import React from 'react';
import { useReactFlow } from 'reactflow';
import { useStore } from '../store';
import { LayoutDashboard, Scan } from 'lucide-react';
import { ToolType } from '../types';

const SectionPanel: React.FC = () => {
  const { isSectionPanelOpen, setSelectedNodes } = useStore();
  const { getNodes, fitView } = useReactFlow();
  
  if (!isSectionPanelOpen) return null;

  const sections = getNodes().filter(n => n.type === ToolType.SECTION);

  const handleSectionClick = (id: string) => {
      // Select the section
      setSelectedNodes([id]);
      
      // Fit view to the section (Focus/Fullscreen effect)
      fitView({
          nodes: [{ id }],
          padding: 0.1,
          duration: 800,
      });
  };

  return (
    <div className="absolute top-20 left-4 w-60 bg-white rounded-lg shadow-xl border border-gray-200 p-4 z-50 max-h-[calc(100vh-8rem)] overflow-hidden flex flex-col animate-in slide-in-from-left duration-200">
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
        <h3 className="font-semibold text-gray-800 flex items-center gap-2 text-sm">
          <LayoutDashboard size={16} className="text-purple-500" />
          分区导航
        </h3>
        <span className="text-xs text-gray-400">{sections.length} 个分区</span>
      </div>
      
      <div className="overflow-y-auto custom-scrollbar flex-1 space-y-1">
          {sections.length > 0 ? (
              sections.map((node) => (
                  <button 
                    key={node.id}
                    onClick={() => handleSectionClick(node.id)}
                    className="w-full group flex items-center gap-2 p-2 rounded-md cursor-pointer text-xs transition-colors hover:bg-purple-50 border border-transparent hover:border-purple-100 text-left"
                  >
                      <Scan size={14} className="text-gray-400 group-hover:text-purple-500" />
                      <span className="flex-1 truncate font-medium text-gray-700 group-hover:text-purple-700">
                          {node.data.label || '未命名分区'}
                      </span>
                  </button>
              ))
          ) : (
               <div className="text-center py-8 text-gray-400 text-xs italic">
                  暂无分区
              </div>
          )}
      </div>
    </div>
  );
};

export default SectionPanel;