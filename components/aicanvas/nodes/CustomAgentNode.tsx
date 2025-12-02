
import React, { memo, useState, useRef, useEffect } from 'react';
import { NodeProps, Position, MarkerType, Node as RFNode, useReactFlow } from 'reactflow';
import { NodeData, ToolType, MindMapItem } from '../types';
import { CustomHandle, ShapeNodeWrapper, EditableLabel } from './BaseNode';
import { Bot, Play, Settings, Loader2, FileText, GitBranch, ChevronDown, Check } from 'lucide-react';
import { useStore } from '../store';
import { GoogleGenAI } from "@google/genai";

// --- Helpers for Parsing (Aligned with AIGenerator) ---

const extractArrayObjects = (text: string, key: string) => {
    const objects: any[] = [];
    // Regex to find the start of the array: "key": [ or 'key': [ or key: [
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
        
        if (escape) {
            escape = false;
            continue;
        }
        
        if (char === '\\') {
            escape = true;
            continue;
        }

        if (char === '"') {
            inString = !inString;
            continue;
        }

        if (!inString) {
            if (char === '{') {
                if (braceCount === 0) currentObjStart = i;
                braceCount++;
            } else if (char === '}') {
                braceCount--;
                if (braceCount === 0 && currentObjStart !== -1) {
                    const jsonStr = text.substring(currentObjStart, i + 1);
                    try {
                        // Attempt to fix common LLM JSON issues like trailing commas
                        const cleanJson = jsonStr.replace(/,\s*}/g, '}');
                        objects.push(JSON.parse(cleanJson));
                    } catch (e) {
                        // Ignore malformed partials until they are complete/valid
                    }
                    currentObjStart = -1;
                }
            } else if (char === ']') {
                 // End of the target array
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

    // 1. Initialize all nodes
    flatNodes.forEach(n => {
        const safeId = n.id !== undefined && n.id !== null ? String(n.id) : `temp-${Math.random()}`;
        nodeMap.set(safeId, {
            id: safeId,
            label: n.label || 'Node',
            children: [],
            style: {
                backgroundColor: n.backgroundColor,
                textColor: n.textColor,
                fontSize: n.fontSize
            }
        });
    });

    // 2. Build Hierarchy
    flatNodes.forEach(n => {
        const safeId = n.id !== undefined && n.id !== null ? String(n.id) : null;
        if (!safeId) return;
        
        const item = nodeMap.get(safeId);
        if (!item) return;

        const parentId = n.parentId !== undefined && n.parentId !== null ? String(n.parentId) : null;

        if (parentId && parentId !== 'null' && nodeMap.has(parentId)) {
            const parent = nodeMap.get(parentId);
            parent?.children.push(item);
        } else if (!parentId || parentId === 'root' || n.isRoot) {
            if (!root) root = item;
        }
    });

    // Fallback if no explicit root found but nodes exist
    if (!root && flatNodes.length > 0) {
        root = nodeMap.get(String(flatNodes[0].id)) || null;
    }

    return root;
};

const getNodeContext = (node: RFNode<NodeData>): string => {
    if (!node) return '';
    
    if (node.type === ToolType.MARKDOWN && node.data.markdownContent) {
        return `[Source: Markdown]\n${node.data.markdownContent.slice(0, 2000)}...`; // Reasonable context limit
    }
    
    if (node.type === ToolType.MINDMAP && node.data.mindMapRoot) {
        const traverse = (item: MindMapItem, depth: number = 0): string => {
            if (depth > 4) return ''; // Limit depth to avoid excessive tokens
            let text = `${'  '.repeat(depth)}- ${item.label}\n`;
            if (item.children) {
                text += item.children.map(c => traverse(c, depth + 1)).join('');
            }
            return text;
        };
        return `[Source: Mind Map]\n${traverse(node.data.mindMapRoot)}`;
    }

    if (node.data.label) {
        return `[Source: ${node.type}]\n${node.data.label}`;
    }
    
    return '';
};

export const CustomAgentNode = memo(({ id, data, selected, isConnectable }: NodeProps<NodeData>) => {
  const { setNodes, setEdges, takeSnapshot, defaultStyle } = useStore();
  const { getNodes, getEdges } = useReactFlow();
  const [isLoading, setIsLoading] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const [promptText, setPromptText] = useState(data.label || '');
  const outputType = data.agentOutputType || 'MARKDOWN';

  useEffect(() => {
      setPromptText(data.label || '');
  }, [data.label]);

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

  const handleBlur = () => {
      if (data.label !== promptText) {
          setNodes((nds) => nds.map(n => {
              if (n.id === id) {
                  return { ...n, data: { ...n.data, label: promptText } };
              }
              return n;
          }));
      }
  };

  const handleRun = async () => {
    if (isLoading) return;
    if (!promptText.trim()) {
        alert("请输入指令内容");
        return;
    }
    
    handleBlur();
    setIsLoading(true);
    takeSnapshot();

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        // Use getter to access the absolute freshest state
        const currentNodes = getNodes();
        const currentEdges = getEdges();
        
        const currentNode = currentNodes.find(n => n.id === id);
        if (!currentNode) {
            throw new Error("Cannot find current node context");
        }

        // 1. Context Awareness: Find Upstream Nodes
        const incomingEdges = currentEdges.filter(e => e.target === id);
        const sourceNodes = incomingEdges
            .map(e => currentNodes.find(n => n.id === e.source))
            .filter(n => n !== undefined) as RFNode<NodeData>[];
        
        let contextPrompt = "";
        if (sourceNodes.length > 0) {
            const contexts = sourceNodes.map(n => getNodeContext(n)).filter(t => t.trim().length > 0);
            if (contexts.length > 0) {
                contextPrompt = `\n\n### Context Information (from connected inputs):\n"""\n${contexts.join('\n\n')}\n"""\n`;
            }
        }

        // Position for new node (Right side)
        const startX = currentNode.position.x + (currentNode.width || 250) + 100;
        const startY = currentNode.position.y;
        const newId = `ai-gen-${Date.now()}`;

        if (outputType === 'MARKDOWN') {
            // --- MARKDOWN MODE ---
            const instructions = `You are a helpful AI assistant.
            ${contextPrompt}
            
            ### Instruction:
            ${promptText}
            
            **Response Guidelines:**
            - Output pure Markdown format.
            - Use headers (#, ##), lists, and bold text for clarity.
            - Do NOT wrap the entire response in a markdown code block (like \`\`\`markdown ... \`\`\`). Just return the markdown content directly.
            `;

            // 1. Create Placeholder Node Immediately
            const newNode: RFNode<NodeData> = {
                id: newId,
                type: ToolType.MARKDOWN,
                position: { x: startX, y: startY },
                data: {
                    ...defaultStyle,
                    markdownContent: '🤖 AI 正在思考中...',
                    backgroundColor: '#ffffff',
                    borderColor: '#e2e8f0',
                    borderWidth: 1,
                    width: 450,
                    height: 600
                },
                style: { width: 450, height: 600 }
            };
            setNodes((nds) => [...nds, newNode]);

            // 2. Create Connection Edge
            const newEdge = {
                id: `edge-${id}-${newId}`,
                source: id,
                target: newId,
                sourceHandle: 'right',
                targetHandle: 'left',
                type: 'default',
                animated: true,
                style: { stroke: '#6366f1', strokeWidth: 2 },
                markerEnd: { type: MarkerType.ArrowClosed, color: '#6366f1' }
            };
            setEdges((eds) => [...eds, newEdge]);

            // 3. Stream Content (Identical structure to AIGenerator)
            const result = await ai.models.generateContentStream({
                model: 'gemini-2.5-flash',
                contents: { parts: [{ text: instructions }] },
            });

            let fullText = '';
            for await (const chunk of result) {
                fullText += chunk.text || '';
                
                setNodes((nds) => nds.map(n => {
                    if (n.id === newId) {
                        return { ...n, data: { ...n.data, markdownContent: fullText } };
                    }
                    return n;
                }));
            }

        } else {
            // --- MINDMAP MODE ---
            const instructions = `You are an expert Mind Map generator.
            ${contextPrompt}
            
            ### Instruction:
            ${promptText}

            **Task:**
            Generate a Mind Map structure based on the instruction.
            
            **Output Format (Strict JSON):**
            Return a valid JSON object with a single key "nodes" containing an array of node objects.
            
            Node Object Schema:
            {
                "id": "unique_string_id",
                "label": "Concise Label",
                "parentId": "parent_node_id_or_null_for_root"
            }
            
            **Rules:**
            - The root node must have "parentId": null.
            - Generate at least 3 levels of depth if possible.
            - Do NOT output Markdown. Output ONLY JSON.
            `;

            // 1. Create Placeholder Node
            const newNode: RFNode<NodeData> = {
                id: newId,
                type: ToolType.MINDMAP,
                position: { x: startX, y: startY },
                data: {
                    ...defaultStyle,
                    mindMapRoot: { id: 'root', label: 'Generating...', children: [] },
                    backgroundColor: 'transparent',
                    borderColor: 'transparent',
                    borderWidth: 0,
                },
                style: { width: 600, height: 400 }
            };
            setNodes((nds) => [...nds, newNode]);

            // 2. Create Connection Edge
            const newEdge = {
                id: `edge-${id}-${newId}`,
                source: id,
                target: newId,
                sourceHandle: 'right',
                targetHandle: 'main-left',
                type: 'default',
                animated: true,
                style: { stroke: '#6366f1', strokeWidth: 2 },
                markerEnd: { type: MarkerType.ArrowClosed, color: '#6366f1' }
            };
            setEdges((eds) => [...eds, newEdge]);

            // 3. Generate Content (JSON Mode)
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: { parts: [{ text: instructions }] },
                config: { responseMimeType: "application/json" }
            });

            const textResponse = response.text || '';
            const flatNodes = extractArrayObjects(textResponse, 'nodes');
            const tree = buildMindMapTree(flatNodes);

            if (tree) {
                tree.layoutDirection = 'LR';
                setNodes((nds) => nds.map(n => {
                    if (n.id === newId) {
                        return { 
                            ...n, 
                            data: { ...n.data, mindMapRoot: tree } 
                        };
                    }
                    return n;
                }));
            } else {
                setNodes((nds) => nds.map(n => {
                    if (n.id === newId) {
                        return { 
                            ...n, 
                            data: { ...n.data, mindMapRoot: { id: 'err', label: 'Generation Failed', children: [] } } 
                        };
                    }
                    return n;
                }));
            }
        }

    } catch (e: any) {
        console.error("Agent generation failed", e);
        alert(`生成失败: ${e.message || '未知错误'}`);
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
        <div className="bg-indigo-50 px-3 py-2 border-b border-indigo-100 flex items-center justify-between z-50 shrink-0">
            <div className="flex items-center gap-2 text-indigo-900 font-semibold text-xs select-none">
                <Bot size={16} className="text-indigo-600" />
                <span>智能体</span>
                <span className="text-indigo-400">|</span>
                <span className="text-[10px] text-indigo-600 uppercase flex items-center gap-1 bg-white/50 px-1.5 py-0.5 rounded border border-indigo-100">
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
                            : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200'
                        }
                    `}
                    title="运行智能体 (Ctrl+Enter)"
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
        <div className="flex-1 relative bg-white flex flex-col group/input">
             <textarea 
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                onBlur={handleBlur}
                className="w-full h-full resize-none outline-none text-sm p-4 bg-transparent text-gray-700 placeholder-gray-400 custom-scrollbar nodrag cursor-text"
                placeholder="在此输入指令... (例如：生成一份关于AI的行业报告大纲)"
                style={{ lineHeight: 1.6 }}
                onKeyDown={(e) => {
                    // Allow Ctrl+Enter to run
                    if(e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                        e.preventDefault();
                        handleRun();
                    }
                    e.stopPropagation(); // Stop propagation to canvas
                }}
             />
        </div>

        <CustomHandle type="source" position={Position.Top} id="top" selected={selected} isConnectable={isConnectable} />
        <CustomHandle type="source" position={Position.Right} id="right" selected={selected} isConnectable={isConnectable} />
        <CustomHandle type="source" position={Position.Bottom} id="bottom" selected={selected} isConnectable={isConnectable} />
        <CustomHandle type="source" position={Position.Left} id="left" selected={selected} isConnectable={isConnectable} />
      </div>
    </ShapeNodeWrapper>
  );
});
