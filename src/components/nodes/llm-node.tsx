import { Handle, Position } from "@xyflow/react";
import { Brain } from "lucide-react";

export function LLMNode({ data }: { data: any }) {
  return (
    <div
      className="rounded-2xl border shadow-sm min-w-[210px] max-w-[260px] overflow-hidden transition-shadow hover:shadow-md"
      style={{
        backgroundColor: "rgba(242, 164, 184, 0.10)",
        borderColor: "rgba(242, 164, 184, 0.3)",
      }}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="w-3.5 h-3.5 border-2 border-card bg-rose-accent rounded-full"
      />
      <div className="flex items-center gap-2.5 px-3.5 py-2.5">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: "rgba(168, 85, 247, 0.15)" }}
        >
          <Brain className="h-3.5 w-3.5 text-purple-500" />
        </div>
        <span className="text-sm font-semibold text-foreground">
          {data.label || "LLM Call"}
        </span>
      </div>
      <div className="px-3.5 pb-3">
        <span
          className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium"
          style={{
            backgroundColor: "rgba(168, 85, 247, 0.10)",
            color: "#A855F7",
          }}
        >
          {data.model || "gpt-4o"}
        </span>
      </div>
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 border-2 border-card bg-muted-foreground rounded-full"
      />
    </div>
  );
}
