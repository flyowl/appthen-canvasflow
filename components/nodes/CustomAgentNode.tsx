import React, { memo, useState, useRef, useEffect } from 'react';
import { NodeProps, Position, useReactFlow, MarkerType, Node as RFNode } from 'reactflow';
import { NodeData, ToolType, MindMapItem } from '../../types';
import { CustomHandle, EditableLabel, ShapeNodeWrapper } from './BaseNode';
import { Bot, Play, Settings, Loader2, FileText, GitBranch, ChevronDown, Check } from 'lucide-react';
import { useStore } from '../../store';
import { GoogleGenAI } from "@google/genai";

// --- Helpers for Parsing ---

const extractArrayObjects = (text: string, key: string) => {
    const objects: any[] = [];
    const keyPattern = `["']?${key}["']?\\s*:\\s*\\[`;
    const match = text.match(new RegExp(keyPattern));
    
    if (!match) return objects;
    
    let startIndex = match.index! + match[0].length;
    let braceCount = 0;
    let inString = false;
    let escape = false;
    let currentObjStart = -1;

    for (let i = startIndex; i < text.length; i++) {
        const char = text[i];
        if (escape) { escape = false; continue; }
        if (char === '\\') { escape = true; continue; }
        if (char === '"') { inString = !inString; continue; }

        if (!inString) {
            if (char === '{') {
                if (braceCount === 0) currentObjStart = i;
                braceCount++;
            } else if (char === '}') {
                braceCount--;
                if (braceCount === 0 && currentObjStart !== -1) {
                    const jsonStr = text.substring(currentObjStart, i + 1);
                    try {
                        const cleanJson = jsonStr.replace(/,\s*}/g, '}');
                        objects.push(JSON.parse(cleanJson));
                    } catch (e) { /* ignore */ }
                    currentObjStart = -1;
                }
            } else if (char === ']') {
                 if (braceCount === 0) break; 
            }
        }
    }
    return objects;
};

const buildMindMapTree = (flatNodes: any[]): MindMapItem | null => {
    if (flatNodes.length === 0) return null;
    const nodeMap = new Map<string, MindMapItem>();
    let root: MindMapItem | null = null;

    flatNodes.forEach(n => {
        const safeId = n.id || `temp-${Math.random()}`;
        nodeMap.set(safeId, {
            id: safeId,
            label: n.label || 'Node',
            children: [],
            style: { backgroundColor: n.backgroundColor, textColor: n.textColor, fontSize: n.fontSize }
        });
    });

    flatNodes.forEach(n => {
        const item = nodeMap.get(n.id);
        if (!item) return;
        if (n.parentId && nodeMap.has(n.parentId)) {
            nodeMap.get(n.parentId)?.children.push(item);
        } else if (!n.parentId || n.parentId === 'root' || n.isRoot) {
            if (!root) root = item;
        }
    });

    if (!root && flatNodes.length > 0) root = nodeMap.get(flatNodes[0].id) || null;
    return root;
};


