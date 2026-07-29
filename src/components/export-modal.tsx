"use client";

import { useFlowStore } from "@/store/flow-store";
import { Copy, Check, X, FileCode, FileJson, FileText, Download, Sparkles, Key, Info } from "lucide-react";
import { useState } from "react";
import { type Node, type Edge } from "@xyflow/react";
import JSZip from "jszip";

// Defined outside the template so it can be injected via .toString() without TS parsing the body as TSX
function interpolateVariables(text: string, nodeOutputs: Record<string, string>, lastOutput: string): string {
  if (!text) return text;
  const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|\[\]\\]/g, '\\$&');
  try {
    const obj = JSON.parse(text);
    const replaceInObj = (item: unknown): unknown => {
      if (typeof item === 'string') {
        let res = item.replace(/\{\{\s*(output|outputContext)\s*\}\}/gi, lastOutput);
        for (const [key, val] of Object.entries(nodeOutputs)) {
          res = res.replace(new RegExp('\\{\\{\\s*' + escapeRegex(key) + '(\\.(output|input))?\\s*\\}\\}', 'gi'), val);
        }
        return res;
      }
      if (Array.isArray(item)) return item.map(replaceInObj);
      if (item && typeof item === 'object') {
        const o: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(item as Record<string, unknown>)) o[k] = replaceInObj(v);
        return o;
      }
      return item;
    };
    return JSON.stringify(replaceInObj(obj), null, 2);
  } catch {
    let result = text;
    const allVars: Record<string, string> = { output: lastOutput, outputContext: lastOutput, ...nodeOutputs };
    for (const [key, val] of Object.entries(allVars)) {
      const ek = escapeRegex(key);
      result = result.replace(new RegExp('"\\{\\{\\s*' + ek + '(\\.(output|input))?\\s*\\}}"', 'gi'), JSON.stringify(val));
      result = result.replace(new RegExp('\\{\\{\\s*' + ek + '(\\.(output|input))?\\s*\\}\\}', 'gi'), val);
    }
    return result;
  }
}

