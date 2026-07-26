import { Handle, Position, NodeProps } from "@xyflow/react";
import { Globe, Check, AlertCircle } from "lucide-react";
import { useFlowStore } from "@/store/flow-store";

export function APINode({ id, data }: NodeProps) {
  const status = useFlowStore((state) => state.nodeStatuses[id] || "idle");
  const urlStr = (data?.url as string) || (data?.endpoint as string) || "";

  return (
    <div
      className={`rounded-2xl border shadow-sm min-w-[210px] max-w-[260px] overflow-hidden transition-all duration-200 relative ${
        status === "running" ? "ring-4 ring-gold animate-pulse" : ""
      }`}
      style={{
        background: "linear-gradient(rgba(236, 72, 153, 0.05), rgba(236, 72, 153, 0.05)), var(--color-card)",
        borderColor: status === "running" ? "var(--color-gold)" : "rgba(236, 72, 153, 0.3)",
      }}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="w-3.5 h-3.5 border-2 border-card bg-pink-400 rounded-full"
      />
      <div className="flex items-center justify-between px-3.5 py-2.5">
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: "rgba(236, 72, 153, 0.15)" }}
          >
            <Globe className="h-3.5 w-3.5 text-pink-500" />
          </div>
          <span className="text-sm font-semibold text-foreground truncate">
            {(data?.label as string) || "API Request"}
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
          className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium truncate max-w-[190px]"
          style={{
            backgroundColor: "rgba(236, 72, 153, 0.10)",
            color: "#EC4899",
          }}
        >
          {(data?.method as string) || "GET"} {urlStr ? (urlStr.length > 20 ? urlStr.substring(0, 20) + '...' : urlStr) : "No URL"}
        </span>
      </div>
      <Handle
        type="source"
        position={Position.Right}
        className="w-3.5 h-3.5 border-2 border-card bg-pink-400 rounded-full"
      />
    </div>
  );
}
