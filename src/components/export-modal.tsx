"use client";

import { useFlowStore } from "@/store/flow-store";
import { Button } from "@/components/ui/button";
import { Copy, Check, X } from "lucide-react";
import { useState } from "react";

function generateMCPCode(systemPrompt: string, modelName: string) {
  return `import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { createOllama } from 'ollama-ai-provider';
import { createMistral } from '@ai-sdk/mistral';

const server = new McpServer({
  name: "agentforge-skill",
  version: "1.0.0",
});

server.tool(
  "run_skill",
  "Executes the built AI skill",
  { input: z.string().describe("The user input or data to process") },
  async ({ input }) => {
    let model;
    const modelName = "${modelName}";
    if (modelName.startsWith('gpt-')) {
      const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });
      model = openai(modelName);
    } else if (modelName.includes('mistral') || modelName.includes('mixtral')) {
      const mistral = createMistral({ apiKey: process.env.MISTRAL_API_KEY });
      model = mistral(modelName);
    } else {
      const ollama = createOllama({ baseURL: 'http://localhost:11434/api' });
      model = ollama(modelName);
    }

    try {
      const { text } = await generateText({
        model: model,
        system: ${JSON.stringify(systemPrompt)},
        prompt: input,
      });
      return { content: [{ type: "text", text: text }] };
    } catch (e: any) {
      return { content: [{ type: "text", text: "Error: " + e.message }], isError: true };
    }
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("AgentForge MCP server running on stdio");
}

main().catch(console.error);
`;
}

function generatePackageJson() {
  return `{
  "name": "agentforge-mcp-skill",
  "version": "1.0.0",
  "type": "module",
  "bin": {
    "agentforge-mcp-skill": "./dist/server.js"
  },
  "scripts": {
    "build": "tsc",
    "start": "node dist/server.js"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "latest",
    "ai": "latest",
    "@ai-sdk/openai": "latest",
    "@ai-sdk/mistral": "latest",
    "ollama-ai-provider": "latest",
    "zod": "latest"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "@types/node": "^20.0.0"
  }
}`;
}

function generateSkillMd(systemPrompt: string) {
  return `---
name: custom-agentforge-skill
description: A custom skill generated visually in AgentForge Studio.
---

## Instructions

When this skill is invoked, follow these core instructions exactly:

${systemPrompt}
`;
}

export function ExportModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const getExecutableGraph = useFlowStore((state) => state.getExecutableGraph);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);
  const [copiedMd, setCopiedMd] = useState(false);
  
  let code = "";
  let pkg = "";
  let md = "";

  const graph = getExecutableGraph();
  if (graph) {
    const promptNode = graph.nodes.find(n => n.type === 'prompt');
    const llmNode = graph.nodes.find(n => n.type === 'llm');
    
    const systemPrompt = promptNode?.data?.prompt || 'You are a helpful AI assistant.';
    const modelName = llmNode?.data?.model || 'gpt-4o';

    code = generateMCPCode(systemPrompt, modelName);
    pkg = generatePackageJson();
    md = generateSkillMd(systemPrompt);
  }

  const copyToClipboard = (text: string, type: 'code' | 'json' | 'md') => {
    navigator.clipboard.writeText(text);
    if (type === 'code') {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } else if (type === 'json') {
      setCopiedJson(true);
      setTimeout(() => setCopiedJson(false), 2000);
    } else {
      setCopiedMd(true);
      setTimeout(() => setCopiedMd(false), 2000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-4xl h-[80vh] flex flex-col bg-background border rounded-lg shadow-lg relative overflow-hidden">
        
        <div className="p-6 border-b flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold mb-1">Export MCP Server</h2>
            <p className="text-sm text-muted-foreground">
              Your AI Skill is ready to run inside Claude Desktop, Cursor, and any other MCP client! 
              Save these files in a new directory, run \`npm install\`, and build the server.
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="shrink-0 -mt-2 -mr-2">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 p-6 overflow-hidden flex flex-col">
          {!graph ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm border border-dashed rounded-lg">
              Your graph is incomplete. Please ensure you have a Trigger and an LLM node connected before exporting.
            </div>
          ) : (
            <div className="flex-1 flex flex-col gap-4 min-h-0">
              <div className="flex-1 flex flex-col border rounded-md min-h-0 bg-muted/20">
                <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/40">
                  <span className="font-semibold text-sm">server.ts (MCP Export)</span>
                  <Button size="sm" variant="ghost" onClick={() => copyToClipboard(code, 'code')}>
                    {copiedCode ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <div className="flex-1 p-4 overflow-auto">
                  <pre className="text-xs font-mono whitespace-pre-wrap text-muted-foreground">
                    {code}
                  </pre>
                </div>
              </div>

              <div className="flex h-[200px] gap-4 shrink-0">
                <div className="flex-1 flex flex-col border rounded-md bg-muted/20">
                  <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/40">
                    <span className="font-semibold text-sm">package.json</span>
                    <Button size="sm" variant="ghost" onClick={() => copyToClipboard(pkg, 'json')}>
                      {copiedJson ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  <div className="flex-1 p-4 overflow-auto">
                    <pre className="text-xs font-mono whitespace-pre-wrap text-muted-foreground">
                      {pkg}
                    </pre>
                  </div>
                </div>

                <div className="flex-1 flex flex-col border rounded-md bg-muted/20">
                  <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/40">
                    <span className="font-semibold text-sm">SKILL.md (Web Export)</span>
                    <Button size="sm" variant="ghost" onClick={() => copyToClipboard(md, 'md')}>
                      {copiedMd ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  <div className="flex-1 p-4 overflow-auto">
                    <pre className="text-xs font-mono whitespace-pre-wrap text-muted-foreground">
                      {md}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
