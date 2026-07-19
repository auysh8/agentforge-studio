"use client";

import { useCallback, useRef } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  useReactFlow,
  ReactFlowProvider,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useFlowStore } from "@/store/flow-store";

// Custom Nodes
import { TriggerNode } from "./nodes/trigger-node";
import { LLMNode } from "./nodes/llm-node";
import { PromptNode } from "./nodes/prompt-node";

const nodeTypes = {
  trigger: TriggerNode,
  llm: LLMNode,
  prompt: PromptNode,
};

let id = 0;
const getId = () => `dndnode_${id++}`;

function FlowBuilderContent() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, addNode } = useFlowStore();
  const { screenToFlowPosition } = useReactFlow();

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData("application/reactflow");

      if (typeof type === "undefined" || !type) {
        return;
      }

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      let defaultData = { label: `${type} node` };
      if (type === 'llm') defaultData = { ...defaultData, model: 'gpt-4o' };
      if (type === 'prompt') defaultData = { ...defaultData, prompt: 'You are a helpful assistant.' };

      const newNode = {
        id: getId(),
        type,
        position,
        data: defaultData,
      };

      addNode(newNode);
    },
    [screenToFlowPosition, addNode]
  );

  return (
    <div className="w-full h-full" ref={reactFlowWrapper}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        onDrop={onDrop}
        onDragOver={onDragOver}
        fitView
      >
        <Controls className="bg-card text-foreground border-border fill-foreground" />
        <MiniMap 
          className="bg-card border border-border rounded-md shadow-sm"
          maskColor="var(--color-muted)"
          nodeColor={(node) => {
            switch (node.type) {
              case 'trigger': return '#22c55e'; // green-500
              case 'prompt': return '#3b82f6';  // blue-500
              case 'llm': return '#a855f7';     // purple-500
              default: return 'var(--color-foreground)';
            }
          }}
        />
        <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="var(--border)" />
      </ReactFlow>
    </div>
  );
}

export function FlowBuilder() {
  return (
    <ReactFlowProvider>
      <FlowBuilderContent />
    </ReactFlowProvider>
  );
}
