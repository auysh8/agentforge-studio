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
  nodeStatuses: Record<string, 'idle' | 'pending' | 'running' | 'success' | 'error'>;
  activeEdgeStatuses: Record<string, boolean>;
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  addNode: (node: Node) => void;
  updateNodeData: (nodeId: string, data: Record<string, unknown>) => void;
  setSelectedNode: (node: Node | null) => void;
  deleteNode: (nodeId: string) => void;
  loadGraph: (graph: { nodes: Node[]; edges: Edge[] }) => void;
  resetGraph: () => void;
  setNodeStatus: (nodeId: string, status: 'idle' | 'pending' | 'running' | 'success' | 'error') => void;
  resetNodeStatuses: () => void;
  setEdgeActive: (edgeId: string, active: boolean) => void;
  resetEdgeStatuses: () => void;
  getExecutableGraph: () => { nodes: Node[]; edges: Edge[] } | null;
};

const defaultInitialNodes: Node[] = [];

const defaultInitialEdges: Edge[] = [];

export const useFlowStore = create<FlowState>()(
  persist(
    (set, get) => ({
      nodes: defaultInitialNodes,
      edges: defaultInitialEdges,
      selectedNode: null,
      nodeStatuses: {},
      activeEdgeStatuses: {},
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
          activeEdgeStatuses: {},
        });
      },
      resetGraph: () => {
        set({
          nodes: [],
          edges: [],
          selectedNode: null,
          nodeStatuses: {},
          activeEdgeStatuses: {},
        });
      },
      setNodeStatus: (nodeId: string, status: 'idle' | 'pending' | 'running' | 'success' | 'error') => {
        set((state) => ({
          nodeStatuses: { ...state.nodeStatuses, [nodeId]: status },
        }));
      },
      resetNodeStatuses: () => {
        set({ nodeStatuses: {}, activeEdgeStatuses: {} });
      },
      setEdgeActive: (edgeId: string, active: boolean) => {
        set((state) => ({
          activeEdgeStatuses: { ...state.activeEdgeStatuses, [edgeId]: active },
        }));
      },
      resetEdgeStatuses: () => {
        set({ activeEdgeStatuses: {} });
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
      version: 1,
    }
  )
);

