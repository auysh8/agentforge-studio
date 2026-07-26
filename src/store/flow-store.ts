import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  Connection,
  Edge,
  EdgeChange,
  Node,
  NodeChange,
  addEdge,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
  applyNodeChanges,
  applyEdgeChanges,
} from '@xyflow/react';

type FlowState = {
  nodes: Node[];
  edges: Edge[];
  selectedNode: Node | null;
  nodeStatuses: Record<string, 'idle' | 'running' | 'success' | 'error'>;
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  addNode: (node: Node) => void;
  updateNodeData: (nodeId: string, data: Record<string, unknown>) => void;
  setSelectedNode: (node: Node | null) => void;
  deleteNode: (nodeId: string) => void;
  loadGraph: (graph: { nodes: Node[]; edges: Edge[] }) => void;
  resetGraph: () => void;
  setNodeStatus: (nodeId: string, status: 'idle' | 'running' | 'success' | 'error') => void;
  resetNodeStatuses: () => void;
  getExecutableGraph: () => { nodes: Node[]; edges: Edge[] } | null;
};

const defaultInitialNodes: Node[] = [
  {
    id: "trigger-1",
    type: "trigger",
    position: { x: 100, y: 180 },
    data: { label: "User Prompt Trigger", eventType: "user_prompt" },
  },
  {
    id: "api-1",
    type: "api",
    position: { x: 450, y: 150 },
    data: {
      label: "Exa Web Search",
      endpoint: "https://api.exa.ai/search",
      method: "POST",
      headers: '{"x-api-key": "893ae3b5-4dbb-4782-bf71-ffd3248d8d15", "Content-Type": "application/json"}',
      body: '{"query": "startups in delhi ncr", "numResults": 3}',
    },
  },
  {
    id: "llm-1",
    type: "llm",
    position: { x: 800, y: 150 },
    data: {
      label: "AI Synthesis",
      provider: "mistral",
      model: "mistral-large-latest",
      systemPrompt: "Synthesize the search results concisely.",
    },
  },
];

const defaultInitialEdges: Edge[] = [
  { id: "e1-2", source: "trigger-1", target: "api-1" },
  { id: "e2-3", source: "api-1", target: "llm-1" },
];

export const useFlowStore = create<FlowState>()(
  persist(
    (set, get) => ({
      nodes: defaultInitialNodes,
      edges: defaultInitialEdges,
      selectedNode: null,
      nodeStatuses: {},
      onNodesChange: (changes: NodeChange[]) => {
        set({
          nodes: applyNodeChanges(changes, get().nodes),
        });
        
        // Update selected node if it changed
        const selected = get().nodes.find(n => n.selected);
        set({ selectedNode: selected || null });
      },
      onEdgesChange: (changes: EdgeChange[]) => {
        set({
          edges: applyEdgeChanges(changes, get().edges),
        });
      },
      onConnect: (connection: Connection) => {
        set({
          edges: addEdge(connection, get().edges),
        });
      },
      addNode: (node: Node) => {
        set({ nodes: [...get().nodes, node] });
      },
      updateNodeData: (nodeId: string, data: Record<string, unknown>) => {
        const newNodes = get().nodes.map((node) =>
          node.id === nodeId ? { ...node, data: { ...node.data, ...data } } : node
        );
        set({ nodes: newNodes });
        
        // Also update selectedNode to ensure PropertiesPanel re-renders with new data
        const currentSelected = get().selectedNode;
        if (currentSelected && currentSelected.id === nodeId) {
          set({ selectedNode: newNodes.find(n => n.id === nodeId) || null });
        }
      },
      setSelectedNode: (node: Node | null) => {
        set({ selectedNode: node });
      },
      deleteNode: (nodeId: string) => {
        set((state) => ({
          nodes: state.nodes.filter((node) => node.id !== nodeId),
          edges: state.edges.filter((edge) => edge.source !== nodeId && edge.target !== nodeId),
          selectedNode: state.selectedNode?.id === nodeId ? null : state.selectedNode,
        }));
      },
      loadGraph: (graph: { nodes: Node[]; edges: Edge[] }) => {
        set({
          nodes: graph.nodes || [],
          edges: graph.edges || [],
          selectedNode: null,
          nodeStatuses: {},
        });
      },
      resetGraph: () => {
        set({
          nodes: defaultInitialNodes,
          edges: defaultInitialEdges,
          selectedNode: null,
          nodeStatuses: {},
        });
      },
      setNodeStatus: (nodeId: string, status: 'idle' | 'running' | 'success' | 'error') => {
        set((state) => ({
          nodeStatuses: { ...state.nodeStatuses, [nodeId]: status },
        }));
      },
      resetNodeStatuses: () => {
        set({ nodeStatuses: {} });
      },
      getExecutableGraph: () => {
        const { nodes, edges } = get();
        // Validate that we have at least a trigger node
        const hasTrigger = nodes.some(n => n.type === 'trigger');
        
        if (!hasTrigger) {
          return null;
        }
        
        return { nodes, edges };
      }
    }),
    {
      name: 'agentforge-flow-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ nodes: state.nodes, edges: state.edges }),
    }
  )
);

