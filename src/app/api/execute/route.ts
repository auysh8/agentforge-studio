import { streamText } from 'ai';
import { createOllama } from 'ollama-ai-provider';
import { createOpenAI } from '@ai-sdk/openai';
import { createMistral } from '@ai-sdk/mistral';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { nodes, edges } = await req.json();

    // Find the trigger node
    let currentNode = nodes.find((n: any) => n.type === 'trigger');
    if (!currentNode) {
      return new Response(JSON.stringify({ error: 'Graph must contain a Trigger node' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let outputContext = currentNode.data?.input || '';
    let systemPrompt = 'You are a helpful AI assistant.';

    // Iteratively traverse the DAG
    while (currentNode) {
      // 1. Execute current node logic
      if (currentNode.type === 'trigger') {
        outputContext = currentNode.data?.input || '';
      } else if (currentNode.type === 'prompt') {
        systemPrompt = currentNode.data?.prompt || systemPrompt;
      } else if (currentNode.type === 'api') {
        const method = currentNode.data?.method || 'GET';
        const url = currentNode.data?.url;
        if (url) {
          try {
            const fetchOptions: RequestInit = { method };
            if (method !== 'GET' && method !== 'HEAD') {
              fetchOptions.body = outputContext;
            }
            if (currentNode.data?.headers) {
              try {
                fetchOptions.headers = JSON.parse(currentNode.data.headers);
              } catch (e: any) {
                throw new Error("Invalid JSON in API Headers");
              }
            }
            const response = await fetch(url, fetchOptions);
            outputContext = await response.text();
          } catch (e: any) {
            outputContext = `API Request failed: ${e.message}`;
          }
        }
      } else if (currentNode.type === 'condition') {
        // Condition doesn't change output, but we need to record its result for edge traversal
        // It's evaluated right before edge finding
      } else if (currentNode.type === 'llm') {
        // LLM node ends traversal and streams the response
        const modelName = currentNode.data?.model || 'gpt-4o';
        
        let model;
        if (modelName.startsWith('gpt-')) {
          const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY || '' });
          model = openai(modelName);
        } else if (modelName.includes('mistral') || modelName.includes('mixtral')) {
          const mistral = createMistral({ apiKey: process.env.MISTRAL_API_KEY || '' });
          model = mistral(modelName);
        } else {
          const ollama = createOllama({ baseURL: 'http://localhost:11434/api' });
          model = ollama(modelName);
        }

        const result = streamText({
          model: model as any,
          system: systemPrompt,
          prompt: outputContext,
        });

        return result.toTextStreamResponse();
      }

      // 2. Find the next node
      const outgoingEdges = edges.filter((e: any) => e.source === currentNode.id);
      
      if (outgoingEdges.length === 0) {
        break; // End of flow
      }

      let nextEdge;
      if (currentNode.type === 'condition') {
        // Evaluate condition
        let conditionResult = false;
        try {
          // eslint-disable-next-line no-new-func
          const func = new Function('output', `return ${currentNode.data?.condition || 'false'};`);
          conditionResult = !!func(outputContext);
        } catch (e) {
          console.error("Condition evaluation error", e);
          conditionResult = false;
        }
        
        const handleId = conditionResult ? 'true' : 'false';
        nextEdge = outgoingEdges.find((e: any) => e.sourceHandle === handleId) || outgoingEdges[0];
      } else {
        // For linear nodes, just pick the first outgoing edge
        nextEdge = outgoingEdges[0];
      }

      if (nextEdge) {
        currentNode = nodes.find((n: any) => n.id === nextEdge.target);
      } else {
        currentNode = null;
      }
    }

    // If we finished traversal without hitting an LLM node, we return the raw text output
    // so the useCompletion hook reads it correctly as a finished block of text.
    return new Response(outputContext, {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    });

  } catch (error: any) {
    console.error('Execution error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Execution failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
