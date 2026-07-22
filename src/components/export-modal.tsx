"use client";

import { useFlowStore } from "@/store/flow-store";
import { Copy, Check, X, FileCode, FileJson, FileText } from "lucide-react";
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
        system: ${JSON.stringify("SYSTEM_PROMPT_PLACEHOLDER")},
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

export function ExportModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const getExecutableGraph = useFlowStore(
    (state) => state.getExecutableGraph
  );
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);
  const [copiedMd, setCopiedMd] = useState(false);

  let code = "";
  let pkg = "";
  let md = "";

  const graph = getExecutableGraph();
  if (graph) {
    const promptNode = graph.nodes.find((n) => n.type === "prompt");
    const llmNode = graph.nodes.find((n) => n.type === "llm");

    const systemPrompt =
      (promptNode?.data?.prompt as string) || "You are a helpful AI assistant.";
    const modelName = (llmNode?.data?.model as string) || "gpt-4o";

    code = generateMCPCode(systemPrompt, modelName);
    pkg = generatePackageJson();
    md = generateSkillMd(systemPrompt);
  }

  const copyToClipboard = (text: string, type: "code" | "json" | "md") => {
    navigator.clipboard.writeText(text);
    if (type === "code") {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } else if (type === "json") {
      setCopiedJson(true);
      setTimeout(() => setCopiedJson(false), 2000);
    } else {
      setCopiedMd(true);
      setTimeout(() => setCopiedMd(false), 2000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-4xl h-[80vh] flex flex-col bg-card border border-warm-border rounded-2xl shadow-2xl relative overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="p-6 border-b border-warm-border flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold text-foreground mb-1">
              Export MCP Server
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-lg">
              Your AI Skill is ready to run inside Claude Desktop, Cursor, and
              any other MCP client! Save these files in a new directory, run{" "}
              <code className="px-1.5 py-0.5 rounded-md bg-muted text-[10px] font-mono">
                npm install
              </code>
              , and build the server.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors shrink-0 -mt-1 -mr-1"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-hidden flex flex-col">
          {!graph ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm border border-dashed border-warm-border rounded-2xl">
              Your graph is incomplete. Please ensure you have a Trigger and
              an LLM node connected before exporting.
            </div>
          ) : (
            <div className="flex-1 flex flex-col gap-4 min-h-0">
              {/* Main code file */}
              <div className="flex-1 flex flex-col border border-warm-border rounded-xl min-h-0 bg-cream overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-warm-border bg-muted/30">
                  <div className="flex items-center gap-2">
                    <FileCode className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="font-semibold text-xs">
                      server.ts
                    </span>
                    <span className="text-[9px] uppercase tracking-wider font-medium px-1.5 py-0.5 rounded-full bg-gold/20 text-gold-foreground/60">
                      MCP Export
                    </span>
                  </div>
                  <button
                    onClick={() => copyToClipboard(code, "code")}
                    className="p-1.5 rounded-lg hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {copiedCode ? (
                      <Check className="h-3.5 w-3.5 text-green-500" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
                <div className="flex-1 p-4 overflow-auto">
                  <pre className="text-xs font-mono whitespace-pre-wrap text-muted-foreground leading-relaxed">
                    {code}
                  </pre>
                </div>
              </div>

              {/* Bottom files row */}
              <div className="flex h-[180px] gap-4 shrink-0">
                <div className="flex-1 flex flex-col border border-warm-border rounded-xl bg-cream overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-2.5 border-b border-warm-border bg-muted/30">
                    <div className="flex items-center gap-2">
                      <FileJson className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="font-semibold text-xs">
                        package.json
                      </span>
                    </div>
                    <button
                      onClick={() => copyToClipboard(pkg, "json")}
                      className="p-1.5 rounded-lg hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {copiedJson ? (
                        <Check className="h-3.5 w-3.5 text-green-500" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                  <div className="flex-1 p-4 overflow-auto">
                    <pre className="text-xs font-mono whitespace-pre-wrap text-muted-foreground leading-relaxed">
                      {pkg}
                    </pre>
                  </div>
                </div>

                <div className="flex-1 flex flex-col border border-warm-border rounded-xl bg-cream overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-2.5 border-b border-warm-border bg-muted/30">
                    <div className="flex items-center gap-2">
                      <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="font-semibold text-xs">SKILL.md</span>
                      <span className="text-[9px] uppercase tracking-wider font-medium px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-500/70">
                        Web Export
                      </span>
                    </div>
                    <button
                      onClick={() => copyToClipboard(md, "md")}
                      className="p-1.5 rounded-lg hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {copiedMd ? (
                        <Check className="h-3.5 w-3.5 text-green-500" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                  <div className="flex-1 p-4 overflow-auto">
                    <pre className="text-xs font-mono whitespace-pre-wrap text-muted-foreground leading-relaxed">
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
