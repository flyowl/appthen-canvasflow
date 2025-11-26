import { create } from 'zustand';
import { AppState, ToolType } from './types';

export const useStore = create<AppState>((set) => ({
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
}));