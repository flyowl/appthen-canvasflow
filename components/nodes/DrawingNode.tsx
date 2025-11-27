import React, { memo } from 'react';
import { NodeProps, Position } from 'reactflow';
import { NodeData } from '../../types';
import { CustomHandle, ShapeNodeWrapper } from './BaseNode';

export const DrawingNode = memo(({ id, data, selected, isConnectable }: NodeProps<NodeData>) => {
    return (
      <ShapeNodeWrapper selected={selected}>
        <div className={`relative w-full h-full group ${selected ? 'ring-1 ring-blue-500 border-dashed' : ''}`}>
            <svg 
                style={{ 
                    width: '100%', 
                    height: '100%', 
                    overflow: 'visible',
                    pointerEvents: 'none'
                }}
            >
                <path
                    d={data.path}
                    stroke={data.borderColor}
                    strokeWidth={data.borderWidth}
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    vectorEffect="non-scaling-stroke"
                />
            </svg>
            <CustomHandle type="source" position={Position.Top} id="top" selected={selected} isConnectable={isConnectable} />
            <CustomHandle type="source" position={Position.Left} id="left" selected={selected} isConnectable={isConnectable} />
            <CustomHandle type="source" position={Position.Right} id="right" selected={selected} isConnectable={isConnectable} />
            <CustomHandle type="source" position={Position.Bottom} id="bottom" selected={selected} isConnectable={isConnectable} />
        </div>
      </ShapeNodeWrapper>
    );
});
