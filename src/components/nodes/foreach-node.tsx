"use client";

import { Handle, Position, NodeProps } from "@xyflow/react";
import { ArrowsClockwise } from "@phosphor-icons/react";
import { Check, AlertCircle, Repeat } from "lucide-react";
import { useFlowStore } from "@/store/flow-store";

export function ForEachNode({ id, data, selected }: NodeProps) {
  const status = useFlowStore((state) => state.nodeStatuses[id] || "idle");
  const arraySource = (data?.arraySource as string) || "output";
  const concurrency = (data?.concurrency as number) || 1;

  return (
    <div
      className={`min-w-[240px] max-w-[290px] bg-card border border-warm-border shadow-sm rounded-xl relative transition-all duration-200 ${
        selected ? "ring-2 ring-gold/40 border-gold" : ""
      } ${status === "running" ? "node-running-active" : status === "success" ? "node-success-pop" : ""}`}
      style={{ borderLeft: "3px solid var(--family-logic-accent)" }}
    >
      {/* Target Handle */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !border-2 !border-background hover:!scale-125 transition-transform"
        style={{ backgroundColor: "var(--family-logic-accent)" }}
      />

      {/* Node Header */}
      <div className="flex items-start justify-between gap-3 p-3.5 pb-2">
        <div className="flex items-start gap-2.5 min-w-0 text-left">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
            style={{ backgroundColor: "var(--family-logic-icon-bg)" }}
          >
            <ArrowsClockwise size={18} weight="fill" style={{ color: "var(--family-logic-icon-color)" }} />
          </div>
          <div className="min-w-0 flex-1 text-left">
            <h3 className="text-[14px] font-medium text-foreground truncate text-left">
              {(data?.label as string) || "ForEach Loop"}
            </h3>
            <p className="text-[12px] font-normal text-muted-foreground leading-tight mt-0.5 text-left">
              Array Iteration
            </p>
          </div>
        </div>

        {/* Category Tag & Status */}
        <div className="flex items-center gap-1.5 shrink-0">
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
            style={{ backgroundColor: "var(--family-logic-tag-bg)", color: "var(--family-logic-tag-text)" }}
          >
            foreach
          </span>
        </div>
      </div>

      {/* Detail Chip */}
      <div className="px-3.5 pt-1 text-left">
        <div className="p-2 rounded-lg bg-muted/40 font-mono text-[11px] text-muted-foreground truncate flex items-center justify-between text-left">
          <div className="flex items-center gap-1.5 min-w-0 truncate">
            <Repeat className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
            <span className="truncate">{arraySource}</span>
          </div>
          <span className="text-[10px] bg-background/80 px-1.5 py-0.5 rounded border border-warm-border shrink-0 ml-1">
            {concurrency === 1 ? "Sequential" : `${concurrency}x Parallel`}
          </span>
        </div>
      </div>

      {/* Branch Outputs Container */}
      <div className="pt-3 pb-3 px-3.5 space-y-2.5 text-left">
        {/* LOOP Branch Row */}
        <div className="relative min-h-[28px] flex items-center justify-between pl-2 pr-3 py-1 rounded-md bg-indigo-500/10 text-left">
          <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 tracking-wide uppercase text-left">
            Loop Item
          </span>
          <Handle
            type="source"
            id="loop"
            position={Position.Right}
            className="!w-3 !h-3 !bg-indigo-600 !border-2 !border-background hover:!scale-125 transition-transform"
          />
        </div>

        {/* COMPLETED Branch Row */}
        <div className="relative min-h-[28px] flex items-center justify-between pl-2 pr-3 py-1 rounded-md bg-emerald-500/10 text-left">
          <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 tracking-wide uppercase text-left">
            On Completed
          </span>
          <Handle
            type="source"
            id="completed"
            position={Position.Right}
            className="!w-3 !h-3 !bg-emerald-600 !border-2 !border-background hover:!scale-125 transition-transform"
          />
        </div>
      </div>
    </div>
  );
}
