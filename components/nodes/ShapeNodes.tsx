import React, { memo } from 'react';
import { NodeProps, Position } from 'reactflow';
import { NodeData } from '../../types';
import { CustomHandle, EditableLabel, ShapeNodeWrapper } from './BaseNode';

export const RectangleNode = memo(({ id, data, selected, isConnectable }: NodeProps<NodeData>) => {
  return (
    <ShapeNodeWrapper selected={selected}>
      <div className={`relative w-full h-full group transition-all duration-300 ${selected ? 'drop-shadow-md hover:drop-shadow-lg' : 'drop-shadow-sm hover:drop-shadow-md hover:scale-[1.02]'}`}>
        <svg width="100%" height="100%" style={{ overflow: 'visible', position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}>
            <rect
                x="0"
                y="0"
                width="100%"
                height="100%"
                rx={data.borderRadius ?? 12} 
                ry={data.borderRadius ?? 12}
                fill={data.backgroundColor}
                stroke={data.borderColor}
                strokeWidth={data.borderWidth}
                vectorEffect="non-scaling-stroke"
            />
        </svg>
        
        <EditableLabel id={id} data={data} isShape />

        <CustomHandle type="source" position={Position.Top} id="top" selected={selected} isConnectable={isConnectable} />
        <CustomHandle type="source" position={Position.Left} id="left" selected={selected} isConnectable={isConnectable} />
        <CustomHandle type="source" position={Position.Right} id="right" selected={selected} isConnectable={isConnectable} />
        <CustomHandle type="source" position={Position.Bottom} id="bottom" selected={selected} isConnectable={isConnectable} />
      </div>
    </ShapeNodeWrapper>
  );
});

export const CircleNode = memo(({ id, data, selected, isConnectable }: NodeProps<NodeData>) => {
  return (
    <ShapeNodeWrapper selected={selected}>
      <div className={`relative w-full h-full group transition-all duration-300 ${selected ? 'drop-shadow-md hover:drop-shadow-lg' : 'drop-shadow-sm hover:drop-shadow-md hover:scale-[1.02]'}`}>
        <svg width="100%" height="100%" style={{ overflow: 'visible', position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}>
            <ellipse
                cx="50%"
                cy="50%"
                rx="50%"
                ry="50%"
                fill={data.backgroundColor}
                stroke={data.borderColor}
                strokeWidth={data.borderWidth}
                vectorEffect="non-scaling-stroke"
            />
        </svg>

        <EditableLabel id={id} data={data} isShape />

        <CustomHandle type="source" position={Position.Top} id="top" selected={selected} isConnectable={isConnectable} />
        <CustomHandle type="source" position={Position.Left} id="left" selected={selected} isConnectable={isConnectable} />
        <CustomHandle type="source" position={Position.Right} id="right" selected={selected} isConnectable={isConnectable} />
        <CustomHandle type="source" position={Position.Bottom} id="bottom" selected={selected} isConnectable={isConnectable} />
      </div>
    </ShapeNodeWrapper>
  );
});

export const TriangleNode = memo(({ id, data, selected, isConnectable }: NodeProps<NodeData>) => {
    return (
        <ShapeNodeWrapper selected={selected}>
            <div className={`relative w-full h-full group transition-all duration-300 ${selected ? 'drop-shadow-md hover:drop-shadow-lg' : 'drop-shadow-sm hover:drop-shadow-md hover:scale-[1.02]'}`}>
                 <CustomHandle type="source" position={Position.Top} id="top" selected={selected} isConnectable={isConnectable} />
                <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ overflow: 'visible', position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}>
                    <path 
                        d="M50 0 L100 100 L0 100 Z" 
                        fill={data.backgroundColor} 
                        stroke={data.borderColor} 
                        strokeWidth={data.borderWidth}
                        vectorEffect="non-scaling-stroke"
                        strokeLinejoin="round"
                    />
                </svg>
                
                <div className="absolute inset-0 pt-8 pb-2 px-4">
                     <EditableLabel id={id} data={data} isShape />
                </div>

                <CustomHandle type="source" position={Position.Bottom} id="bottom" selected={selected} isConnectable={isConnectable} />
                <CustomHandle type="source" position={Position.Left} id="left" selected={selected} isConnectable={isConnectable} style={{ top: '66%' }} />
                <CustomHandle type="source" position={Position.Right} id="right" selected={selected} isConnectable={isConnectable} style={{ top: '66%' }} />
            </div>
        </ShapeNodeWrapper>
    )
})

export const DiamondNode = memo(({ id, data, selected, isConnectable }: NodeProps<NodeData>) => {
    return (
        <ShapeNodeWrapper selected={selected}>
            <div className={`relative w-full h-full group transition-all duration-300 ${selected ? 'drop-shadow-md hover:drop-shadow-lg' : 'drop-shadow-sm hover:drop-shadow-md hover:scale-[1.02]'}`}>
                <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ overflow: 'visible', position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}>
                    <polygon 
                        points="50,0 100,50 50,100 0,50" 
                        fill={data.backgroundColor} 
                        stroke={data.borderColor} 
                        strokeWidth={data.borderWidth}
                        vectorEffect="non-scaling-stroke"
                        strokeLinejoin="round"
                    />
                </svg>
                
                <div className="absolute inset-0 flex items-center justify-center p-6">
                     <EditableLabel id={id} data={data} isShape />
                </div>

                <CustomHandle type="source" position={Position.Top} id="top" selected={selected} isConnectable={isConnectable} />
                <CustomHandle type="source" position={Position.Left} id="left" selected={selected} isConnectable={isConnectable} />
                <CustomHandle type="source" position={Position.Right} id="right" selected={selected} isConnectable={isConnectable} />
                <CustomHandle type="source" position={Position.Bottom} id="bottom" selected={selected} isConnectable={isConnectable} />
            </div>
        </ShapeNodeWrapper>
    )
});

