import { streamText, generateText } from 'ai';
import { createOllama } from 'ollama-ai-provider';
import { createOpenAI } from '@ai-sdk/openai';
import { createMistral } from '@ai-sdk/mistral';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import fs from 'fs';
import path from 'path';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

function logExecution(msg: string) {
  try {
    const logPath = path.join(process.cwd(), 'execution.log');
    fs.appendFileSync(logPath, `[${new Date().toISOString()}] ${msg}\n`);
  } catch (e) {
    console.error("Failed to write to execution.log", e);
  }
}

function interpolateVariables(
  text: string,
  nodeOutputs: Record<string, string>,
  lastOutput: string
): string {
  if (!text) return text;

  // 1. Try parsing text as a JSON template object
  try {
    const obj = JSON.parse(text);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const replaceInObj = (item: any): any => {
      if (typeof item === 'string') {
        let res = item.replace(/\{\{\s*(output|outputContext)\s*\}\}/gi, lastOutput);
        res = res.replace(/\{\{\s*(output|outputContext)\.base64\s*\}\}/gi, Buffer.from(lastOutput).toString('base64'));
        for (const [key, val] of Object.entries(nodeOutputs)) {
          const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          res = res.replace(new RegExp(`\\{\\{\\s*${escapedKey}(\\.(output|input))?\\s*\\}\\}`, 'gi'), val);
          res = res.replace(new RegExp(`\\{\\{\\s*${escapedKey}\\.base64\\s*\\}\\}`, 'gi'), Buffer.from(val).toString('base64'));
        }
        return res;
      }
      if (Array.isArray(item)) return item.map(replaceInObj);
      if (item && typeof item === 'object') {
        const newObj: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(item)) {
          newObj[k] = replaceInObj(v);
        }
        return newObj;
      }
      return item;
    };
    return JSON.stringify(replaceInObj(obj), null, 2);
  } catch {
    // 2. Fallback for raw text templates
    let result = text;
    const allVars: Record<string, string> = {
      output: lastOutput,
      outputContext: lastOutput,
      ...nodeOutputs,
    };

    for (const [key, val] of Object.entries(allVars)) {
      const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

      // Replace JSON-quoted placeholders with safely JSON-stringified values
      const quotedRegex = new RegExp(`"\\{\\{\\s*${escapedKey}(\\.(output|input))?\\s*\\}}"`, 'gi');
      result = result.replace(quotedRegex, JSON.stringify(val));

      const rawRegex = new RegExp(`\\{\\{\\s*${escapedKey}(\\.(output|input))?\\s*\\}\\}`, 'gi');
      result = result.replace(rawRegex, val);

      const quotedB64Regex = new RegExp(`"\\{\\{\\s*${escapedKey}\\.base64\\s*\\}}"`, 'gi');
      result = result.replace(quotedB64Regex, JSON.stringify(Buffer.from(val).toString('base64')));

      const rawB64Regex = new RegExp(`\\{\\{\\s*${escapedKey}\\.base64\\s*\\}\\}`, 'gi');
      result = result.replace(rawB64Regex, Buffer.from(val).toString('base64'));
    }
    return result;
  }
}

