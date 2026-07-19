import { Handle, Position } from '@xyflow/react';
import { Play } from 'lucide-react';

export function TriggerNode({ data }: { data: any }) {
  return (
    <div className="rounded-md border bg-card text-card-foreground shadow-sm min-w-[200px] max-w-[250px]">
      <div className="flex items-center gap-2 border-b bg-muted/50 px-3 py-2 rounded-t-md">
        <Play className="h-4 w-4 text-green-500" />
        <span className="text-sm font-semibold">{data.label || 'Trigger'}</span>
      </div>
      <div className="p-3">
        <p className="text-xs text-muted-foreground whitespace-pre-wrap line-clamp-4 overflow-hidden text-ellipsis">
          {data.input || 'Enter input in properties'}
        </p>
      </div>
      <Handle type="source" position={Position.Right} className="w-4 h-4 border-2 border-background bg-primary after:content-[''] after:absolute after:-inset-4" />
    </div>
  );
}
