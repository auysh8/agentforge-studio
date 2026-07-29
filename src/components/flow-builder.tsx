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
import { APINode } from "./nodes/api-node";
import { ConditionNode } from "./nodes/condition-node";
import { CodeNode } from "./nodes/code-node";
import { JsonNode } from "./nodes/json-node";
import { OutputNode } from "./nodes/output-node";

const nodeTypes = {
  trigger: TriggerNode,
  llm: LLMNode,
  prompt: PromptNode,
  api: APINode,
  condition: ConditionNode,
  code: CodeNode,
  json: JsonNode,
  output: OutputNode,
};

const getId = () => `dndnode_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

function FlowBuilderContent() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { nodes, edges, nodeStatuses, onNodesChange, onEdgesChange, onConnect, addNode } =
    useFlowStore();
  const { screenToFlowPosition } = useReactFlow();

  const formattedEdges = edges.map((edge) => {
    const sourceStatus = nodeStatuses[edge.source];
    const targetStatus = nodeStatuses[edge.target];
    const isExecuting = sourceStatus === "running" || targetStatus === "running";
    const isCompleted = sourceStatus === "success" && targetStatus === "success";

    return {
      ...edge,
      animated: isExecuting || isCompleted,
      className: isExecuting ? "active-execution" : isCompleted ? "animated" : "",
    };
  });

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

      let defaultData: Record<string, unknown> = { label: `${type} node` };
      if (type === "llm") defaultData = { ...defaultData, model: "gpt-4o" };
      if (type === "prompt")
        defaultData = {
          ...defaultData,
          prompt: "You are a helpful assistant.",
        };
      if (type === "api") defaultData = { ...defaultData, method: "GET", url: "https://api.example.com/data" };
      if (type === "condition") defaultData = { ...defaultData, condition: "output.contains('error')" };
      if (type === "code") defaultData = { ...defaultData, code: "return output.toUpperCase();" };
      if (type === "json") defaultData = { ...defaultData, path: "results[0].title" };
      if (type === "output") defaultData = { ...defaultData, format: "text/plain" };

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
        edges={formattedEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        onDrop={onDrop}
        onDragOver={onDragOver}
        fitView
        deleteKeyCode={["Backspace", "Delete"]}
        defaultEdgeOptions={{
          style: { strokeWidth: 2, stroke: "var(--color-muted-foreground)" },
          type: "smoothstep",
        }}
      >
        <Controls position="top-left" />
        <MiniMap
          position="top-right"
          maskColor="var(--color-cream)"
          nodeColor={(node) => {
            switch (node.type) {
              case "trigger":
                return "#F5D56E";
              case "prompt":
                return "#8BB4E0";
              case "llm":
                return "#F2A4B8";
              case "api":
                return "#F472B6"; // pink-400
              case "condition":
                return "#FBBF24"; // amber-400
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
