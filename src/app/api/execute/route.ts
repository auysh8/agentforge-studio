import { streamText } from 'ai';
import { createOllama } from 'ollama-ai-provider';
import { createOpenAI } from '@ai-sdk/openai';
import { createMistral } from '@ai-sdk/mistral';
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
  let result = text.replace(/\{\{\s*(output|outputContext)\s*\}\}/gi, lastOutput);
  
  // Replace {{nodeId.output}} or {{label.output}} or {{trigger.input}}
  for (const [key, val] of Object.entries(nodeOutputs)) {
    const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\{\\{\\s*${escapedKey}(\\.(output|input))?\\s*\\}\\}`, 'gi');
    result = result.replace(regex, val);
  }
  return result;
}

export async function POST(req: Request) {
  try {
    logExecution("--- New Flow Execution Request Received ---");
    const customOpenAIKey = req.headers.get('x-openai-api-key') || '';
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
        logExecution(`[Trigger Node] Input: ${outputContext}`);
      } else if (currentNode.type === 'prompt') {
        const rawPrompt = (currentNode.data?.prompt as string) || systemPrompt;
        systemPrompt = interpolateVariables(rawPrompt, nodeOutputs, outputContext);
        nodeOutputs[currentNode.id] = systemPrompt;
        logExecution(`[Prompt Node] System Prompt: ${systemPrompt}`);
      } else if (currentNode.type === 'api') {
        const method = (currentNode.data?.method as string) || 'GET';
        let url = (currentNode.data?.url as string) || '';
        url = interpolateVariables(url, nodeOutputs, outputContext);

        logExecution(`[API Node Executing] Method: ${method} | URL: ${url}`);
        console.log(`\n--- [AgentForge API Node Executing] ---`);
        console.log(`Node ID: ${currentNode.id}`);
        console.log(`Method: ${method}`);
        console.log(`URL: ${url}`);

        if (url) {
          try {
            const fetchOptions: RequestInit = { method };
            if (method !== 'GET' && method !== 'HEAD') {
              const bodyStr = typeof currentNode.data?.body === 'string'
                ? interpolateVariables(currentNode.data.body, nodeOutputs, outputContext)
                : outputContext;
              fetchOptions.body = bodyStr;
              logExecution(`[API Request Body]: ${bodyStr}`);
              console.log(`Body: ${bodyStr}`);
            }

            if (currentNode.data?.headers) {
              try {
                const interpolatedHeadersStr = interpolateVariables(
                  currentNode.data.headers as string,
                  nodeOutputs,
                  outputContext
                );
                fetchOptions.headers = JSON.parse(interpolatedHeadersStr);
                logExecution(`[API Request Headers]: ${interpolatedHeadersStr}`);
                console.log(`Headers:`, fetchOptions.headers);
              } catch {
                logExecution(`[API Error]: Invalid JSON in API Headers`);
                throw new Error("Invalid JSON in API Headers");
              }
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
        if (currentNode.data?.label) {
          nodeOutputs[currentNode.data.label as string] = outputContext;
        }
      } else if (currentNode.type === 'condition') {
        // Handled right before edge finding
      } else if (currentNode.type === 'llm') {
        const modelName = (currentNode.data?.model as string) || 'gpt-4o';
        logExecution(`[LLM Node Executing] Model: ${modelName}`);

        let model;
        if (modelName.startsWith('gpt-')) {
          const openai = createOpenAI({ apiKey: customOpenAIKey || process.env.OPENAI_API_KEY || '' });
          model = openai(modelName);
        } else if (modelName.includes('mistral') || modelName.includes('mixtral')) {
          const mistral = createMistral({ apiKey: customMistralKey || process.env.MISTRAL_API_KEY || '' });
          model = mistral(modelName);
        } else {
          const ollama = createOllama({ baseURL: 'http://localhost:11434/api' });
          model = ollama(modelName);
        }

        const interpolatedInput = interpolateVariables(outputContext, nodeOutputs, outputContext);
        logExecution(`[LLM Prompt]: ${interpolatedInput}`);

        const result = streamText({
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          model: model as any,
          system: systemPrompt,
          prompt: interpolatedInput,
        });

        return result.toTextStreamResponse();
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

