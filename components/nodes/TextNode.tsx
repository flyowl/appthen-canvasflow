import React, { memo } from 'react';
import { NodeProps, Position } from 'reactflow';
import { NodeData } from '../../types';
import { CustomHandle, EditableLabel } from './BaseNode';

export const TextNode = memo(({ id, data, selected, isConnectable }: NodeProps<NodeData>) => {
  return (
    <div
      className={`relative min-w-[50px] flex items-center group transition-all duration-200 ${
         selected ? 'border border-blue-500 border-dashed bg-blue-50/20' : 'border border-transparent hover:border-gray-200'
      }`}
    >
       <EditableLabel id={id} data={data} isShape={false} />

      <CustomHandle type="source" position={Position.Right} id="right" selected={selected} isConnectable={isConnectable} />
      <CustomHandle type="source" position={Position.Left} id="left" selected={selected} isConnectable={isConnectable} />
      <CustomHandle type="source" position={Position.Top} id="top" selected={selected} isConnectable={isConnectable} />
      <CustomHandle type="source" position={Position.Bottom} id="bottom" selected={selected} isConnectable={isConnectable} />
    </div>
  );
});
