import React, { useEffect, useState, useRef } from 'react';
import { useReactFlow, MarkerType, Node } from 'reactflow';
import { useStore } from './store';
import { 
    X, Type as TypeIcon, Palette, BringToFront, SendToBack,
    AlignLeft, AlignCenter, AlignRight, AlignVerticalJustifyStart, AlignVerticalJustifyCenter, AlignVerticalJustifyEnd,
    AlignHorizontalDistributeCenter, AlignVerticalDistributeCenter,
    Spline, MoveDiagonal, CornerDownRight, ArrowRight, ArrowLeft, Minus, MoreHorizontal, Cable, Activity, Trash2,
    LayoutTemplate, Image as ImageIcon, Video as VideoIcon, Upload,
    Maximize, Crop, Scan, StretchHorizontal, Expand
} from 'lucide-react';
import { ToolType } from './types';

const PRESET_COLORS = [
  '#ffffff', '#000000', '#94a3b8', '#ef4444', '#f97316', 
  '#f59e0b', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899'
];

interface ColorPickerProps {
    label: string;
    value: string;
    onChange: (val: string) => void;
    hasTransparent?: boolean;
}

const ColorPicker: React.FC<ColorPickerProps> = ({ label, value, onChange, hasTransparent }) => {
    const [isOpen, setIsOpen] = useState(false);
    
    // Normalize value for the native color input
    const displayValue = (value === 'transparent' || !value) ? '#ffffff' : value;

    return (
        <div className="relative">
            <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs text-gray-500 font-medium">{label}</label>
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-md border border-gray-200 hover:bg-gray-50 transition-all bg-white min-w-[80px]"
                >
                     <div 
                        className="w-4 h-4 rounded-full border border-gray-200 shadow-sm relative overflow-hidden"
                        style={{ backgroundColor: value === 'transparent' ? 'transparent' : value }}
                     >
                        {value === 'transparent' && (
                             <div className="absolute inset-0 bg-red-400/80 w-[1px] h-[200%] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-45 transform origin-center" />
                        )}
                     </div>
                     <span className="text-[10px] text-gray-600 font-mono uppercase truncate flex-1 text-left">{value === 'transparent' ? '无填充' : value}</span>
                </button>
            </div>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-[60]" onClick={() => setIsOpen(false)} />
                    <div className="absolute right-0 top-8 z-[70] bg-white p-3 rounded-lg shadow-xl border border-gray-200 w-56 animate-in fade-in zoom-in-95 duration-200">
                        <div className="text-[10px] font-bold text-gray-400 mb-2 uppercase flex items-center justify-between">
                             <span>快速设置</span>
                             <span className="text-[9px] bg-gray-100 px-1 rounded text-gray-500">Presets</span>
                        </div>
                        <div className="flex flex-wrap gap-2 mb-3">
                            {hasTransparent && (
                                <button
                                    onClick={() => { onChange('transparent'); setIsOpen(false); }}
                                    className={`w-6 h-6 rounded-full border border-gray-200 relative overflow-hidden transition-transform hover:scale-110 ${value === 'transparent' ? 'ring-2 ring-blue-500 ring-offset-1' : ''}`}
                                    title="无/透明"
                                >
                                   <div className="absolute inset-0 bg-red-400/80 w-[1px] h-[200%] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-45 transform origin-center" />
                                </button>
                            )}
                            {PRESET_COLORS.map(color => (
                                <button
                                    key={color}
                                    onClick={() => { onChange(color); setIsOpen(false); }}
                                    className={`w-6 h-6 rounded-full border border-gray-200 transition-transform hover:scale-110 ${value === color ? 'ring-2 ring-blue-500 ring-offset-1' : ''}`}
                                    style={{ backgroundColor: color }}
                                    title={color}
                                />
                            ))}
                        </div>

                        <div className="h-px bg-gray-100 my-2" />

                        <div className="text-[10px] font-bold text-gray-400 mb-2 uppercase">自定义颜色</div>
                        <div className="flex items-center gap-2">
                             <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-gray-200 shadow-sm cursor-pointer hover:opacity-90">
                                 <input
                                    type="color"
                                    value={displayValue}
                                    onChange={(e) => onChange(e.target.value)}
                                    className="absolute inset-0 w-[150%] h-[150%] -top-1/4 -left-1/4 cursor-pointer p-0 border-0"
                                />
                             </div>
                             <div className="flex-1 relative">
                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">#</span>
                                <input 
                                    type="text"
                                    value={value === 'transparent' ? '' : value.replace('#', '')}
                                    onChange={(e) => onChange(`#${e.target.value}`)}
                                    className="w-full pl-5 pr-2 py-1.5 text-xs border border-gray-200 rounded focus:ring-2 focus:ring-blue-500 outline-none font-mono uppercase"
                                    placeholder="HEX"
                                />
                             </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

const PropertiesPanel: React.FC = () => {
  const { selectedNodes, selectedEdges, setNodes, setEdges, takeSnapshot } = useStore();
  const { getNodes, getEdges } = useReactFlow();
  
  const [activeNode, setActiveNode] = useState<any>(null);
  const [activeEdge, setActiveEdge] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (selectedNodes.length === 1) {
      const node = getNodes().find((n) => n.id === selectedNodes[0]);
      setActiveNode(node);
      setActiveEdge(null);
    } else if (selectedNodes.length === 0 && selectedEdges.length === 1) {
      const edge = getEdges().find((e) => e.id === selectedEdges[0]);
      setActiveEdge(edge);
      setActiveNode(null);
    } else {
      setActiveNode(null);
      setActiveEdge(null);
    }
  }, [selectedNodes, selectedEdges, getNodes, getEdges]);

  // Helper to get node dimensions safely
  const getNodeSize = (node: any) => {
    const width = node.width ?? node.style?.width ?? node.data?.width ?? (node.type === 'TEXT' ? 100 : 150);
    const height = node.height ?? node.style?.height ?? node.data?.height ?? (node.type === 'TEXT' ? 30 : 50);
    return { width: Number(width), height: Number(height) };
  };

  const calculateRelativePosition = (node: Node, targetAbsX: number, targetAbsY: number, allNodes: Node[]) => {
    if (!node.parentNode) return { x: targetAbsX, y: targetAbsY };
    const parent = allNodes.find(n => n.id === node.parentNode);
    if (!parent || !parent.positionAbsolute) return { x: targetAbsX, y: targetAbsY };
    return {
        x: targetAbsX - parent.positionAbsolute.x,
        y: targetAbsY - parent.positionAbsolute.y
    };
  };

  const alignNodes = (type: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => {
      const allNodes = getNodes();
      const selected = allNodes.filter(n => selectedNodes.includes(n.id));
      if (selected.length < 2) return;
      takeSnapshot();

      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      
      selected.forEach(n => {
          const { width, height } = getNodeSize(n);
          // Use absolute position for robust alignment
          const x = n.positionAbsolute?.x ?? n.position.x;
          const y = n.positionAbsolute?.y ?? n.position.y;
          
          if (x < minX) minX = x;
          if (x + width > maxX) maxX = x + width;
          if (y < minY) minY = y;
          if (y + height > maxY) maxY = y + height;
      });
      
      const centerX = (minX + maxX) / 2;
      const centerY = (minY + maxY) / 2;

      setNodes(nds => nds.map(n => {
          if (!selectedNodes.includes(n.id)) return n;
          const { width, height } = getNodeSize(n);
          // Current Absolute
          const currentAbsX = n.positionAbsolute?.x ?? n.position.x;
          const currentAbsY = n.positionAbsolute?.y ?? n.position.y;
          
          let targetAbsX = currentAbsX;
          let targetAbsY = currentAbsY;

          switch(type) {
              case 'left': targetAbsX = minX; break;
              case 'center': targetAbsX = centerX - (width / 2); break;
              case 'right': targetAbsX = maxX - width; break;
              case 'top': targetAbsY = minY; break;
              case 'middle': targetAbsY = centerY - (height / 2); break;
              case 'bottom': targetAbsY = maxY - height; break;
          }
          
          const newPos = calculateRelativePosition(n, targetAbsX, targetAbsY, allNodes);
          return { ...n, position: newPos };
      }));
  };

  const distributeNodes = (type: 'horizontal' | 'vertical') => {
       const allNodes = getNodes();
       const selected = allNodes.filter(n => selectedNodes.includes(n.id));
       if (selected.length < 3) return;
       
       takeSnapshot();
       
       const sorted = [...selected].sort((a, b) => {
           const ax = a.positionAbsolute?.x ?? a.position.x;
           const bx = b.positionAbsolute?.x ?? b.position.x;
           const ay = a.positionAbsolute?.y ?? a.position.y;
           const by = b.positionAbsolute?.y ?? b.position.y;
           return type === 'horizontal' ? ax - bx : ay - by;
       });

       const first = sorted[0];
       const last = sorted[sorted.length - 1];
       const firstAbsPos = { x: first.positionAbsolute?.x ?? first.position.x, y: first.positionAbsolute?.y ?? first.position.y };
       const lastAbsPos = { x: last.positionAbsolute?.x ?? last.position.x, y: last.positionAbsolute?.y ?? last.position.y };
       const lastSize = getNodeSize(last);

       const updates = new Map();

       if (type === 'horizontal') {
           const startEdge = firstAbsPos.x;
           const endEdge = lastAbsPos.x + lastSize.width;
           const totalNodeWidths = sorted.reduce((acc, n) => acc + getNodeSize(n).width, 0);
           const totalGapSpace = (endEdge - startEdge) - totalNodeWidths;
           const gap = totalGapSpace / (sorted.length - 1);
           
           let currentX = startEdge;
           sorted.forEach((n) => {
               updates.set(n.id, currentX);
               currentX += getNodeSize(n).width + gap;
           });
           
           setNodes(nds => nds.map(n => {
               if(updates.has(n.id)) {
                   const targetX = updates.get(n.id);
                   const currentAbsY = n.positionAbsolute?.y ?? n.position.y;
                   const newPos = calculateRelativePosition(n, targetX, currentAbsY, allNodes);
                   return { ...n, position: newPos };
               }
               return n;
           }));

       } else {
           const startEdge = firstAbsPos.y;
           const endEdge = lastAbsPos.y + lastSize.height;
           const totalNodeHeights = sorted.reduce((acc, n) => acc + getNodeSize(n).height, 0);
           const totalGapSpace = (endEdge - startEdge) - totalNodeHeights;
           const gap = totalGapSpace / (sorted.length - 1);
           
           let currentY = startEdge;
           sorted.forEach((n) => {
               updates.set(n.id, currentY);
               currentY += getNodeSize(n).height + gap;
           });
           
           setNodes(nds => nds.map(n => {
               if(updates.has(n.id)) {
                   const targetY = updates.get(n.id);
                   const currentAbsX = n.positionAbsolute?.x ?? n.position.x;
                   const newPos = calculateRelativePosition(n, currentAbsX, targetY, allNodes);
                   return { ...n, position: newPos };
               }
               return n;
           }));
       }
  }

  // Node Updater
  const updateNodeData = (key: string, value: any) => {
    if (!activeNode) return;

    setNodes((nodes) =>
      nodes.map((n) => {
        if (n.id === activeNode.id) {
            const newData = { ...n.data, [key]: value };
            return { ...n, data: newData };
        }
        return n;
      })
    );
    
    setActiveNode((prev: any) => ({
        ...prev,
        data: { ...prev.data, [key]: value }
    }));
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
      if (!activeNode || !event.target.files?.[0]) return;
      const file = event.target.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
          const result = e.target?.result;
          if (typeof result === 'string') {
              updateNodeData('src', result);
          }
      };
      reader.readAsDataURL(file);
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Logic to reset image size to original dimensions
  const handleResetImageSize = () => {
    if (!activeNode || !activeNode.data.src) return;
    takeSnapshot();
    const img = new Image();
    img.onload = () => {
        setNodes((nodes) =>
          nodes.map((n) => {
            if (n.id === activeNode.id) {
                return { 
                    ...n, 
                    width: img.naturalWidth, 
                    height: img.naturalHeight,
                    style: { ...n.style, width: img.naturalWidth, height: img.naturalHeight }
                };
            }
            return n;
          })
        );
        // Refresh active node state to reflect new size
        setActiveNode((prev: any) => ({
            ...prev,
            width: img.naturalWidth,
            height: img.naturalHeight,
            style: { ...prev.style, width: img.naturalWidth, height: img.naturalHeight }
        }));
    };
    img.src = activeNode.data.src;
  };

  // Fullscreen logic
  const handleFullscreen = () => {
      if (!activeNode || !activeNode.data.src) return;
      // Find image element in DOM.
      // Since we don't have direct ref, we create a temporary overlay
      const overlay = document.createElement('div');
      overlay.style.position = 'fixed';
      overlay.style.top = '0';
      overlay.style.left = '0';
      overlay.style.width = '100vw';
      overlay.style.height = '100vh';
      overlay.style.backgroundColor = 'rgba(0,0,0,0.9)';
      overlay.style.zIndex = '99999';
      overlay.style.display = 'flex';
      overlay.style.alignItems = 'center';
      overlay.style.justifyContent = 'center';
      overlay.style.cursor = 'zoom-out';
      
      const img = document.createElement('img');
      img.src = activeNode.data.src;
      img.style.maxWidth = '95%';
      img.style.maxHeight = '95%';
      img.style.objectFit = 'contain';
      
      overlay.appendChild(img);
      
      overlay.onclick = () => {
          document.body.removeChild(overlay);
      };
      
      document.body.appendChild(overlay);
  };

  // Edge Updater
  const updateEdgeData = (key: string, value: any) => {
      if(!activeEdge) return;

      setEdges((edges) => edges.map(e => {
          if (e.id === activeEdge.id) {
              let newEdge = { ...e };
              
              if (key === 'type') {
                  newEdge.type = value;
              } else if (key === 'label') {
                  newEdge.label = value;
              } else if (key === 'stroke') {
                  newEdge.style = { ...newEdge.style, stroke: value };
                  // Update marker colors to match line
                  if (newEdge.markerStart && typeof newEdge.markerStart === 'object') {
                       newEdge.markerStart = { ...newEdge.markerStart, color: value };
                  }
                  if (newEdge.markerEnd && typeof newEdge.markerEnd === 'object') {
                       newEdge.markerEnd = { ...newEdge.markerEnd, color: value };
                  }
              } else if (key === 'strokeWidth') {
                  newEdge.style = { ...newEdge.style, strokeWidth: value };
              } else if (key === 'dashed') {
                   newEdge.style = { ...newEdge.style, strokeDasharray: value ? '5 5' : undefined };
              } else if (key === 'markerStart') {
                  newEdge.markerStart = value ? { type: MarkerType.ArrowClosed, color: newEdge.style?.stroke || '#000000' } : undefined;
              } else if (key === 'markerEnd') {
                  newEdge.markerEnd = value ? { type: MarkerType.ArrowClosed, color: newEdge.style?.stroke || '#000000' } : undefined;
              } else if (key === 'animated') {
                  newEdge.animated = value;
              }

              // Logic for "back and forth" effect:
              const hasMarkerStart = (key === 'markerStart' ? value : newEdge.markerStart);
              const hasMarkerEnd = (key === 'markerEnd' ? value : newEdge.markerEnd);
              const isAnimated = (key === 'animated' ? value : newEdge.animated);

              if (isAnimated) {
                  if (hasMarkerStart && hasMarkerEnd) {
                      newEdge.style = { ...newEdge.style, animation: 'dashdraw 0.5s linear infinite alternate' };
                  } else {
                      newEdge.style = { ...newEdge.style, animation: 'dashdraw 0.5s linear infinite' };
                  }
              } else {
                  if (newEdge.style?.animation) {
                      const { animation, ...restStyle } = newEdge.style;
                      newEdge.style = restStyle;
                  }
              }

              setActiveEdge(newEdge);
              return newEdge;
          }
          return e;
      }));
  }

  const deleteSelected = () => {
    takeSnapshot();
    if (selectedNodes.length > 0) {
        setNodes((nodes) => nodes.filter(n => !selectedNodes.includes(n.id)));
        setActiveNode(null);
    }
    if (activeEdge) {
        setEdges((edges) => edges.filter(e => e.id !== activeEdge.id));
        setActiveEdge(null);
    }
  }

  const bringToFront = () => {
      takeSnapshot();
      if (activeNode) {
          setNodes((nodes) => {
              const others = nodes.filter(n => n.id !== activeNode.id);
              return [...others, activeNode];
          });
      } else if (activeEdge) {
          setEdges((edges) => {
              const others = edges.filter(e => e.id !== activeEdge.id);
              return [...others, activeEdge];
          });
      }
  };

  const sendToBack = () => {
      takeSnapshot();
      if (activeNode) {
          setNodes((nodes) => {
              const others = nodes.filter(n => n.id !== activeNode.id);
              return [activeNode, ...others];
          });
      } else if (activeEdge) {
          setEdges((edges) => {
              const others = edges.filter(e => e.id !== activeEdge.id);
              return [activeEdge, ...others];
          });
      }
  };

  // --- MULTI SELECTION RENDERER ---
  if (selectedNodes.length > 1) {
    return (
        <div className="absolute top-20 right-4 w-72 bg-white rounded-lg shadow-xl border border-gray-200 p-4 z-50 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-800 flex items-center gap-2 text-sm">
                    <LayoutTemplate size={16} className="text-blue-500" />
                    多选 ({selectedNodes.length})
                </h3>
                 <button 
                    onClick={deleteSelected}
                    className="p-1 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded transition-colors"
                >
                    <Trash2 size={14} />
                </button>
            </div>

            <div className="space-y-4">
                 <div className="space-y-2">
                     <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                        对齐方式
                     </label>
                     <div className="grid grid-cols-6 gap-1 bg-gray-50 p-1.5 rounded-lg border border-gray-100">
                        <button onClick={() => alignNodes('left')} className="p-1.5 rounded hover:bg-white hover:shadow-sm hover:text-blue-600 text-gray-500 transition-all" title="左对齐">
                            <AlignLeft size={16} />
                        </button>
                        <button onClick={() => alignNodes('center')} className="p-1.5 rounded hover:bg-white hover:shadow-sm hover:text-blue-600 text-gray-500 transition-all" title="水平居中">
                             <AlignCenter size={16} className="rotate-90" />
                        </button>
                        <button onClick={() => alignNodes('right')} className="p-1.5 rounded hover:bg-white hover:shadow-sm hover:text-blue-600 text-gray-500 transition-all" title="右对齐">
                            <AlignRight size={16} />
                        </button>
                        <div className="w-px bg-gray-200 mx-0.5" />
                        <button onClick={() => alignNodes('top')} className="p-1.5 rounded hover:bg-white hover:shadow-sm hover:text-blue-600 text-gray-500 transition-all" title="顶对齐">
                            <AlignVerticalJustifyStart size={16} />
                        </button>
                        <button onClick={() => alignNodes('middle')} className="p-1.5 rounded hover:bg-white hover:shadow-sm hover:text-blue-600 text-gray-500 transition-all" title="垂直居中">
                             <AlignVerticalJustifyCenter size={16} />
                        </button>
                        <button onClick={() => alignNodes('bottom')} className="p-1.5 rounded hover:bg-white hover:shadow-sm hover:text-blue-600 text-gray-500 transition-all" title="底对齐">
                            <AlignVerticalJustifyEnd size={16} />
                        </button>
                     </div>
                 </div>

                 <div className="space-y-2">
                     <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                        分布
                     </label>
                     <div className="flex gap-2">
                        <button 
                            onClick={() => distributeNodes('horizontal')}
                            className="flex-1 flex items-center justify-center gap-2 p-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded text-xs text-gray-600 transition-colors"
                            title="水平均分"
                        >
                            <AlignHorizontalDistributeCenter size={16} />
                            水平均分
                        </button>
                        <button 
                            onClick={() => distributeNodes('vertical')}
                            className="flex-1 flex items-center justify-center gap-2 p-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded text-xs text-gray-600 transition-colors"
                            title="垂直均分"
                        >
                            <AlignVerticalDistributeCenter size={16} />
                            垂直均分
                        </button>
                     </div>
                 </div>
            </div>
        </div>
    );
  }

  if (!activeNode && !activeEdge) {
    return null;
  }

  // --- NODE PROPERTY RENDERER ---
  if (activeNode) {
    // Special handling for GROUP: No properties shown as requested
    if (activeNode.type === ToolType.GROUP) {
        return null;
    }

    const getTypeLabel = (type: string) => {
        switch(type) {
            case 'RECTANGLE': return '矩形';
            case 'CIRCLE': return '圆形';
            case 'TRIANGLE': return '三角形';
            case 'DIAMOND': return '菱形';
            case 'PARALLELOGRAM': return '平行四边形';
            case 'HEXAGON': return '六边形';
            case 'CYLINDER': return '圆柱体';
            case 'CLOUD': return '云';
            case 'DOCUMENT': return '文档';
            case 'TEXT': return '文本';
            case 'PEN': return '手绘';
            case 'GROUP': return '组合';
            case 'SECTION': return '分区';
            case 'STICKY_NOTE': return '便签';
            case 'IMAGE': return '图片';
            case 'VIDEO': return '视频';
            default: return type;
        }
    }

    const supportsBorderRadius = [ToolType.RECTANGLE, ToolType.SECTION, ToolType.STICKY_NOTE].includes(activeNode.type);
    const isMedia = [ToolType.IMAGE, ToolType.VIDEO].includes(activeNode.type);
    const isImage = activeNode.type === ToolType.IMAGE;
    const isVideo = activeNode.type === ToolType.VIDEO;
    const isSection = activeNode.type === ToolType.SECTION;

    return (
        <div className="absolute top-20 right-4 w-72 bg-white rounded-lg shadow-xl border border-gray-200 p-4 z-50 max-h-[calc(100vh-8rem)] overflow-y-auto custom-scrollbar">
        <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2 text-sm">
            <Palette size={16} className="text-blue-500" />
            属性
            </h3>
            <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold text-gray-500 font-mono bg-gray-100 px-2 py-0.5 rounded">
                {getTypeLabel(activeNode.type)}
                </span>
                <button 
                    onClick={deleteSelected}
                    className="p-1 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded transition-colors"
                >
                    <Trash2 size={14} />
                </button>
            </div>
        </div>

        <div className="space-y-6">
            
            {/* Layer Actions */}
            <div className="flex gap-2">
                <button 
                    onClick={bringToFront}
                    className="flex-1 flex items-center justify-center gap-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded p-2 text-xs text-gray-700 transition-colors"
                >
                    <BringToFront size={14} /> 置顶
                </button>
                <button 
                    onClick={sendToBack}
                    className="flex-1 flex items-center justify-center gap-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded p-2 text-xs text-gray-700 transition-colors"
                >
                    <SendToBack size={14} /> 置底
                </button>
            </div>

            {/* Media Source Section */}
            {isMedia && (
                <div className="space-y-3">
                     <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                        {isVideo ? <VideoIcon size={12} /> : <ImageIcon size={12} />} 
                        {isVideo ? '视频源' : '图片源'}
                    </label>
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full flex items-center justify-center gap-2 p-2 bg-white border border-dashed border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors text-sm"
                    >
                        <Upload size={14} />
                        更换{isVideo ? '视频' : '图片'}
                    </button>
                    <input 
                        ref={fileInputRef}
                        type="file" 
                        accept={isVideo ? "video/*" : "image/*"}
                        className="hidden" 
                        onChange={handleFileUpload}
                    />
                </div>
            )}
            
            {/* Image Specific Controls */}
            {isImage && (
                <div className="space-y-3">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                        <ImageIcon size={12} /> 图片显示
                    </label>
                    
                    {/* Size and Fullscreen Actions */}
                    <div className="flex gap-2">
                         <button 
                            onClick={handleResetImageSize}
                            className="flex-1 flex items-center justify-center gap-1 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded p-1.5 text-xs text-gray-600 transition-colors"
                            title="重置为原始尺寸 (100%)"
                        >
                            <Maximize size={12} /> 原始尺寸
                        </button>
                        <button 
                            onClick={handleFullscreen}
                            className="flex-1 flex items-center justify-center gap-1 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded p-1.5 text-xs text-gray-600 transition-colors"
                            title="全屏查看"
                        >
                            <Expand size={12} /> 全屏查看
                        </button>
                    </div>

                    {/* Object Fit Controls */}
                    <div className="grid grid-cols-3 gap-1 bg-gray-50 p-1 rounded-lg border border-gray-200">
                        <button 
                            onClick={() => updateNodeData('objectFit', 'contain')}
                            className={`flex flex-col items-center justify-center gap-1 py-1.5 rounded transition-all ${(!activeNode.data.objectFit || activeNode.data.objectFit === 'contain') ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                            title="完整显示 (Contain)"
                        >
                            <Scan size={14} />
                            <span className="text-[10px] scale-90">完整</span>
                        </button>
                        <button 
                            onClick={() => updateNodeData('objectFit', 'cover')}
                            className={`flex flex-col items-center justify-center gap-1 py-1.5 rounded transition-all ${activeNode.data.objectFit === 'cover' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                            title="裁剪填充 (Cover)"
                        >
                            <Crop size={14} />
                            <span className="text-[10px] scale-90">裁剪</span>
                        </button>
                        <button 
                            onClick={() => updateNodeData('objectFit', 'fill')}
                            className={`flex flex-col items-center justify-center gap-1 py-1.5 rounded transition-all ${activeNode.data.objectFit === 'fill' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                            title="拉伸填充 (Fill)"
                        >
                            <StretchHorizontal size={14} />
                            <span className="text-[10px] scale-90">拉伸</span>
                        </button>
                    </div>
                </div>
            )}

            {/* Content Section */}
            {activeNode.type !== 'PEN' && !isMedia && (
                <div className="space-y-3">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                    <TypeIcon size={12} /> 内容
                </label>
                <div>
                    <input
                    type="text"
                    value={activeNode.data.label || ''}
                    onChange={(e) => updateNodeData('label', e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    placeholder="输入文本..."
                    />
                </div>
                </div>
            )}

            {/* Typography Section */}
            {activeNode.type !== 'PEN' && !isMedia && (
                <div className="space-y-4">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                        <TypeIcon size={12} /> 字体与排版
                    </label>
                    
                    <ColorPicker 
                        label="颜色" 
                        value={activeNode.data.textColor || '#000000'} 
                        onChange={(val) => updateNodeData('textColor', val)} 
                    />

                    <div>
                        <label className="block text-xs text-gray-500 mb-1.5 font-medium">大小 ({activeNode.data.fontSize}px)</label>
                        <input
                            type="number"
                            value={activeNode.data.fontSize || 16}
                            onChange={(e) => updateNodeData('fontSize', parseInt(e.target.value))}
                            className="w-full px-2 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                    
                    {/* Alignment Controls */}
                    <div>
                        <label className="block text-xs text-gray-500 mb-1.5 font-medium">对齐方式</label>
                        <div className="flex items-center justify-between gap-1 bg-gray-50 p-1 rounded-lg border border-gray-200">
                            <div className="flex gap-1 border-r border-gray-200 pr-1 mr-1">
                                <button 
                                    onClick={() => updateNodeData('align', 'left')}
                                    className={`p-1.5 rounded ${activeNode.data.align === 'left' ? 'bg-white shadow text-blue-500' : 'text-gray-500 hover:text-gray-700'}`}
                                    title="左对齐"
                                >
                                    <AlignLeft size={14} />
                                </button>
                                <button 
                                    onClick={() => updateNodeData('align', 'center')}
                                    className={`p-1.5 rounded ${(activeNode.data.align === 'center' || !activeNode.data.align) ? 'bg-white shadow text-blue-500' : 'text-gray-500 hover:text-gray-700'}`}
                                    title="水平居中"
                                >
                                    <AlignCenter size={14} />
                                </button>
                                <button 
                                    onClick={() => updateNodeData('align', 'right')}
                                    className={`p-1.5 rounded ${activeNode.data.align === 'right' ? 'bg-white shadow text-blue-500' : 'text-gray-500 hover:text-gray-700'}`}
                                    title="右对齐"
                                >
                                    <AlignRight size={14} />
                                </button>
                            </div>
                            
                            <div className="flex gap-1">
                                <button 
                                    onClick={() => updateNodeData('verticalAlign', 'top')}
                                    className={`p-1.5 rounded ${activeNode.data.verticalAlign === 'top' ? 'bg-white shadow text-blue-500' : 'text-gray-500 hover:text-gray-700'}`}
                                    title="顶对齐"
                                >
                                    <AlignVerticalJustifyStart size={14} />
                                </button>
                                <button 
                                    onClick={() => updateNodeData('verticalAlign', 'center')}
                                    className={`p-1.5 rounded ${(activeNode.data.verticalAlign === 'center' || !activeNode.data.verticalAlign) ? 'bg-white shadow text-blue-500' : 'text-gray-500 hover:text-gray-700'}`}
                                    title="垂直居中"
                                >
                                    <AlignVerticalJustifyCenter size={14} />
                                </button>
                                <button 
                                    onClick={() => updateNodeData('verticalAlign', 'bottom')}
                                    className={`p-1.5 rounded ${activeNode.data.verticalAlign === 'bottom' ? 'bg-white shadow text-blue-500' : 'text-gray-500 hover:text-gray-700'}`}
                                    title="底对齐"
                                >
                                    <AlignVerticalJustifyEnd size={14} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Appearance Section */}
            <div className="space-y-4">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                    <Palette size={12} /> 外观
                </label>
                
                {activeNode.type !== 'PEN' && !isMedia && (
                    <ColorPicker 
                        label="填充" 
                        value={activeNode.data.backgroundColor || '#ffffff'} 
                        onChange={(val) => updateNodeData('backgroundColor', val)} 
                        hasTransparent
                    />
                )}
                
                {/* Media can have borders */}
                {/* Partitions generally don't use border controls in this view, relying on defaults, but we allow if needed */}
                <ColorPicker 
                    label="描边" 
                    value={activeNode.data.borderColor || '#000000'} 
                    onChange={(val) => updateNodeData('borderColor', val)} 
                    hasTransparent
                />

                <div>
                    <div className="flex justify-between items-center mb-1.5">
                        <label className="text-xs text-gray-500 font-medium">线宽</label>
                        <span className="text-[10px] text-gray-400 bg-gray-50 px-1.5 rounded">{activeNode.data.borderWidth !== undefined ? activeNode.data.borderWidth : 0}px</span>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="20"
                        value={activeNode.data.borderWidth !== undefined ? activeNode.data.borderWidth : 0}
                        onChange={(e) => updateNodeData('borderWidth', parseInt(e.target.value))}
                        className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                </div>

                {supportsBorderRadius && (
                    <div>
                        <div className="flex justify-between items-center mb-1.5">
                            <label className="text-xs text-gray-500 font-medium">圆角</label>
                            <span className="text-[10px] text-gray-400 bg-gray-50 px-1.5 rounded">{activeNode.data.borderRadius ?? 0}px</span>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={activeNode.data.borderRadius ?? 0}
                            onChange={(e) => updateNodeData('borderRadius', parseInt(e.target.value))}
                            className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
                        />
                    </div>
                )}
            </div>

        </div>
        </div>
    );
  }

  // --- EDGE PROPERTY RENDERER ---
  if (activeEdge) {
      const edgeStyle = activeEdge.style || {};
      const edgeType = activeEdge.type || 'default';
      
      return (
        <div className="absolute top-20 right-4 w-72 bg-white rounded-lg shadow-xl border border-gray-200 p-4 z-50 max-h-[calc(100vh-8rem)] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-800 flex items-center gap-2 text-sm">
                <Cable size={16} className="text-blue-500" />
                连接线配置
                </h3>
                 <button 
                    onClick={deleteSelected}
                    className="p-1 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded transition-colors"
                >
                    <Trash2 size={14} />
                </button>
            </div>

            <div className="space-y-6">
                 {/* Layer Actions */}
                 <div className="flex gap-2">
                    <button 
                        onClick={bringToFront}
                        className="flex-1 flex items-center justify-center gap-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded p-2 text-xs text-gray-700 transition-colors"
                    >
                        <BringToFront size={14} /> 置顶
                    </button>
                    <button 
                        onClick={sendToBack}
                        className="flex-1 flex items-center justify-center gap-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded p-2 text-xs text-gray-700 transition-colors"
                    >
                        <SendToBack size={14} /> 置底
                    </button>
                </div>

                 {/* Text Label */}
                 <div className="space-y-3">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                        文本内容
                    </label>
                    <div>
                        <input
                        type="text"
                        value={activeEdge.label || ''}
                        onChange={(e) => updateEdgeData('label', e.target.value)}
                        className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                        placeholder="输入连接线文字..."
                        />
                    </div>
                 </div>

                 {/* Line Type */}
                 <div className="space-y-3">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                        线条形状 (默认: 曲线)
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                         <button 
                             onClick={() => updateEdgeData('type', 'default')}
                             className={`flex flex-col items-center justify-center p-3 rounded border transition-all ${edgeType === 'default' || edgeType === 'simplebezier' ? 'bg-blue-50 border-blue-500 text-blue-600' : 'bg-gray-50 border-gray-200 hover:bg-gray-100 text-gray-600'}`}
                             title="曲线 (Default)"
                        >
                            <Spline size={20} className="mb-1" />
                            <span className="text-xs">曲线</span>
                        </button>
                        <button 
                            onClick={() => updateEdgeData('type', 'smoothstep')}
                            className={`flex flex-col items-center justify-center p-3 rounded border transition-all ${edgeType === 'smoothstep' || edgeType === 'step' ? 'bg-blue-50 border-blue-500 text-blue-600' : 'bg-gray-50 border-gray-200 hover:bg-gray-100 text-gray-600'}`}
                            title="直角折线"
                        >
                            <CornerDownRight size={20} className="mb-1" />
                            <span className="text-xs">折线</span>
                        </button>
                        <button 
                             onClick={() => updateEdgeData('type', 'straight')}
                             className={`flex flex-col items-center justify-center p-3 rounded border transition-all ${edgeType === 'straight' ? 'bg-blue-50 border-blue-500 text-blue-600' : 'bg-gray-50 border-gray-200 hover:bg-gray-100 text-gray-600'}`}
                             title="直线"
                        >
                            <MoveDiagonal size={20} className="mb-1" />
                            <span className="text-xs">直线</span>
                        </button>
                    </div>
                 </div>

                 {/* Line Style */}
                 <div className="space-y-4">
                     <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                        外观样式
                    </label>
                    
                    <ColorPicker 
                        label="颜色" 
                        value={edgeStyle.stroke || '#000000'} 
                        onChange={(val) => updateEdgeData('stroke', val)} 
                    />

                    <div>
                        <label className="block text-xs text-gray-500 mb-1.5 font-medium">动画流动</label>
                        <button
                        onClick={() => updateEdgeData('animated', !activeEdge.animated)}
                        className={`w-full h-[38px] flex items-center justify-center gap-2 rounded border transition-colors ${activeEdge.animated ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                        >
                            <Activity size={16} />
                            <span className="text-xs">{activeEdge.animated ? '开启' : '关闭'}</span>
                        </button>
                    </div>

                     <div>
                         <label className="block text-xs text-gray-500 mb-1.5 font-medium">虚线样式</label>
                         <button
                            onClick={() => updateEdgeData('dashed', !edgeStyle.strokeDasharray)}
                            className={`w-full h-[32px] flex items-center justify-center gap-2 rounded border transition-colors ${edgeStyle.strokeDasharray ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                        >
                            {edgeStyle.strokeDasharray ? <MoreHorizontal size={16} /> : <Minus size={16} />}
                            <span className="text-xs">{edgeStyle.strokeDasharray ? '虚线' : '实线'}</span>
                        </button>
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-1.5">
                            <label className="text-xs text-gray-500 font-medium">线宽</label>
                            <span className="text-[10px] text-gray-400 bg-gray-50 px-1.5 rounded">{edgeStyle.strokeWidth || 1}px</span>
                        </div>
                        <input
                            type="range"
                            min="1"
                            max="10"
                            value={edgeStyle.strokeWidth || 1}
                            onChange={(e) => updateEdgeData('strokeWidth', parseInt(e.target.value))}
                            className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
                        />
                    </div>
                 </div>

                 {/* Markers */}
                 <div className="space-y-3">
                     <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                        箭头设置
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                        <button
                             onClick={() => updateEdgeData('markerStart', !activeEdge.markerStart)}
                             className={`flex items-center justify-between px-3 py-2 rounded border text-xs transition-colors ${activeEdge.markerStart ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                        >
                            <span>起点箭头</span>
                            {activeEdge.markerStart ? <ArrowLeft size={14} className="text-blue-500" /> : <X size={14} className="text-gray-400" />}
                        </button>

                         <button
                             onClick={() => updateEdgeData('markerEnd', !activeEdge.markerEnd)}
                             className={`flex items-center justify-between px-3 py-2 rounded border text-xs transition-colors ${activeEdge.markerEnd ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                        >
                            <span>终点箭头</span>
                            {activeEdge.markerEnd ? <ArrowRight size={14} className="text-blue-500" /> : <X size={14} className="text-gray-400" />}
                        </button>
                    </div>
                 </div>

            </div>
        </div>
      )
  }

  return null;
};

export default PropertiesPanel;