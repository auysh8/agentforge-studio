"use client";

import { useFlowStore } from "@/store/flow-store";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, Play, Brain, MessageSquare, Globe, Split } from "lucide-react";
import { useTheme } from "next-themes";

const nodeTypeConfig: Record<string, { icon: any; color: string; bg: string; label: string }> = {
  trigger: { icon: Play, color: "#22C55E", bg: "rgba(34, 197, 94, 0.12)", label: "Trigger" },
  llm: { icon: Brain, color: "#A855F7", bg: "rgba(168, 85, 247, 0.12)", label: "LLM Node" },
  prompt: { icon: MessageSquare, color: "#3B82F6", bg: "rgba(59, 130, 246, 0.12)", label: "Prompt" },
  api: { icon: Globe, color: "#EC4899", bg: "rgba(236, 72, 153, 0.12)", label: "API Request" },
  condition: { icon: Split, color: "#F59E0B", bg: "rgba(245, 158, 11, 0.12)", label: "Condition" },
};

export function PropertiesPanel() {
  const selectedNode = useFlowStore((state) => state.selectedNode);
  const updateNodeData = useFlowStore((state) => state.updateNodeData);
  const deleteNode = useFlowStore((state) => state.deleteNode);
  const { theme, systemTheme } = useTheme();
  const isDark =
    theme === "dark" || (theme === "system" && systemTheme === "dark");

  if (!selectedNode) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-muted/60 flex items-center justify-center">
          <Brain className="h-5 w-5 text-muted-foreground/40" />
        </div>
        <p className="text-sm text-muted-foreground/60">
          Select a node to edit its properties
        </p>
      </div>
    );
  }

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
          <IconComp className="h-4 w-4" style={{ color: config.color }} />
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
            <option value="gemini-1.5-pro" />
            <option value="gemini-1.5-flash" />
          </datalist>
          <p className="text-[10px] text-muted-foreground/60">
            e.g. gpt-4o, mistral-large-latest, llama3
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
            className="h-[280px] resize-none overflow-y-auto rounded-xl bg-cream border-warm-border text-sm"
            style={{ fieldSizing: "fixed" } as any}
            placeholder="Type your system prompt here..."
          />
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
              className="h-[120px] resize-none overflow-y-auto rounded-xl bg-cream border-warm-border text-sm font-mono"
              placeholder='{\n  "Authorization": "Bearer token"\n}'
            />
          </div>
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
