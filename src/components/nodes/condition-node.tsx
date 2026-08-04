"use client";

import { Handle, Position, NodeProps } from "@xyflow/react";
import { GitFork, Check, AlertCircle } from "lucide-react";
import { useFlowStore } from "@/store/flow-store";

export function ConditionNode({ id, data, selected }: NodeProps) {
  const status = useFlowStore((state) => state.nodeStatuses[id] || "idle");

  return (
    <div
      className={`min-w-[240px] max-w-[290px] bg-card border border-warm-border shadow-sm rounded-xl relative transition-all duration-200 ${
        selected ? "ring-2 ring-gold/40 border-gold" : ""
      } ${status === "running" ? "ring-4 ring-gold executing-node-glow" : ""}`}
      style={{ borderLeft: "3px solid #854F0B" }}
    >
      {/* Target Handle */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-[#854F0B] !border-2 !border-background hover:!scale-125 transition-transform"
      />

      {/* Node Header */}
      <div className="flex items-start justify-between gap-3 p-3.5 pb-2">
        <div className="flex items-start gap-2.5 min-w-0 text-left">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
            style={{ backgroundColor: "#FAEEDA", color: "#854F0B" }}
          >
            <GitFork className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1 text-left">
            <h3 className="text-[14px] font-medium text-foreground truncate text-left">
              {(data?.label as string) || "Condition Node"}
            </h3>
            <p className="text-[12px] font-normal text-muted-foreground leading-tight mt-0.5 text-left">
              Flow Routing
            </p>
          </div>
        </div>

        {/* Category Tag & Status */}
        <div className="flex items-center gap-1.5 shrink-0">
          {status === "running" && <div className="w-2 h-2 rounded-full bg-gold animate-ping" />}
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
          <span
            className="px-2 py-0.5 rounded-full text-[11px] font-medium"
            style={{ backgroundColor: "#FAEEDA", color: "#854F0B" }}
          >
            logic
          </span>
        </div>
      </div>

      {/* Detail Chip */}
      <div className="px-3.5 pt-1 text-left">
        <div className="p-2 rounded-lg bg-muted/40 font-mono text-[12px] text-muted-foreground truncate text-left">
          {(data?.condition as string) || "output.contains('error')"}
        </div>
      </div>

      {/* Branch Rows Container */}
      <div className="pt-3 pb-3 px-3.5 space-y-2.5 text-left">
        {/* TRUE Branch Row */}
        <div className="relative min-h-[28px] flex items-center justify-between pl-2 pr-3 py-1 rounded-md bg-emerald-500/10 text-left">
          <span className="text-[11px] font-semibold text-emerald-600 tracking-wide uppercase text-left">
            True
          </span>
          <Handle
            type="source"
            id="true"
            position={Position.Right}
            className="!w-3 !h-3 !bg-emerald-600 !border-2 !border-background hover:!scale-125 transition-transform"
          />
        </div>

        {/* FALSE Branch Row */}
        <div className="relative min-h-[28px] flex items-center justify-between pl-2 pr-3 py-1 rounded-md bg-rose-500/10 text-left">
          <span className="text-[11px] font-semibold text-rose-600 tracking-wide uppercase text-left">
            False
          </span>
          <Handle
            type="source"
            id="false"
            position={Position.Right}
            className="!w-3 !h-3 !bg-rose-600 !border-2 !border-background hover:!scale-125 transition-transform"
          />
        </div>
      </div>
    </div>
  );
}
