"use client";

import { Handle, Position, NodeProps } from "@xyflow/react";
import { Code2, Check, AlertCircle } from "lucide-react";
import { useFlowStore } from "@/store/flow-store";

export function CodeNode({ id, data, selected }: NodeProps) {
  const status = useFlowStore((state) => state.nodeStatuses[id] || "idle");

  return (
    <div
      className={`min-w-[200px] rounded-2xl bg-card border transition-all duration-200 shadow-sm relative ${
        selected ? "border-gold ring-2 ring-gold/20" : "border-warm-border"
      } ${status === "running" ? "ring-4 ring-gold animate-pulse" : ""}`}
    >
      {/* Node Header */}
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-warm-border/60 bg-muted/20 rounded-t-2xl">
        <div className="w-7 h-7 rounded-xl bg-cyan-500/15 flex items-center justify-center shrink-0">
          <Code2 className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-foreground truncate">
            {(data?.label as string) || "Code Transformation"}
          </p>
          <p className="text-[10px] text-muted-foreground truncate">Custom JavaScript</p>
        </div>

        {/* Status Badge */}
        {status === "running" && (
          <div className="w-2 h-2 rounded-full bg-gold animate-ping" />
        )}
        {status === "success" && (
          <div className="w-4 h-4 rounded-full bg-green-500/20 text-green-600 flex items-center justify-center">
            <Check className="h-2.5 w-2.5" />
          </div>
        )}
        {status === "error" && (
          <div className="w-4 h-4 rounded-full bg-destructive/20 text-destructive flex items-center justify-center">
            <AlertCircle className="h-2.5 w-2.5" />
          </div>
        )}
      </div>

      {/* Node Content */}
      <div className="p-3">
        <div className="p-2 rounded-xl bg-muted/40 font-mono text-[10px] text-muted-foreground truncate">
          {(data?.code as string)?.slice(0, 30) || "return output.toUpperCase();"}
        </div>
      </div>

      {/* Input / Output Handles */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-cyan-500 !border-2 !border-background hover:!scale-125 transition-transform"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-cyan-500 !border-2 !border-background hover:!scale-125 transition-transform"
      />
    </div>
  );
}
