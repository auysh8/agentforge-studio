import { streamText } from 'ai';
import { createOllama } from 'ollama-ai-provider';
import { createOpenAI } from '@ai-sdk/openai';
import { createMistral } from '@ai-sdk/mistral';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { nodes, edges } = await req.json();

    // 1. Extract necessary data from nodes
    const triggerNode = nodes.find((n: any) => n.type === 'trigger');
    const promptNode = nodes.find((n: any) => n.type === 'prompt');
    const llmNode = nodes.find((n: any) => n.type === 'llm');

    if (!triggerNode || !llmNode) {
      return new Response(JSON.stringify({ error: 'Graph must contain a Trigger and an LLM node' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const userInput = triggerNode.data?.input || '';
    const systemPrompt = promptNode?.data?.prompt || 'You are a helpful AI assistant.';
    const modelName = llmNode.data?.model || 'gpt-4o';

    // 2. Determine the provider based on the model name
    let model;
    if (modelName.startsWith('gpt-')) {
      const openai = createOpenAI({
        apiKey: process.env.OPENAI_API_KEY || '',
      });
      model = openai(modelName);
    } else if (modelName.includes('mistral') || modelName.includes('mixtral')) {
      const mistral = createMistral({
        apiKey: process.env.MISTRAL_API_KEY || '',
      });
      model = mistral(modelName);
    } else {
      // Default to local Ollama
      const ollama = createOllama({
        baseURL: 'http://localhost:11434/api',
      });
      model = ollama(modelName);
    }

    // 3. Execute the LLM call with Vercel AI SDK
    const result = streamText({
      model: model,
      system: systemPrompt,
      prompt: userInput,
    });

    // 4. Return the streaming response
    return result.toTextStreamResponse();
  } catch (error: any) {
    console.error('Execution error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Execution failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
