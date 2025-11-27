import React, { memo } from 'react';
import { NodeProps, Position } from 'reactflow';
import { NodeData } from '../../types';
import { CustomHandle, EditableLabel, ShapeNodeWrapper } from './BaseNode';

export const GroupNode = memo(({ id, data, selected, isConnectable }: NodeProps<NodeData>) => {
    const isHighlighted = data.isHighlight;
    const isActive = isHighlighted || selected;

    // Default to transparent if no specific background is set
    const bgColor = data.backgroundColor || 'transparent';
    const isTransparent = bgColor === 'transparent' || bgColor === 'rgba(0,0,0,0)';
    
    // Logic for Group Appearance:
    // 1. If actively selected or highlighted (drag over), show blue dashed border.
    // 2. If it is a "Partition" (has bg color), show it.
    // 3. If it's a "Group" (transparent wrapper), show NOTHING (no border) unless selected.
    
    let borderWidth = data.borderWidth ?? 0;
    let borderColor = data.borderColor || 'transparent';
    let borderStyle = 'solid';
    
    if (isActive) {
        borderWidth = 2;
        borderColor = '#3b82f6'; // Blue 500
        borderStyle = 'dashed';
    } else {
        // Enforce transparent border if it's not selected and user didn't explicitly set a color (or set it to transparent)
        if (borderColor === 'transparent' || !data.borderColor) {
             borderWidth = 0;
             borderColor = 'transparent';
        }
    }

    const effectiveBgColor = isActive && isTransparent 
        ? 'rgba(59, 130, 246, 0.05)' 
        : bgColor;

    return (
        <ShapeNodeWrapper selected={selected} minWidth={150} minHeight={150}>
            <div 
                className="relative w-full h-full transition-all duration-200 overflow-visible group"
                style={{
                    backgroundColor: effectiveBgColor,
                    borderWidth: borderWidth,
                    borderColor: borderColor,
                    borderStyle: borderStyle,
                    borderRadius: data.borderRadius ?? 8,
                    // "Inner padding" request: Added padding to the container. 
                    // Note: This won't shift absolute positioned children (standard behavior in this app), 
                    // but it affects the visual box model and background rendering.
                    padding: '12px',
                    // Only allow pointer events on the container if it has a background (Partition) or is selected, 
                    // otherwise let clicks pass through to children (for Logical Groups)
                    pointerEvents: isTransparent && !selected ? 'none' : 'auto',
                    // Explicitly remove potential default browser outlines or shadows when not active
                    boxShadow: isActive ? undefined : 'none',
                    outline: 'none'
                }}
            >
                {/* Header / Label Area - Only render if there is a non-empty label. 
                    Logical groups usually have empty labels. */}
                {data.label && (
                    <div className="absolute top-0 left-0 right-0 h-8 pointer-events-auto">
                         <EditableLabel id={id} data={data} isShape isGroup />
                    </div>
                )}

                 {/* Group Handles - Always available for connecting to the group itself */}
                <CustomHandle type="source" position={Position.Top} id="top" selected={selected} isConnectable={isConnectable} />
                <CustomHandle type="source" position={Position.Left} id="left" selected={selected} isConnectable={isConnectable} />
                <CustomHandle type="source" position={Position.Right} id="right" selected={selected} isConnectable={isConnectable} />
                <CustomHandle type="source" position={Position.Bottom} id="bottom" selected={selected} isConnectable={isConnectable} />
            </div>
        </ShapeNodeWrapper>
    );
});