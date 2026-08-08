"use client";

import { useFlowStore } from "@/store/flow-store";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Trash2 } from "lucide-react";
import {
  Play,
  Brain,
  ChatCircle,
  PaperPlaneTilt,
  GitBranch,
  SquaresFour,
  GitMerge,
  ArrowsClockwise,
  Code,
  BracketsCurly,
  Globe,
} from "@phosphor-icons/react";

const nodeTypeConfig: Record<string, { icon: React.ElementType; color: string; bg: string; label: string }> = {
  trigger: { icon: Play, color: "var(--family-trigger-icon-color)", bg: "var(--family-trigger-icon-bg)", label: "Trigger" },
  llm: { icon: Brain, color: "var(--family-ai-icon-color)", bg: "var(--family-ai-icon-bg)", label: "LLM Node" },
  prompt: { icon: ChatCircle, color: "var(--family-ai-icon-color)", bg: "var(--family-ai-icon-bg)", label: "Prompt" },
  output: { icon: PaperPlaneTilt, color: "var(--family-output-icon-color)", bg: "var(--family-output-icon-bg)", label: "Output Node" },
  condition: { icon: GitBranch, color: "var(--family-logic-icon-color)", bg: "var(--family-logic-icon-bg)", label: "Condition" },
  parallel: { icon: SquaresFour, color: "var(--family-logic-icon-color)", bg: "var(--family-logic-icon-bg)", label: "Parallel Split" },
  join: { icon: GitMerge, color: "var(--family-logic-icon-color)", bg: "var(--family-logic-icon-bg)", label: "Join / Merge" },
  foreach: { icon: ArrowsClockwise, color: "var(--family-logic-icon-color)", bg: "var(--family-logic-icon-bg)", label: "ForEach Loop" },
  code: { icon: Code, color: "var(--family-data-icon-color)", bg: "var(--family-data-icon-bg)", label: "Code Script" },
  json: { icon: BracketsCurly, color: "var(--family-data-icon-color)", bg: "var(--family-data-icon-bg)", label: "JSON Extractor" },
  api: { icon: Globe, color: "var(--family-integration-icon-color)", bg: "var(--family-integration-icon-bg)", label: "API Request" },
};

