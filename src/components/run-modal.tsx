"use client";

import React, { useState } from "react";
import { X, Play, Sparkles } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useFlowStore } from "@/store/flow-store";

interface RunModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRun: (inputOverride?: string) => void;
  isLoading: boolean;
}

export function RunModal({ isOpen, onClose, onRun, isLoading }: RunModalProps) {
  const nodes = useFlowStore((state) => state.nodes);
  const updateNodeData = useFlowStore((state) => state.updateNodeData);

  const triggerNode = nodes.find((n) => n.type === "trigger");
  const initialInput = (triggerNode?.data?.input as string) || "";
  const [testInput, setTestInput] = useState(initialInput);

  if (!isOpen) return null;

  const handleExecute = () => {
    if (triggerNode) {
      updateNodeData(triggerNode.id, { input: testInput });
    }
    onRun(testInput);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-lg bg-card border border-warm-border rounded-2xl shadow-2xl overflow-hidden animate-slide-up flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-warm-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gold/15 flex items-center justify-center text-gold">
              <Play className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">Run Workflow Skill</h2>
              <p className="text-xs text-muted-foreground">Provide test input variables before running</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="run-input" className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-gold" />
              <span>Trigger Input Data</span>
            </Label>
            <Textarea
              id="run-input"
              value={testInput}
              onChange={(e) => setTestInput(e.target.value)}
              className="h-[140px] resize-none overflow-y-auto rounded-xl bg-cream border-warm-border text-sm"
              placeholder="Enter text or JSON data to pass into Trigger Node..."
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-muted/30 border-t border-warm-border flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-muted-foreground hover:bg-muted/60 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleExecute}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-semibold
              bg-gold text-gold-foreground hover:brightness-105 transition-all shadow-sm
              disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Play className="h-3.5 w-3.5" />
            {isLoading ? "Running..." : "Start Run"}
          </button>
        </div>
      </div>
    </div>
  );
}
