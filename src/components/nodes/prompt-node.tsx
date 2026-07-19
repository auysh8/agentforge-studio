import { Handle, Position } from "@xyflow/react";
import { MessageSquare } from "lucide-react";

export function PromptNode({ data }: { data: any }) {
  return (
    <div className="rounded-2xl border border-warm-border bg-card shadow-sm min-w-[210px] max-w-[260px] overflow-hidden transition-shadow hover:shadow-md">
      <Handle
        type="target"
        position={Position.Left}
        className="w-3.5 h-3.5 border-2 border-card bg-primary rounded-full"
      />
      <div className="flex items-center gap-2.5 px-3.5 py-2.5">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: "rgba(59, 130, 246, 0.12)" }}
        >
          <MessageSquare className="h-3.5 w-3.5 text-blue-500" />
        </div>
        <span className="text-sm font-semibold text-foreground">
          {data.label || "Prompt"}
        </span>
      </div>
      <div className="px-3.5 pb-3">
        <p className="text-xs text-muted-foreground whitespace-pre-wrap line-clamp-3 leading-relaxed">
          {data.prompt || "Enter prompt in properties"}
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
