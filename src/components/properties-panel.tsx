"use client";

import { useFlowStore } from "@/store/flow-store";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, Play, Brain, MessageSquare } from "lucide-react";
import { useTheme } from "next-themes";

const nodeTypeConfig: Record<string, { icon: any; color: string; bg: string; label: string }> = {
  trigger: { icon: Play, color: "#22C55E", bg: "rgba(34, 197, 94, 0.12)", label: "Trigger" },
  llm: { icon: Brain, color: "#A855F7", bg: "rgba(168, 85, 247, 0.12)", label: "LLM Node" },
  prompt: { icon: MessageSquare, color: "#3B82F6", bg: "rgba(59, 130, 246, 0.12)", label: "Prompt" },
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
          value={selectedNode.data.label || ""}
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
            value={selectedNode.data.model || ""}
            onChange={(e) =>
              updateNodeData(selectedNode.id, { model: e.target.value })
            }
            className="rounded-xl bg-cream border-warm-border h-9 text-sm"
          />
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
            value={selectedNode.data.prompt || ""}
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
            value={selectedNode.data.input || ""}
            onChange={(e) =>
              updateNodeData(selectedNode.id, { input: e.target.value })
            }
            className="h-[280px] resize-none overflow-y-auto rounded-xl bg-cream border-warm-border text-sm"
            style={{ fieldSizing: "fixed" } as any}
            placeholder="Type your test input here..."
          />
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