function generateMCPCode(graph: { nodes: Node[], edges: Edge[] }, toolName: string, toolDescription: string, inputHint: string) {
  const cleanedNodes = graph.nodes.map((n) => ({
    id: n.id,
    type: n.type,
    data: n.data,
  }));
  const cleanedEdges = graph.edges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    sourceHandle: e.sourceHandle,
  }));

  const nodesJson = JSON.stringify(cleanedNodes, null, 2);
  const edgesJson = JSON.stringify(cleanedEdges, null, 2);
  const interpolateFnSrc = `function interpolateVariables(text: any, nodeOutputs: Record<string, string>, lastOutput: string): string {
  if (!text) return text;
  const escapeRegex = (s: string) => s.replace(/[-.*+?^\${}()|[\\]\\\\]/g, '\\\\$&');
  const toBase64 = (str: string) => Buffer.from(String(str ?? ''), 'utf-8').toString('base64');
  try {
    const obj = JSON.parse(text);
    const replaceInObj = (item: any): any => {
      if (typeof item === 'string') {
        let res = item.replace(/\\{\\{\\s*(output|outputContext)\\.base64\\s*\\}\\}/gi, toBase64(lastOutput));
        res = res.replace(/\\{\\{\\s*(output|outputContext)\\s*\\}\\}/gi, lastOutput);
        for (const [key, val] of Object.entries(nodeOutputs)) {
          const ek = escapeRegex(key);
          res = res.replace(new RegExp('\\{\\{\\s*' + ek + '\\.base64\\s*\\}\\}', 'gi'), toBase64(String(val)));
          res = res.replace(new RegExp('\\{\\{\\s*' + ek + '(\\.(output|input))?\\s*\\}\\}', 'gi'), String(val));
        }
        return res;
      }
      if (Array.isArray(item)) return item.map(replaceInObj);
      if (item && typeof item === 'object') {
        const o: Record<string, any> = {};
        for (const [k, v] of Object.entries(item)) o[k] = replaceInObj(v);
        return o;
      }
      return item;
    };
    return JSON.stringify(replaceInObj(obj), null, 2);
  } catch {
    let result = String(text);
    const allVars: Record<string, string> = { output: lastOutput, outputContext: lastOutput, ...nodeOutputs };
    for (const [key, val] of Object.entries(allVars)) {
      const ek = escapeRegex(key);
      result = result.replace(new RegExp('"\\{\\{\\s*' + ek + '\\.base64\\s*\\}}"', 'gi'), JSON.stringify(toBase64(val)));
      result = result.replace(new RegExp('\\{\\{\\s*' + ek + '\\.base64\\s*\\}\\}', 'gi'), toBase64(val));
      result = result.replace(new RegExp('"\\{\\{\\s*' + ek + '(\\.(output|input))?\\s*\\}}"', 'gi'), JSON.stringify(val));
      result = result.replace(new RegExp('\\{\\{\\s*' + ek + '(\\.(output|input))?\\s*\\}\\}', 'gi'), String(val));
    }
    return result;
  }
}`;

  return `import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

try {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  dotenv.config({ path: path.resolve(__dirname, '../.env') });
} catch {
  // Ignore fallback error if file doesn't exist
}

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { createOllama } from 'ollama-ai-provider';
import { createMistral } from '@ai-sdk/mistral';
import { createGoogleGenerativeAI } from '@ai-sdk/google';

const server = new McpServer({
  name: "agentforge-skill",
  version: "1.0.0",
});

const nodes: any[] = ${nodesJson};
const edges: any[] = ${edgesJson};

${interpolateFnSrc}

server.tool(
  "${toolName}",
  "${toolDescription}",
  { input: z.string().describe("${inputHint}") },
  async ({ input }) => {
    try {
      let currentNode: any = nodes.find((n) => n.type === 'trigger');
      if (!currentNode) {
        return { content: [{ type: "text", text: "Error: Graph must contain a Trigger node" }], isError: true };
      }

      // nodeOutputs tracks every node's output keyed by id AND label
      const nodeOutputs: Record<string, string> = {};
      let outputContext = input || '';
      let systemPrompt = 'You are a helpful AI assistant.';

      // Seed trigger outputs so {{trigger}} works in downstream nodes
      nodeOutputs[currentNode.id] = outputContext;
      nodeOutputs['trigger'] = outputContext;
      if (currentNode.data?.label) nodeOutputs[currentNode.data.label] = outputContext;

      while (currentNode) {
        if (currentNode.type === 'trigger') {
          outputContext = input || '';
          nodeOutputs[currentNode.id] = outputContext;
          nodeOutputs['trigger'] = outputContext;
          if (currentNode.data?.label) nodeOutputs[currentNode.data.label] = outputContext;

        } else if (currentNode.type === 'prompt') {
          const rawPrompt = currentNode.data?.prompt || systemPrompt;
          systemPrompt = interpolateVariables(rawPrompt, nodeOutputs, outputContext);
          nodeOutputs[currentNode.id] = systemPrompt;
          if (currentNode.data?.label) nodeOutputs[currentNode.data.label] = systemPrompt;

        } else if (currentNode.type === 'api') {
          const method = currentNode.data?.method || 'GET';
          let url = currentNode.data?.url || currentNode.data?.endpoint || '';
          url = interpolateVariables(url, nodeOutputs, outputContext);

          if (url) {
            try {
              const fetchOptions: any = { method };
              if (currentNode.data?.headers) {
                try {
                  const interpolatedHeaders = interpolateVariables(currentNode.data.headers, nodeOutputs, outputContext);
                  fetchOptions.headers = JSON.parse(interpolatedHeaders);
                } catch {
                  throw new Error('Invalid JSON in API Headers');
                }
              }
              if (method !== 'GET' && method !== 'HEAD') {
                let bodyStr = typeof currentNode.data?.body === 'string'
                  ? interpolateVariables(currentNode.data.body, nodeOutputs, outputContext)
                  : outputContext;

                if (method === 'PUT' && url.includes('api.github.com/repos/') && url.includes('/contents/')) {
                  try {
                    const bodyObj = JSON.parse(bodyStr);
                    if (bodyObj.content) {
                      let rawContent = typeof bodyObj.content === 'string' ? bodyObj.content.trim() : '';
                      if (rawContent.startsWith('\`\`\`')) {
                        rawContent = rawContent.replace(/^\`\`\`[a-z]*\\n?/i, '').replace(/\\n?\`\`\`$/i, '').trim();
                      }
                      bodyObj.content = Buffer.from(rawContent, 'utf-8').toString('base64');
                    }
                    if (!bodyObj.sha) {
                      try {
                        const getShaRes = await fetch(url, { headers: fetchOptions.headers });
                        if (getShaRes.ok) {
                          const existingFile = await getShaRes.json();
                          if (existingFile?.sha) {
                            bodyObj.sha = existingFile.sha;
                          }
                        }
                      } catch {
                        // ignore SHA fetch error
                      }
                    }
                    bodyStr = JSON.stringify(bodyObj, null, 2);
                  } catch {
                    // ignore JSON parse error
                  }
                }

                fetchOptions.body = bodyStr;
              }
              const response = await fetch(url, fetchOptions);
              outputContext = await response.text();
            } catch (e: any) {
              outputContext = \`API Request failed: \${e.message}\`;
            }
          }
          nodeOutputs[currentNode.id] = outputContext;
          if (currentNode.data?.label) nodeOutputs[currentNode.data.label] = outputContext;

        } else if (currentNode.type === 'code') {
          const script = currentNode.data?.code || 'return output;';
          try {
            const fn = new Function('output', 'outputs', script);
            const result = fn(outputContext, nodeOutputs);
            outputContext = typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result ?? '');
          } catch (e: any) {
            outputContext = \`Code execution error: \${e.message}\`;
          }
          nodeOutputs[currentNode.id] = outputContext;
          if (currentNode.data?.label) nodeOutputs[currentNode.data.label] = outputContext;

        } else if (currentNode.type === 'json') {
          const jsonPath = currentNode.data?.path || '';
          try {
            const parsed = JSON.parse(outputContext);
            if (jsonPath) {
              const fn = new Function('data', \`try { return data.\${jsonPath}; } catch { return undefined; }\`);
              const extracted = fn(parsed);
              outputContext = typeof extracted === 'object' ? JSON.stringify(extracted, null, 2) : String(extracted ?? '');
            }
          } catch (e: any) {
            outputContext = \`JSON Extraction error: \${e.message}\`;
          }
          nodeOutputs[currentNode.id] = outputContext;
          if (currentNode.data?.label) nodeOutputs[currentNode.data.label] = outputContext;

        } else if (currentNode.type === 'output') {
          const rawTpl = currentNode.data?.template || currentNode.data?.body || '';
          if (rawTpl) {
            outputContext = interpolateVariables(rawTpl, nodeOutputs, outputContext);
          }
          nodeOutputs[currentNode.id] = outputContext;
          if (currentNode.data?.label) nodeOutputs[currentNode.data.label] = outputContext;

        } else if (currentNode.type === 'llm') {
          const modelName = currentNode.data?.model || 'gpt-4o';
          let model: any;
          const mLower = modelName.toLowerCase();
          const isGemini =
            mLower.startsWith('gemini-') ||
            mLower.includes('google') ||
            mLower.includes('flash') ||
            mLower.includes('gemini') ||
            /^(3\\.[0-9]|2\\.[0-9]|1\\.[0-9])/.test(mLower);

          if (isGemini && !mLower.startsWith('gpt-') && !mLower.includes('mistral')) {
            const resolvedModel = mLower.startsWith('gemini-') ? modelName : \`gemini-\${modelName}\`;
            const google = createGoogleGenerativeAI({ apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY || '' });
            model = google(resolvedModel);
          } else if (mLower.startsWith('gpt-')) {
            const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY || '' });
            model = openai(modelName);
          } else if (mLower.includes('mistral') || mLower.includes('mixtral')) {
            const mistral = createMistral({ apiKey: process.env.MISTRAL_API_KEY || '' });
            model = mistral(modelName);
          } else {
            const ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434/api';
            const ollama = createOllama({ baseURL: ollamaUrl });
            model = ollama(modelName);
          }

          const interpolatedInput = interpolateVariables(outputContext, nodeOutputs, outputContext);
          const outgoingEdges = edges.filter((e) => e.source === currentNode.id);

          let text: string;
          ({ text } = await generateText({
            model,
            system: systemPrompt,
            prompt: interpolatedInput,
          } as any));

          // Strip wrapping markdown fences if present
          text = text.trim();
          if (text.startsWith('\`\`\`')) {
            text = text.replace(/^\`\`\`[a-z]*\\n?/i, '').replace(/\\n?\`\`\`$/i, '').trim();
          }

          outputContext = text;
          nodeOutputs[currentNode.id] = text;
          nodeOutputs['llm'] = text;
          if (currentNode.data?.label) nodeOutputs[currentNode.data.label] = text;

          // If LLM is the terminal node, return immediately
          if (outgoingEdges.length === 0) {
            return { content: [{ type: "text", text }] };
          }
        }

        const outgoingEdges = edges.filter((e) => e.source === currentNode.id);
        if (outgoingEdges.length === 0) break;

        let nextEdge: any;
        if (currentNode.type === 'condition') {
          let conditionResult = false;
          try {
            const condStr = interpolateVariables(currentNode.data?.condition || 'false', nodeOutputs, outputContext);
            const func = new Function('output', 'outputs', \`return \${condStr};\`);
            conditionResult = !!func(outputContext, nodeOutputs);
          } catch {
            conditionResult = false;
          }
          const handleId = conditionResult ? 'true' : 'false';
          nextEdge = outgoingEdges.find((e) => e.sourceHandle === handleId) || outgoingEdges[0];
        } else {
          nextEdge = outgoingEdges[0];
        }

        currentNode = nextEdge ? nodes.find((n) => n.id === nextEdge.target) : null;
      }

      return { content: [{ type: "text", text: outputContext }] };
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
    "@ai-sdk/google": "latest",
    "@ai-sdk/openai": "latest",
    "@ai-sdk/mistral": "latest",
    "ollama-ai-provider": "latest",
    "dotenv": "^16.4.5",
    "zod": "latest"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "@types/node": "^20.0.0"
  }
}`;
}

