import React, { memo } from 'react';
import { NodeProps, Position } from 'reactflow';
import { NodeData } from '../../types';
import { CustomHandle, EditableLabel, ShapeNodeWrapper } from './BaseNode';

export const StickyNoteNode = memo(({ id, data, selected, isConnectable }: NodeProps<NodeData>) => {
    return (
      <ShapeNodeWrapper selected={selected}>
        <div 
          className={`relative w-full h-full group transition-all duration-300 ${
              selected ? 'ring-2 ring-blue-500 ring-offset-1' : 'hover:scale-[1.02]'
          }`}
          style={{
              backgroundColor: data.backgroundColor,
              border: `${data.borderWidth}px solid ${data.borderColor}`,
              borderRadius: data.borderRadius ?? 0,
              // "Floating" shadow effect: deeper and softer than standard
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06), 0 10px 15px -3px rgba(0, 0, 0, 0.1)',
          }}
        >
          <EditableLabel id={id} data={data} isShape />
          
          <CustomHandle type="source" position={Position.Top} id="top" selected={selected} isConnectable={isConnectable} />
          <CustomHandle type="source" position={Position.Left} id="left" selected={selected} isConnectable={isConnectable} />
          <CustomHandle type="source" position={Position.Right} id="right" selected={selected} isConnectable={isConnectable} />
          <CustomHandle type="source" position={Position.Bottom} id="bottom" selected={selected} isConnectable={isConnectable} />
        </div>
      </ShapeNodeWrapper>
    );
});
