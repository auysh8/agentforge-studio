import { Handle, Position } from "@xyflow/react";
import { Globe } from "lucide-react";

export function APINode({ data }: { data: any }) {
  return (
    <div
      className="rounded-2xl border shadow-sm min-w-[210px] max-w-[260px] overflow-hidden transition-shadow hover:shadow-md relative"
      style={{
        background: "linear-gradient(rgba(236, 72, 153, 0.05), rgba(236, 72, 153, 0.05)), var(--color-card)",
        borderColor: "rgba(236, 72, 153, 0.3)",
      }}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="w-3.5 h-3.5 border-2 border-card bg-pink-400 rounded-full"
      />
      <div className="flex items-center gap-2.5 px-3.5 py-2.5">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: "rgba(236, 72, 153, 0.15)" }}
        >
          <Globe className="h-3.5 w-3.5 text-pink-500" />
        </div>
        <span className="text-sm font-semibold text-foreground truncate">
          {data.label || "API Request"}
        </span>
      </div>
      <div className="px-3.5 pb-3">
        <span
          className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium truncate max-w-[190px]"
          style={{
            backgroundColor: "rgba(236, 72, 153, 0.10)",
            color: "#EC4899",
          }}
        >
          {data.method || "GET"} {data.url ? (data.url.length > 20 ? data.url.substring(0,20)+'...' : data.url) : "No URL"}
        </span>
      </div>
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 border-2 border-card bg-pink-400 rounded-full"
      />
    </div>
  );
}