function generateDotenvExample() {
  return `# AgentForge Exported MCP Server Environment Variables
# Rename or copy this file to .env and fill in your API keys:

# Google Gemini Key
GEMINI_API_KEY=
GOOGLE_GENERATIVE_AI_API_KEY=

# OpenAI Key
OPENAI_API_KEY=

# Mistral Key
MISTRAL_API_KEY=

# Ollama Endpoint (default: http://localhost:11434/api)
OLLAMA_URL=http://localhost:11434/api
`;
}

function generateMcpConfigSnippet(toolName: string) {
  return `{
  "mcpServers": {
    "${toolName || 'agentforge-skill'}": {
      "command": "node",
      "args": [
        "/path/to/dist/server.js"
      ],
      "env": {
        "GEMINI_API_KEY": "YOUR_GEMINI_API_KEY_HERE",
        "OPENAI_API_KEY": "YOUR_OPENAI_API_KEY_HERE",
        "MISTRAL_API_KEY": "YOUR_MISTRAL_API_KEY_HERE"
      }
    }
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

function generateTsConfig() {
  return `{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*"]
}`;
}

function generateReadme(toolName: string = "agentforge-skill") {
  return `# AgentForge MCP Skill Server

Generated visually in AgentForge Studio.

## 🚀 Quick Start

1. **Install dependencies**:
   \`\`\`bash
   npm install
   \`\`\`

2. **Build the server**:
   \`\`\`bash
   npm run build
   \`\`\`

## ⚙️ MCP Client Configuration (Recommended)

Set your LLM provider API key(s) directly inside your MCP client's configuration file using the \`"env"\` block. This guarantees your server runs reliably regardless of execution directory.

### Configuration Snippet

Add this to your MCP client config file (e.g. Claude Desktop \`claude_desktop_config.json\`, Cursor \`mcp.json\`, or Antigravity \`mcp_config.json\`):

\`\`\`json
{
  "mcpServers": {
    "${toolName}": {
      "command": "node",
      "args": [
        "/absolute/path/to/dist/server.js"
      ],
      "env": {
        "GEMINI_API_KEY": "YOUR_GEMINI_API_KEY_HERE",
        "OPENAI_API_KEY": "YOUR_OPENAI_API_KEY_HERE",
        "MISTRAL_API_KEY": "YOUR_MISTRAL_API_KEY_HERE"
      }
    }
  }
}
\`\`\`

### Alternative: Local \`.env\` File
You can also copy \`.env.example\` to \`.env\` in this server directory:
\`\`\`bash
cp .env.example .env
\`\`\`
Edit \`.env\` and add your keys:
\`\`\`env
GEMINI_API_KEY=YOUR_GEMINI_API_KEY_HERE
\`\`\`
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
  const [copiedConfig, setCopiedConfig] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const [isGeneratingMeta, setIsGeneratingMeta] = useState(false);
  const [toolName, setToolName] = useState("run_skill");
  const [toolDescription, setToolDescription] = useState("Executes the built AI skill");
  const [inputHint, setInputHint] = useState("The user input or data to process");

  let code = "";
  let pkg = "";
  let md = "";
  let mcpConfig = "";
  let readmeStr = "";

  const graph = getExecutableGraph();
  if (graph) {
    const promptNode = graph.nodes.find((n) => n.type === "prompt");

    const systemPrompt =
      (promptNode?.data?.prompt as string) || "You are a helpful AI assistant.";
    code = generateMCPCode(graph, toolName, toolDescription, inputHint);
    pkg = generatePackageJson();
    md = generateSkillMd(systemPrompt);
    mcpConfig = generateMcpConfigSnippet(toolName);
    readmeStr = generateReadme(toolName);
  }

  const handleAIGenerateMeta = async () => {
    if (!graph) return;
    setIsGeneratingMeta(true);
    try {
      const flowSummary = graph.nodes
        .map((n) => {
          if (n.type === "trigger") return `[Trigger] Input: "${n.data?.label || n.data?.input || "User Input"}"`;
          if (n.type === "prompt") return `[Prompt] System: "${String(n.data?.prompt || "").slice(0, 300)}"`;
          if (n.type === "api") return `[API Request] ${n.data?.method || "GET"} ${n.data?.url || n.data?.endpoint || ""}`;
          if (n.type === "llm") return `[LLM Node] Model: ${n.data?.model || "gpt-4o"}`;
          if (n.type === "code") return `[Code Node] Script: ${n.data?.label || "Custom Logic"}`;
          return `[${n.type}] Label: ${n.data?.label || n.type}`;
        })
        .join("\n");

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (typeof window !== "undefined") {
        const savedSettings = localStorage.getItem("agentforge-settings");
        if (savedSettings) {
          try {
            const parsed = JSON.parse(savedSettings);
            if (parsed.googleKey) headers["x-google-api-key"] = parsed.googleKey;
            if (parsed.openaiKey) headers["x-openai-api-key"] = parsed.openaiKey;
            if (parsed.mistralKey) headers["x-mistral-api-key"] = parsed.mistralKey;
            if (parsed.defaultModel) headers["x-default-model"] = parsed.defaultModel;
          } catch {
            // ignore
          }
        }
      }

      const res = await fetch("/api/generate-tool-meta", {
        method: "POST",
        headers,
        body: JSON.stringify({ flowSummary }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to generate tool metadata");
      }

      if (data.toolName) setToolName(data.toolName);
      if (data.toolDescription) setToolDescription(data.toolDescription);
      if (data.inputHint) setInputHint(data.inputHint);
    } catch (err: any) {
      alert(err.message || "Error generating tool metadata with AI");
    } finally {
      setIsGeneratingMeta(false);
    }
  };

  const copyToClipboard = (text: string, type: "code" | "json" | "md" | "config") => {
    navigator.clipboard.writeText(text);
    if (type === "code") {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } else if (type === "json") {
      setCopiedJson(true);
      setTimeout(() => setCopiedJson(false), 2000);
    } else if (type === "config") {
      setCopiedConfig(true);
      setTimeout(() => setCopiedConfig(false), 2000);
    } else {
      setCopiedMd(true);
      setTimeout(() => setCopiedMd(false), 2000);
    }
  };

  const handleDownloadZip = async () => {
    if (!graph) return;
    setIsZipping(true);
    try {
      const zip = new JSZip();
      zip.file("src/server.ts", code);
      zip.file("package.json", pkg);
      zip.file("SKILL.md", md);
      zip.file("tsconfig.json", generateTsConfig());
      zip.file("README.md", readmeStr);
      zip.file(".env.example", generateDotenvExample());

      const content = await zip.generateAsync({ type: "blob" });
      const downloadAnchor = document.createElement("a");
      downloadAnchor.href = URL.createObjectURL(content);
      downloadAnchor.download = `agentforge-mcp-server-${Date.now()}.zip`;
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (e) {
      alert("Failed to generate zip file: " + (e as Error).message);
    } finally {
      setIsZipping(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-4xl h-[85vh] flex flex-col bg-card border border-warm-border rounded-2xl shadow-2xl relative overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="p-6 border-b border-warm-border space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-bold text-foreground mb-1">
                Export MCP Server
              </h2>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-lg">
                Your AI Skill is ready to run inside Claude Desktop, Cursor, and
                any other MCP client! Configure how the AI sees this tool, then download.
              </p>
            </div>
            <div className="flex items-center gap-2">
              {graph && (
                <button
                  onClick={handleDownloadZip}
                  disabled={isZipping}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold
                    bg-gold text-gold-foreground hover:brightness-105 transition-all shadow-sm
                    disabled:opacity-60"
                >
                  <Download className="h-3.5 w-3.5" />
                  {isZipping ? "Creating Zip..." : "Download Project (.zip)"}
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors shrink-0"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* API Keys Notice */}
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-300">
            <Key className="h-4 w-4 shrink-0 text-amber-500" />
            <span>
              <strong>Client Config Setup:</strong> Pass API keys directly inside your MCP client config JSON (Claude Desktop, Cursor, or Antigravity) under the <code>"env"</code> dictionary for 100% reliable execution!
            </span>
          </div>
          {/* MCP Tool Identity — tells the AI what this tool does and what to pass */}
          <div className="space-y-2 p-3 rounded-xl bg-muted/40 border border-warm-border">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                MCP Tool Identity
              </span>
              <button
                onClick={handleAIGenerateMeta}
                disabled={isGeneratingMeta || !graph}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold
                  bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20
                  hover:bg-purple-500/20 transition-all disabled:opacity-50"
              >
                <Sparkles className="h-3 w-3 text-purple-500 animate-pulse" />
                {isGeneratingMeta ? "Generating with AI..." : "Generate with AI"}
              </button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-medium text-muted-foreground">
                  Tool Name
                </label>
                <input
                  value={toolName}
                  onChange={(e) => setToolName(e.target.value.replace(/\s+/g, '_').toLowerCase())}
                  placeholder="e.g. generate_readme"
                  className="w-full h-8 px-2.5 text-xs rounded-lg bg-background border border-warm-border focus:outline-none focus:ring-1 focus:ring-gold/50"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-medium text-muted-foreground">
                  Tool Description (AI reads this)
                </label>
                <input
                  value={toolDescription}
                  onChange={(e) => setToolDescription(e.target.value)}
                  placeholder="e.g. Generates a README for a GitHub repo"
                  className="w-full h-8 px-2.5 text-xs rounded-lg bg-background border border-warm-border focus:outline-none focus:ring-1 focus:ring-gold/50"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-medium text-muted-foreground">
                  Input Hint (tells AI what to pass)
                </label>
                <input
                  value={inputHint}
                  onChange={(e) => setInputHint(e.target.value)}
                  placeholder="e.g. GitHub repo as owner/repo format"
                  className="w-full h-8 px-2.5 text-xs rounded-lg bg-background border border-warm-border focus:outline-none focus:ring-1 focus:ring-gold/50"
                />
              </div>
            </div>
          </div>
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

              {/* Bottom files row: MCP Config snippet, package.json, SKILL.md */}
              <div className="flex h-[180px] gap-4 shrink-0">
                <div className="flex-1 flex flex-col border border-warm-border rounded-xl bg-cream overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-2.5 border-b border-warm-border bg-muted/30">
                    <div className="flex items-center gap-2">
                      <FileJson className="h-3.5 w-3.5 text-emerald-500" />
                      <span className="font-semibold text-xs text-foreground">
                        mcp_config.json
                      </span>
                      <span className="text-[9px] uppercase tracking-wider font-medium px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        Client Config
                      </span>
                    </div>
                    <button
                      onClick={() => copyToClipboard(mcpConfig, "config")}
                      className="p-1.5 rounded-lg hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors"
                      title="Copy MCP Client Configuration"
                    >
                      {copiedConfig ? (
                        <Check className="h-3.5 w-3.5 text-green-500" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                  <div className="flex-1 p-4 overflow-auto">
                    <pre className="text-xs font-mono whitespace-pre-wrap text-muted-foreground leading-relaxed">
                      {mcpConfig}
                    </pre>
                  </div>
                </div>

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
