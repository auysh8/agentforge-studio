import { Handle, Position, NodeProps } from "@xyflow/react";
import { MessageSquare, Check, AlertCircle } from "lucide-react";
import { useFlowStore } from "@/store/flow-store";

export function PromptNode({ id, data }: NodeProps) {
  const status = useFlowStore((state) => state.nodeStatuses[id] || "idle");

  return (
    <div
      className={`rounded-2xl border bg-card shadow-sm min-w-[210px] max-w-[260px] overflow-hidden transition-all duration-200 ${
        status === "running" ? "ring-4 ring-gold executing-node-glow" : ""
      }`}
      style={{
        borderColor: status === "running" ? "var(--color-gold)" : "var(--color-warm-border)",
      }}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="w-3.5 h-3.5 border-2 border-card bg-primary rounded-full"
      />
      <div className="flex items-center justify-between px-3.5 py-2.5">
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: "rgba(59, 130, 246, 0.12)" }}
          >
            <MessageSquare className="h-3.5 w-3.5 text-blue-500" />
          </div>
          <span className="text-sm font-semibold text-foreground truncate">
            {(data?.label as string) || "Prompt"}
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
        <p className="text-xs text-muted-foreground whitespace-pre-wrap line-clamp-3 leading-relaxed">
          {(data?.prompt as string) || "Enter prompt in properties"}
        </p>
      </div>
      <Handle
        type="source"
        position={Position.Right}
        className="w-3.5 h-3.5 border-2 border-card bg-primary rounded-full"
      />
    </div>
  );
}
