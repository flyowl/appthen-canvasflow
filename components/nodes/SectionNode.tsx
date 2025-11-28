import React, { memo } from 'react';
import { NodeProps, Position } from 'reactflow';
import { NodeData } from '../../types';
import { CustomHandle, EditableLabel, ShapeNodeWrapper } from './BaseNode';

export const SectionNode = memo(({ id, data, selected, isConnectable }: NodeProps<NodeData>) => {
    // Highlight state is driven by drag-over logic in App.tsx
    const isHighlighted = data.isHighlight;
    const isActive = isHighlighted || selected;

    return (
        <ShapeNodeWrapper selected={selected} minWidth={200} minHeight={200}>
            <div 
                className={`relative w-full h-full transition-all duration-200 rounded-lg flex flex-col overflow-hidden
                    ${isActive ? 'ring-2 ring-blue-500 ring-offset-1' : 'border border-gray-200'}
                `}
                style={{
                    // Partitions have a visible background
                    backgroundColor: data.backgroundColor || 'rgba(241, 245, 249, 0.5)', 
                    // Visual cue when dragging items over to indicate it will catch them
                    boxShadow: isHighlighted ? 'inset 0 0 0 2px #3b82f6, 0 4px 6px -1px rgba(0,0,0,0.1)' : 'none',
                }}
            >
                {/* Section Header */}
                <div 
                    className="h-8 w-full bg-slate-100/80 border-b border-gray-200 flex items-center px-2 select-none backdrop-blur-sm"
                    style={{ pointerEvents: 'auto' }}
                >
                     <EditableLabel id={id} data={data} isShape isGroup />
                </div>

                {/* Content Area - Pointer events should be transparent to allow selecting children easily, 
                    unless the section itself is clicked on empty space */}
                <div className="flex-1 w-full" style={{ pointerEvents: 'auto' }} />

                 {/* Connection Handles */}
                <CustomHandle type="source" position={Position.Top} id="top" selected={selected} isConnectable={isConnectable} />
                <CustomHandle type="source" position={Position.Left} id="left" selected={selected} isConnectable={isConnectable} />
                <CustomHandle type="source" position={Position.Right} id="right" selected={selected} isConnectable={isConnectable} />
                <CustomHandle type="source" position={Position.Bottom} id="bottom" selected={selected} isConnectable={isConnectable} />
            </div>
        </ShapeNodeWrapper>
    );
});