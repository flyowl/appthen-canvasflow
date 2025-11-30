import React, { useRef } from 'react';
import { useStore } from '../store';
import { ToolType } from '../types';
import { useReactFlow } from 'reactflow';
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
  Trash2,
  Shapes, 
  ChevronDown,
  Diamond,
  Hexagon,
  Database, 
  Cloud,
  File, 
  RectangleHorizontal, 
  Image as ImageIcon,
  Video as VideoIcon,
  Film,
  Plus,
  Bot,
  FileText,
  FileJson,
  Upload,
  Clover
} from 'lucide-react';

// Custom small Parallelogram icon if needed, or use generic
const ParallelogramIcon = ({ size }: { size: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19h14.5L22 5H7.5L4 19z" />
    </svg>
);

const Toolbar: React.FC = () => {
  const { 
      tool, setTool, 
      toggleLayersPanel, isLayersPanelOpen, 
      toggleSectionPanel, isSectionPanelOpen,
      toggleAIModal, isAIModalOpen,
      toggleResourceMarket, isResourceMarketOpen,
      undo, redo, clearAll, history,
      setNodes, setEdges, takeSnapshot
  } = useStore();
  const { getNodes, getEdges, getViewport, setViewport } = useReactFlow();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const viewport = document.querySelector('.react-flow__viewport') as HTMLElement;
    if (viewport) {
      toPng(viewport, {
        backgroundColor: '#f9fafb',
        cacheBust: true,
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
      });
    }
  };

  const handleExportJSON = () => {
      const data = {
          nodes: getNodes(),
          edges: getEdges(),
          viewport: getViewport(),
          timestamp: Date.now(),
          version: '1.0'
      };
      
      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `canvas-backup-${new Date().toISOString().slice(0,10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
  };

  const handleImportJSON = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
          try {
              const content = e.target?.result as string;
              const data = JSON.parse(content);

              if (data.nodes && Array.isArray(data.nodes)) {
                  takeSnapshot();
                  setNodes(data.nodes);
                  
                  if (data.edges && Array.isArray(data.edges)) {
                      setEdges(data.edges);
                  } else {
                      setEdges([]);
                  }

                  if (data.viewport) {
                      setViewport(data.viewport);
                  }
              } else {
                  alert('无效的画板数据文件');
              }
          } catch (error) {
              console.error('Import failed:', error);
              alert('无法解析文件');
          }
      };
      reader.readAsText(file);
      // Reset input to allow selecting same file again
      if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const onDragStart = (event: React.DragEvent, nodeType: ToolType) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  // Define types for cleaner structure
  type SimpleTool = { type: ToolType; icon: React.ReactNode; label: string; draggable?: boolean };
  type GroupTool = { group: true; label: string; icon: React.ReactNode; items: SimpleTool[] };
  type Separator = { separator: true };
  type ToolbarItem = SimpleTool | GroupTool | Separator;

  const tools: ToolbarItem[] = [
    { type: ToolType.SELECT, icon: <MousePointer2 size={18} />, label: '选择 (V)', draggable: false },
    { type: ToolType.HAND, icon: <Hand size={18} />, label: '抓手 (H)', draggable: false },
    { separator: true },
    { type: ToolType.PEN, icon: <Pen size={18} />, label: '画笔 (P)', draggable: false },
    { type: ToolType.ERASER, icon: <Eraser size={18} />, label: '橡皮擦 (E)', draggable: false },
    { separator: true },
    // Grouped Shapes
    { 
        group: true, 
        label: '图形库', 
        icon: <Shapes size={18} />,
        items: [
            { type: ToolType.RECTANGLE, icon: <Square size={18} />, label: '矩形', draggable: true },
            { type: ToolType.CIRCLE, icon: <Circle size={18} />, label: '圆形', draggable: true },
            { type: ToolType.TRIANGLE, icon: <Triangle size={18} />, label: '三角形', draggable: true },
            { type: ToolType.DIAMOND, icon: <Diamond size={18} />, label: '菱形', draggable: true },
            { type: ToolType.PARALLELOGRAM, icon: <ParallelogramIcon size={18} />, label: '平行四边形', draggable: true },
            { type: ToolType.HEXAGON, icon: <Hexagon size={18} />, label: '六边形', draggable: true },
            { type: ToolType.CYLINDER, icon: <Database size={18} />, label: '圆柱体', draggable: true },
            { type: ToolType.CLOUD, icon: <Cloud size={18} />, label: '云', draggable: true },
            { type: ToolType.DOCUMENT, icon: <File size={18} />, label: '文档', draggable: true },
        ]
    },
    {
      group: true,
      label: '多媒体',
      icon: <ImageIcon size={18} />,
      items: [
          { type: ToolType.IMAGE, icon: <ImageIcon size={18} />, label: '图片', draggable: true },
          { type: ToolType.VIDEO, icon: <Film size={18} />, label: '视频', draggable: true },
      ]
    },
    // Note: ToolType.MINDMAP and ToolType.CUSTOM_AGENT have been moved to the Plus menu
    { type: ToolType.SECTION, icon: <LayoutDashboard size={18} />, label: '分区', draggable: true },
    { type: ToolType.STICKY_NOTE, icon: <StickyNote size={18} />, label: '便签', draggable: true },
    { type: ToolType.TEXT, icon: <Type size={18} />, label: '文本', draggable: true },
  ];

  const canUndo = history.past.length > 0;
  const canRedo = history.future.length > 0;

  return (
    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-xl border border-gray-200 p-1.5 flex items-center gap-1 z-50">
      
      <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept=".json" 
          onChange={handleImportJSON} 
      />

      {/* Resource Market Toggle */}
      <button
        onClick={toggleResourceMarket}
        title="资源市场"
        className={`p-2 rounded-md transition-all duration-200 ${
            isResourceMarketOpen
            ? 'bg-green-50 text-green-600 shadow-sm ring-1 ring-green-100'
            : 'text-gray-600 hover:bg-green-50 hover:text-green-600'
        }`}
      >
        <Clover size={18} />
      </button>

      <div className="w-px h-6 bg-gray-200 mx-1" />

      {/* PLUS MENU (Insert/Utils) */}
      <div className="relative group/menu flex items-center justify-center">
        <button
            title="添加组件 / 工具"
            className="p-2 rounded-md text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-all duration-200"
        >
            <Plus size={18} />
        </button>

        <div className="absolute top-full left-0 pt-2 hidden group-hover/menu:block z-50">
            <div className="absolute -top-2 left-0 w-full h-4 bg-transparent" />
            <div className="bg-white rounded-lg shadow-xl border border-gray-200 p-2 min-w-[160px] animate-in fade-in zoom-in-95 duration-200 flex flex-col gap-1">
                <div className="text-[10px] font-bold text-gray-400 px-2 py-1 uppercase tracking-wider">组件</div>
                
                <button
                    onClick={() => setTool(ToolType.MINDMAP)}
                    draggable={true}
                    onDragStart={(event) => onDragStart(event, ToolType.MINDMAP)}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors text-left cursor-grab active:cursor-grabbing ${tool === ToolType.MINDMAP ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-100'}`}
                >
                    <GitBranch size={16} />
                    <span>思维导图</span>
                </button>

                <button
                    onClick={() => setTool(ToolType.CUSTOM_AGENT)}
                    draggable={true}
                    onDragStart={(event) => onDragStart(event, ToolType.CUSTOM_AGENT)}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors text-left cursor-grab active:cursor-grabbing ${tool === ToolType.CUSTOM_AGENT ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-100'}`}
                >
                    <Bot size={16} />
                    <span>自定义智能体</span>
                </button>
                
                <button
                    onClick={() => setTool(ToolType.MARKDOWN)}
                    draggable={true}
                    onDragStart={(event) => onDragStart(event, ToolType.MARKDOWN)}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors text-left cursor-grab active:cursor-grabbing ${tool === ToolType.MARKDOWN ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-100'}`}
                >
                    <FileText size={16} />
                    <span>Markdown 编辑器</span>
                </button>

                <div className="h-px bg-gray-100 my-1" />
                <div className="text-[10px] font-bold text-gray-400 px-2 py-1 uppercase tracking-wider">工具</div>

                <button
                    onClick={toggleLayersPanel}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors text-left ${isLayersPanelOpen ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-100'}`}
                >
                    <Layers size={16} />
                    <span>{isLayersPanelOpen ? '关闭图层' : '图层面板'}</span>
                </button>

                <button
                    onClick={toggleSectionPanel}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors text-left ${isSectionPanelOpen ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-100'}`}
                >
                    <LayoutDashboard size={16} />
                    <span>{isSectionPanelOpen ? '关闭分区' : '分区面板'}</span>
                </button>

                <button
                    onClick={handleExport}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-gray-700 hover:bg-gray-100 transition-colors text-left"
                >
                    <Download size={16} />
                    <span>导出图片 (PNG)</span>
                </button>

                <div className="h-px bg-gray-100 my-1" />
                <div className="text-[10px] font-bold text-gray-400 px-2 py-1 uppercase tracking-wider">数据</div>

                <button
                    onClick={handleExportJSON}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-gray-700 hover:bg-gray-100 transition-colors text-left"
                >
                    <FileJson size={16} />
                    <span>导出数据 (JSON)</span>
                </button>

                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-gray-700 hover:bg-gray-100 transition-colors text-left"
                >
                    <Upload size={16} />
                    <span>导入数据 (JSON)</span>
                </button>
            </div>
        </div>
      </div>
      
      <div className="w-px h-6 bg-gray-200 mx-1" />

      {tools.map((t, i) => {
        if ('separator' in t) {
            return <div key={i} className="w-px h-6 bg-gray-200 mx-1" />;
        }

        if ('group' in t) {
            // Check if any item in the group is active
            const isGroupActive = t.items.some(item => item.type === tool);
            
            return (
                <div key={i} className="relative group/menu flex items-center justify-center">
                    <button
                        title={t.label}
                        className={`p-2 rounded-md transition-all duration-200 flex items-center gap-1 ${
                            isGroupActive
                            ? 'bg-blue-50 text-blue-600 shadow-sm ring-1 ring-blue-100'
                            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                        }`}
                    >
                        {t.icon}
                        <ChevronDown size={10} className={`opacity-50 transition-transform duration-200 group-hover/menu:rotate-180`} />
                    </button>

                    {/* Dropdown Menu with padding bridge */}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 pt-2 hidden group-hover/menu:block z-50">
                        {/* Bridge for mouse hover */}
                        <div className="absolute -top-2 left-0 w-full h-4 bg-transparent" />
                        
                        <div className="bg-white rounded-lg shadow-xl border border-gray-200 p-2 grid grid-cols-2 gap-1 min-w-[100px] animate-in fade-in zoom-in-95 duration-200">
                            {t.items.map((subTool) => (
                                <button
                                    key={subTool.type}
                                    onClick={() => setTool(subTool.type)}
                                    draggable={subTool.draggable}
                                    onDragStart={(event) => subTool.draggable && onDragStart(event, subTool.type)}
                                    title={subTool.label}
                                    className={`p-2 rounded-md transition-all duration-200 cursor-grab active:cursor-grabbing hover:bg-gray-100 flex items-center justify-center aspect-square ${
                                        tool === subTool.type ? 'bg-blue-50 text-blue-600' : 'text-gray-600'
                                    }`}
                                >
                                    {subTool.icon}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            );
        }

        // Regular Item
        return (
            <button
            key={t.type}
            onClick={() => setTool(t.type)}
            draggable={t.draggable}
            onDragStart={(event) => t.draggable && onDragStart(event, t.type)}
            title={t.label}
            className={`p-2 rounded-md transition-all duration-200 cursor-grab active:cursor-grabbing ${
                tool === t.type
                ? 'bg-blue-50 text-blue-600 shadow-sm ring-1 ring-blue-100'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
            >
            {t.icon}
            </button>
        );
      })}
      
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

      {/* Layers and Export buttons have been moved to the Plus menu */}

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
        onClick={(e) => {
            e.stopPropagation();
            clearAll();
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