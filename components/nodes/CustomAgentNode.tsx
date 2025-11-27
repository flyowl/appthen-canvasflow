import React, { memo } from 'react';
import { NodeProps, Position } from 'reactflow';
import { NodeData } from '../../types';
import { CustomHandle, EditableLabel, ShapeNodeWrapper } from './BaseNode';
import { Bot, Play, Settings } from 'lucide-react';

export const CustomAgentNode = memo(({ id, data, selected, isConnectable }: NodeProps<NodeData>) => {
  return (
    <ShapeNodeWrapper selected={selected} minWidth={250} minHeight={150}>
      <div 
        className={`relative w-full h-full flex flex-col bg-white rounded-xl overflow-hidden shadow-sm transition-all duration-300 ${
            selected ? 'ring-2 ring-blue-500 ring-offset-1 shadow-md' : 'border border-gray-200 hover:shadow-md'
        }`}
      >
        {/* Header */}
        <div className="bg-indigo-50 px-3 py-2 border-b border-indigo-100 flex items-center justify-between">
            <div className="flex items-center gap-2 text-indigo-900 font-semibold text-xs select-none">
                <Bot size={16} className="text-indigo-600" />
                <span>自定义智能体</span>
            </div>
            <div className="flex items-center gap-1">
                <button className="p-1 text-indigo-400 hover:text-indigo-600 rounded hover:bg-indigo-100 transition-colors">
                    <Settings size={14} />
                </button>
                <button className="p-1 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors shadow-sm">
                    <Play size={10} className="ml-0.5" />
                </button>
            </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 p-4 bg-white relative">
             <div className="absolute inset-0 p-4">
                <EditableLabel id={id} data={data} isShape />
             </div>
        </div>

        <CustomHandle type="source" position={Position.Top} id="top" selected={selected} isConnectable={isConnectable} />
        <CustomHandle type="source" position={Position.Right} id="right" selected={selected} isConnectable={isConnectable} />
        <CustomHandle type="source" position={Position.Bottom} id="bottom" selected={selected} isConnectable={isConnectable} />
        <CustomHandle type="source" position={Position.Left} id="left" selected={selected} isConnectable={isConnectable} />
      </div>
    </ShapeNodeWrapper>
  );
});
