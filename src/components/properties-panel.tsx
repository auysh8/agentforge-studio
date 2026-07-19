"use client";

import { useFlowStore } from "@/store/flow-store";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import Editor from "@monaco-editor/react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function PropertiesPanel() {
  const selectedNode = useFlowStore((state) => state.selectedNode);
  const updateNodeData = useFlowStore((state) => state.updateNodeData);
  const deleteNode = useFlowStore((state) => state.deleteNode);
  const { theme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = theme === "dark" || (theme === "system" && systemTheme === "dark");

  if (!selectedNode) {
    return <p className="text-sm text-muted-foreground">Select a node to edit its properties.</p>;
  }

  const handleLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateNodeData(selectedNode.id, { label: e.target.value });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="node-label">Label</Label>
        <Input 
          id="node-label" 
          value={selectedNode.data.label || ''} 
          onChange={handleLabelChange} 
        />
      </div>
      
      {selectedNode.type === 'llm' && (
        <div className="space-y-2">
          <Label htmlFor="node-model">Model</Label>
          <Input 
            id="node-model" 
            value={selectedNode.data.model || ''} 
            onChange={(e) => updateNodeData(selectedNode.id, { model: e.target.value })} 
          />
          <p className="text-xs text-muted-foreground">e.g. gpt-4o, mistral-large-latest, llama3</p>
        </div>
      )}

      {selectedNode.type === 'prompt' && (
        <div className="space-y-2">
          <Label htmlFor="node-prompt">System Prompt</Label>
          <div className="border rounded-md overflow-hidden h-[300px]">
            {mounted && (
              <Editor
                height="100%"
                defaultLanguage="markdown"
                theme={isDark ? "vs-dark" : "light"}
                value={selectedNode.data.prompt || ''}
                onChange={(value) => updateNodeData(selectedNode.id, { prompt: value })}
                options={{
                  minimap: { enabled: false },
                  wordWrap: 'on',
                  lineNumbers: 'off',
                  padding: { top: 12, bottom: 12 }
                }}
              />
            )}
          </div>
        </div>
      )}
      
      {selectedNode.type === 'trigger' && (
        <div className="space-y-2">
          <Label htmlFor="node-input">Test Input</Label>
          <Textarea 
            id="node-input" 
            value={selectedNode.data.input || ''} 
            onChange={(e) => updateNodeData(selectedNode.id, { input: e.target.value })} 
            className="h-[300px] resize-none overflow-y-auto"
            style={{ fieldSizing: 'fixed' } as any}
            placeholder="Type your test input here..."
          />
        </div>
      )}

      <div className="pt-4 border-t">
        <Button 
          variant="destructive" 
          className="w-full" 
          onClick={() => deleteNode(selectedNode.id)}
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Delete Node
        </Button>
      </div>
    </div>
  );
}
