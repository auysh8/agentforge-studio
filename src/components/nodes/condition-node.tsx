import { Handle, Position, NodeProps } from "@xyflow/react";
import { Split, Check, AlertCircle } from "lucide-react";
import { useFlowStore } from "@/store/flow-store";

export function ConditionNode({ id, data }: NodeProps) {
  const status = useFlowStore((state) => state.nodeStatuses[id] || "idle");

  return (
    <div
      className={`rounded-2xl border shadow-sm min-w-[210px] max-w-[260px] overflow-hidden transition-all duration-200 relative ${
        status === "running" ? "ring-4 ring-gold executing-node-glow" : ""
      }`}
      style={{
        background: "linear-gradient(rgba(245, 158, 11, 0.05), rgba(245, 158, 11, 0.05)), var(--color-card)",
        borderColor: status === "running" ? "var(--color-gold)" : "rgba(245, 158, 11, 0.3)",
      }}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="w-3.5 h-3.5 border-2 border-card bg-amber-400 rounded-full"
      />
      <div className="flex items-center justify-between px-3.5 py-2.5">
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: "rgba(245, 158, 11, 0.15)" }}
          >
            <Split className="h-3.5 w-3.5 text-amber-500" />
          </div>
          <span className="text-sm font-semibold text-foreground truncate">
            {(data?.label as string) || "Condition"}
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
      <div className="px-3.5 pb-4">
        <span
          className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium truncate max-w-[190px]"
          style={{
            backgroundColor: "rgba(245, 158, 11, 0.10)",
            color: "#F59E0B",
          }}
        >
          {(data?.condition as string) || "If condition..."}
        </span>
      </div>
      
      {/* True Handle */}
      <Handle
        type="source"
        id="true"
        position={Position.Right}
        className="w-3.5 h-3.5 border-2 border-card bg-green-500 rounded-full translate-y-[-12px]"
        style={{ top: "40%" }}
      />
      <div className="absolute right-4 text-[9px] font-bold text-green-600/80 uppercase tracking-wider" style={{ top: "33%" }}>True</div>
      
      {/* False Handle */}
      <Handle
        type="source"
        id="false"
        position={Position.Right}
        className="w-3.5 h-3.5 border-2 border-card bg-red-500 rounded-full translate-y-[4px]"
        style={{ top: "65%" }}
      />
      <div className="absolute right-4 text-[9px] font-bold text-red-600/80 uppercase tracking-wider" style={{ top: "67%" }}>False</div>
    </div>
  );
}
