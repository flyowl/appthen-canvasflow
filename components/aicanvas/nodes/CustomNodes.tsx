import React, { memo, useRef } from 'react';
import { NodeProps, Position } from 'reactflow';
import { NodeData, ToolType } from '../types';
import { useStore } from '../store';
import { CustomHandle, EditableLabel, ShapeNodeWrapper } from './BaseNode';
import { Image as ImageIcon, Video as VideoIcon, Upload } from 'lucide-react';

export * from './BaseNode';
export * from './MindMapNode';
export * from './CustomAgentNode';
export * from './MarkdownNode';

// --- ShapeNodes ---

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

// --- TextNode ---

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

// --- DrawingNode ---

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

// --- GroupNode ---

export const GroupNode = memo(({ id, data, selected, isConnectable }: NodeProps<NodeData>) => {
    return (
        <ShapeNodeWrapper selected={selected} minWidth={100} minHeight={100} noResizer={!selected}>
            <div 
                className={`w-full h-full transition-all duration-200 ${selected ? 'ring-1 ring-blue-500 ring-dashed' : ''}`}
                style={{
                    backgroundColor: 'transparent',
                    pointerEvents: 'none' 
                }}
            >
                <CustomHandle type="source" position={Position.Top} id="top" selected={selected} isConnectable={isConnectable} />
                <CustomHandle type="source" position={Position.Left} id="left" selected={selected} isConnectable={isConnectable} />
                <CustomHandle type="source" position={Position.Right} id="right" selected={selected} isConnectable={isConnectable} />
                <CustomHandle type="source" position={Position.Bottom} id="bottom" selected={selected} isConnectable={isConnectable} />
            </div>
        </ShapeNodeWrapper>
    );
});

// --- SectionNode ---

export const SectionNode = memo(({ id, data, selected, isConnectable }: NodeProps<NodeData>) => {
    const isHighlighted = data.isHighlight;
    const isActive = isHighlighted || selected;

    return (
        <ShapeNodeWrapper selected={selected} minWidth={200} minHeight={200}>
            <div 
                className={`relative w-full h-full transition-all duration-200 rounded-lg flex flex-col overflow-hidden
                    ${isActive ? 'ring-2 ring-blue-500 ring-offset-1' : 'border border-gray-200'}
                `}
                style={{
                    backgroundColor: data.backgroundColor || 'rgba(241, 245, 249, 0.5)', 
                    boxShadow: isHighlighted ? 'inset 0 0 0 2px #3b82f6, 0 4px 6px -1px rgba(0,0,0,0.1)' : 'none',
                }}
            >
                <div 
                    className="h-8 w-full bg-slate-100/80 border-b border-gray-200 flex items-center px-2 select-none backdrop-blur-sm"
                    style={{ pointerEvents: 'auto' }}
                >
                     <EditableLabel id={id} data={data} isShape isGroup />
                </div>

                <div className="flex-1 w-full" style={{ pointerEvents: 'auto' }} />

                <CustomHandle type="source" position={Position.Top} id="top" selected={selected} isConnectable={isConnectable} />
                <CustomHandle type="source" position={Position.Left} id="left" selected={selected} isConnectable={isConnectable} />
                <CustomHandle type="source" position={Position.Right} id="right" selected={selected} isConnectable={isConnectable} />
                <CustomHandle type="source" position={Position.Bottom} id="bottom" selected={selected} isConnectable={isConnectable} />
            </div>
        </ShapeNodeWrapper>
    );
});

// --- StickyNoteNode ---

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

// --- MediaNodes ---

export const ImageNode = memo(({ id, data, selected, isConnectable }: NodeProps<NodeData>) => {
    const setNodes = useStore(s => s.setNodes);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const src = event.target?.result as string;
                setNodes(nds => nds.map(n => n.id === id ? { ...n, data: { ...n.data, src } } : n));
            };
            reader.readAsDataURL(file);
        }
    }

    const objectFit = data.objectFit || 'contain';

    return (
        <ShapeNodeWrapper selected={selected} minWidth={100} minHeight={100}>
             <div className={`relative w-full h-full group bg-white ${selected ? 'ring-1 ring-blue-500' : ''} rounded-lg overflow-hidden flex flex-col shadow-sm border border-gray-200`}>
                {data.src ? (
                    <img 
                        src={data.src} 
                        alt="Node" 
                        className="w-full h-full pointer-events-none select-none" 
                        style={{ objectFit }}
                        draggable={false}
                    />
                ) : (
                    <div 
                        className="w-full h-full flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 cursor-pointer text-gray-400 hover:text-gray-600 transition-colors p-4"
                        onClick={() => inputRef.current?.click()}
                        title="点击上传图片"
                    >
                        <ImageIcon size={24} className="mb-2" />
                        <span className="text-xs font-medium text-center">上传图片</span>
                        <input type="file" ref={inputRef} className="hidden" accept="image/*" onChange={handleUpload} />
                    </div>
                )}
                
                <CustomHandle type="source" position={Position.Top} id="top" selected={selected} isConnectable={isConnectable} />
                <CustomHandle type="source" position={Position.Right} id="right" selected={selected} isConnectable={isConnectable} />
                <CustomHandle type="source" position={Position.Bottom} id="bottom" selected={selected} isConnectable={isConnectable} />
                <CustomHandle type="source" position={Position.Left} id="left" selected={selected} isConnectable={isConnectable} />
            </div>
        </ShapeNodeWrapper>
    );
});

export const VideoNode = memo(({ id, data, selected, isConnectable }: NodeProps<NodeData>) => {
    const setNodes = useStore(s => s.setNodes);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const src = event.target?.result as string;
                setNodes(nds => nds.map(n => n.id === id ? { ...n, data: { ...n.data, src } } : n));
            };
            reader.readAsDataURL(file);
        }
    }

    return (
        <ShapeNodeWrapper selected={selected} minWidth={150} minHeight={100}>
             <div className={`relative w-full h-full group bg-black ${selected ? 'ring-1 ring-blue-500' : ''} rounded-lg overflow-hidden flex flex-col shadow-sm border border-gray-800`}>
                {data.src ? (
                    <video 
                        src={data.src} 
                        controls 
                        className="w-full h-full object-contain nopan"
                    />
                ) : (
                    <div 
                        className="w-full h-full flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 cursor-pointer text-gray-400 hover:text-gray-600 transition-colors p-4"
                        onClick={() => inputRef.current?.click()}
                        title="点击上传视频"
                    >
                        <VideoIcon size={24} className="mb-2" />
                        <span className="text-xs font-medium text-center">上传视频</span>
                        <input type="file" ref={inputRef} className="hidden" accept="video/*" onChange={handleUpload} />
                    </div>
                )}
                
                <CustomHandle type="source" position={Position.Top} id="top" selected={selected} isConnectable={isConnectable} />
                <CustomHandle type="source" position={Position.Right} id="right" selected={selected} isConnectable={isConnectable} />
                <CustomHandle type="source" position={Position.Bottom} id="bottom" selected={selected} isConnectable={isConnectable} />
                <CustomHandle type="source" position={Position.Left} id="left" selected={selected} isConnectable={isConnectable} />
            </div>
        </ShapeNodeWrapper>
    );
});