export async function POST(req: Request) {
  try {
    logExecution("--- New Flow Execution Request Received ---");
    const customOpenAIKey = req.headers.get('x-openai-api-key') || '';
    const customGoogleKey = req.headers.get('x-google-api-key') || req.headers.get('x-gemini-api-key') || '';
    const customMistralKey = req.headers.get('x-mistral-api-key') || '';

    const { nodes, edges } = await req.json();

    // Store outputs of each node by node.id, node.type, and node.data.label
    const nodeOutputs: Record<string, string> = {};

    // Find the trigger node
    let currentNode = nodes.find((n: Record<string, unknown>) => n.type === 'trigger');
    if (!currentNode) {
      logExecution("ERROR: Graph must contain a Trigger node");
      return new Response(JSON.stringify({ error: 'Graph must contain a Trigger node' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let outputContext = (currentNode.data?.input as string) || '';
    nodeOutputs[currentNode.id] = outputContext;
    if (currentNode.data?.label) {
      nodeOutputs[currentNode.data.label as string] = outputContext;
    }
    nodeOutputs['trigger'] = outputContext;

    let systemPrompt = 'You are a helpful AI assistant.';

    // Iteratively traverse the DAG
    while (currentNode) {
      // 1. Execute current node logic
      if (currentNode.type === 'trigger') {
        outputContext = (currentNode.data?.input as string) || '';
        nodeOutputs[currentNode.id] = outputContext;
        nodeOutputs['trigger'] = outputContext;
        if (currentNode.data?.label) nodeOutputs[currentNode.data.label as string] = outputContext;
        logExecution(`[Trigger Node] Input: ${outputContext}`);
      } else if (currentNode.type === 'prompt') {
        const rawPrompt = (currentNode.data?.prompt as string) || systemPrompt;
        systemPrompt = interpolateVariables(rawPrompt, nodeOutputs, outputContext);
        nodeOutputs[currentNode.id] = systemPrompt;
        if (currentNode.data?.label) nodeOutputs[currentNode.data.label as string] = systemPrompt;
        logExecution(`[Prompt Node] System Prompt: ${systemPrompt}`);
      } else if (currentNode.type === 'api') {
        const method = (currentNode.data?.method as string) || 'GET';
        let url = (currentNode.data?.url as string) || (currentNode.data?.endpoint as string) || '';
        url = interpolateVariables(url, nodeOutputs, outputContext);

        logExecution(`[API Node Executing] Method: ${method} | URL: ${url}`);
        console.log(`\n--- [AgentForge API Node Executing] ---`);
        console.log(`Node ID: ${currentNode.id}`);
        console.log(`Method: ${method}`);
        console.log(`URL: ${url}`);

        if (url) {
          try {
            const fetchOptions: RequestInit = { method };
            let headersObj: Record<string, string> = {};
            if (currentNode.data?.headers) {
              try {
                const interpolatedHeadersStr = interpolateVariables(
                  currentNode.data.headers as string,
                  nodeOutputs,
                  outputContext
                );
                headersObj = JSON.parse(interpolatedHeadersStr);
                fetchOptions.headers = headersObj;
                logExecution(`[API Request Headers]: ${interpolatedHeadersStr}`);
                console.log(`Headers:`, fetchOptions.headers);
              } catch {
                logExecution(`[API Error]: Invalid JSON in API Headers`);
                throw new Error("Invalid JSON in API Headers");
              }
            }

            if (method !== 'GET' && method !== 'HEAD') {
              let bodyStr = typeof currentNode.data?.body === 'string'
                ? interpolateVariables(currentNode.data.body, nodeOutputs, outputContext)
                : outputContext;

              // GitHub Contents API helper: auto-base64 encode & auto-fetch SHA for PUT updates
              if (method === 'PUT' && url.includes('api.github.com/repos/') && url.includes('/contents/')) {
                try {
                  const bodyObj = JSON.parse(bodyStr);
                  if (bodyObj.content) {
                    let rawContent = typeof bodyObj.content === 'string' ? bodyObj.content.trim() : '';
                    if (rawContent.startsWith('```')) {
                      rawContent = rawContent.replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/i, '').trim();
                    }
                    bodyObj.content = Buffer.from(rawContent).toString('base64');
                  }
                  // Auto fetch SHA if not present
                  if (!bodyObj.sha) {
                    try {
                      const getShaRes = await fetch(url, { headers: headersObj });
                      if (getShaRes.ok) {
                        const existingFile = await getShaRes.json();
                        if (existingFile?.sha) {
                          bodyObj.sha = existingFile.sha;
                          logExecution(`[GitHub API Helper] Auto-attached existing SHA: ${existingFile.sha}`);
                        }
                      }
                    } catch (e) {
                      logExecution(`[GitHub API Helper] Could not auto-fetch SHA: ${(e as Error).message}`);
                    }
                  }
                  bodyStr = JSON.stringify(bodyObj, null, 2);
                } catch {
                  // Not JSON body, keep as is
                }
              }

              fetchOptions.body = bodyStr;
              logExecution(`[API Request Body]: ${bodyStr.slice(0, 300)}...`);
              console.log(`Body: ${bodyStr.slice(0, 300)}...`);
            }

            const response = await fetch(url, fetchOptions);
            outputContext = await response.text();
            logExecution(`[API Response Status]: ${response.status} ${response.statusText}`);
            logExecution(`[API Response Preview]: ${outputContext.slice(0, 300)}`);
            console.log(`Response Status: ${response.status} ${response.statusText}`);
            console.log(`Response Preview: ${outputContext.slice(0, 300)}...`);
            console.log(`------------------------------------\n`);
          } catch (e) {
            outputContext = `API Request failed: ${(e as Error).message}`;
            logExecution(`[API Request Failed]: ${(e as Error).message}`);
            console.error(`[AgentForge API Node Error]: ${(e as Error).message}`);
          }
        }
        nodeOutputs[currentNode.id] = outputContext;
        if (currentNode.data?.label) nodeOutputs[currentNode.data.label as string] = outputContext;
      } else if (currentNode.type === 'code') {
        const script = (currentNode.data?.code as string) || 'return output;';
        logExecution(`[Code Node Executing] Script: ${script}`);
        try {
          const fn = new Function('output', 'outputs', script);
          const resultVal = fn(outputContext, nodeOutputs);
          outputContext = typeof resultVal === 'object' ? JSON.stringify(resultVal, null, 2) : String(resultVal ?? '');
          logExecution(`[Code Node Output]: ${outputContext.slice(0, 200)}`);
        } catch (e) {
          outputContext = `Code execution error: ${(e as Error).message}`;
          logExecution(`[Code Node Error]: ${(e as Error).message}`);
        }
        nodeOutputs[currentNode.id] = outputContext;
        if (currentNode.data?.label) nodeOutputs[currentNode.data.label as string] = outputContext;
      } else if (currentNode.type === 'json') {
        const jsonPath = (currentNode.data?.path as string) || '';
        logExecution(`[JSON Node Executing] Path: ${jsonPath}`);
        try {
          const parsed = JSON.parse(outputContext);
          if (jsonPath) {
            const fn = new Function('data', `try { return data.${jsonPath}; } catch { return undefined; }`);
            const extracted = fn(parsed);
            outputContext = typeof extracted === 'object' ? JSON.stringify(extracted, null, 2) : String(extracted ?? '');
          }
          logExecution(`[JSON Node Output]: ${outputContext.slice(0, 200)}`);
        } catch (e) {
          outputContext = `JSON Extraction error: ${(e as Error).message}`;
          logExecution(`[JSON Node Error]: ${(e as Error).message}`);
        }
        nodeOutputs[currentNode.id] = outputContext;
        if (currentNode.data?.label) nodeOutputs[currentNode.data.label as string] = outputContext;
      } else if (currentNode.type === 'output') {
        logExecution(`[Output Node Executing] Format: ${currentNode.data?.format || 'text/plain'}`);
        const rawTpl = (currentNode.data?.template as string) || (currentNode.data?.body as string) || '';
        if (rawTpl) {
          outputContext = interpolateVariables(rawTpl, nodeOutputs, outputContext);
        }
        nodeOutputs[currentNode.id] = outputContext;
        if (currentNode.data?.label) nodeOutputs[currentNode.data.label as string] = outputContext;
      } else if (currentNode.type === 'condition') {
        // Handled right before edge finding
      } else if (currentNode.type === 'llm') {
        const modelName = (currentNode.data?.model as string) || 'gpt-4o';
        logExecution(`[LLM Node Executing] Model: ${modelName}`);

        let model;
        const mLower = modelName.toLowerCase();
        const isGemini =
          mLower.startsWith('gemini-') ||
          mLower.includes('google') ||
          mLower.includes('flash') ||
          mLower.includes('gemini') ||
          /^(3\.[0-9]|2\.[0-9]|1\.[0-9])/.test(mLower);

        if (isGemini && !mLower.startsWith('gpt-') && !mLower.includes('mistral')) {
          const resolvedModel = mLower.startsWith('gemini-') ? modelName : `gemini-${modelName}`;
          const google = createGoogleGenerativeAI({ apiKey: customGoogleKey || process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY || '' });
          model = google(resolvedModel);
        } else if (mLower.startsWith('gpt-')) {
          const openai = createOpenAI({ apiKey: customOpenAIKey || process.env.OPENAI_API_KEY || '' });
          model = openai(modelName);
        } else if (mLower.includes('mistral') || mLower.includes('mixtral')) {
          const mistral = createMistral({ apiKey: customMistralKey || process.env.MISTRAL_API_KEY || '' });
          model = mistral(modelName);
        } else {
          const ollama = createOllama({ baseURL: 'http://localhost:11434/api' });
          model = ollama(modelName);
        }

        const interpolatedInput = interpolateVariables(outputContext, nodeOutputs, outputContext);
        logExecution(`[LLM Prompt]: ${interpolatedInput}`);

        const outgoingEdges = edges.filter((e: Record<string, unknown>) => e.source === currentNode.id);

        if (outgoingEdges.length > 0) {
          // If there are downstream nodes, generate full text so execution loop can continue
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          let { text } = await (generateText as any)({
            model: model as any,
            system: systemPrompt,
            prompt: interpolatedInput,
            maxTokens: 4096,
          });

          // Clean outer markdown code block wrapper fences if present
          text = text.trim();
          if (text.startsWith('```')) {
            text = text.replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/i, '').trim();
          }

          outputContext = text;
          nodeOutputs[currentNode.id] = text;
          nodeOutputs['llm'] = text;
          if (currentNode.data?.label) nodeOutputs[currentNode.data.label as string] = text;
          logExecution(`[LLM Node Output]: ${text.slice(0, 200)}...`);
        } else {
          // If LLM is terminal node, stream response to browser
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const result = (streamText as any)({
            model: model as any,
            system: systemPrompt,
            prompt: interpolatedInput,
            maxTokens: 4096,
          });
          return result.toTextStreamResponse();
        }
      }

      // 2. Find the next node
      const outgoingEdges = edges.filter((e: Record<string, unknown>) => e.source === currentNode.id);
      
      if (outgoingEdges.length === 0) {
        logExecution(`[End of Flow] No outgoing edges from node ${currentNode.id}`);
        break; // End of flow
      }

      let nextEdge;
      if (currentNode.type === 'condition') {
        let conditionResult = false;
        try {
          const condStr = (currentNode.data?.condition as string) || 'false';
          const interpolatedCond = interpolateVariables(condStr, nodeOutputs, outputContext);
          // Safe evaluation check
          const func = new Function('output', 'outputs', `return ${interpolatedCond};`);
          conditionResult = !!func(outputContext, nodeOutputs);
        } catch (e) {
          console.error("Condition evaluation error", e);
          conditionResult = false;
        }
        
        const handleId = conditionResult ? 'true' : 'false';
        nextEdge = outgoingEdges.find((e: Record<string, unknown>) => e.sourceHandle === handleId) || outgoingEdges[0];
      } else {
        nextEdge = outgoingEdges[0];
      }

      if (nextEdge) {
        logExecution(`[Transition] Moving from node (${currentNode.id}) -> node (${nextEdge.target})`);
        currentNode = nodes.find((n: Record<string, unknown>) => n.id === nextEdge.target);
      } else {
        logExecution(`[End of Flow] Target node not found`);
        currentNode = null;
      }
    }

    return new Response(outputContext, {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    });

  } catch (error) {
    console.error('Execution error:', error);
    return new Response(JSON.stringify({ error: (error as Error).message || 'Execution failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

