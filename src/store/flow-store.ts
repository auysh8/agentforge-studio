import { create } from 'zustand';
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
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  addNode: (node: Node) => void;
  updateNodeData: (nodeId: string, data: any) => void;
  setSelectedNode: (node: Node | null) => void;
  deleteNode: (nodeId: string) => void;
  getExecutableGraph: () => { nodes: Node[]; edges: Edge[] } | null;
};

export const useFlowStore = create<FlowState>((set, get) => ({
  nodes: [],
  edges: [],
  selectedNode: null,
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
  updateNodeData: (nodeId: string, data: any) => {
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
  getExecutableGraph: () => {
    const { nodes, edges } = get();
    // Validate that we have at least a trigger node
    const hasTrigger = nodes.some(n => n.type === 'trigger');
    
    if (!hasTrigger) {
      return null;
    }
    
    return { nodes, edges };
  }
}));
