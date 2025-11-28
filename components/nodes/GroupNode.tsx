import React, { memo } from 'react';
import { NodeProps, Position } from 'reactflow';
import { NodeData } from '../../types';
import { CustomHandle, ShapeNodeWrapper } from './BaseNode';

export const GroupNode = memo(({ id, data, selected, isConnectable }: NodeProps<NodeData>) => {
    // Group Node is strictly for Logical Grouping (Ctrl+G).
    // It is completely transparent and acts as a logical container.

    return (
        <ShapeNodeWrapper selected={selected} minWidth={100} minHeight={100} noResizer={!selected}>
            <div 
                className={`w-full h-full transition-all duration-200 ${selected ? 'ring-1 ring-blue-500 ring-dashed' : ''}`}
                style={{
                    backgroundColor: 'transparent',
                    pointerEvents: 'none' // Clicks pass through to children or canvas
                }}
            >
                {/* 
                   Connection Handles are kept but hidden visually. 
                */}
                <CustomHandle type="source" position={Position.Top} id="top" selected={selected} isConnectable={isConnectable} />
                <CustomHandle type="source" position={Position.Left} id="left" selected={selected} isConnectable={isConnectable} />
                <CustomHandle type="source" position={Position.Right} id="right" selected={selected} isConnectable={isConnectable} />
                <CustomHandle type="source" position={Position.Bottom} id="bottom" selected={selected} isConnectable={isConnectable} />
            </div>
        </ShapeNodeWrapper>
    );
});