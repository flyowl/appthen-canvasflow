import React, { memo } from 'react';
import { NodeProps, Position } from 'reactflow';
import { NodeData } from '../../types';
import { CustomHandle, ShapeNodeWrapper } from './BaseNode';

export const GroupNode = memo(({ id, data, selected, isConnectable }: NodeProps<NodeData>) => {
    // Group Node is now strictly for Logical Grouping (Ctrl+G).
    // It is usually transparent and acts as a bounding box.

    return (
        <ShapeNodeWrapper selected={selected} minWidth={100} minHeight={100}>
            <div 
                className={`relative w-full h-full transition-all duration-200 pointer-events-none
                    ${selected ? 'border-2 border-dashed border-blue-500 bg-blue-50/5' : ''}
                `}
                style={{
                    borderRadius: data.borderRadius ?? 4,
                }}
            >
                 {/* Connection Handles */}
                <CustomHandle type="source" position={Position.Top} id="top" selected={selected} isConnectable={isConnectable} />
                <CustomHandle type="source" position={Position.Left} id="left" selected={selected} isConnectable={isConnectable} />
                <CustomHandle type="source" position={Position.Right} id="right" selected={selected} isConnectable={isConnectable} />
                <CustomHandle type="source" position={Position.Bottom} id="bottom" selected={selected} isConnectable={isConnectable} />
            </div>
        </ShapeNodeWrapper>
    );
});