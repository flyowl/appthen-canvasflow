import React from 'react';
import { useStore } from '../store';
import { ToolType } from '../types';
import { toPng } from 'html-to-image';
import { 
  MousePointer2, 
  Square, 
  Circle, 
  Type, 
  Triangle,
  Hand,
  Pen,
  Download,
  Layers,
  Sparkles,
  LayoutDashboard,
  GitBranch,
  Eraser,
  StickyNote,
  Undo2,
  Redo2,
  Trash2
} from 'lucide-react';

const Toolbar: React.FC = () => {
  const { 
      tool, setTool, 
      toggleLayersPanel, isLayersPanelOpen, 
      toggleAIModal, isAIModalOpen,
      undo, redo, clearAll, history
  } = useStore();

  const handleExport = () => {
    const viewport = document.querySelector('.react-flow__viewport') as HTMLElement;
    if (viewport) {
      toPng(viewport, {
        backgroundColor: '#f9fafb',
        cacheBust: true, // Forces a new request to ensure CORS headers are received
        style: {
            transform: 'scale(1)',
            transformOrigin: 'top left',
            width: viewport.style.width,
            height: viewport.style.height
        }
      })
      .then((dataUrl) => {
        const link = document.createElement('a');
        link.download = 'canvas-board-export.png';
        link.href = dataUrl;
        link.click();
      })
      .catch((err) => {
        console.error('Export failed:', err);
        // Fallback or user notification could go here
      });
    }
  };

  const onDragStart = (event: React.DragEvent, nodeType: ToolType) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  const tools = [
    { type: ToolType.SELECT, icon: <MousePointer2 size={18} />, label: '选择 (V)', draggable: false },
    { type: ToolType.HAND, icon: <Hand size={18} />, label: '抓手 (H)', draggable: false },
    { separator: true },
    { type: ToolType.PEN, icon: <Pen size={18} />, label: '画笔 (P)', draggable: false },
    { type: ToolType.ERASER, icon: <Eraser size={18} />, label: '橡皮擦 (E) - 仅清除笔迹', draggable: false },
    { type: ToolType.MINDMAP, icon: <GitBranch size={18} />, label: '思维导图 (点击添加)', draggable: true },
    { type: ToolType.GROUP, icon: <LayoutDashboard size={18} />, label: '分区 (拖拽或点击)', draggable: true },
    { separator: true },
    { type: ToolType.STICKY_NOTE, icon: <StickyNote size={18} />, label: '便签 (拖拽或点击)', draggable: true },
    { type: ToolType.RECTANGLE, icon: <Square size={18} />, label: '矩形 (拖拽或点击)', draggable: true },
    { type: ToolType.CIRCLE, icon: <Circle size={18} />, label: '圆形 (拖拽或点击)', draggable: true },
    { type: ToolType.TRIANGLE, icon: <Triangle size={18} />, label: '三角形 (拖拽或点击)', draggable: true },
    { type: ToolType.TEXT, icon: <Type size={18} />, label: '文本 (拖拽或点击)', draggable: true },
  ];

  const canUndo = history.past.length > 0;
  const canRedo = history.future.length > 0;

  return (
    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-xl border border-gray-200 p-1.5 flex items-center gap-1 z-50">
      {tools.map((t, i) => (
        t.separator ? (
            <div key={i} className="w-px h-6 bg-gray-200 mx-1" />
        ) : (
            <button
            key={t.type}
            onClick={() => t.type && setTool(t.type)}
            draggable={t.draggable}
            onDragStart={(event) => t.draggable && t.type && onDragStart(event, t.type)}
            title={t.label}
            className={`p-2 rounded-md transition-all duration-200 cursor-grab active:cursor-grabbing ${
                tool === t.type
                ? 'bg-blue-50 text-blue-600 shadow-sm ring-1 ring-blue-100'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
            >
            {t.icon}
            </button>
        )
      ))}
      
      <div className="w-px h-6 bg-gray-200 mx-1" />

      <button
        onClick={toggleAIModal}
        title="AI 智能生成"
        className={`p-2 rounded-md transition-all duration-200 ${
            isAIModalOpen
            ? 'bg-purple-50 text-purple-600 shadow-sm ring-1 ring-purple-100'
            : 'text-gray-600 hover:bg-purple-50 hover:text-purple-600'
        }`}
      >
        <Sparkles size={18} />
      </button>

      <button
        onClick={toggleLayersPanel}
        title="图层"
        className={`p-2 rounded-md transition-all duration-200 ${
            isLayersPanelOpen
            ? 'bg-blue-50 text-blue-600 shadow-sm ring-1 ring-blue-100'
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
        }`}
      >
        <Layers size={18} />
      </button>

      <button
        onClick={handleExport}
        title="导出 PNG"
        className="p-2 rounded-md text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-all duration-200"
      >
        <Download size={18} />
      </button>

      <div className="w-px h-6 bg-gray-200 mx-1" />

      <button
        onClick={undo}
        disabled={!canUndo}
        title="撤销 (Ctrl+Z)"
        className={`p-2 rounded-md transition-all duration-200 ${
            canUndo
            ? 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            : 'text-gray-300 cursor-not-allowed'
        }`}
      >
        <Undo2 size={18} />
      </button>

      <button
        onClick={redo}
        disabled={!canRedo}
        title="重做 (Ctrl+Y)"
        className={`p-2 rounded-md transition-all duration-200 ${
            canRedo
            ? 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            : 'text-gray-300 cursor-not-allowed'
        }`}
      >
        <Redo2 size={18} />
      </button>

      <button
        onClick={() => {
            if(window.confirm('确定要清空画板吗？')) clearAll();
        }}
        title="清空画板"
        className="p-2 rounded-md text-red-500 hover:bg-red-50 hover:text-red-600 transition-all duration-200"
      >
        <Trash2 size={18} />
      </button>
    </div>
  );
};

export default Toolbar;