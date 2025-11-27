import React, { memo, useRef } from 'react';
import { NodeProps, Position } from 'reactflow';
import { NodeData } from '../../types';
import { CustomHandle, ShapeNodeWrapper } from './BaseNode';
import { useStore } from '../../store';
import { Image as ImageIcon, Video as VideoIcon, Upload } from 'lucide-react';

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

    // Default to 'contain' if not specified
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
                    // "nopan" class is essential to allow interaction with video controls without panning the canvas
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