export const ParallelogramNode = memo(({ id, data, selected, isConnectable }: NodeProps<NodeData>) => {
    return (
        <ShapeNodeWrapper selected={selected}>
             <div className={`relative w-full h-full group transition-all duration-300 ${selected ? 'drop-shadow-md hover:drop-shadow-lg' : 'drop-shadow-sm hover:drop-shadow-md hover:scale-[1.02]'}`}>
                <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ overflow: 'visible', position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}>
                    <polygon 
                        points="20,0 100,0 80,100 0,100" 
                        fill={data.backgroundColor} 
                        stroke={data.borderColor} 
                        strokeWidth={data.borderWidth}
                        vectorEffect="non-scaling-stroke"
                        strokeLinejoin="round"
                    />
                </svg>
                
                <div className="absolute inset-0 flex items-center justify-center px-6 py-2">
                     <EditableLabel id={id} data={data} isShape />
                </div>

                <CustomHandle type="source" position={Position.Top} id="top" selected={selected} isConnectable={isConnectable} />
                <CustomHandle type="source" position={Position.Left} id="left" selected={selected} isConnectable={isConnectable} />
                <CustomHandle type="source" position={Position.Right} id="right" selected={selected} isConnectable={isConnectable} />
                <CustomHandle type="source" position={Position.Bottom} id="bottom" selected={selected} isConnectable={isConnectable} />
            </div>
        </ShapeNodeWrapper>
    )
});

export const HexagonNode = memo(({ id, data, selected, isConnectable }: NodeProps<NodeData>) => {
    return (
        <ShapeNodeWrapper selected={selected}>
             <div className={`relative w-full h-full group transition-all duration-300 ${selected ? 'drop-shadow-md hover:drop-shadow-lg' : 'drop-shadow-sm hover:drop-shadow-md hover:scale-[1.02]'}`}>
                <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ overflow: 'visible', position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}>
                    <polygon 
                        points="25,0 75,0 100,50 75,100 25,100 0,50" 
                        fill={data.backgroundColor} 
                        stroke={data.borderColor} 
                        strokeWidth={data.borderWidth}
                        vectorEffect="non-scaling-stroke"
                        strokeLinejoin="round"
                    />
                </svg>
                
                <div className="absolute inset-0 flex items-center justify-center px-6 py-2">
                     <EditableLabel id={id} data={data} isShape />
                </div>

                <CustomHandle type="source" position={Position.Top} id="top" selected={selected} isConnectable={isConnectable} />
                <CustomHandle type="source" position={Position.Left} id="left" selected={selected} isConnectable={isConnectable} />
                <CustomHandle type="source" position={Position.Right} id="right" selected={selected} isConnectable={isConnectable} />
                <CustomHandle type="source" position={Position.Bottom} id="bottom" selected={selected} isConnectable={isConnectable} />
            </div>
        </ShapeNodeWrapper>
    )
});