export const CustomAgentNode = memo(({ id, data, selected, isConnectable }: NodeProps<NodeData>) => {
  const { setNodes, setEdges, takeSnapshot, defaultStyle } = useStore();
  const { getNodes } = useReactFlow();
  const [isLoading, setIsLoading] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const outputType = data.agentOutputType || 'MARKDOWN';

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOutputTypeSelect = (type: 'MARKDOWN' | 'MINDMAP') => {
      setNodes((nds) => nds.map(n => {
          if (n.id === id) {
              return { ...n, data: { ...n.data, agentOutputType: type } };
          }
          return n;
      }));
      setIsDropdownOpen(false);
  };

  const handleRun = async () => {
    if (isLoading || !data.label) return;
    setIsLoading(true);
    takeSnapshot();

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const currentNode = getNodes().find(n => n.id === id);
        if (!currentNode) return;

        // Position for new node (Right side)
        const startX = currentNode.position.x + (currentNode.width || 250) + 100;
        const startY = currentNode.position.y;
        const newId = `ai-gen-${Date.now()}`;

        if (outputType === 'MARKDOWN') {
            const prompt = `You are a helpful assistant. Generate a comprehensive and well-structured Markdown response for the following request: "${data.label}". 
            Use headers, lists, and bold text to make it readable. Do not wrap in markdown code blocks.`;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });

            const markdownContent = response.text || '# Error generating content';

            const newNode: RFNode<NodeData> = {
                id: newId,
                type: ToolType.MARKDOWN,
                position: { x: startX, y: startY },
                data: {
                    ...defaultStyle,
                    markdownContent: markdownContent,
                    backgroundColor: '#ffffff',
                    borderColor: '#e2e8f0',
                    borderWidth: 1,
                    width: 400,
                    height: 500
                },
                style: { width: 400, height: 500 }
            };

            setNodes((nds) => [...nds, newNode]);
        } else {
            // MINDMAP
            const prompt = `Generate a Mind Map for: "${data.label}".
            Return a JSON object with a "nodes" array.
            Each node object must have: "id", "label", "parentId" (null for root).
            Generate at least 3 levels.
            NO Markdown. JSON ONLY.`;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: { responseMimeType: "application/json" }
            });

            const flatNodes = extractArrayObjects(response.text, 'nodes');
            const tree = buildMindMapTree(flatNodes);

            if (tree) {
                tree.layoutDirection = 'LR';
                const newNode: RFNode<NodeData> = {
                    id: newId,
                    type: ToolType.MINDMAP,
                    position: { x: startX, y: startY },
                    data: {
                        ...defaultStyle,
                        mindMapRoot: tree,
                        backgroundColor: 'transparent',
                        borderColor: 'transparent',
                        borderWidth: 0,
                    },
                    style: { width: 600, height: 400 }
                };
                setNodes((nds) => [...nds, newNode]);
            }
        }

        // Create Edge with specific handles (Right to Left)
        const newEdge = {
            id: `edge-${id}-${newId}`,
            source: id,
            target: newId,
            sourceHandle: 'right', // Connect from right
            targetHandle: outputType === 'MINDMAP' ? 'main-left' : 'left', // Connect to left
            type: 'default',
            animated: true,
            style: { stroke: '#6366f1', strokeWidth: 2 },
            markerEnd: { type: MarkerType.ArrowClosed, color: '#6366f1' }
        };

        setEdges((eds) => [...eds, newEdge]);

    } catch (e) {
        console.error("Agent generation failed", e);
        alert("生成失败，请稍后重试");
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <ShapeNodeWrapper selected={selected} minWidth={250} minHeight={150}>
      <div 
        className={`relative w-full h-full flex flex-col bg-white rounded-xl overflow-hidden shadow-sm transition-all duration-300 ${
            selected ? 'ring-2 ring-blue-500 ring-offset-1 shadow-md' : 'border border-gray-200 hover:shadow-md'
        }`}
      >
        {/* Header */}
        <div className="bg-indigo-50 px-3 py-2 border-b border-indigo-100 flex items-center justify-between z-50">
            <div className="flex items-center gap-2 text-indigo-900 font-semibold text-xs select-none">
                <Bot size={16} className="text-indigo-600" />
                <span>智能体</span>
                <span className="text-indigo-400">|</span>
                <span className="text-[10px] text-indigo-600 uppercase flex items-center gap-1 bg-white/50 px-1.5 py-0.5 rounded">
                    {outputType === 'MARKDOWN' ? <FileText size={10} /> : <GitBranch size={10} />}
                    {outputType === 'MARKDOWN' ? '富文本' : '思维导图'}
                </span>
            </div>
            
            <div className="flex items-center gap-1">
                {/* Settings Dropdown */}
                <div className="relative" ref={dropdownRef}>
                    <button 
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className={`p-1 rounded hover:bg-indigo-100 transition-colors flex items-center gap-0.5 ${isDropdownOpen ? 'bg-indigo-100 text-indigo-700' : 'text-indigo-400 hover:text-indigo-600'}`}
                        title="输出设置"
                    >
                        <Settings size={14} />
                        <ChevronDown size={10} />
                    </button>

                    {isDropdownOpen && (
                        <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-[60] animate-in fade-in zoom-in-95 duration-100">
                            <div className="px-2 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">输出类型</div>
                            <button
                                onClick={() => handleOutputTypeSelect('MARKDOWN')}
                                className="w-full flex items-center justify-between px-3 py-2 text-xs text-left hover:bg-gray-50 text-gray-700"
                            >
                                <div className="flex items-center gap-2">
                                    <FileText size={14} className="text-blue-500" />
                                    <span>富文本 (Markdown)</span>
                                </div>
                                {outputType === 'MARKDOWN' && <Check size={12} className="text-blue-600" />}
                            </button>
                            <button
                                onClick={() => handleOutputTypeSelect('MINDMAP')}
                                className="w-full flex items-center justify-between px-3 py-2 text-xs text-left hover:bg-gray-50 text-gray-700"
                            >
                                <div className="flex items-center gap-2">
                                    <GitBranch size={14} className="text-purple-500" />
                                    <span>思维导图</span>
                                </div>
                                {outputType === 'MINDMAP' && <Check size={12} className="text-blue-600" />}
                            </button>
                        </div>
                    )}
                </div>

                {/* Run Button */}
                <button 
                    onClick={handleRun}
                    disabled={isLoading}
                    className={`p-1 rounded-full transition-colors shadow-sm flex items-center justify-center w-6 h-6
                        ${isLoading 
                            ? 'bg-indigo-400 cursor-not-allowed' 
                            : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                        }
                    `}
                    title="运行智能体"
                >
                    {isLoading ? (
                        <Loader2 size={12} className="animate-spin text-white" />
                    ) : (
                        <Play size={10} className="ml-0.5" />
                    )}
                </button>
            </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 p-4 bg-white relative">
             <div className="absolute inset-0 p-4">
                <EditableLabel id={id} data={data} isShape />
             </div>
             {!data.label && !data.isEditing && (
                 <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                     <span className="text-xs text-gray-400 italic">输入提示词...</span>
                 </div>
             )}
        </div>

        <CustomHandle type="source" position={Position.Top} id="top" selected={selected} isConnectable={isConnectable} />
        <CustomHandle type="source" position={Position.Right} id="right" selected={selected} isConnectable={isConnectable} />
        <CustomHandle type="source" position={Position.Bottom} id="bottom" selected={selected} isConnectable={isConnectable} />
        <CustomHandle type="source" position={Position.Left} id="left" selected={selected} isConnectable={isConnectable} />
      </div>
    </ShapeNodeWrapper>
  );
});
