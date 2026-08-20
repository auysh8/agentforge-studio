import { generateText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';
import { createGroq } from '@ai-sdk/groq';
import { createMistral } from '@ai-sdk/mistral';

export async function POST(req: Request) {
  try {
    const { flowSummary } = await req.json();

    const customGoogleKey = req.headers.get('x-google-api-key') || req.headers.get('x-gemini-api-key') || '';
    const customOpenAIKey = req.headers.get('x-openai-api-key') || '';
    const customGroqKey = req.headers.get('x-groq-api-key') || '';
    const customMistralKey = req.headers.get('x-mistral-api-key') || '';

    const googleKey = customGoogleKey || process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY || '';
    const openaiKey = customOpenAIKey || process.env.OPENAI_API_KEY || '';
    const groqKey = customGroqKey || process.env.GROQ_API_KEY || '';
    const mistralKey = customMistralKey || process.env.MISTRAL_API_KEY || '';

    const requestedModel = req.headers.get('x-default-model') || '';

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let model: any;
    if (googleKey) {
      const google = createGoogleGenerativeAI({ apiKey: googleKey });
      const targetModel = (requestedModel && (requestedModel.startsWith('gemini-') || requestedModel.includes('flash') || requestedModel.includes('google')))
        ? requestedModel
        : 'gemini-2.0-flash';
      model = google(targetModel);
    } else if (openaiKey) {
      const openai = createOpenAI({ apiKey: openaiKey });
      const targetModel = (requestedModel && requestedModel.startsWith('gpt-')) ? requestedModel : 'gpt-4o-mini';
      model = openai(targetModel);
    } else if (groqKey) {
      const groq = createGroq({ apiKey: groqKey });
      const targetModel = (requestedModel && (requestedModel.includes('llama') || requestedModel.includes('groq') || requestedModel.includes('deepseek') || requestedModel.includes('gemma')))
        ? requestedModel.replace(/^groq[\/-]/i, '')
        : 'llama-3.3-70b-versatile';
      model = groq(targetModel);
    } else if (mistralKey) {
      const mistral = createMistral({ apiKey: mistralKey });
      const targetModel = (requestedModel && requestedModel.includes('mistral')) ? requestedModel : 'mistral-small-latest';
      model = mistral(targetModel);
    } else {
      return new Response(
        JSON.stringify({ error: 'No API key found. Please configure an API key in Settings.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const systemPrompt = `You are an expert AI engineer configuring MCP (Model Context Protocol) tool schemas.
Analyze the provided node-based execution flow graph and generate:
1. toolName: A short, concise snake_case function name (e.g., "generate_readme", "search_web_summary", "review_code").
2. toolDescription: A clear 1-2 sentence description explaining what the tool does so an AI model knows when to invoke it.
3. inputHint: A short description explaining what input value to pass (e.g., "GitHub repository in owner/repo format", "Search query or topic").

Respond ONLY with raw JSON matching this exact structure:
{
  "toolName": "...",
  "toolDescription": "...",
  "inputHint": "..."
}`;

    const { text } = await generateText({
      model,
      system: systemPrompt,
      prompt: `Flow Graph Details:\n${flowSummary}`,
    });

    const cleanedText = text.replace(/```json/gi, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanedText);

    return new Response(JSON.stringify(parsed), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message || 'Failed to generate metadata' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