export const CylinderNode = memo(({ id, data, selected, isConnectable }: NodeProps<NodeData>) => {
    return (
        <ShapeNodeWrapper selected={selected}>
             <div className={`relative w-full h-full group transition-all duration-300 ${selected ? 'drop-shadow-md hover:drop-shadow-lg' : 'drop-shadow-sm hover:drop-shadow-md hover:scale-[1.02]'}`}>
                <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ overflow: 'visible', position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}>
                    {/* Top Ellipse */}
                    <path 
                         d="M0,20 v60 a50,20 0 0 0 100,0 v-60 a50,20 0 0 0 -100,0 z"
                         fill={data.backgroundColor} 
                         stroke={data.borderColor} 
                         strokeWidth={data.borderWidth}
                         vectorEffect="non-scaling-stroke"
                    />
                    <path 
                         d="M0,20 a50,20 0 0 0 100,0 a50,20 0 0 0 -100,0"
                         fill={data.backgroundColor} 
                         stroke={data.borderColor} 
                         strokeWidth={data.borderWidth}
                         vectorEffect="non-scaling-stroke"
                    />
                </svg>
                
                <div className="absolute inset-0 flex items-center justify-center px-4 py-6">
                     <EditableLabel id={id} data={data} isShape />
                </div>

                <CustomHandle type="source" position={Position.Top} id="top" selected={selected} isConnectable={isConnectable} />
                <CustomHandle type="source" position={Position.Left} id="left" selected={selected} isConnectable={isConnectable} />
                <CustomHandle type="source" position={Position.Right} id="right" selected={selected} isConnectable={isConnectable} />
                <CustomHandle type="source" position={Position.Bottom} id="bottom" selected={selected} isConnectable={isConnectable} />
            </div>
        </ShapeNodeWrapper>
    )
});

export const CloudNode = memo(({ id, data, selected, isConnectable }: NodeProps<NodeData>) => {
    return (
        <ShapeNodeWrapper selected={selected}>
             <div className={`relative w-full h-full group transition-all duration-300 ${selected ? 'drop-shadow-md hover:drop-shadow-lg' : 'drop-shadow-sm hover:drop-shadow-md hover:scale-[1.02]'}`}>
                <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ overflow: 'visible', position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}>
                    <path 
                        d="M25,60 a20,20 0 0,1 0,-40 a20,20 0 0,1 25,-10 a25,25 0 0,1 45,10 a20,20 0 0,1 5,35 a20,20 0 0,1 -15,15 h-60 a20,20 0 0,1 -0,-10 z"
                        fill={data.backgroundColor} 
                        stroke={data.borderColor} 
                        strokeWidth={data.borderWidth}
                        vectorEffect="non-scaling-stroke"
                        strokeLinejoin="round"
                    />
                </svg>
                
                <div className="absolute inset-0 flex items-center justify-center p-4">
                     <EditableLabel id={id} data={data} isShape />
                </div>

                <CustomHandle type="source" position={Position.Top} id="top" selected={selected} isConnectable={isConnectable} />
                <CustomHandle type="source" position={Position.Left} id="left" selected={selected} isConnectable={isConnectable} />
                <CustomHandle type="source" position={Position.Right} id="right" selected={selected} isConnectable={isConnectable} />
                <CustomHandle type="source" position={Position.Bottom} id="bottom" selected={selected} isConnectable={isConnectable} />
            </div>
        </ShapeNodeWrapper>
    )
});

export const DocumentNode = memo(({ id, data, selected, isConnectable }: NodeProps<NodeData>) => {
    return (
        <ShapeNodeWrapper selected={selected}>
             <div className={`relative w-full h-full group transition-all duration-300 ${selected ? 'drop-shadow-md hover:drop-shadow-lg' : 'drop-shadow-sm hover:drop-shadow-md hover:scale-[1.02]'}`}>
                <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ overflow: 'visible', position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}>
                     <path 
                        d="M10,0 h80 v85 q-20,15 -40,0 t-40,0 Z"
                        fill={data.backgroundColor} 
                        stroke={data.borderColor} 
                        strokeWidth={data.borderWidth}
                        vectorEffect="non-scaling-stroke"
                        strokeLinejoin="round"
                    />
                </svg>
                
                <div className="absolute inset-0 flex items-center justify-center p-4 pb-8">
                     <EditableLabel id={id} data={data} isShape />
                </div>

                <CustomHandle type="source" position={Position.Top} id="top" selected={selected} isConnectable={isConnectable} />
                <CustomHandle type="source" position={Position.Left} id="left" selected={selected} isConnectable={isConnectable} />
                <CustomHandle type="source" position={Position.Right} id="right" selected={selected} isConnectable={isConnectable} />
                <CustomHandle type="source" position={Position.Bottom} id="bottom" selected={selected} isConnectable={isConnectable} />
            </div>
        </ShapeNodeWrapper>
    )
});
