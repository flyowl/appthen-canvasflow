import { Node, Edge, OnNodesChange, OnEdgesChange, Connection } from 'reactflow';

export enum ToolType {
  SELECT = 'SELECT',
  RECTANGLE = 'RECTANGLE',
  CIRCLE = 'CIRCLE',
  TRIANGLE = 'TRIANGLE',
  DIAMOND = 'DIAMOND',
  PARALLELOGRAM = 'PARALLELOGRAM',
  HEXAGON = 'HEXAGON',
  CYLINDER = 'CYLINDER',
  CLOUD = 'CLOUD',
  DOCUMENT = 'DOCUMENT',
  TEXT = 'TEXT',
  STICKY_NOTE = 'STICKY_NOTE',
  HAND = 'HAND',
  PEN = 'PEN',
  GROUP = 'GROUP',     // For logical combinations (Ctrl+G)
  SECTION = 'SECTION', // For visual partitions
  MINDMAP = 'MINDMAP',
  ERASER = 'ERASER',
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  CUSTOM_AGENT = 'CUSTOM_AGENT',
  MARKDOWN = 'MARKDOWN',
}

export type LayoutDirection = 'LR' | 'RL' | 'TB' | 'HS';

export interface MindMapItem {
  id: string;
  label: string;
  children: MindMapItem[];
  layoutDirection?: LayoutDirection; // Only valid on Root
  style?: {
      backgroundColor?: string;
      borderColor?: string;
      textColor?: string;
      fontSize?: number;
  }
}

export interface NodeData {
  label?: string;
  backgroundColor: string;
  borderColor: string;
  borderWidth: number;
  textColor: string;
  fontSize: number;
  width?: number;
  height?: number;
  text?: string;
  align?: 'left' | 'center' | 'right';
  verticalAlign?: 'top' | 'center' | 'bottom';
  isEditing?: boolean;
  // For Drawing Node
  path?: string;
  // For Group/Section interaction
  isHighlight?: boolean;
  // For Mind Map
  mindMapRoot?: MindMapItem;
  // Corner Radius
  borderRadius?: number;
  // For Media
  src?: string;
  objectFit?: 'contain' | 'cover' | 'fill';
  // For Markdown
  markdownContent?: string;
}

export type CanvasNode = Node<NodeData>;

export interface AppState {
  tool: ToolType;
  selectedNodes: string[];
  selectedEdges: string[];
  copiedNodes: Node<NodeData>[];
  isLayersPanelOpen: boolean;
  isAIModalOpen: boolean;
  defaultStyle: {
    backgroundColor: string;
    borderColor: string;
    borderWidth: number;
    textColor: string;
    fontSize: number;
    align: 'left' | 'center' | 'right';
    verticalAlign: 'top' | 'center' | 'bottom';
    borderRadius: number;
  };
  
  // Canvas State
  nodes: Node<NodeData>[];
  edges: Edge[];
  history: {
      past: { nodes: Node<NodeData>[], edges: Edge[] }[];
      future: { nodes: Node<NodeData>[], edges: Edge[] }[];
  };

  setTool: (tool: ToolType) => void;
  setSelectedNodes: (nodeIds: string[]) => void;
  setSelectedEdges: (edgeIds: string[]) => void;
  setCopiedNodes: (nodes: Node<NodeData>[]) => void;
  toggleLayersPanel: () => void;
  toggleAIModal: () => void;
  updateDefaultStyle: (style: Partial<AppState['defaultStyle']>) => void;

  // Actions
  setNodes: (payload: Node<NodeData>[] | ((nodes: Node<NodeData>[]) => Node<NodeData>[])) => void;
  setEdges: (payload: Edge[] | ((edges: Edge[]) => Edge[])) => void;
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: (connection: Connection) => void;
  takeSnapshot: () => void;
  undo: () => void;
  redo: () => void;
  clearAll: () => void;
}