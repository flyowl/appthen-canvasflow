import { create } from 'zustand';
import { AppState, ToolType, NodeData } from './types';
import { 
    applyNodeChanges, 
    applyEdgeChanges, 
    addEdge,
    Node, 
    Edge,
    NodeChange,
    EdgeChange,
    Connection
} from 'reactflow';

const initialNodes: Node<NodeData>[] = [
  {
    id: '1',
    type: ToolType.RECTANGLE,
    position: { x: 250, y: 200 },
    data: { 
      label: '欢迎使用画板',
      backgroundColor: '#EFF6FF',
      borderColor: '#3B82F6',
      borderWidth: 2,
      textColor: '#1E3A8A',
      fontSize: 16,
      align: 'center',
      verticalAlign: 'center',
      width: 250,
      height: 120
    },
    style: { width: 250, height: 120 }
  },
];

export const useStore = create<AppState>((set, get) => ({
  tool: ToolType.SELECT,
  selectedNodes: [],
  selectedEdges: [],
  copiedNodes: [],
  isLayersPanelOpen: false,
  isAIModalOpen: false,
  defaultStyle: {
    backgroundColor: '#ffffff',
    borderColor: '#000000',
    borderWidth: 2,
    textColor: '#000000',
    fontSize: 16,
    align: 'center',
    verticalAlign: 'center',
  },
  
  // Canvas State
  nodes: initialNodes,
  edges: [],
  history: {
      past: [],
      future: []
  },

  setTool: (tool) => set({ tool }),
  setSelectedNodes: (selectedNodes) => set({ selectedNodes }),
  setSelectedEdges: (selectedEdges) => set({ selectedEdges }),
  setCopiedNodes: (copiedNodes) => set({ copiedNodes }),
  toggleLayersPanel: () => set((state) => ({ isLayersPanelOpen: !state.isLayersPanelOpen })),
  toggleAIModal: () => set((state) => ({ isAIModalOpen: !state.isAIModalOpen })),
  updateDefaultStyle: (style) =>
    set((state) => ({
      defaultStyle: { ...state.defaultStyle, ...style },
    })),

  // Actions
  setNodes: (payload) => set((state) => {
      const newNodes = typeof payload === 'function' ? payload(state.nodes) : payload;
      return { nodes: newNodes };
  }),
  setEdges: (payload) => set((state) => {
      const newEdges = typeof payload === 'function' ? payload(state.edges) : payload;
      return { edges: newEdges };
  }),

  onNodesChange: (changes: NodeChange[]) => {
      set({
          nodes: applyNodeChanges(changes, get().nodes),
      });
  },
  onEdgesChange: (changes: EdgeChange[]) => {
      set({
          edges: applyEdgeChanges(changes, get().edges),
      });
  },
  onConnect: (connection: Connection) => {
      const { nodes, edges, history } = get();
      set({
          history: {
              past: [...history.past, { nodes, edges }],
              future: []
          },
          edges: addEdge(connection, edges)
      });
  },
  takeSnapshot: () => {
      const { nodes, edges, history } = get();
      set({
          history: {
              past: [...history.past, { nodes, edges }],
              future: []
          }
      });
  },
  undo: () => {
      const { history, nodes, edges } = get();
      if (history.past.length === 0) return;

      const previous = history.past[history.past.length - 1];
      const newPast = history.past.slice(0, history.past.length - 1);

      set({
          nodes: previous.nodes,
          edges: previous.edges,
          history: {
              past: newPast,
              future: [{ nodes, edges }, ...history.future]
          }
      });
  },
  redo: () => {
      const { history, nodes, edges } = get();
      if (history.future.length === 0) return;

      const next = history.future[0];
      const newFuture = history.future.slice(1);

      set({
          nodes: next.nodes,
          edges: next.edges,
          history: {
              past: [...history.past, { nodes, edges }],
              future: newFuture
          }
      });
  },
  clearAll: () => {
      const { nodes, edges, history } = get();
      if (nodes.length === 0 && edges.length === 0) return;
      
      set({
          history: {
              past: [...history.past, { nodes, edges }],
              future: []
          },
          nodes: [],
          edges: []
      });
  }
}));