import React, { useEffect, useState } from 'react';
import { useReactFlow, MarkerType } from 'reactflow';
import { useStore } from '../store';
import { 
    X, Type as TypeIcon, Palette, Square, Scaling, BringToFront, SendToBack,
    AlignLeft, AlignCenter, AlignRight, AlignVerticalJustifyCenter, AlignVerticalJustifyStart, AlignVerticalJustifyEnd,
    Spline, MoveDiagonal, CornerDownRight, ArrowRight, ArrowLeft, Minus, MoreHorizontal, Cable, Activity, Trash2
} from 'lucide-react';

const PropertiesPanel: React.FC = () => {
  const { selectedNodes, selectedEdges, setNodes, setEdges, takeSnapshot } = useStore();
  const { getNodes, getEdges } = useReactFlow();
  
  const [activeNode, setActiveNode] = useState<any>(null);
  const [activeEdge, setActiveEdge] = useState<any>(null);

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

  // Wrapper to save history before modification if starting a new interaction
  // For sliders/inputs, debouncing history is ideal, but for simplicity we assume fine-grained history here or relying on user 'takeSnapshot' logic might be too manual.
  // We'll skip auto-snapshot on every keystroke, relying on important actions or just direct updates. 
  // To make undo usable for property edits, we should snapshot on focus or change start, but that's complex.
  // We will just update state directly for now.

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
                      // Alternate animation for bidirectional
                      newEdge.style = { ...newEdge.style, animation: 'dashdraw 0.5s linear infinite alternate' };
                  } else {
                      // Standard animation
                      newEdge.style = { ...newEdge.style, animation: 'dashdraw 0.5s linear infinite' };
                  }
              } else {
                  // Remove animation
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
    if (activeNode) {
        setNodes((nodes) => nodes.filter(n => n.id !== activeNode.id));
        setActiveNode(null);
    }
    if (activeEdge) {
        setEdges((edges) => edges.filter(e => e.id !== activeEdge.id));
        setActiveEdge(null);
    }
  }

  const bringToFront = () => {
      if(!activeNode) return;
      takeSnapshot();
      setNodes((nodes) => {
          const others = nodes.filter(n => n.id !== activeNode.id);
          return [...others, activeNode];
      });
  };

  const sendToBack = () => {
      if(!activeNode) return;
      takeSnapshot();
      setNodes((nodes) => {
          const others = nodes.filter(n => n.id !== activeNode.id);
          return [activeNode, ...others];
      });
  };

  if (!activeNode && !activeEdge) {
    return null;
  }

  // --- NODE PROPERTY RENDERER ---
  if (activeNode) {
    const getTypeLabel = (type: string) => {
        switch(type) {
            case 'RECTANGLE': return '矩形';
            case 'CIRCLE': return '圆形';
            case 'TRIANGLE': return '三角形';
            case 'TEXT': return '文本';
            case 'PEN': return '手绘';
            case 'GROUP': return '分区/组合';
            case 'STICKY_NOTE': return '便签';
            default: return type;
        }
    }

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

            {/* Content Section */}
            {activeNode.type !== 'PEN' && (
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
            {activeNode.type !== 'PEN' && (
                <div className="space-y-3">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                    <TypeIcon size={12} /> 字体与排版
                </label>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs text-gray-500 mb-1.5 font-medium">颜色</label>
                        <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-lg border border-gray-200">
                            <input
                            type="color"
                            value={activeNode.data.textColor || '#000000'}
                            onChange={(e) => updateNodeData('textColor', e.target.value)}
                            className="w-6 h-6 rounded cursor-pointer border-0 p-0 bg-transparent"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs text-gray-500 mb-1.5 font-medium">大小 ({activeNode.data.fontSize}px)</label>
                        <input
                            type="number"
                            value={activeNode.data.fontSize || 16}
                            onChange={(e) => updateNodeData('fontSize', parseInt(e.target.value))}
                            className="w-full px-2 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
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
            <div className="space-y-3">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                <Palette size={12} /> 外观
            </label>
            
            <div className="grid grid-cols-2 gap-3">
                {activeNode.type !== 'PEN' && (
                    <div>
                    <label className="block text-xs text-gray-500 mb-1.5 font-medium">填充</label>
                    <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-lg border border-gray-200">
                        <input
                        type="color"
                        value={activeNode.data.backgroundColor || '#ffffff'}
                        onChange={(e) => updateNodeData('backgroundColor', e.target.value)}
                        className="w-6 h-6 rounded cursor-pointer border-0 p-0 bg-transparent"
                        />
                        <span className="text-[10px] text-gray-500 font-mono uppercase truncate">{activeNode.data.backgroundColor}</span>
                    </div>
                    </div>
                )}
                
                <div className={activeNode.type === 'PEN' ? 'col-span-2' : ''}>
                <label className="block text-xs text-gray-500 mb-1.5 font-medium">描边</label>
                <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-lg border border-gray-200">
                    <input
                    type="color"
                    value={activeNode.data.borderColor || '#000000'}
                    onChange={(e) => updateNodeData('borderColor', e.target.value)}
                    className="w-6 h-6 rounded cursor-pointer border-0 p-0 bg-transparent"
                    />
                    <span className="text-[10px] text-gray-500 font-mono uppercase truncate">{activeNode.data.borderColor}</span>
                </div>
                </div>
            </div>

            <div>
                <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs text-gray-500 font-medium">线宽</label>
                    <span className="text-[10px] text-gray-400 bg-gray-50 px-1.5 rounded">{activeNode.data.borderWidth}px</span>
                </div>
                <input
                    type="range"
                    min="1"
                    max="20"
                    value={activeNode.data.borderWidth || 2}
                    onChange={(e) => updateNodeData('borderWidth', parseInt(e.target.value))}
                    className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
                </div>
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
                 <div className="space-y-3">
                     <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                        外观样式
                    </label>
                    
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs text-gray-500 mb-1.5 font-medium">颜色</label>
                            <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-lg border border-gray-200">
                                <input
                                type="color"
                                value={edgeStyle.stroke || '#000000'}
                                onChange={(e) => updateEdgeData('stroke', e.target.value)}
                                className="w-6 h-6 rounded cursor-pointer border-0 p-0 bg-transparent"
                                />
                                <span className="text-[10px] text-gray-500 font-mono uppercase truncate">{edgeStyle.stroke}</span>
                            </div>
                        </div>
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