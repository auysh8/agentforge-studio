# AgentForge Studio

AgentForge Studio is a visual IDE and node-based builder for designing, testing, and deploying autonomous AI agents and complex AI workflows. Built with Next.js, React Flow, and the Vercel AI SDK.

## Features

- **Visual Flow Builder**: Drag-and-drop node interface for constructing AI logic using React Flow.
- **Multi-Model Support**: Integrated with OpenAI, Mistral, and local Ollama models via Vercel AI SDK.
- **Code Editor**: Built-in Monaco editor for custom scripting and prompt engineering.
- **Advanced Layout**: Flexible, resizable panels using FlexLayout and React Resizable Panels.
- **Modern UI**: Styled with Tailwind CSS v4, Shadcn UI, and Base UI components.
- **Local & Cloud Capable**: Export your agent flows or run them directly in the browser.

## Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org) (React 19)
- **Visual Editor**: [@xyflow/react](https://reactflow.dev/)
- **AI Integration**: [Vercel AI SDK](https://sdk.vercel.ai/)
- **State Management**: [Zustand](https://zustand-demo.pmnd.rs/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **UI Components**: [Shadcn UI](https://ui.shadcn.com/)

## Getting Started

First, install the dependencies:

```bash
npm install
```

Then, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the studio.

## Environment Variables

Ensure you create a `.env.local` file in the root directory and add your API keys for the providers you plan to use:

```env
OPENAI_API_KEY=your_openai_api_key
MISTRAL_API_KEY=your_mistral_api_key
```
