import React, { memo, useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Handle, Position, NodeProps, NodeResizer, useReactFlow } from 'reactflow';
import { NodeData, MindMapItem, LayoutDirection } from '../../types';
import { AlignLeft, AlignRight, ArrowDown, Split, Trash2, Plus, Type, Palette } from 'lucide-react';
import { useStore } from '../../store'; // Import store

// Custom Handle Component with Robust Hit Area and Priority Z-Index
const CustomHandle = ({ position, type = "source", id, selected, isConnectable, style }: any) => {
    // Ensure connectable defaults to true if undefined
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

const ShapeNodeWrapper = ({ 
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
const EditableLabel = ({ id, data, isShape, isGroup }: { id: string, data: NodeData, isShape?: boolean, isGroup?: boolean }) => {
    // Use store setNodes
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


export const RectangleNode = memo(({ id, data, selected, isConnectable }: NodeProps<NodeData>) => {
  return (
    <ShapeNodeWrapper selected={selected}>
      <div className={`relative w-full h-full group ${selected ? 'drop-shadow-sm' : ''}`}>
        <svg width="100%" height="100%" style={{ overflow: 'visible', position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}>
            <rect
                x="0"
                y="0"
                width="100%"
                height="100%"
                rx="8" 
                ry="8"
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
      <div className={`relative w-full h-full group ${selected ? 'drop-shadow-sm' : ''}`}>
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
            <div className={`relative w-full h-full group ${selected ? 'drop-shadow-sm' : ''}`}>
                 <CustomHandle type="source" position={Position.Top} id="top" selected={selected} isConnectable={isConnectable} />
                <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ overflow: 'visible', position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}>
                    <path 
                        d="M50 0 L100 100 L0 100 Z" 
                        fill={data.backgroundColor} 
                        stroke={data.borderColor} 
                        strokeWidth={data.borderWidth}
                        vectorEffect="non-scaling-stroke"
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

export const TextNode = memo(({ id, data, selected, isConnectable }: NodeProps<NodeData>) => {
  return (
    <div
      className={`relative min-w-[50px] flex items-center group ${
         selected ? 'border border-blue-500 border-dashed' : 'border border-transparent'
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

export const GroupNode = memo(({ id, data, selected, isConnectable }: NodeProps<NodeData>) => {
    // Determine visuals based on selection and highlight (drag over) state
    const isHighlighted = data.isHighlight;
    const bgColor = data.backgroundColor && data.backgroundColor !== '#ffffff' ? data.backgroundColor : 'rgba(240, 244, 255, 0.2)';
    const borderColor = isHighlighted ? '#3b82f6' : (data.borderColor && data.borderColor !== '#000000' ? data.borderColor : '#cbd5e1');
    const borderStyle = isHighlighted ? 'solid' : 'dashed';
    const borderWidth = isHighlighted ? 2 : (data.borderWidth || 2);
    
    return (
        <ShapeNodeWrapper selected={selected} minWidth={150} minHeight={150}>
            <div 
                className="relative w-full h-full rounded-lg transition-all duration-200 overflow-visible group"
                style={{
                    backgroundColor: isHighlighted ? 'rgba(59, 130, 246, 0.1)' : bgColor,
                    borderWidth: borderWidth,
                    borderColor: borderColor,
                    borderStyle: borderStyle,
                    boxShadow: isHighlighted ? '0 0 0 4px rgba(59, 130, 246, 0.1)' : 'none'
                }}
            >
                {/* Header / Label Area */}
                <div className="absolute top-0 left-0 right-0 h-8">
                     <EditableLabel id={id} data={data} isShape isGroup />
                </div>

                 {/* Group Handles - Always available for connecting to the group itself */}
                <CustomHandle type="source" position={Position.Top} id="top" selected={selected} isConnectable={isConnectable} />
                <CustomHandle type="source" position={Position.Left} id="left" selected={selected} isConnectable={isConnectable} />
                <CustomHandle type="source" position={Position.Right} id="right" selected={selected} isConnectable={isConnectable} />
                <CustomHandle type="source" position={Position.Bottom} id="bottom" selected={selected} isConnectable={isConnectable} />
            </div>
        </ShapeNodeWrapper>
    );
});

export const StickyNoteNode = memo(({ id, data, selected, isConnectable }: NodeProps<NodeData>) => {
    return (
      <ShapeNodeWrapper selected={selected}>
        <div 
          className={`relative w-full h-full group ${selected ? 'ring-2 ring-blue-500 ring-offset-1' : ''}`}
          style={{
              backgroundColor: data.backgroundColor,
              border: `${data.borderWidth}px solid ${data.borderColor}`,
              // "Floating" shadow effect: deeper and softer than standard
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06), 0 10px 15px -3px rgba(0, 0, 0, 0.1)',
              transition: 'box-shadow 0.2s',
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


// --- Mind Map Node Implementation ---

interface LayoutNode {
    id: string;
    item: MindMapItem;
    x: number;
    y: number;
    width: number;
    height: number;
    color: string;
    style?: MindMapItem['style'];
    parentId?: string;
    parentX?: number;
    parentY?: number;
    parentW?: number;
    parentH?: number;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

// Simplified Flat List Layout Calculation
// Returns a flat list of nodes for rendering, rather than a tree structure
const calculateMindMapLayout = (
    root: MindMapItem, 
    direction: LayoutDirection = 'LR'
): { nodes: LayoutNode[], bounds: { minX: number, maxX: number, minY: number, maxY: number } } => {
    // ... (rest of layout logic remains same)
    
    // NOTE: Copying existing layout logic for brevity as it was not requested to change.
    // Assuming implementation is identical to previous file content for calculateMindMapLayout.
    // I will include the full implementation to be safe since I'm replacing the file.
    
    const nodes: LayoutNode[] = [];
    const hGap = 60;
    const vGap = 12;
    
    const traverse = (item: MindMapItem, depth: number, colorIdx: number): { height: number, width: number } => {
        const labelLength = item.label.length || 5;
        const fontSize = item.style?.fontSize || (depth === 0 ? 16 : 14);
        const charWidth = fontSize * 0.8; 
        const padding = 24;
        const width = Math.max(80, Math.min(300, labelLength * charWidth + padding));
        const height = fontSize * 2.5; 
        
        let childrenHeight = 0;
        
        item.children.forEach((child, i) => {
             const idx = depth === 0 ? i : colorIdx;
             const dim = traverse(child, depth + 1, idx);
             childrenHeight += dim.height + vGap;
        });
        
        if (childrenHeight > 0) childrenHeight -= vGap;
        
        const totalHeight = Math.max(height, childrenHeight);
        (item as any)._dim = { width, height: totalHeight, nodeHeight: height, childrenHeight };
        
        return { width, height: totalHeight };
    };

    const positionHorizontal = (
        item: MindMapItem, 
        x: number, 
        y: number, 
        depth: number, 
        colorIdx: number, 
        dirMultiplier: number,
        parent?: LayoutNode
    ) => {
         const dim = (item as any)._dim;
         const myHeight = dim.nodeHeight || 36;
         const myY = y + (dim.height / 2) - (myHeight / 2);
         
         let finalX = x;
         if (dirMultiplier === 1) { // LR
             finalX = x;
         } else { // RL
             finalX = x - dim.width;
         }
         
         let baseColor = COLORS[colorIdx % COLORS.length];
         if (depth === 0) baseColor = COLORS[0];
         
         const node: LayoutNode = {
             id: item.id,
             item,
             x: finalX,
             y: myY,
             width: dim.width,
             height: myHeight,
             color: baseColor,
             style: item.style,
             parentId: parent?.id,
             parentX: parent?.x,
             parentY: parent?.y,
             parentW: parent?.width,
             parentH: parent?.height
         };
         
         nodes.push(node);
         
         let currentY = y;
         if (dim.childrenHeight < myHeight) {
             currentY += (myHeight - dim.childrenHeight) / 2;
         }
         
         item.children.forEach((child, i) => {
             const childDim = (child as any)._dim;
             const idx = depth === 0 ? i : colorIdx;
             
             let childX = 0;
             if (dirMultiplier === 1) { // LR
                 childX = finalX + dim.width + hGap;
             } else { // RL
                 childX = finalX - hGap;
             }

             positionHorizontal(child, childX, currentY, depth + 1, idx, dirMultiplier, node);
             currentY += childDim.height + vGap;
         });
    };

    if (direction === 'HS') {
        const leftChildren: MindMapItem[] = [];
        const rightChildren: MindMapItem[] = [];
        
        root.children.forEach((child, i) => {
            if (i % 2 !== 0) leftChildren.push(child);
            else rightChildren.push(child);
        });

        const labelLength = root.label.length || 5;
        const rootFontSize = root.style?.fontSize || 16;
        const rootWidth = Math.max(80, Math.min(250, labelLength * (rootFontSize * 0.8) + 30));
        const rootHeight = rootFontSize * 2.5;

        let rightHeight = 0;
        rightChildren.forEach((child, i) => {
            const dim = traverse(child, 1, i * 2);
            rightHeight += dim.height + vGap;
        });
        if (rightHeight > 0) rightHeight -= vGap;

        let leftHeight = 0;
        leftChildren.forEach((child, i) => {
            const dim = traverse(child, 1, i * 2 + 1);
            leftHeight += dim.height + vGap;
        });
        if (leftHeight > 0) leftHeight -= vGap;
        
        const rootY = 0;
        const rootNode: LayoutNode = {
            id: root.id,
            item: root,
            x: 0,
            y: rootY,
            width: rootWidth,
            height: rootHeight,
            color: COLORS[0],
            style: root.style,
        };
        nodes.push(rootNode);

        let currentY = rootY + (rootHeight / 2) - (rightHeight / 2);
        rightChildren.forEach((child, i) => {
             const childDim = (child as any)._dim;
             const startX = rootWidth + hGap;
             positionHorizontal(child, startX, currentY, 1, i * 2, 1, rootNode);
             currentY += childDim.height + vGap;
        });

        currentY = rootY + (rootHeight / 2) - (leftHeight / 2);
        leftChildren.forEach((child, i) => {
             const childDim = (child as any)._dim;
             const startX = -hGap; 
             positionHorizontal(child, startX, currentY, 1, i * 2 + 1, -1, rootNode);
             currentY += childDim.height + vGap;
        });

    } else if (direction === 'TB') {
         const traverseTB = (item: MindMapItem, depth: number, colorIdx: number): { width: number, height: number } => {
            const labelLength = item.label.length || 5;
            const fontSize = item.style?.fontSize || (depth === 0 ? 16 : 14);
            const w = Math.max(80, Math.min(250, labelLength * (fontSize * 0.8) + 30));
            const h = fontSize * 2.5;
            
            let childrenWidth = 0;
            item.children.forEach((child, i) => {
                 const idx = depth === 0 ? i : colorIdx;
                 const dim = traverseTB(child, depth + 1, idx);
                 childrenWidth += dim.width + 40; 
            });
            if (childrenWidth > 0) childrenWidth -= 40;
            
            const totalWidth = Math.max(w, childrenWidth);
            (item as any)._dim = { width: w, height: h, totalWidth, childrenWidth };
            return { width: totalWidth, height: h };
         };

         const positionTB = (item: MindMapItem, x: number, y: number, depth: number, colorIdx: number, parent?: LayoutNode) => {
             const dim = (item as any)._dim;
             const myW = dim.width;
             const myX = x + (dim.totalWidth / 2) - (myW / 2);
             
             const node: LayoutNode = {
                 id: item.id,
                 item,
                 x: myX,
                 y,
                 width: myW,
                 height: dim.height,
                 color: depth === 0 ? COLORS[0] : COLORS[colorIdx % COLORS.length],
                 style: item.style,
                 parentId: parent?.id,
                 parentX: parent?.x,
                 parentY: parent?.y,
                 parentW: parent?.width,
                 parentH: parent?.height
             };
             nodes.push(node);
             
             let currentX = x;
             item.children.forEach((child, i) => {
                 const childDim = (child as any)._dim;
                 const idx = depth === 0 ? i : colorIdx;
                 positionTB(child, currentX, y + dim.height + 60, depth + 1, idx, node);
                 currentX += childDim.totalWidth + 40;
             });
         };
         
         traverseTB(root, 0, 0);
         positionTB(root, 0, 0, 0, 0);

    } else {
        traverse(root, 0, 0);
        const dirMultiplier = direction === 'RL' ? -1 : 1;
        positionHorizontal(root, 0, 0, 0, 0, dirMultiplier);
    }

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    nodes.forEach(n => {
        if (n.x < minX) minX = n.x;
        if (n.x + n.width > maxX) maxX = n.x + n.width;
        if (n.y < minY) minY = n.y;
        if (n.y + n.height > maxY) maxY = n.y + n.height;
    });

    return { nodes, bounds: { minX, maxX, minY, maxY } };
};

export const MindMapNode = memo(({ id, data, selected }: NodeProps<NodeData>) => {
    // Replaced useReactFlow().setNodes with useStore setNodes
    const setNodes = useStore((state) => state.setNodes);
    
    const [activeId, setActiveId] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingText, setEditingText] = useState('');
    const inputRef = useRef<HTMLTextAreaElement>(null);
    
    const rootItem = data.mindMapRoot;
    const direction = rootItem?.layoutDirection || 'LR';

    if (!rootItem) return <div className="p-4 text-red-500">Mind Map Data Missing</div>;

    const { nodes, bounds } = useMemo(() => {
        return calculateMindMapLayout(rootItem, direction);
    }, [rootItem, direction]);

    const findItem = useCallback((itemId: string, current: MindMapItem, parent: MindMapItem | null = null): { item: MindMapItem, parent: MindMapItem | null } | null => {
        if (current.id === itemId) return { item: current, parent };
        for (const child of current.children) {
            const found = findItem(itemId, child, current);
            if (found) return found;
        }
        return null;
    }, []);

    const updateTree = useCallback((fn: (root: MindMapItem) => MindMapItem) => {
        setNodes(nds => nds.map(n => {
            if (n.id === id && n.data.mindMapRoot) {
                const newRoot = fn(JSON.parse(JSON.stringify(n.data.mindMapRoot)));
                return { ...n, data: { ...n.data, mindMapRoot: newRoot } };
            }
            return n;
        }));
    }, [id, setNodes]);

    // ... (Actions and handlers remain largely same, just using the updateTree with store setNodes)

    const changeLayout = (dir: LayoutDirection) => {
        updateTree(root => {
            root.layoutDirection = dir;
            return root;
        });
    };

    const addChild = useCallback(() => {
        if (!activeId) return;
        const newId = `node-${Date.now()}`;
        updateTree(root => {
            const found = findItem(activeId, root);
            if (found) {
                found.item.children.push({ id: newId, label: '新节点', children: [] });
            }
            return root;
        });
        setTimeout(() => {
            setActiveId(newId);
            setEditingId(newId);
            setEditingText('新节点');
        }, 50);
    }, [activeId, findItem, updateTree]);

    const addSibling = useCallback(() => {
        if (!activeId) return;
        const newId = `node-${Date.now()}`;
        updateTree(root => {
            const found = findItem(activeId, root);
            if (found && found.parent) {
                const index = found.parent.children.findIndex(c => c.id === activeId);
                found.parent.children.splice(index + 1, 0, { id: newId, label: '新节点', children: [] });
                setTimeout(() => {
                    setActiveId(newId);
                    setEditingId(newId);
                    setEditingText('新节点');
                }, 50);
            } else if (!found?.parent) {
                 found?.item.children.push({ id: newId, label: '分支', children: [] });
                 setTimeout(() => {
                     setActiveId(newId);
                     setEditingId(newId);
                     setEditingText('分支');
                 }, 50);
            }
            return root;
        });
    }, [activeId, findItem, updateTree]);

    const deleteNode = useCallback(() => {
        if (!activeId) return;
        updateTree(root => {
            if (root.id === activeId) return root; 
            const found = findItem(activeId, root);
            if (found && found.parent) {
                found.parent.children = found.parent.children.filter(c => c.id !== activeId);
                setTimeout(() => setActiveId(found.parent?.id || null), 50);
            }
            return root;
        });
    }, [activeId, findItem, updateTree]);

    const updateNodeStyle = useCallback((styleProp: keyof NonNullable<MindMapItem['style']>, value: any) => {
        if (!activeId) return;
        updateTree(root => {
            const found = findItem(activeId, root);
            if (found) {
                found.item.style = { ...found.item.style, [styleProp]: value };
            }
            return root;
        });
    }, [activeId, findItem, updateTree]);

    const submitEdit = useCallback(() => {
        if (editingId && editingText) {
            updateTree(root => {
                const found = findItem(editingId, root);
                if (found) found.item.label = editingText;
                return root;
            });
        }
        setEditingId(null);
    }, [editingId, editingText, findItem, updateTree]);

    // Keyboard handling
    useEffect(() => {
        if (!selected || editingId) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement;
            if (target.tagName === 'TEXTAREA' || target.tagName === 'INPUT') return;

            if (!activeId) {
                if (['Tab', 'Enter'].includes(e.key)) setActiveId(rootItem.id);
                return;
            }
            
            const getHSDirection = (targetId: string): 'left' | 'right' | 'root' => {
                if (targetId === rootItem.id) return 'root';
                const found = findItem(targetId, rootItem);
                if (!found || !found.parent) return 'root';
                
                let current = found;
                while (current.parent && current.parent.id !== rootItem.id) {
                     const p = findItem(current.parent.id, rootItem);
                     if(p) current = p;
                     else break;
                }
                
                if (current.parent?.id === rootItem.id) {
                    const idx = current.parent.children.findIndex(c => c.id === current.item.id);
                    return idx % 2 === 0 ? 'right' : 'left';
                }
                return 'right'; 
            };


            switch(e.key) {
                case 'Tab':
                    e.preventDefault();
                    addChild();
                    break;
                case 'Enter':
                    e.preventDefault();
                    addSibling();
                    break;
                case 'Backspace':
                case 'Delete':
                    if (activeId !== rootItem.id) {
                         e.preventDefault();
                         deleteNode();
                    }
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    if (direction === 'TB') {
                         const current = findItem(activeId, rootItem);
                         if (current && current.parent) {
                             const idx = current.parent.children.findIndex(c => c.id === activeId);
                             if (current.parent.children[idx + 1]) setActiveId(current.parent.children[idx + 1].id);
                         }
                    } else if (direction === 'HS') {
                        const pos = getHSDirection(activeId);
                        if (pos === 'root') {
                             const rightChild = rootItem.children.find((_, i) => i % 2 === 0);
                             if (rightChild) setActiveId(rightChild.id);
                        } else if (pos === 'right') {
                            const found = findItem(activeId, rootItem);
                            if(found && found.item.children.length > 0) setActiveId(found.item.children[0].id);
                        } else { 
                            const found = findItem(activeId, rootItem);
                            if(found && found.parent) setActiveId(found.parent.id);
                        }
                    } else if (direction === 'LR') {
                         const found = findItem(activeId, rootItem);
                         if(found && found.item.children.length > 0) setActiveId(found.item.children[0].id);
                    } else { 
                         const foundLeft = findItem(activeId, rootItem);
                         if(foundLeft && foundLeft.parent) setActiveId(foundLeft.parent.id);
                    }
                    break;
                case 'ArrowLeft':
                     e.preventDefault();
                     if (direction === 'TB') {
                         const current = findItem(activeId, rootItem);
                         if (current && current.parent) {
                             const idx = current.parent.children.findIndex(c => c.id === activeId);
                             if (current.parent.children[idx - 1]) setActiveId(current.parent.children[idx - 1].id);
                         }
                    } else if (direction === 'HS') {
                        const pos = getHSDirection(activeId);
                        if (pos === 'root') {
                             const leftChild = rootItem.children.find((_, i) => i % 2 !== 0);
                             if (leftChild) setActiveId(leftChild.id);
                        } else if (pos === 'left') {
                            const found = findItem(activeId, rootItem);
                            if(found && found.item.children.length > 0) setActiveId(found.item.children[0].id);
                        } else { 
                            const found = findItem(activeId, rootItem);
                            if(found && found.parent) setActiveId(found.parent.id);
                        }
                    } else if (direction === 'RL') {
                        const found = findItem(activeId, rootItem);
                        if(found && found.item.children.length > 0) setActiveId(found.item.children[0].id);
                    } else { 
                        const foundLeft = findItem(activeId, rootItem);
                        if(foundLeft && foundLeft.parent) setActiveId(foundLeft.parent.id);
                    }
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    if (direction === 'TB') {
                        const found = findItem(activeId, rootItem);
                        if(found && found.item.children.length > 0) setActiveId(found.item.children[0].id);
                    } else if (direction === 'HS') {
                         const current = findItem(activeId, rootItem);
                         if (current && current.parent) {
                             const siblings = current.parent.children;
                             const myIdx = siblings.findIndex(c => c.id === activeId);
                             
                             if (current.parent.id === rootItem.id) {
                                 if (siblings[myIdx + 2]) setActiveId(siblings[myIdx + 2].id);
                             } else {
                                 if (siblings[myIdx + 1]) setActiveId(siblings[myIdx + 1].id);
                             }
                         }
                    } else {
                        const current = findItem(activeId, rootItem);
                        if (current && current.parent) {
                            const idx = current.parent.children.findIndex(c => c.id === activeId);
                            if (current.parent.children[idx + 1]) setActiveId(current.parent.children[idx + 1].id);
                        }
                    }
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    if (direction === 'TB') {
                        const found = findItem(activeId, rootItem);
                         if(found && found.parent) setActiveId(found.parent.id);
                    } else if (direction === 'HS') {
                         const current = findItem(activeId, rootItem);
                         if (current && current.parent) {
                             const siblings = current.parent.children;
                             const myIdx = siblings.findIndex(c => c.id === activeId);
                             
                             if (current.parent.id === rootItem.id) {
                                 if (siblings[myIdx - 2]) setActiveId(siblings[myIdx - 2].id);
                             } else {
                                 if (siblings[myIdx - 1]) setActiveId(siblings[myIdx - 1].id);
                             }
                         }
                    } else {
                        const current = findItem(activeId, rootItem);
                        if (current && current.parent) {
                            const idx = current.parent.children.findIndex(c => c.id === activeId);
                            if (current.parent.children[idx - 1]) setActiveId(current.parent.children[idx - 1].id);
                        }
                    }
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selected, activeId, rootItem, addChild, addSibling, deleteNode, findItem, editingId, direction]);

    // Auto Focus Input
    useEffect(() => {
        if (editingId && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [editingId]);

    const padding = 50;
    const totalWidth = (bounds.maxX - bounds.minX) + (padding * 2);
    const totalHeight = (bounds.maxY - bounds.minY) + (padding * 2);
    const offsetX = -bounds.minX + padding;
    const offsetY = -bounds.minY + padding;

    const activeLayoutNode = useMemo(() => nodes.find(n => n.id === activeId), [nodes, activeId]);

    // Render (same as before)
    return (
        <ShapeNodeWrapper selected={selected} noResizer>
             <div 
                className={`relative group ${selected ? 'drop-shadow-sm' : ''} transition-all duration-300`} 
                style={{ width: totalWidth, height: totalHeight }}
                onClick={(e) => {
                    if(e.target === e.currentTarget) setActiveId(null);
                }}
             >
                 {selected && !activeId && (
                     <div className="absolute -top-12 left-0 bg-white shadow-md border border-gray-100 rounded flex overflow-hidden z-50">
                         <button 
                            onClick={(e) => { e.stopPropagation(); changeLayout('LR'); }}
                            className={`p-2 hover:bg-gray-100 ${direction === 'LR' ? 'bg-blue-50 text-blue-600' : 'text-gray-600'}`}
                            title="向右分布"
                        >
                            <AlignLeft size={16} />
                         </button>
                         <button 
                            onClick={(e) => { e.stopPropagation(); changeLayout('RL'); }}
                            className={`p-2 hover:bg-gray-100 ${direction === 'RL' ? 'bg-blue-50 text-blue-600' : 'text-gray-600'}`}
                            title="向左分布"
                        >
                             <AlignRight size={16} />
                         </button>
                         <button 
                            onClick={(e) => { e.stopPropagation(); changeLayout('HS'); }}
                            className={`p-2 hover:bg-gray-100 ${direction === 'HS' ? 'bg-blue-50 text-blue-600' : 'text-gray-600'}`}
                            title="左右分布"
                        >
                             <Split size={16} />
                         </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); changeLayout('TB'); }}
                            className={`p-2 hover:bg-gray-100 ${direction === 'TB' ? 'bg-blue-50 text-blue-600' : 'text-gray-600'}`}
                            title="向下分布"
                        >
                             <ArrowDown size={16} />
                         </button>
                     </div>
                 )}

                 {activeLayoutNode && selected && (
                     <div 
                        className="absolute z-50 bg-white shadow-lg border border-gray-200 rounded-lg p-1 flex items-center gap-2 animate-in fade-in zoom-in-95 duration-200"
                        style={{
                            left: activeLayoutNode.x + offsetX + (activeLayoutNode.width / 2),
                            top: activeLayoutNode.y + offsetY - 45, 
                            transform: 'translateX(-50%)'
                        }}
                        onClick={(e) => e.stopPropagation()}
                     >
                        <div className="flex items-center gap-1 border-r border-gray-100 pr-2">
                             <div className="relative w-5 h-5 rounded-full overflow-hidden border border-gray-200 cursor-pointer hover:scale-110 transition-transform">
                                <input 
                                    type="color" 
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    title="背景颜色"
                                    value={activeLayoutNode.style?.backgroundColor || '#ffffff'}
                                    onChange={(e) => updateNodeStyle('backgroundColor', e.target.value)}
                                />
                                <div className="w-full h-full" style={{ backgroundColor: activeLayoutNode.style?.backgroundColor || '#ffffff' }} />
                             </div>
                             
                             <div className="relative w-5 h-5 flex items-center justify-center cursor-pointer hover:text-blue-600">
                                 <span className="font-bold text-xs" style={{ color: activeLayoutNode.style?.textColor || '#000000' }}>A</span>
                                 <input 
                                    type="color" 
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    title="文字颜色"
                                    value={activeLayoutNode.style?.textColor || '#000000'}
                                    onChange={(e) => updateNodeStyle('textColor', e.target.value)}
                                />
                             </div>
                        </div>

                         <div className="flex items-center gap-1 border-r border-gray-100 pr-2">
                             <button 
                                onClick={() => {
                                    const currentSize = activeLayoutNode.style?.fontSize || 14;
                                    updateNodeStyle('fontSize', Math.max(10, currentSize - 2));
                                }}
                                className="p-1 hover:bg-gray-100 rounded text-gray-600"
                                title="减小字号"
                             >
                                 <span className="text-xs">A-</span>
                             </button>
                             <span className="text-xs w-4 text-center">{activeLayoutNode.style?.fontSize || 14}</span>
                             <button 
                                onClick={() => {
                                    const currentSize = activeLayoutNode.style?.fontSize || 14;
                                    updateNodeStyle('fontSize', Math.min(36, currentSize + 2));
                                }}
                                className="p-1 hover:bg-gray-100 rounded text-gray-600"
                                title="增大字号"
                             >
                                 <span className="text-xs">A+</span>
                             </button>
                         </div>

                         {activeId !== rootItem.id && (
                             <button 
                                onClick={() => deleteNode()}
                                className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors"
                                title="删除节点"
                             >
                                 <Trash2 size={14} />
                             </button>
                         )}
                     </div>
                 )}

                 <svg width="100%" height="100%" style={{ overflow: 'visible', position: 'absolute', pointerEvents: 'none' }}>
                     <g transform={`translate(${offsetX}, ${offsetY})`}>
                        {nodes.map(node => {
                            if (!node.parentId) return null;
                            const isRoot = node.parentId === rootItem.id;
                            
                            let startX = 0, startY = 0, endX = 0, endY = 0;
                            
                            let useVertical = false;
                            let useLeft = false;
                            
                            if (direction === 'TB') {
                                useVertical = true;
                            } else if (direction === 'HS') {
                                if (node.x < node.parentX!) useLeft = true;
                            } else if (direction === 'RL') {
                                useLeft = true;
                            }

                            if (useVertical) {
                                startX = (node.parentX || 0) + (node.parentW || 0) / 2;
                                startY = (node.parentY || 0) + (node.parentH || 0);
                                endX = node.x + node.width / 2;
                                endY = node.y;
                            } else if (useLeft) {
                                startX = (node.parentX || 0);
                                startY = (node.parentY || 0) + (node.parentH || 0) / 2;
                                endX = node.x + node.width;
                                endY = node.y + node.height / 2;
                            } else {
                                startX = (node.parentX || 0) + (node.parentW || 0);
                                startY = (node.parentY || 0) + (node.parentH || 0) / 2;
                                endX = node.x;
                                endY = node.y + node.height / 2;
                            }

                            let d = '';
                            if (useVertical) {
                                const c1y = startY + (endY - startY) / 2;
                                d = `M ${startX} ${startY} C ${startX} ${c1y}, ${endX} ${c1y}, ${endX} ${endY}`;
                            } else {
                                const c1x = startX + (endX - startX) / 2;
                                d = `M ${startX} ${startY} C ${c1x} ${startY}, ${c1x} ${endY}, ${endX} ${endY}`;
                            }
                            
                            return (
                                <path 
                                    key={`path-${node.id}`}
                                    d={d}
                                    stroke={node.color}
                                    strokeWidth={isRoot ? 3 : 2}
                                    fill="none"
                                />
                            )
                        })}
                     </g>
                 </svg>
                 
                 {nodes.map(node => {
                     const isActive = activeId === node.id;
                     const isRoot = node.id === rootItem.id;
                     const isEditing = editingId === node.id;
                     
                     const backgroundColor = node.style?.backgroundColor || (isRoot ? '#3b82f6' : '#ffffff');
                     const textColor = node.style?.textColor || (isRoot ? '#ffffff' : '#000000');
                     const borderColor = node.style?.borderColor || node.color;
                     const fontSize = node.style?.fontSize || (isRoot ? 16 : 14);

                     const absX = node.x + offsetX;
                     const absY = node.y + offsetY;

                     return (
                        <div
                            key={node.id}
                            className="absolute"
                            style={{ 
                                left: absX, 
                                top: absY, 
                                width: node.width, 
                                height: node.height 
                            }}
                        >
                            <div 
                                className={`
                                    w-full h-full flex items-center justify-center rounded-full transition-all duration-200 cursor-pointer
                                    ${isActive ? 'ring-2 ring-offset-2 ring-blue-400' : ''}
                                    ${isRoot ? 'shadow-md' : 'shadow-sm'}
                                `}
                                style={{
                                    backgroundColor: backgroundColor,
                                    borderColor: borderColor,
                                    borderWidth: isRoot ? 0 : 2,
                                    borderStyle: 'solid',
                                    color: textColor,
                                    fontWeight: isRoot ? 'bold' : 'normal',
                                    fontSize: fontSize
                                }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveId(node.id);
                                }}
                                onDoubleClick={(e) => {
                                    e.stopPropagation();
                                    setEditingId(node.id);
                                    setEditingText(node.item.label);
                                }}
                            >
                                {isEditing ? (
                                    <textarea 
                                        ref={inputRef}
                                        value={editingText}
                                        onChange={(e) => setEditingText(e.target.value)}
                                        onBlur={submitEdit}
                                        onKeyDown={(e) => {
                                            e.stopPropagation();
                                            if(e.key === 'Enter') {
                                                e.preventDefault();
                                                submitEdit();
                                            }
                                        }}
                                        className="w-full h-full bg-transparent text-center resize-none outline-none overflow-hidden px-2 py-1 rounded-full nodrag"
                                        style={{ color: textColor, fontSize: fontSize }}
                                    />
                                ) : (
                                    <span className="truncate w-full text-center select-none px-2">{node.item.label}</span>
                                )}
                            </div>

                            <Handle 
                                id={`handle-top-${node.id}`} 
                                type="source" 
                                position={Position.Top} 
                                className="w-2 h-2 opacity-0 group-hover:opacity-100 bg-blue-400" 
                                style={{ zIndex: 50, top: -2 }}
                            />
                            <Handle 
                                id={`handle-bottom-${node.id}`} 
                                type="source" 
                                position={Position.Bottom} 
                                className="w-2 h-2 opacity-0 group-hover:opacity-100 bg-blue-400" 
                                style={{ zIndex: 50, bottom: -2 }}
                            />
                            <Handle 
                                id={`handle-left-${node.id}`} 
                                type="source" 
                                position={Position.Left} 
                                className="w-2 h-2 opacity-0 group-hover:opacity-100 bg-blue-400" 
                                style={{ zIndex: 50, left: -2 }}
                            />
                            <Handle 
                                id={`handle-right-${node.id}`} 
                                type="source" 
                                position={Position.Right} 
                                className="w-2 h-2 opacity-0 group-hover:opacity-100 bg-blue-400" 
                                style={{ zIndex: 50, right: -2 }}
                            />
                        </div>
                     )
                 })}

                <CustomHandle type="target" position={Position.Left} id="main-left" selected={selected} />
                <CustomHandle type="source" position={Position.Right} id="main-right" selected={selected} />
             </div>
             
             {selected && (
                 <div className="absolute -bottom-12 left-0 right-0 text-center text-[10px] text-gray-400 pointer-events-none select-none">
                     Tab: 添加子节点 | Enter: 添加同级 | Del: 删除 | 双击编辑 | 拖拽连接点连线
                 </div>
             )}
        </ShapeNodeWrapper>
    );
});