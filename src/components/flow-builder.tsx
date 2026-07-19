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
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, addNode } =
    useFlowStore();
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
      if (type === "llm") defaultData = { ...defaultData, model: "gpt-4o" } as any;
      if (type === "prompt")
        defaultData = {
          ...defaultData,
          prompt: "You are a helpful assistant.",
        } as any;

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
        defaultEdgeOptions={{
          style: { strokeWidth: 2, stroke: "var(--color-muted-foreground)" },
          type: "smoothstep",
        }}
      >
        <Controls />
        <MiniMap
          maskColor="var(--color-cream)"
          nodeColor={(node) => {
            switch (node.type) {
              case "trigger":
                return "#F5D56E";
              case "prompt":
                return "#8BB4E0";
              case "llm":
                return "#F2A4B8";
              default:
                return "var(--color-foreground)";
            }
          }}
        />
        <Background
          variant={BackgroundVariant.Dots}
          gap={28}
          size={1.2}
          color="var(--color-warm-border)"
        />
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
