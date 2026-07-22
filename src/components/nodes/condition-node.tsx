import { Handle, Position } from "@xyflow/react";
import { Split } from "lucide-react";

export function ConditionNode({ data }: { data: any }) {
  return (
    <div
      className="rounded-2xl border shadow-sm min-w-[210px] max-w-[260px] overflow-hidden transition-shadow hover:shadow-md relative"
      style={{
        background: "linear-gradient(rgba(245, 158, 11, 0.05), rgba(245, 158, 11, 0.05)), var(--color-card)",
        borderColor: "rgba(245, 158, 11, 0.3)",
      }}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="w-3.5 h-3.5 border-2 border-card bg-amber-400 rounded-full"
      />
      <div className="flex items-center gap-2.5 px-3.5 py-2.5">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: "rgba(245, 158, 11, 0.15)" }}
        >
          <Split className="h-3.5 w-3.5 text-amber-500" />
        </div>
        <span className="text-sm font-semibold text-foreground truncate">
          {data.label || "Condition"}
        </span>
      </div>
      <div className="px-3.5 pb-4">
        <span
          className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium truncate max-w-[190px]"
          style={{
            backgroundColor: "rgba(245, 158, 11, 0.10)",
            color: "#F59E0B",
          }}
        >
          {data.condition || "If condition..."}
        </span>
      </div>
      
      {/* True Handle */}
      <Handle
        type="source"
        id="true"
        position={Position.Right}
        className="w-3 h-3 border-2 border-card bg-green-500 rounded-full translate-y-[-12px]"
        style={{ top: "40%" }}
      />
      <div className="absolute right-4 text-[9px] font-bold text-green-600/80 uppercase tracking-wider" style={{ top: "33%" }}>True</div>
      
      {/* False Handle */}
      <Handle
        type="source"
        id="false"
        position={Position.Right}
        className="w-3 h-3 border-2 border-card bg-red-500 rounded-full translate-y-[4px]"
        style={{ top: "65%" }}
      />
      <div className="absolute right-4 text-[9px] font-bold text-red-600/80 uppercase tracking-wider" style={{ top: "67%" }}>False</div>
    </div>
  );
}
