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
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (data: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      try {
        logExecution("--- New Flow Execution Request Received ---");
        const customOpenAIKey = req.headers.get('x-openai-api-key') || '';
        const customGoogleKey = req.headers.get('x-google-api-key') || req.headers.get('x-gemini-api-key') || '';
        const customMistralKey = req.headers.get('x-mistral-api-key') || '';

        const { nodes, edges } = await req.json();

        // Store outputs of each node by node.id, node.type, and node.data.label
        const nodeOutputs: Record<string, string> = {};

        // Find the trigger node (trigger, webhook, or cron)
        let currentNode = nodes.find((n: Record<string, unknown>) => n.type === 'trigger' || n.type === 'webhook' || n.type === 'cron');
        if (!currentNode) {
          logExecution("ERROR: Graph must contain a Trigger node");
          sendEvent({ type: 'error', error: 'Graph must contain a Trigger node' });
          controller.close();
          return;
        }

        let outputContext = (currentNode.data?.input as string) || '';
        nodeOutputs[currentNode.id] = outputContext;
        if (currentNode.data?.label) {
          nodeOutputs[currentNode.data.label as string] = outputContext;
        }
        nodeOutputs['trigger'] = outputContext;

        let systemPrompt = 'You are a helpful AI assistant.';

        // Single node executor function
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const executeSingleNode = async (node: any, currentContext: string): Promise<string> => {
          sendEvent({ type: 'node_start', nodeId: node.id, nodeType: node.type });
          let resContext = currentContext;

          if (node.type === 'trigger' || node.type === 'webhook') {
            resContext = (node.data?.input as string) || currentContext || '';
            nodeOutputs[node.id] = resContext;
            nodeOutputs['trigger'] = resContext;
            if (node.data?.label) nodeOutputs[node.data.label as string] = resContext;
            logExecution(`[${node.type} Node] Input: ${resContext}`);
          } else if (node.type === 'cron') {
            resContext = `Cron trigger executed at ${new Date().toISOString()} (Schedule: ${node.data?.cronExpression || '0 8 * * *'})`;
            nodeOutputs[node.id] = resContext;
            nodeOutputs['trigger'] = resContext;
            if (node.data?.label) nodeOutputs[node.data.label as string] = resContext;
            logExecution(`[Cron Node] Executed schedule: ${node.data?.cronExpression}`);
          } else if (node.type === 'vector_db') {
            const provider = (node.data?.provider as string) || 'in-memory';
            const topK = Number(node.data?.topK || 3);
            const rawQuery = (node.data?.searchQuery as string) || resContext;
            const interpolatedQuery = interpolateVariables(rawQuery, nodeOutputs, resContext);
            logExecution(`[Vector Node Executing] Provider: ${provider} | Query: ${interpolatedQuery}`);

            const dummyDocs = [
              `[Document 1] System Architecture: AgentForge Studio uses Next.js App Router with serverless DAG execution engine.`,
              `[Document 2] Security Rules: Code nodes run server-side. Sanitize inputs and validate API tokens.`,
              `[Document 3] LLM Models: Native multi-provider support for OpenAI GPT-4o, Google Gemini 2.0 Flash, and Mistral.`,
              `[Document 4] Vector RAG: Vector search retrieves top-k relevant knowledge snippets for prompt enrichment.`,
            ];

            const queryLower = interpolatedQuery.toLowerCase();
            const matchedDocs = dummyDocs
              .filter(doc => queryLower.split(' ').some(word => word.length > 2 && doc.toLowerCase().includes(word)))
              .slice(0, topK);

            const finalSnippets = matchedDocs.length > 0 ? matchedDocs : dummyDocs.slice(0, topK);
            resContext = `[Retrieved Context (${provider}, Top-${topK})]:\n${finalSnippets.join('\n\n')}`;
            nodeOutputs[node.id] = resContext;
            if (node.data?.label) nodeOutputs[node.data.label as string] = resContext;
          } else if (node.type === 'prompt') {
            const rawPrompt = (node.data?.prompt as string) || systemPrompt;
            systemPrompt = interpolateVariables(rawPrompt, nodeOutputs, resContext);
            nodeOutputs[node.id] = systemPrompt;
            if (node.data?.label) nodeOutputs[node.data.label as string] = systemPrompt;
            logExecution(`[Prompt Node] System Prompt: ${systemPrompt}`);
          } else if (node.type === 'api') {
            const method = (node.data?.method as string) || 'GET';
            let url = (node.data?.url as string) || (node.data?.endpoint as string) || '';
            url = interpolateVariables(url, nodeOutputs, resContext);

            logExecution(`[API Node Executing] Method: ${method} | URL: ${url}`);

            if (url) {
              try {
                const fetchOptions: RequestInit = { method };
                let headersObj: Record<string, string> = {};
                if (node.data?.headers) {
                  try {
                    const interpolatedHeadersStr = interpolateVariables(
                      node.data.headers as string,
                      nodeOutputs,
                      resContext
                    );
                    headersObj = JSON.parse(interpolatedHeadersStr);
                    fetchOptions.headers = headersObj;
                  } catch {
                    logExecution(`[API Error]: Invalid JSON in API Headers`);
                    throw new Error("Invalid JSON in API Headers");
                  }
                }

                if (method !== 'GET' && method !== 'HEAD') {
                  let bodyStr = typeof node.data?.body === 'string'
                    ? interpolateVariables(node.data.body, nodeOutputs, resContext)
                    : resContext;

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
                      if (!bodyObj.sha) {
                        try {
                          const getShaRes = await fetch(url, { headers: headersObj });
                          if (getShaRes.ok) {
                            const existingFile = await getShaRes.json();
                            if (existingFile?.sha) {
                              bodyObj.sha = existingFile.sha;
                            }
                          }
                        } catch (e) {
                          logExecution(`[GitHub API Helper] Could not auto-fetch SHA: ${(e as Error).message}`);
                        }
                      }
                      bodyStr = JSON.stringify(bodyObj, null, 2);
                    } catch {
                      // Not JSON body
                    }
                  }

                  fetchOptions.body = bodyStr;
                }

                const response = await fetch(url, fetchOptions);
                resContext = await response.text();
                logExecution(`[API Response Status]: ${response.status} ${response.statusText}`);
              } catch (e) {
                resContext = `API Request failed: ${(e as Error).message}`;
                logExecution(`[API Request Failed]: ${(e as Error).message}`);
                sendEvent({ type: 'node_error', nodeId: node.id, error: resContext });
              }
            }
            nodeOutputs[node.id] = resContext;
            if (node.data?.label) nodeOutputs[node.data.label as string] = resContext;
          } else if (node.type === 'code') {
            const script = (node.data?.code as string) || 'return output;';
            logExecution(`[Code Node Executing] Script: ${script}`);
            try {
              const fn = new Function('output', 'outputs', script);
              const resultVal = fn(resContext, nodeOutputs);
              resContext = typeof resultVal === 'object' ? JSON.stringify(resultVal, null, 2) : String(resultVal ?? '');
            } catch (e) {
              resContext = `Code execution error: ${(e as Error).message}`;
              logExecution(`[Code Node Error]: ${(e as Error).message}`);
              sendEvent({ type: 'node_error', nodeId: node.id, error: resContext });
            }
            nodeOutputs[node.id] = resContext;
            if (node.data?.label) nodeOutputs[node.data.label as string] = resContext;
          } else if (node.type === 'json') {
            const jsonPath = (node.data?.path as string) || '';
            logExecution(`[JSON Node Executing] Path: ${jsonPath}`);
            try {
              const parsed = JSON.parse(resContext);
              if (jsonPath) {
                const fn = new Function('data', `try { return data.${jsonPath}; } catch { return undefined; }`);
                const extracted = fn(parsed);
                resContext = typeof extracted === 'object' ? JSON.stringify(extracted, null, 2) : String(extracted ?? '');
              }
            } catch (e) {
              resContext = `JSON Extraction error: ${(e as Error).message}`;
              logExecution(`[JSON Node Error]: ${(e as Error).message}`);
              sendEvent({ type: 'node_error', nodeId: node.id, error: resContext });
            }
            nodeOutputs[node.id] = resContext;
            if (node.data?.label) nodeOutputs[node.data.label as string] = resContext;
          } else if (node.type === 'output') {
            logExecution(`[Output Node Executing] Format: ${node.data?.format || 'text/plain'}`);
            const rawTpl = (node.data?.template as string) || (node.data?.body as string) || '';
            if (rawTpl) {
              resContext = interpolateVariables(rawTpl, nodeOutputs, resContext);
            }
            nodeOutputs[node.id] = resContext;
            if (node.data?.label) nodeOutputs[node.data.label as string] = resContext;
          } else if (node.type === 'llm') {
            const modelName = (node.data?.model as string) || 'gpt-4o';
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

            const interpolatedInput = interpolateVariables(resContext, nodeOutputs, resContext);

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            let { text } = await (generateText as any)({
              model: model as any,
              system: systemPrompt,
              prompt: interpolatedInput,
              maxTokens: 4096,
            });

            text = text.trim();
            if (text.startsWith('```')) {
              text = text.replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/i, '').trim();
            }

            resContext = text;
            nodeOutputs[node.id] = text;
            nodeOutputs['llm'] = text;
            if (node.data?.label) nodeOutputs[node.data.label as string] = text;
          }

          sendEvent({ type: 'node_success', nodeId: node.id, output: resContext });
          return resContext;
        };

        // Helper to execute a subgraph until join node or end
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const executeSubgraph = async (startNode: any, inContext: string, localOutputs: Record<string, string>): Promise<{ output: string; lastNodeId: string; nodeLabel: string }> => {
          let curr = startNode;
          let ctx = inContext;

          while (curr) {
            if (curr.type === 'join') {
              break; // Stop at join node, join will process all incoming branches
            }

            if (curr.type === 'parallel') {
              ctx = await executeParallelNode(curr, ctx);
            } else if (curr.type === 'foreach') {
              ctx = await executeForEachNode(curr, ctx);
            } else {
              ctx = await executeSingleNode(curr, ctx);
            }

            const outEdges = edges.filter((e: Record<string, unknown>) => e.source === curr.id);
            if (outEdges.length === 0) break;

            let nextE = outEdges[0];
            if (curr.type === 'condition') {
              let condRes = false;
              try {
                const condStr = (curr.data?.condition as string) || 'false';
                const interpCond = interpolateVariables(condStr, { ...nodeOutputs, ...localOutputs }, ctx);
                const func = new Function('output', 'outputs', `return ${interpCond};`);
                condRes = !!func(ctx, { ...nodeOutputs, ...localOutputs });
              } catch {
                condRes = false;
              }
              const handleId = condRes ? 'true' : 'false';
              nextE = outEdges.find((e: Record<string, unknown>) => e.sourceHandle === handleId) || outEdges[0];
            }

            if (nextE) {
              curr = nodes.find((n: Record<string, unknown>) => n.id === nextE.target);
            } else {
              curr = null;
            }
          }

          return { output: ctx, lastNodeId: curr?.id || '', nodeLabel: curr?.data?.label as string || '' };
        };

        // Parallel Fan-Out Execution
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const executeParallelNode = async (pNode: any, inContext: string): Promise<string> => {
          sendEvent({ type: 'node_start', nodeId: pNode.id, nodeType: pNode.type });
          logExecution(`[Parallel Node Executing] Fanning out concurrent branches`);

          const outEdges = edges.filter((e: Record<string, unknown>) => e.source === pNode.id);
          sendEvent({ type: 'node_success', nodeId: pNode.id, output: inContext });

          if (outEdges.length === 0) return inContext;

          const branchPromises = outEdges.map(async (edge: Record<string, unknown>) => {
            const targetNode = nodes.find((n: Record<string, unknown>) => n.id === edge.target);
            if (!targetNode) return null;
            const res = await executeSubgraph(targetNode, inContext, { ...nodeOutputs });
            return {
              edgeId: edge.id,
              targetId: targetNode.id,
              nodeLabel: (targetNode.data?.label as string) || targetNode.id,
              output: res.output,
            };
          });

          const branchResults = (await Promise.all(branchPromises)).filter(Boolean);

          // Find downstream Join node
          const joinNode = nodes.find((n: Record<string, unknown>) => n.type === 'join');
          if (joinNode) {
            sendEvent({ type: 'node_start', nodeId: joinNode.id, nodeType: joinNode.type });
            const strategy = (joinNode.data?.mergeStrategy as string) || 'array';
            let mergedStr: string;

            if (strategy === 'object') {
              const obj: Record<string, string> = {};
              branchResults.forEach((b) => {
                if (b) obj[b.nodeLabel] = b.output;
              });
              mergedStr = JSON.stringify(obj, null, 2);
            } else if (strategy === 'text') {
              mergedStr = branchResults.map((b) => b?.output || '').join('\n\n---\n\n');
            } else {
              mergedStr = JSON.stringify(branchResults.map((b) => b?.output || ''), null, 2);
            }

            nodeOutputs[joinNode.id] = mergedStr;
            if (joinNode.data?.label) nodeOutputs[joinNode.data.label as string] = mergedStr;
            logExecution(`[Join Node Executing] Merged ${branchResults.length} parallel outputs using '${strategy}' strategy`);
            sendEvent({ type: 'node_success', nodeId: joinNode.id, output: mergedStr });
            return mergedStr;
          }

          const fallbackMerged = JSON.stringify(branchResults.map((b) => b?.output || ''), null, 2);
          return fallbackMerged;
        };

        // ForEach Loop Execution
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const executeForEachNode = async (feNode: any, inContext: string): Promise<string> => {
          sendEvent({ type: 'node_start', nodeId: feNode.id, nodeType: feNode.type });

          const arraySrc = (feNode.data?.arraySource as string) || 'output';
          const concurrency = Number(feNode.data?.concurrency || 1);
          const itemAlias = (feNode.data?.itemAlias as string) || 'item';

          let rawData = interpolateVariables(arraySrc === 'output' ? inContext : arraySrc, nodeOutputs, inContext);
          let arrayItems: unknown[] = [];

          try {
            const parsed = JSON.parse(rawData);
            arrayItems = Array.isArray(parsed) ? parsed : [parsed];
          } catch {
            arrayItems = rawData.split('\n').filter((s) => s.trim().length > 0);
          }

          logExecution(`[ForEach Node Executing] Iterating over ${arrayItems.length} items (Concurrency: ${concurrency})`);

          const outEdges = edges.filter((e: Record<string, unknown>) => e.source === feNode.id);
          const loopEdge = outEdges.find((e: Record<string, unknown>) => e.sourceHandle === 'loop');
          const loopTarget = loopEdge ? nodes.find((n: Record<string, unknown>) => n.id === loopEdge.target) : null;

          const loopResults: string[] = [];

          if (loopTarget) {
            const processItem = async (item: unknown, idx: number) => {
              const itemStr = typeof item === 'object' ? JSON.stringify(item) : String(item);
              const itemOutputs = {
                ...nodeOutputs,
                [itemAlias]: itemStr,
                item: itemStr,
                itemIndex: String(idx),
              };
              nodeOutputs[itemAlias] = itemStr;
              nodeOutputs['itemIndex'] = String(idx);

              const subRes = await executeSubgraph(loopTarget, itemStr, itemOutputs);
              return subRes?.output || itemStr;
            };

            if (concurrency > 1) {
              for (let i = 0; i < arrayItems.length; i += concurrency) {
                const chunk = arrayItems.slice(i, i + concurrency);
                const chunkRes = await Promise.all(chunk.map((item, cIdx) => processItem(item, i + cIdx)));
                loopResults.push(...chunkRes);
              }
            } else {
              for (let i = 0; i < arrayItems.length; i++) {
                const res = await processItem(arrayItems[i], i);
                loopResults.push(res);
              }
            }
          }

          const aggregatedOutput = JSON.stringify(loopResults, null, 2);
          nodeOutputs[feNode.id] = aggregatedOutput;
          if (feNode.data?.label) nodeOutputs[feNode.data.label as string] = aggregatedOutput;

          sendEvent({ type: 'node_success', nodeId: feNode.id, output: aggregatedOutput });
          return aggregatedOutput;
        };

        // Main Traversal Loop
        while (currentNode) {
          if (currentNode.type === 'parallel') {
            outputContext = await executeParallelNode(currentNode, outputContext);

            // Find node after join
            const joinNode = nodes.find((n: Record<string, unknown>) => n.type === 'join');
            if (joinNode) {
              const joinOutEdges = edges.filter((e: Record<string, unknown>) => e.source === joinNode.id);
              currentNode = joinOutEdges.length > 0 ? nodes.find((n: Record<string, unknown>) => n.id === joinOutEdges[0].target) : null;
            } else {
              break;
            }
          } else if (currentNode.type === 'foreach') {
            outputContext = await executeForEachNode(currentNode, outputContext);

            const outEdges = edges.filter((e: Record<string, unknown>) => e.source === currentNode.id);
            const completedEdge = outEdges.find((e: Record<string, unknown>) => e.sourceHandle === 'completed') || outEdges[0];
            currentNode = completedEdge ? nodes.find((n: Record<string, unknown>) => n.id === completedEdge.target) : null;
          } else if (currentNode.type === 'join') {
            // Already handled in parallel execution
            const joinOutEdges = edges.filter((e: Record<string, unknown>) => e.source === currentNode.id);
            currentNode = joinOutEdges.length > 0 ? nodes.find((n: Record<string, unknown>) => n.id === joinOutEdges[0].target) : null;
          } else {
            outputContext = await executeSingleNode(currentNode, outputContext);

            const outgoingEdges = edges.filter((e: Record<string, unknown>) => e.source === currentNode.id);
            if (outgoingEdges.length === 0) {
              logExecution(`[End of Flow] No outgoing edges from node ${currentNode.id}`);
              break;
            }

            let nextEdge;
            if (currentNode.type === 'condition') {
              let conditionResult = false;
              try {
                const condStr = (currentNode.data?.condition as string) || 'false';
                const interpolatedCond = interpolateVariables(condStr, nodeOutputs, outputContext);
                const func = new Function('output', 'outputs', `return ${interpolatedCond};`);
                conditionResult = !!func(outputContext, nodeOutputs);
              } catch {
                conditionResult = false;
              }

              const handleId = conditionResult ? 'true' : 'false';
              nextEdge = outgoingEdges.find((e: Record<string, unknown>) => e.sourceHandle === handleId) || outgoingEdges[0];
            } else {
              nextEdge = outgoingEdges[0];
            }

            if (nextEdge) {
              currentNode = nodes.find((n: Record<string, unknown>) => n.id === nextEdge.target);
            } else {
              currentNode = null;
            }
          }
        }

        // Emit final completion event with full text output
        sendEvent({ type: 'done', output: outputContext });
        controller.close();
      } catch (error) {
        console.error('Execution error:', error);
        logExecution(`[Execution Error]: ${(error as Error).message}`);
        sendEvent({ type: 'error', error: (error as Error).message || 'Execution failed' });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}


