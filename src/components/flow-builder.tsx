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
import { WebhookNode } from "./nodes/webhook-node";
import { CronNode } from "./nodes/cron-node";
import { LLMNode } from "./nodes/llm-node";
import { PromptNode } from "./nodes/prompt-node";
import { APINode } from "./nodes/api-node";
import { VectorNode } from "./nodes/vector-node";
import { ConditionNode } from "./nodes/condition-node";
import { ParallelNode } from "./nodes/parallel-node";
import { JoinNode } from "./nodes/join-node";
import { ForEachNode } from "./nodes/foreach-node";
import { CodeNode } from "./nodes/code-node";
import { JsonNode } from "./nodes/json-node";
import { OutputNode } from "./nodes/output-node";

// Custom Edges
import { FlowingParticleEdge } from "./edges/flowing-particle-edge";

const nodeTypes = {
  trigger: TriggerNode,
  webhook: WebhookNode,
  cron: CronNode,
  llm: LLMNode,
  prompt: PromptNode,
  api: APINode,
  vector_db: VectorNode,
  condition: ConditionNode,
  parallel: ParallelNode,
  join: JoinNode,
  foreach: ForEachNode,
  code: CodeNode,
  json: JsonNode,
  output: OutputNode,
};

const edgeTypes = {
  flowing: FlowingParticleEdge,
};

const getId = () => `dndnode_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

function FlowBuilderContent() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { nodes, edges, nodeStatuses, activeEdgeStatuses, onNodesChange, onEdgesChange, onConnect, addNode } =
    useFlowStore();
  const { screenToFlowPosition } = useReactFlow();

  const formattedEdges = edges.map((edge) => {
    const sourceStatus = nodeStatuses[edge.source];
    const targetStatus = nodeStatuses[edge.target];
    const isTransferring = Boolean(activeEdgeStatuses[edge.id]);
    const isCompleted = sourceStatus === "success" && targetStatus === "success";

    return {
      ...edge,
      type: "flowing",
      data: {
        ...edge.data,
        isTransferring,
        isCompleted,
      },
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
      if (type === "webhook") defaultData = { ...defaultData, label: "Webhook Trigger", webhookId: `hook_${Date.now().toString(36)}`, method: "POST" };
      if (type === "cron") defaultData = { ...defaultData, label: "Cron Schedule", cronExpression: "0 8 * * *" };
      if (type === "vector_db") defaultData = { ...defaultData, label: "Vector Search / RAG", provider: "in-memory", topK: 3, collectionName: "documents" };
      if (type === "llm") defaultData = { ...defaultData, model: "gpt-4o" };
      if (type === "prompt")
        defaultData = {
          ...defaultData,
          prompt: "You are a helpful assistant.",
        };
      if (type === "api") defaultData = { ...defaultData, method: "GET", url: "https://api.example.com/data" };
      if (type === "condition") defaultData = { ...defaultData, condition: "output.contains('error')" };
      if (type === "parallel") defaultData = { ...defaultData, label: "Parallel Split" };
      if (type === "join") defaultData = { ...defaultData, label: "Join / Merge", mergeStrategy: "array" };
      if (type === "foreach") defaultData = { ...defaultData, label: "ForEach Loop", arraySource: "output", concurrency: 1, itemAlias: "item" };
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
        edgeTypes={edgeTypes}
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
              case "webhook":
              case "cron":
                return "var(--family-trigger-accent)";
              case "llm":
              case "prompt":
                return "var(--family-ai-accent)";
              case "condition":
              case "parallel":
              case "join":
              case "foreach":
                return "var(--family-logic-accent)";
              case "api":
              case "vector_db":
                return "var(--family-integration-accent)";
              case "json":
              case "code":
                return "var(--family-data-accent)";
              case "output":
                return "var(--family-output-accent)";
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
