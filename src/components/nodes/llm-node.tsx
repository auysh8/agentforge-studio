import { Handle, Position, NodeProps } from "@xyflow/react";
import { Brain, Check, AlertCircle } from "lucide-react";
import { useFlowStore } from "@/store/flow-store";

export function LLMNode({ id, data }: NodeProps) {
  const status = useFlowStore((state) => state.nodeStatuses[id] || "idle");

  return (
    <div
      className={`rounded-2xl border shadow-sm min-w-[210px] max-w-[260px] overflow-hidden transition-all duration-200 ${
        status === "running" ? "ring-4 ring-gold executing-node-glow" : ""
      }`}
      style={{
        background: "linear-gradient(rgba(242, 164, 184, 0.10), rgba(242, 164, 184, 0.10)), var(--color-card)",
        borderColor: status === "running" ? "var(--color-gold)" : "rgba(242, 164, 184, 0.3)",
      }}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="w-3.5 h-3.5 border-2 border-card bg-rose-accent rounded-full"
      />
      <div className="flex items-center justify-between px-3.5 py-2.5">
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: "rgba(168, 85, 247, 0.15)" }}
          >
            <Brain className="h-3.5 w-3.5 text-purple-500" />
          </div>
          <span className="text-sm font-semibold text-foreground truncate">
            {(data?.label as string) || "LLM Call"}
          </span>
        </div>

        {/* Status indicator */}
        {status === "running" && (
          <div className="w-2 h-2 rounded-full bg-gold animate-ping" />
        )}
        {status === "success" && (
          <div className="w-4 h-4 rounded-full bg-green-500/20 text-green-600 flex items-center justify-center shrink-0">
            <Check className="h-2.5 w-2.5" />
          </div>
        )}
        {status === "error" && (
          <div className="w-4 h-4 rounded-full bg-destructive/20 text-destructive flex items-center justify-center shrink-0">
            <AlertCircle className="h-2.5 w-2.5" />
          </div>
        )}
      </div>
      <div className="px-3.5 pb-3">
        <span
          className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium"
          style={{
            backgroundColor: "rgba(168, 85, 247, 0.10)",
            color: "#A855F7",
          }}
        >
          {(data?.model as string) || "gpt-4o"}
        </span>
      </div>
      <Handle
        type="source"
        position={Position.Right}
        className="w-3.5 h-3.5 border-2 border-card bg-purple-500 rounded-full"
      />
    </div>
  );
}
