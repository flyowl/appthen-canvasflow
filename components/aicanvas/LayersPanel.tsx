import React, { useState } from 'react';
import { useReactFlow } from 'reactflow';
import { useStore } from './store';
import { Layers, ArrowUp, ArrowDown, Cable, Box } from 'lucide-react';
import { ToolType } from './types';

const LayersPanel: React.FC = () => {
  const { isLayersPanelOpen, selectedNodes, setSelectedNodes, selectedEdges, setSelectedEdges } = useStore();
  const { getNodes, setNodes, getEdges, setEdges } = useReactFlow();
  
  const [activeTab, setActiveTab] = useState<'nodes' | 'edges'>('nodes');

  if (!isLayersPanelOpen) return null;

  const nodes = getNodes().slice().reverse(); // Show top nodes first
  const edges = getEdges().slice().reverse(); // Show top edges first

  const handleSelectNode = (id: string, multi: boolean) => {
      if (multi) {
          setSelectedNodes(selectedNodes.includes(id) ? selectedNodes.filter(n => n !== id) : [...selectedNodes, id]);
      } else {
          setSelectedNodes([id]);
          setSelectedEdges([]); // Clear edges when selecting node
      }
  };

  const handleSelectEdge = (id: string, multi: boolean) => {
      if (multi) {
          setSelectedEdges(selectedEdges.includes(id) ? selectedEdges.filter(e => e !== id) : [...selectedEdges, id]);
      } else {
          setSelectedEdges([id]);
          setSelectedNodes([]); // Clear nodes when selecting edge
      }
  };

  const moveNode = (id: string, direction: 'up' | 'down') => {
      const allNodes = getNodes();
      const index = allNodes.findIndex(n => n.id === id);
      if (index === -1) return;
      
      const newNodes = [...allNodes];
      if (direction === 'up' && index < allNodes.length - 1) {
          [newNodes[index], newNodes[index + 1]] = [newNodes[index + 1], newNodes[index]];
      } else if (direction === 'down' && index > 0) {
           [newNodes[index], newNodes[index - 1]] = [newNodes[index - 1], newNodes[index]];
      }
      setNodes(newNodes);
  };

  // Edge reordering removed as per user request ("useless" relative to nodes)

  const getNodeLabel = (node: any) => {
      const typeMap: Record<string, string> = {
          [ToolType.RECTANGLE]: '矩形',
          [ToolType.CIRCLE]: '圆形',
          [ToolType.TRIANGLE]: '三角形',
          [ToolType.DIAMOND]: '菱形',
          [ToolType.PARALLELOGRAM]: '平行四边形',
          [ToolType.HEXAGON]: '六边形',
          [ToolType.CYLINDER]: '圆柱体',
          [ToolType.CLOUD]: '云',
          [ToolType.DOCUMENT]: '文档',
          [ToolType.TEXT]: '文本',
          [ToolType.PEN]: '手绘',
          [ToolType.GROUP]: '组合',
          [ToolType.SECTION]: '分区',
          [ToolType.MINDMAP]: '思维导图',
          [ToolType.STICKY_NOTE]: '便签',
          [ToolType.IMAGE]: '图片',
          [ToolType.VIDEO]: '视频',
          [ToolType.CUSTOM_AGENT]: '智能体',
          [ToolType.MARKDOWN]: 'Markdown',
      };

      if (node.data.label && node.type !== ToolType.PEN && node.type !== ToolType.MINDMAP) return node.data.label;
      if (node.type === ToolType.MINDMAP && node.data.mindMapRoot) return `导图: ${node.data.mindMapRoot.label}`;
      return `${typeMap[node.type] || '节点'} ${node.id.split('-')[1] || ''}`;
  }

  return (
    <div className="absolute top-20 left-4 w-64 bg-white rounded-lg shadow-xl border border-gray-200 p-3 z-50 max-h-[calc(100vh-8rem)] overflow-hidden flex flex-col animate-in slide-in-from-left duration-200">
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100">
        <h3 className="font-semibold text-gray-800 flex items-center gap-2 text-sm">
          <Layers size={16} className="text-blue-500" />
          图层管理
        </h3>
      </div>

      <div className="flex p-1 gap-1 bg-gray-50 rounded-lg mb-2">
         <button 
            onClick={() => setActiveTab('nodes')} 
            className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded text-xs font-medium transition-all ${activeTab === 'nodes' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:bg-gray-100'}`}
         >
             <Box size={12} />
             节点 ({nodes.length})
         </button>
         <button 
            onClick={() => setActiveTab('edges')} 
            className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded text-xs font-medium transition-all ${activeTab === 'edges' ? 'bg-white shadow text-purple-600' : 'text-gray-500 hover:bg-gray-100'}`}
         >
             <Cable size={12} />
             连线 ({edges.length})
         </button>
      </div>
      
      <div className="overflow-y-auto custom-scrollbar flex-1 space-y-1 pr-1">
          {activeTab === 'nodes' && (
              <>
                {nodes.length > 0 ? (
                    nodes.map((node) => {
                        const isSelected = selectedNodes.includes(node.id);
                        return (
                            <div 
                                key={node.id}
                                onClick={(e) => handleSelectNode(node.id, e.ctrlKey || e.metaKey)}
                                className={`group flex items-center gap-2 p-2 rounded-md cursor-pointer text-xs transition-colors border border-transparent ${
                                    isSelected ? 'bg-blue-50 border-blue-100 text-blue-700' : 'hover:bg-gray-50 text-gray-600'
                                }`}
                            >
                                <Box size={14} className={isSelected ? 'text-blue-500' : 'text-gray-400'} />
                                <span className="flex-1 truncate font-medium select-none">
                                    {getNodeLabel(node)}
                                </span>
                                
                                <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 rounded backdrop-blur-sm">
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); moveNode(node.id, 'up'); }}
                                        className="p-1 hover:bg-blue-50 rounded text-gray-500 hover:text-blue-600"
                                        title="上移"
                                    >
                                        <ArrowUp size={12} />
                                    </button>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); moveNode(node.id, 'down'); }}
                                        className="p-1 hover:bg-blue-50 rounded text-gray-500 hover:text-blue-600"
                                        title="下移"
                                    >
                                        <ArrowDown size={12} />
                                    </button>
                                </div>
                            </div>
                        )
                    })
                ) : (
                    <div className="flex flex-col items-center justify-center h-24 text-gray-400 text-xs gap-2">
                        <Box size={24} className="opacity-20" />
                        <span>暂无节点</span>
                    </div>
                )}
              </>
          )}

          {activeTab === 'edges' && (
              <>
                 {edges.length > 0 ? (
                     edges.map((edge) => {
                        const isSelected = selectedEdges.includes(edge.id);
                        return (
                            <div 
                                key={edge.id}
                                onClick={(e) => handleSelectEdge(edge.id, e.ctrlKey || e.metaKey)}
                                className={`group flex items-center gap-2 p-2 rounded-md cursor-pointer text-xs transition-colors border border-transparent ${
                                    isSelected ? 'bg-purple-50 border-purple-100 text-purple-700' : 'hover:bg-gray-50 text-gray-600'
                                }`}
                            >
                                {/* Color Indicator for Edges */}
                                <div 
                                    className="w-3 h-3 rounded-full border border-gray-200 shadow-sm shrink-0"
                                    style={{ backgroundColor: edge.style?.stroke || '#94a3b8' }}
                                    title={`Color: ${edge.style?.stroke}`}
                                />
                                
                                <div className="flex-1 min-w-0 flex flex-col">
                                    <span className="truncate font-medium select-none">
                                        {edge.label || '连接线'}
                                    </span>
                                    <span className="text-[10px] text-gray-400 truncate font-mono">
                                        {edge.id.slice(-6)}
                                    </span>
                                </div>
                                
                                {/* Reordering buttons removed as per request to simplify edge management */}
                            </div>
                        )
                    })
                 ) : (
                    <div className="flex flex-col items-center justify-center h-24 text-gray-400 text-xs gap-2">
                        <Cable size={24} className="opacity-20" />
                        <span>暂无连线</span>
                    </div>
                 )}
              </>
          )}
      </div>
    </div>
  );
};

export default LayersPanel;