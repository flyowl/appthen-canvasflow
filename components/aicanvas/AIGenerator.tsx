import React, { useState, useRef } from 'react';
import { useStore } from './store';
import { useReactFlow, Node, Edge } from 'reactflow';
import { X, Sparkles, Loader2, GitBranch, LayoutDashboard, Image as ImageIcon, Trash2, Zap, FileText } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { ToolType, NodeData, MindMapItem } from './types';

// Robust helper to extract complete JSON objects from a streaming string
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
                        const parsed = JSON.parse(cleanJson);
                        objects.push(parsed);
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

// Reconstruct Mind Map Tree from Flat List
const buildMindMapTree = (flatNodes: any[]): MindMapItem | null => {
    if (flatNodes.length === 0) return null;
    
    const nodeMap = new Map<string, MindMapItem>();
    let root: MindMapItem | null = null;

    // 1. Initialize all nodes
    flatNodes.forEach(n => {
        // Fallback for missing IDs or Labels
        const safeId = n.id || `temp-${Math.random()}`;
        const safeLabel = n.label || 'Node';
        
        nodeMap.set(safeId, {
            id: safeId,
            label: safeLabel,
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
        const item = nodeMap.get(n.id);
        if (!item) return;

        if (n.parentId && nodeMap.has(n.parentId)) {
            const parent = nodeMap.get(n.parentId);
            parent?.children.push(item);
        } else if (!n.parentId || n.parentId === 'root' || n.isRoot) {
            // Assume first node without valid parent or explicit root is Root
            if (!root) root = item;
        }
    });

    // Fallback if no explicit root found but nodes exist (e.g. streaming start)
    if (!root && flatNodes.length > 0) {
        root = nodeMap.get(flatNodes[0].id) || null;
    }

    return root;
};

const ModeOptions = [
    { id: 'default', label: '智能创作', icon: Zap, desc: '生成海报、PPT、架构图等' },
    { id: 'general', label: '通用流图', icon: LayoutDashboard, desc: '生成标准流程图' },
    { id: 'mindmap', label: '思维导图', icon: GitBranch, desc: '生成思维导图结构' },
    { id: 'markdown', label: '富文本', icon: FileText, desc: '生成文章、大纲、笔记' },
] as const;

type AIMode = typeof ModeOptions[number]['id'];

const AIGenerator: React.FC = () => {
  const { isAIModalOpen, toggleAIModal, defaultStyle, setNodes, setEdges, takeSnapshot, selectedNodes } = useStore();
  const { getNodes } = useReactFlow();
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<AIMode>('default');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string>('image/png');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isAIModalOpen) return null;

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        setSelectedImage(base64);
        setImageMimeType(file.type);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearImage = () => {
    setSelectedImage(null);
    setImageMimeType('image/png');
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim() && !selectedImage) return;

    setIsLoading(true);
    setError(null);
    takeSnapshot();

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      // Context Awareness: Calculate optimized starting position & Get Context
      const existingNodes = getNodes();
      
      // Provide AI with context of what's currently selected or on board
      // Filter primarily for selected nodes if selection exists, otherwise use some global context
      const relevantNodes = selectedNodes.length > 0 
          ? existingNodes.filter(n => selectedNodes.includes(n.id))
          : existingNodes.slice(0, 15); // Limit context to avoid token limits

      // Simplified context for Diagram modes
      const contextNodes = relevantNodes.map(n => ({
          id: n.id,
          type: n.type,
          label: n.data.label,
          // Simplify position for context to avoid noise
          x: Math.round(n.position.x),
          y: Math.round(n.position.y)
      }));

      // Richer context for Text/Markdown modes
      const textContext = relevantNodes.map(n => {
          let content = n.data.label || '';
          if (n.type === ToolType.MARKDOWN) content = n.data.markdownContent || '';
          return `[${n.type}]: ${content}`;
      }).join('\n');

      let startX = 100;
      let startY = 100;
      
      if (existingNodes.length > 0) {
         // Find the right-most node to append new content after
         const getWidth = (n: Node) => Number(n.width ?? n.style?.width ?? 150) || 150;
         const maxX = Math.max(...existingNodes.map(n => n.position.x + getWidth(n)));
         const minY = Math.min(...existingNodes.map(n => n.position.y));
         startX = maxX + 100; // Add generous buffer
         startY = minY > 0 ? minY : 100;
      }

      const parts: any[] = [];
      if (selectedImage) {
          parts.push({
              inlineData: {
                  mimeType: imageMimeType,
                  data: selectedImage
              }
          });
      }

      const timestamp = Date.now();

      if (mode === 'default' || mode === 'general') {
        // --- GENERAL / DEFAULT FLOWCHART STREAMING ---
        
        let instructions = '';

        if (mode === 'default') {
             instructions = `You are a versatile AI visual designer.
             **Goal**: Generate a diagram layout based on the user request.
             **Capabilities**:
             - **Layouts**: PPT Slides, Posters, Software Architecture, Infographics, etc.
             - **Nodes**: Use 'SECTION' for containers/slides. Use 'RECTANGLE', 'CIRCLE', 'TEXT' for elements. Use 'IMAGE' for visual placeholders.
             - **Structure**: Group related items spatially.
             
             **Context**:
             Existing nodes (ID/Type/Label): ${JSON.stringify(contextNodes)}.
             If the user asks to "add to" or "connect", use these IDs.
             `;
        } else {
             instructions = `You are a UI/UX expert specialized in Flowcharts.
             **Goal**: Create a structured Flowchart.
             
             **Layout Rules**:
             1. **Direction**: Strictly Vertical (Top-to-Bottom).
             2. **Spacing**: Ensure gaps are large enough (Y gap > 150px).
             3. **Alignment**: Center nodes on the X-axis for the main spine.
             
             **Connection Rules (Crucial)**:
             - **Vertical Flow**: Connect the **Bottom** handle of the Source to the **Top** handle of the Target.
             - **Return Loops**: Connect **Right** handle to **Right/Top** handle.
             - **Output**: You MUST include "sourceHandle" and "targetHandle" fields in edge objects.
               - Valid Handles: 'top', 'bottom', 'left', 'right'.
               - Example: { "sourceHandle": "bottom", "targetHandle": "top" }
             
             **Context**:
             Existing nodes: ${JSON.stringify(contextNodes)}.
             `;
        }

        instructions += `
        **Output Format**:
        Return a JSON object with a SINGLE array named "elements".
        
        Item Schema (Node):
        { "category": "node", "id": "...", "type": "...", "label": "...", "x": 100, "y": 100, "width": 150, "height": 80, "backgroundColor": "...", "borderColor": "..." }
        
        Item Schema (Edge):
        { "category": "edge", "source": "...", "target": "...", "label": "...", "sourceHandle": "bottom", "targetHandle": "top" }

        NO Markdown blocks. JSON ONLY.
        `;
        
        parts.push({
            text: `${instructions}\n\nUser Request: "${prompt}"`
        });

        const result = await ai.models.generateContentStream({
          model: 'gemini-2.5-flash',
          contents: { parts: parts },
          config: { responseMimeType: "application/json" }
        });

        let fullText = '';
        const processedIds = new Set<string>();

        for await (const chunk of result) {
            fullText += chunk.text || '';

            // Extract from the single 'elements' stream
            const foundElements = extractArrayObjects(fullText, 'elements');
            
            const newNodesToAdd: Node[] = [];
            const newEdgesToAdd: Edge[] = [];

            foundElements.forEach((el: any) => {
                // Determine ID based on content to be stable but unique per generation
                const rawId = el.id || `${el.source}-${el.target}`;
                // Keep original ID if it matches an existing node (for connections), else namespace it
                const isExisting = contextNodes.some(n => n.id === rawId);
                const uniqueId = isExisting ? rawId : `ai-${timestamp}-${rawId}`;

                if (!processedIds.has(uniqueId)) {
                    processedIds.add(uniqueId);
                    
                    if (el.category === 'node') {
                        // Offset generated coordinates to startX/startY ONLY if strictly new generation without specific coords
                        // Ideally AI gives relative coords 0-based.
                        const genX = (el.x || 0) + (mode === 'general' ? startX : startX);
                        const genY = (el.y || 0) + (mode === 'general' ? startY : startY);

                        newNodesToAdd.push({
                            id: uniqueId,
                            type: el.type || ToolType.RECTANGLE,
                            position: { x: genX, y: genY },
                            style: { width: el.width || 150, height: el.height || 80 },
                            data: {
                                ...defaultStyle,
                                label: el.label,
                                backgroundColor: el.backgroundColor || defaultStyle.backgroundColor,
                                borderColor: el.borderColor || defaultStyle.borderColor,
                                textColor: el.textColor || defaultStyle.textColor,
                                width: el.width || 150,
                                height: el.height || 80,
                                align: 'center',
                                verticalAlign: 'center',
                                // Support Markdown/Agent specific fields if AI generates them
                                markdownContent: el.markdownContent
                            }
                        });
                    } else if (el.category === 'edge') {
                        // Resolve source/target IDs. If they match context, use raw, else namespace
                        const sourceIsExisting = contextNodes.some(n => n.id === el.source);
                        const targetIsExisting = contextNodes.some(n => n.id === el.target);
                        
                        const sourceId = sourceIsExisting ? el.source : `ai-${timestamp}-${el.source}`;
                        const targetId = targetIsExisting ? el.target : `ai-${timestamp}-${el.target}`;

                         newEdgesToAdd.push({
                            id: uniqueId,
                            source: sourceId,
                            target: targetId,
                            label: el.label,
                            type: 'default',
                            animated: false,
                            sourceHandle: el.sourceHandle || (mode === 'general' ? 'bottom' : undefined),
                            targetHandle: el.targetHandle || (mode === 'general' ? 'top' : undefined),
                            markerEnd: { type: 'arrowclosed' as any },
                            style: { stroke: '#000000', strokeWidth: 2 }
                        });
                    }
                }
            });

            if (newNodesToAdd.length > 0) {
                setNodes((nds) => [...nds, ...newNodesToAdd]);
            }
            if (newEdgesToAdd.length > 0) {
                setEdges((eds) => [...eds, ...newEdgesToAdd]);
            }
        }

      } else if (mode === 'mindmap') {
        // --- MIND MAP STREAMING (FLAT LIST STRATEGY) ---
        const instructions = `Generate a Mind Map for the user request.
        
        **Strategy**:
        Return a FLATTENED list of nodes to allow streaming.
        
        **Output Format**:
        JSON object with a "nodes" array.
        Each node object must have:
        - "id": string
        - "label": string
        - "parentId": string (or null for the Root node)
        
        **Guidelines**:
        - The first node MUST be the Root (parentId: null).
        - Generate at least 3 levels of depth.
        - Use concise labels.
        
        NO Markdown. JSON ONLY.
        
        **Context**:
        ${textContext ? `Refer to these existing nodes:\n${textContext}` : ''}
        `;

        parts.push({
            text: `${instructions}\n\nUser Request: "${prompt}"`
        });

        // Initialize MindMap container immediately
        const mindMapId = `mm-node-${timestamp}`;
        const initialRoot = { id: 'root', label: 'Generating...', children: [] };
        
        const mindMapNode: Node<NodeData> = {
            id: mindMapId,
            type: ToolType.MINDMAP,
            position: { x: startX, y: startY },
            data: {
                ...defaultStyle,
                mindMapRoot: initialRoot,
                backgroundColor: 'transparent',
                borderColor: 'transparent',
                borderWidth: 0,
            },
            style: { width: 600, height: 400 }, 
        };
        
        setNodes((nds) => [...nds, mindMapNode]);

        const result = await ai.models.generateContentStream({
            model: 'gemini-2.5-flash',
            contents: { parts: parts },
            config: { responseMimeType: "application/json" }
        });

        let fullText = '';
        const processedIds = new Set<string>();
        const accumulatedFlatNodes: any[] = [];

        for await (const chunk of result) {
            fullText += chunk.text || '';
            
            // Extract flat nodes from stream
            const foundNodes = extractArrayObjects(fullText, 'nodes');
            let hasNewUpdates = false;

            foundNodes.forEach((n: any) => {
                if (!processedIds.has(n.id)) {
                    processedIds.add(n.id);
                    accumulatedFlatNodes.push(n);
                    hasNewUpdates = true;
                }
            });

            // Rebuild tree and update React Flow only if we have new data
            if (hasNewUpdates && accumulatedFlatNodes.length > 0) {
                const tree = buildMindMapTree(accumulatedFlatNodes);
                if (tree) {
                    // Force layout direction default
                    tree.layoutDirection = 'LR';
                    
                    setNodes((nds) => nds.map(n => {
                        if (n.id === mindMapId) {
                            return {
                                ...n,
                                data: {
                                    ...n.data,
                                    mindMapRoot: tree
                                }
                            }
                        }
                        return n;
                    }));
                }
            }
        }
      } else if (mode === 'markdown') {
        // --- MARKDOWN STREAMING ---
        const instructions = `You are a helpful assistant.
        **Goal**: Generate a comprehensive and well-structured Markdown response based on the user request.
        
        **Context**:
        ${textContext ? `Use the following context if relevant:\n${textContext}` : ''}
        
        **Rules**:
        - Use headers, lists, bold text, tables etc.
        - Do NOT wrap the output in a markdown code block (like \`\`\`markdown). Return raw markdown text.
        `;
        
        parts.push({ text: `${instructions}\n\nUser Request: "${prompt}"` });

        // Create placeholder node
        const mdId = `md-node-${timestamp}`;
        const mdNode: Node<NodeData> = {
            id: mdId,
            type: ToolType.MARKDOWN,
            position: { x: startX, y: startY },
            data: {
                ...defaultStyle,
                markdownContent: 'Generating...',
                backgroundColor: '#ffffff',
                borderColor: '#e2e8f0',
                borderWidth: 1,
                width: 400,
                height: 500
            },
            style: { width: 400, height: 500 }
        };
        setNodes((nds) => [...nds, mdNode]);

        const result = await ai.models.generateContentStream({
            model: 'gemini-2.5-flash',
            contents: { parts: parts },
        });

        let fullText = '';
        for await (const chunk of result) {
            fullText += chunk.text || '';
            setNodes((nds) => nds.map(n => {
                if (n.id === mdId) {
                    return { ...n, data: { ...n.data, markdownContent: fullText } };
                }
                return n;
            }));
        }
      }
      
      toggleAIModal();
      setPrompt('');
      clearImage();
      
    } catch (err: any) {
      console.error("AI Generation Error:", err);
      setError(err.message || "Failed to generate content. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="absolute bottom-4 right-4 z-[100] w-[380px] bg-white rounded-xl shadow-2xl border border-gray-200 overflow-visible animate-in slide-in-from-bottom-5 fade-in duration-200 flex flex-col">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-50 to-white px-4 py-3 border-b border-purple-100 flex items-center justify-between">
          <div className="flex items-center gap-2 text-purple-700">
            <Sparkles size={18} />
            <h2 className="font-semibold text-sm">AI 智能助手</h2>
          </div>
          <button 
            onClick={toggleAIModal}
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1 rounded-full transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-4">
          
          {/* Mode Selection - Horizontal Tabs (Compact Side-by-Side) */}
          <div className="flex gap-2 mb-3">
             {ModeOptions.map((opt) => (
                 <button
                    key={opt.id}
                    onClick={() => setMode(opt.id as any)}
                    className={`flex items-center justify-center gap-2 p-2 rounded-lg border transition-all flex-1
                        ${mode === opt.id 
                            ? 'bg-purple-50 border-purple-200 text-purple-700 shadow-sm' 
                            : 'bg-white border-gray-100 text-gray-500 hover:bg-gray-50 hover:border-gray-200'
                        }
                    `}
                    title={opt.desc}
                 >
                     <opt.icon size={16} className={`${mode === opt.id ? 'text-purple-600' : 'text-gray-400'}`} />
                     <span className="text-xs font-medium whitespace-nowrap">{opt.label}</span>
                 </button>
             ))}
          </div>

          <div className="relative z-0">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={
                  mode === 'default' ? "描述你想生成的内容 (如: 软件架构图、活动海报)..." :
                  mode === 'general' ? "描述流程图步骤 (如: 用户注册登录流程)..." : 
                  mode === 'mindmap' ? "描述思维导图的主题..." :
                  "描述文章主题、大纲或需要生成的内容..."
              }
              className="w-full h-24 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-none text-xs transition-all pr-8"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                  handleGenerate();
                }
              }}
            />
            
            <div className="absolute top-2 right-2">
                 <button 
                    onClick={() => fileInputRef.current?.click()}
                    title="上传参考图片"
                    className="p-1 bg-white border border-gray-200 rounded shadow-sm text-gray-400 hover:text-purple-600 hover:border-purple-200 transition-colors"
                >
                    <ImageIcon size={14} />
                </button>
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleImageUpload}
                />
            </div>
          </div>

           {selectedImage && (
                <div className="mt-2 flex items-center gap-2 p-1.5 bg-purple-50 rounded border border-purple-100 max-w-full">
                    <img 
                        src={`data:${imageMimeType};base64,${selectedImage}`} 
                        alt="Preview" 
                        className="h-8 w-8 object-cover rounded bg-white border border-purple-100" 
                    />
                    <span className="text-[10px] text-purple-700 truncate flex-1">图片已添加</span>
                    <button 
                        onClick={clearImage}
                        className="p-0.5 text-purple-400 hover:text-red-500 hover:bg-white rounded transition-colors"
                    >
                        <Trash2 size={12} />
                    </button>
                </div>
            )}

            {selectedNodes.length > 0 && (
                 <div className="mt-2 text-[10px] text-gray-400 flex items-center gap-1">
                    <Sparkles size={10} />
                    <span>已选中 {selectedNodes.length} 个节点作为参考上下文</span>
                 </div>
            )}

          {error && (
            <div className="mt-2 p-2 bg-red-50 text-red-600 text-xs rounded border border-red-100 flex items-start gap-1">
               <span className="mt-0.5">⚠️</span>
               <span>{error}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex justify-end gap-2">
          <button
            onClick={toggleAIModal}
            className="px-3 py-1.5 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors text-xs"
          >
            取消
          </button>
          <button
            onClick={handleGenerate}
            disabled={isLoading || (!prompt.trim() && !selectedImage)}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg font-medium text-white text-xs transition-all shadow-sm
              ${isLoading || (!prompt.trim() && !selectedImage)
                ? 'bg-purple-300 cursor-not-allowed' 
                : 'bg-purple-600 hover:bg-purple-700 shadow-purple-200 hover:shadow-purple-300'}
            `}
          >
            {isLoading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                正在生成...
              </>
            ) : (
              <>
                <Sparkles size={14} />
                生成
              </>
            )}
          </button>
        </div>
    </div>
  );
};

export default AIGenerator;