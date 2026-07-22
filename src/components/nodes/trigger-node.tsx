import { Handle, Position } from "@xyflow/react";
import { Play } from "lucide-react";

export function TriggerNode({ data }: { data: any }) {
  return (
    <div
      className="rounded-2xl border shadow-sm min-w-[210px] max-w-[260px] overflow-hidden transition-shadow hover:shadow-md"
      style={{
        background: "linear-gradient(rgba(245, 213, 110, 0.12), rgba(245, 213, 110, 0.12)), var(--color-card)",
        borderColor: "rgba(245, 213, 110, 0.3)",
      }}
    >
      <div className="flex items-center gap-2.5 px-3.5 py-2.5">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: "rgba(34, 197, 94, 0.15)" }}
        >
          <Play className="h-3.5 w-3.5 text-green-500" />
        </div>
        <span className="text-sm font-semibold text-foreground">
          {data.label || "Trigger"}
        </span>
      </div>
      <div className="px-3.5 pb-3">
        <p className="text-xs text-muted-foreground whitespace-pre-wrap line-clamp-3 leading-relaxed">
          {data.input || "Enter input in properties"}
        </p>
      </div>
      <Handle
        type="source"
        position={Position.Right}
        className="w-3.5 h-3.5 border-2 border-card bg-gold rounded-full"
      />
    </div>
  );
}
