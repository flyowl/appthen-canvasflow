import React, { useState, useRef, useEffect } from 'react';
import { Handle, Position, NodeResizer } from 'reactflow';
import { useStore } from '../../store';
import { NodeData } from '../../types';

// Custom Handle Component with Robust Hit Area and Priority Z-Index
export const CustomHandle = ({ position, type = "source", id, selected, isConnectable, style }: any) => {
    const connectable = isConnectable !== undefined ? isConnectable : true;

    return (
        <Handle
            type={type}
            position={position}
            id={id}
            isConnectable={connectable}
            style={{
                ...style,
                width: 12,  
                height: 12, 
                background: 'transparent',
                border: 'none',
                zIndex: 2000, 
            }}
            className="!bg-transparent flex items-center justify-center group/handle"
        >
            <div className={`
                w-2.5 h-2.5 bg-white border-2 border-blue-500 rounded-full
                transition-all duration-200 
                pointer-events-none
                ${selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
                group-hover/handle:scale-125 group-hover/handle:bg-blue-600
            `} />
        </Handle>
    );
};

interface ShapeNodeWrapperProps {
  children?: React.ReactNode;
  selected?: boolean;
  minWidth?: number;
  minHeight?: number;
  noResizer?: boolean;
}

export const ShapeNodeWrapper = ({ 
  children, 
  selected, 
  minWidth = 50, 
  minHeight = 50,
  noResizer = false
}: ShapeNodeWrapperProps) => {
    return (
        <>
            {!noResizer && (
                <NodeResizer 
                    color="#3b82f6" 
                    isVisible={!!selected} 
                    minWidth={minWidth} 
                    minHeight={minHeight}
                />
            )}
            {children}
        </>
    )
}

// Editable Label Component
export const EditableLabel = ({ id, data, isShape, isGroup }: { id: string, data: NodeData, isShape?: boolean, isGroup?: boolean }) => {
    const setNodes = useStore((state) => state.setNodes);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [localValue, setLocalValue] = useState(data.label || '');

    useEffect(() => {
        setLocalValue(data.label || '');
    }, [data.label]);

    useEffect(() => {
        if (data.isEditing && textareaRef.current) {
            textareaRef.current.focus();
            textareaRef.current.select();
        }
    }, [data.isEditing]);

    // Auto-resize textarea for text nodes (not shapes)
    useEffect(() => {
        if (!isShape && data.isEditing && textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
        }
    }, [localValue, data.isEditing, isShape]);

    const handleBlur = () => {
        setNodes((nds) => nds.map((n) => {
            if (n.id === id) {
                return { ...n, data: { ...n.data, label: localValue, isEditing: false } };
            }
            return n;
        }));
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            handleBlur();
        }
        e.stopPropagation(); 
    };

    const getJustifyContent = () => {
        if (isGroup) return 'flex-start'; // Groups always left align title by default
        switch (data.align) {
            case 'left': return 'flex-start';
            case 'right': return 'flex-end';
            case 'center': default: return 'center';
        }
    };

    const getAlignItems = () => {
        if (isGroup) return 'flex-start'; // Groups always top align title by default
        switch (data.verticalAlign) {
            case 'top': return 'flex-start';
            case 'bottom': return 'flex-end';
            case 'center': default: return 'center';
        }
    };
    
    // Group styling adjustments
    const padding = isGroup ? '8px 12px' : (isShape ? '16px' : '4px');
    const baseClass = isShape ? "absolute inset-0 w-full h-full" : "relative w-full";
    const textClasses = isGroup 
        ? "text-xs font-semibold text-gray-500 uppercase tracking-wide bg-transparent" 
        : "break-words select-none whitespace-pre-wrap";

    if (data.isEditing) {
        return (
            <div 
                className={`${baseClass} pointer-events-auto flex flex-col`} 
                style={{ 
                    padding,
                    justifyContent: getAlignItems(), 
                }}
            >
                <textarea
                    ref={textareaRef}
                    value={localValue}
                    onChange={(e) => setLocalValue(e.target.value)}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    autoFocus
                    spellCheck={false}
                    className="w-full bg-transparent resize-none outline-none overflow-hidden"
                    style={{
                        color: data.textColor,
                        fontSize: isGroup ? 12 : data.fontSize,
                        textAlign: isGroup ? 'left' : (data.align || 'center'),
                        fontWeight: isGroup ? 600 : 400,
                        lineHeight: 1.2,
                        height: isShape ? '100%' : 'auto', 
                        minHeight: '1.2em'
                    }}
                />
            </div>
        );
    }

    return (
        <div 
            className={`${baseClass} flex pointer-events-none`}
            style={{ 
                justifyContent: getJustifyContent(), 
                alignItems: getAlignItems(), 
                padding 
            }}
        >
            <div 
                className={textClasses}
                style={{ 
                    color: data.textColor, 
                    fontSize: isGroup ? 12 : data.fontSize,
                    textAlign: isGroup ? 'left' : (data.align || 'center'),
                    maxWidth: '100%',
                    maxHeight: '100%',
                    overflow: 'visible',
                    lineHeight: 1.2
                }}
            >
                {data.label}
            </div>
        </div>
    );
};
