import React, { memo } from 'react';
import { NodeProps, Position } from 'reactflow';
import { NodeData } from '../../types';
import { CustomHandle, EditableLabel, ShapeNodeWrapper } from './BaseNode';

export const SectionNode = memo(({ id, data, selected, isConnectable }: NodeProps<NodeData>) => {
    const isHighlighted = data.isHighlight;
    const isActive = isHighlighted || selected;

    return (
        <ShapeNodeWrapper selected={selected} minWidth={200} minHeight={200}>
            <div 
                className={`relative w-full h-full transition-all duration-200 overflow-visible group flex flex-col rounded-lg
                    ${isActive ? 'ring-2 ring-blue-500 ring-offset-1' : 'border border-gray-200 hover:shadow-sm'}
                `}
                style={{
                    backgroundColor: data.backgroundColor || 'rgba(241, 245, 249, 0.5)', // Slate 100 with opacity
                    borderRadius: data.borderRadius ?? 8,
                    // Visual cue when dragging items over
                    boxShadow: isHighlighted ? 'inset 0 0 0 2px #3b82f6, 0 4px 6px -1px rgba(0, 0, 0, 0.1)' : undefined,
                }}
            >
                {/* Section Header */}
                <div 
                    className="h-8 w-full bg-white/50 border-b border-gray-100/50 rounded-t-lg flex items-center px-2 select-none"
                    style={{ pointerEvents: 'auto' }}
                >
                     <EditableLabel id={id} data={data} isShape isGroup />
                </div>

                {/* Content Area - Pointer events pass through unless selected to allow selecting children easily */}
                <div className="flex-1 w-full" style={{ pointerEvents: selected ? 'auto' : 'none' }} />

                 {/* Connection Handles */}
                <CustomHandle type="source" position={Position.Top} id="top" selected={selected} isConnectable={isConnectable} />
                <CustomHandle type="source" position={Position.Left} id="left" selected={selected} isConnectable={isConnectable} />
                <CustomHandle type="source" position={Position.Right} id="right" selected={selected} isConnectable={isConnectable} />
                <CustomHandle type="source" position={Position.Bottom} id="bottom" selected={selected} isConnectable={isConnectable} />
            </div>
        </ShapeNodeWrapper>
    );
});