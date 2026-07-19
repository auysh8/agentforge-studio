import { Handle, Position } from '@xyflow/react';
import { Brain } from 'lucide-react';

export function LLMNode({ data }: { data: any }) {
  return (
    <div className="rounded-md border bg-card text-card-foreground shadow-sm min-w-[200px] max-w-[250px]">
      <Handle type="target" position={Position.Left} className="w-4 h-4 border-2 border-background bg-primary after:content-[''] after:absolute after:-inset-4" />
      <div className="flex items-center gap-2 border-b bg-muted/50 px-3 py-2 rounded-t-md">
        <Brain className="h-4 w-4 text-purple-500" />
        <span className="text-sm font-semibold">{data.label || 'LLM Call'}</span>
      </div>
      <div className="p-3">
        <p className="text-xs text-muted-foreground">Model: {data.model || 'gpt-4o'}</p>
      </div>
      <Handle type="source" position={Position.Right} className="w-3 h-3 border-2 border-background bg-muted-foreground" />
    </div>
  );
}