export function PropertiesPanel() {
  const nodes = useFlowStore((state) => state.nodes);
  const selectedNode = useFlowStore((state) => state.selectedNode);
  const updateNodeData = useFlowStore((state) => state.updateNodeData);
  const deleteNode = useFlowStore((state) => state.deleteNode);

  if (!selectedNode) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-muted/60 flex items-center justify-center">
          <Brain size={24} weight="fill" className="text-muted-foreground/40" />
        </div>
        <p className="text-sm text-muted-foreground/60">
          Select a node to edit its properties
        </p>
      </div>
    );
  }

  const availableVariables = nodes
    .filter((n) => n.id !== selectedNode.id)
    .map((n) => (n.data?.label as string) || n.id)
    .filter(Boolean);

  const insertVariable = (fieldName: string, varText: string) => {
    const currentVal = (selectedNode.data[fieldName] as string) || "";
    updateNodeData(selectedNode.id, { [fieldName]: currentVal ? `${currentVal} ${varText}` : varText });
  };

  const config = nodeTypeConfig[selectedNode.type || ""] || nodeTypeConfig.prompt;
  const IconComp = config.icon;

  const handleLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateNodeData(selectedNode.id, { label: e.target.value });
  };

  return (
    <div className="space-y-5">
      {/* Node Type Header */}
      <div className="flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor: config.bg }}>
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: config.bg }}
        >
          <IconComp size={18} weight="fill" style={{ color: config.color }} />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: config.color }}>
            {config.label}
          </p>
          <p className="text-[10px] text-muted-foreground">ID: {selectedNode.id}</p>
        </div>
      </div>

      {/* Label */}
      <div className="space-y-1.5">
        <Label htmlFor="node-label" className="text-xs font-medium text-muted-foreground">
          Label
        </Label>
        <Input
          id="node-label"
          value={(selectedNode.data.label as string) || ""}
          onChange={handleLabelChange}
          className="rounded-xl bg-cream border-warm-border h-9 text-sm"
        />
      </div>

      {/* Model (LLM) */}
      {selectedNode.type === "llm" && (
        <div className="space-y-1.5">
          <Label htmlFor="node-model" className="text-xs font-medium text-muted-foreground">
            Model
          </Label>
          <Input
            id="node-model"
            list="model-list"
            value={(selectedNode.data.model as string) || ""}
            onChange={(e) =>
              updateNodeData(selectedNode.id, { model: e.target.value })
            }
            className="rounded-xl bg-cream border-warm-border h-9 text-sm"
          />
          <datalist id="model-list">
            <option value="gemini-2.0-flash" />
            <option value="gemini-1.5-flash" />
            <option value="gemini-1.5-pro" />
            <option value="gpt-4o" />
            <option value="gpt-4o-mini" />
            <option value="gpt-4-turbo" />
            <option value="gpt-3.5-turbo" />
            <option value="claude-3-5-sonnet-20240620" />
            <option value="claude-3-opus-20240229" />
            <option value="claude-3-haiku-20240307" />
            <option value="mistral-large-latest" />
            <option value="mistral-small-latest" />
            <option value="open-mixtral-8x7b" />
            <option value="llama3" />
            <option value="mistral" />
            <option value="gemma" />
            <option value="phi3" />
          </datalist>
          <p className="text-[10px] text-muted-foreground/60">
            e.g. gemini-2.0-flash, gpt-4o, mistral-large-latest
          </p>
        </div>
      )}

      {/* Prompt Editor */}
      {selectedNode.type === "prompt" && (
        <div className="space-y-1.5">
          <Label htmlFor="node-prompt" className="text-xs font-medium text-muted-foreground">
            System Prompt
          </Label>
          <Textarea
            id="node-prompt"
            value={(selectedNode.data.prompt as string) || ""}
            onChange={(e) =>
              updateNodeData(selectedNode.id, { prompt: e.target.value })
            }
            className="h-[240px] resize-none overflow-y-auto rounded-xl bg-cream border-warm-border text-sm"
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            style={{ fieldSizing: "fixed" } as any}
            placeholder="Type your system prompt here..."
          />
          {availableVariables.length > 0 && (
            <div className="space-y-1 pt-1">
              <p className="text-[11px] font-medium text-muted-foreground">Available Variables (click to insert):</p>
              <div className="flex flex-wrap gap-1.5">
                {availableVariables.map((vName) => (
                  <button
                    key={vName}
                    type="button"
                    onClick={() => insertVariable("prompt", `{{${vName}}}`)}
                    className="px-2 py-0.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-[11px] font-mono text-primary transition-colors"
                  >
                    + {`{{${vName}}}`}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Test Input (Trigger) */}
      {selectedNode.type === "trigger" && (
        <div className="space-y-1.5">
          <Label htmlFor="node-input" className="text-xs font-medium text-muted-foreground">
            Test Input
          </Label>
          <Textarea
            id="node-input"
            value={(selectedNode.data.input as string) || ""}
            onChange={(e) =>
              updateNodeData(selectedNode.id, { input: e.target.value })
            }
            className="h-[280px] resize-none overflow-y-auto rounded-xl bg-cream border-warm-border text-sm"
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            style={{ fieldSizing: "fixed" } as any}
            placeholder="Type your test input here..."
          />
        </div>
      )}

      {/* API Configuration */}
      {selectedNode.type === "api" && (
        <>
          <div className="space-y-1.5">
            <Label htmlFor="node-method" className="text-xs font-medium text-muted-foreground">
              HTTP Method
            </Label>
            <select
              id="node-method"
              value={(selectedNode.data.method as string) || "GET"}
              onChange={(e) =>
                updateNodeData(selectedNode.id, { method: e.target.value })
              }
              className="w-full rounded-xl bg-cream border border-warm-border h-9 text-sm px-3 focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="DELETE">DELETE</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="node-url" className="text-xs font-medium text-muted-foreground">
              Endpoint URL
            </Label>
            <Input
              id="node-url"
              value={(selectedNode.data.url as string) || ""}
              onChange={(e) =>
                updateNodeData(selectedNode.id, { url: e.target.value })
              }
              placeholder="https://api.example.com/data"
              className="rounded-xl bg-cream border-warm-border h-9 text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="node-headers" className="text-xs font-medium text-muted-foreground">
              Headers (JSON)
            </Label>
            <Textarea
              id="node-headers"
              value={(selectedNode.data.headers as string) || ""}
              onChange={(e) =>
                updateNodeData(selectedNode.id, { headers: e.target.value })
              }
              className="h-[100px] resize-none overflow-y-auto rounded-xl bg-cream border-warm-border text-sm font-mono"
              placeholder='{\n  "x-api-key": "your-key",\n  "Content-Type": "application/json"\n}'
            />
          </div>
          {((selectedNode.data.method as string) || "GET") !== "GET" && (
            <div className="space-y-1.5">
              <Label htmlFor="node-body" className="text-xs font-medium text-muted-foreground">
                Request Body (JSON / String)
              </Label>
              <Textarea
                id="node-body"
                value={(selectedNode.data.body as string) || ""}
                onChange={(e) =>
                  updateNodeData(selectedNode.id, { body: e.target.value })
                }
                className="h-[120px] resize-none overflow-y-auto rounded-xl bg-cream border-warm-border text-sm font-mono"
                placeholder='{\n  "query": "{{trigger.input}}",\n  "numResults": 5\n}'
              />
              <p className="text-[10px] text-muted-foreground/60 leading-tight">
                Supports variable placeholders like {"{{trigger.input}}"} or {"{{output}}"}.
              </p>
            </div>
          )}
        </>
      )}

      {/* Condition Logic */}
      {selectedNode.type === "condition" && (
        <div className="space-y-1.5">
          <Label htmlFor="node-condition" className="text-xs font-medium text-muted-foreground">
            Condition Statement
          </Label>
          <Textarea
            id="node-condition"
            value={(selectedNode.data.condition as string) || ""}
            onChange={(e) =>
              updateNodeData(selectedNode.id, { condition: e.target.value })
            }
            className="h-[120px] resize-none overflow-y-auto rounded-xl bg-cream border-warm-border text-sm font-mono"
            placeholder="e.g. output.includes('success')"
          />
          <p className="text-[10px] text-muted-foreground/60 leading-tight">
            Use Javascript-like syntax to evaluate variables coming into this node.
          </p>
        </div>
      )}

      {/* Code Script */}
      {selectedNode.type === "code" && (
        <div className="space-y-1.5">
          <Label htmlFor="node-code" className="text-xs font-medium text-muted-foreground">
            JavaScript Script
          </Label>
          <Textarea
            id="node-code"
            value={(selectedNode.data.code as string) || ""}
            onChange={(e) =>
              updateNodeData(selectedNode.id, { code: e.target.value })
            }
            className="h-[180px] resize-none overflow-y-auto rounded-xl bg-cream border-warm-border text-sm font-mono"
            placeholder="return output.toUpperCase();"
          />
          <p className="text-[10px] text-muted-foreground/60 leading-tight">
            Use <code className="font-mono">output</code> or <code className="font-mono">outputs</code> to read previous node results.
          </p>
        </div>
      )}

      {/* JSON Extractor */}
      {selectedNode.type === "json" && (
        <div className="space-y-1.5">
          <Label htmlFor="node-json-path" className="text-xs font-medium text-muted-foreground">
            JSON Path / Key
          </Label>
          <Input
            id="node-json-path"
            value={(selectedNode.data.path as string) || ""}
            onChange={(e) =>
              updateNodeData(selectedNode.id, { path: e.target.value })
            }
            placeholder="results[0].url"
            className="rounded-xl bg-cream border-warm-border h-9 text-sm font-mono"
          />
          <p className="text-[10px] text-muted-foreground/60 leading-tight">
            e.g. <code className="font-mono">results[0].title</code> or <code className="font-mono">data.user.name</code>
          </p>
        </div>
      )}

      {/* Parallel Split */}
      {selectedNode.type === "parallel" && (
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-1">
          <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">Parallel Fan-Out</p>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Connect outgoing edges to multiple nodes. All connected branches will execute concurrently using <code className="font-mono">Promise.all</code>.
          </p>
        </div>
      )}

      {/* Join / Merge */}
      {selectedNode.type === "join" && (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="node-merge-strategy" className="text-xs font-medium text-muted-foreground">
              Merge Strategy
            </Label>
            <select
              id="node-merge-strategy"
              value={(selectedNode.data.mergeStrategy as string) || "array"}
              onChange={(e) =>
                updateNodeData(selectedNode.id, { mergeStrategy: e.target.value })
              }
              className="w-full rounded-xl bg-cream border border-warm-border h-9 text-sm px-3"
            >
              <option value="array">Array ([out1, out2])</option>
              <option value="object">Object ({"{ label1: out1, label2: out2 }"})</option>
              <option value="text">Concatenated Text</option>
            </select>
          </div>
          <p className="text-[10px] text-muted-foreground/60 leading-tight">
            Combines all incoming parallel branch outputs into a single payload for downstream nodes.
          </p>
        </div>
      )}

      {/* ForEach Loop */}
      {selectedNode.type === "foreach" && (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="node-array-source" className="text-xs font-medium text-muted-foreground">
              Array Data Source
            </Label>
            <Input
              id="node-array-source"
              value={(selectedNode.data.arraySource as string) || "output"}
              onChange={(e) =>
                updateNodeData(selectedNode.id, { arraySource: e.target.value })
              }
              placeholder="output or {{ JSON Extractor }}"
              className="rounded-xl bg-cream border-warm-border h-9 text-sm font-mono"
            />
            <p className="text-[10px] text-muted-foreground/60 leading-tight">
              Specify variable containing array or leave as <code className="font-mono">output</code> for incoming JSON array.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="node-concurrency" className="text-xs font-medium text-muted-foreground">
              Concurrency Mode
            </Label>
            <select
              id="node-concurrency"
              value={Number(selectedNode.data.concurrency || 1)}
              onChange={(e) =>
                updateNodeData(selectedNode.id, { concurrency: parseInt(e.target.value, 10) })
              }
              className="w-full rounded-xl bg-cream border border-warm-border h-9 text-sm px-3"
            >
              <option value={1}>Sequential (1 item at a time)</option>
              <option value={3}>Parallel Batch (3 items at a time)</option>
              <option value={5}>Parallel Batch (5 items at a time)</option>
              <option value={10}>Unlimited Parallel</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="node-item-alias" className="text-xs font-medium text-muted-foreground">
              Loop Item Variable Name
            </Label>
            <Input
              id="node-item-alias"
              value={(selectedNode.data.itemAlias as string) || "item"}
              onChange={(e) =>
                updateNodeData(selectedNode.id, { itemAlias: e.target.value })
              }
              placeholder="item"
              className="rounded-xl bg-cream border-warm-border h-9 text-sm font-mono"
            />
            <p className="text-[10px] text-muted-foreground/60 leading-tight">
              Access item inside loop using <code className="font-mono">{"{{ item }}"}</code> or <code className="font-mono">{"{{ itemIndex }}"}</code>.
            </p>
          </div>
        </div>
      )}

      {/* Output Node */}
      {selectedNode.type === "output" && (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="node-output-format" className="text-xs font-medium text-muted-foreground">
              Output Format
            </Label>
            <select
              id="node-output-format"
              value={(selectedNode.data.format as string) || "text/plain"}
              onChange={(e) =>
                updateNodeData(selectedNode.id, { format: e.target.value })
              }
              className="w-full rounded-xl bg-cream border border-warm-border h-9 text-sm px-3"
            >
              <option value="text/plain">Plain Text</option>
              <option value="application/json">JSON Object</option>
              <option value="text/markdown">Markdown Format</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="node-output-template" className="text-xs font-medium text-muted-foreground">
              Response Template (Optional)
            </Label>
            <textarea
              id="node-output-template"
              rows={4}
              value={(selectedNode.data.template as string) || (selectedNode.data.body as string) || ""}
              onChange={(e) =>
                updateNodeData(selectedNode.id, { template: e.target.value })
              }
              placeholder="e.g. {{Generate README Text}}"
              className="w-full rounded-xl bg-cream border border-warm-border p-3 text-sm font-mono placeholder:text-muted-foreground/50 resize-y min-h-[90px]"
            />
            {availableVariables.length > 0 && (
              <div className="space-y-1 pt-1">
                <p className="text-[11px] font-medium text-muted-foreground">Available Variables (click to insert):</p>
                <div className="flex flex-wrap gap-1.5">
                  {availableVariables.map((vName) => (
                    <button
                      key={vName}
                      type="button"
                      onClick={() => insertVariable("template", `{{${vName}}}`)}
                      className="px-2 py-0.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-[11px] font-mono text-primary transition-colors"
                    >
                      + {`{{${vName}}}`}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <p className="text-[11px] text-muted-foreground">
              Use <code className="font-mono">{"{{Node Label}}"}</code> to combine outputs from previous nodes.
            </p>
          </div>
        </div>
      )}

      {/* Delete Button */}
      <div className="pt-3 border-t border-warm-border">
        <button
          onClick={() => deleteNode(selectedNode.id)}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl
            text-xs font-medium text-destructive bg-destructive/8 hover:bg-destructive/15
            transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Delete Node
        </button>
      </div>
    </div>
  );
}
