import React from 'react';
import { useReactFlow } from 'reactflow';
import { useStore } from '../store';
import { Layers, Eye, EyeOff, Lock, Unlock, ArrowUp, ArrowDown } from 'lucide-react';
import { ToolType } from '../types';

const LayersPanel: React.FC = () => {
  const { isLayersPanelOpen, selectedNodes, setSelectedNodes } = useStore();
  const { getNodes, setNodes } = useReactFlow();
  const nodes = getNodes().slice().reverse(); // Show top layers first

  if (!isLayersPanelOpen) return null;

  const handleSelect = (id: string, multi: boolean) => {
      if (multi) {
          setSelectedNodes(selectedNodes.includes(id) ? selectedNodes.filter(n => n !== id) : [...selectedNodes, id]);
      } else {
          setSelectedNodes([id]);
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

  const getNodeLabel = (node: any) => {
      const typeMap: Record<string, string> = {
          [ToolType.RECTANGLE]: '矩形',
          [ToolType.CIRCLE]: '圆形',
          [ToolType.TRIANGLE]: '三角形',
          [ToolType.TEXT]: '文本',
          [ToolType.PEN]: '手绘',
          [ToolType.GROUP]: '组合',
          [ToolType.MINDMAP]: '思维导图',
      };

      if (node.data.label && node.type !== ToolType.PEN && node.type !== ToolType.MINDMAP) return node.data.label;
      if (node.type === ToolType.MINDMAP && node.data.mindMapRoot) return `思维导图: ${node.data.mindMapRoot.label}`;
      return `${typeMap[node.type] || '节点'} ${node.id.split('-')[1] || ''}`;
  }

  return (
    <div className="absolute top-20 left-4 w-60 bg-white rounded-lg shadow-xl border border-gray-200 p-4 z-50 max-h-[calc(100vh-8rem)] overflow-hidden flex flex-col">
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
        <h3 className="font-semibold text-gray-800 flex items-center gap-2 text-sm">
          <Layers size={16} className="text-blue-500" />
          图层
        </h3>
        <span className="text-xs text-gray-400">{nodes.length} 个元素</span>
      </div>
      
      <div className="overflow-y-auto custom-scrollbar flex-1 space-y-1">
          {nodes.map((node) => {
              const isSelected = selectedNodes.includes(node.id);
              return (
                  <div 
                    key={node.id}
                    onClick={(e) => handleSelect(node.id, e.ctrlKey || e.metaKey)}
                    className={`group flex items-center gap-2 p-2 rounded-md cursor-pointer text-xs transition-colors border ${
                        isSelected ? 'bg-blue-50 border-blue-200 text-blue-700' : 'hover:bg-gray-50 border-transparent text-gray-600'
                    }`}
                  >
                      <span className="flex-1 truncate font-medium">
                          {getNodeLabel(node)}
                      </span>
                      
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                            onClick={(e) => { e.stopPropagation(); moveNode(node.id, 'up'); }}
                            className="p-1 hover:bg-white rounded shadow-sm text-gray-500"
                            title="上移"
                        >
                            <ArrowUp size={10} />
                        </button>
                         <button 
                            onClick={(e) => { e.stopPropagation(); moveNode(node.id, 'down'); }}
                            className="p-1 hover:bg-white rounded shadow-sm text-gray-500"
                            title="下移"
                        >
                            <ArrowDown size={10} />
                        </button>
                      </div>
                  </div>
              )
          })}
          {nodes.length === 0 && (
              <div className="text-center py-8 text-gray-400 text-xs italic">
                  空图层
              </div>
          )}
      </div>
    </div>
  );
};

export default LayersPanel;