import React, { useState, useRef } from 'react';
import { useStore } from '../store';
import { useReactFlow, Node, Edge } from 'reactflow';
import { X, Sparkles, Loader2, GitBranch, LayoutDashboard, Image as ImageIcon, Trash2 } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { ToolType, NodeData, MindMapItem } from '../types';

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

const AIGenerator: React.FC = () => {
  const { isAIModalOpen, toggleAIModal, defaultStyle, setNodes, setEdges, takeSnapshot } = useStore();
  const { getNodes } = useReactFlow();
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'general' | 'mindmap'>('general');
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
      
      // Context Awareness: Calculate optimized starting position
      const existingNodes = getNodes();
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

      if (mode === 'general') {
        // --- GENERAL FLOWCHART STREAMING ---
        // Strategy: Request a SINGLE array of mixed items (nodes/edges) to allow continuous streaming
        // regardless of generation order.
        const instructions = `You are a UI/UX expert.
        
        **Supported Shapes**:
        - RECTANGLE (Process), CIRCLE (Start/End), DIAMOND (Decision)
        - CYLINDER (Database), CLOUD (Network), DOCUMENT (File)
        - PARALLELOGRAM (I/O), HEXAGON (Prep), STICKY_NOTE (Note)
        
        **Styling Rules**:
        - Use modern **PASTEL** colors (e.g., #EFF6FF, #FEF3C7, #F0FDF4).
        - Contrast border/text colors (e.g., #1E40AF for blue bg).
        
        **Layout Context**:
        - Start generating nodes near x=${startX}, y=${startY}.
        - Arrange nodes logically.
        
        **Output Format**:
        Return a JSON object with a SINGLE array named "elements".
        The array contains both Node objects and Edge objects.
        
        Item Schema (Node):
        { "category": "node", "id": "...", "type": "...", "label": "...", "x": 100, "y": 100, "width": 150, "height": 80, "backgroundColor": "...", "borderColor": "...", "textColor": "..." }
        
        Item Schema (Edge):
        { "category": "edge", "source": "...", "target": "...", "label": "..." }

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
                const uniqueId = `ai-${timestamp}-${rawId}`;

                if (!processedIds.has(uniqueId)) {
                    processedIds.add(uniqueId);
                    
                    if (el.category === 'node') {
                        newNodesToAdd.push({
                            id: uniqueId,
                            type: el.type || ToolType.RECTANGLE,
                            position: { x: el.x || startX, y: el.y || startY },
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
                                verticalAlign: 'center'
                            }
                        });
                    } else if (el.category === 'edge') {
                         newEdgesToAdd.push({
                            id: uniqueId,
                            source: `ai-${timestamp}-${el.source}`,
                            target: `ai-${timestamp}-${el.target}`,
                            label: el.label,
                            type: 'default',
                            animated: false,
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

      } else {
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
    <div className="absolute bottom-4 right-4 z-[100] w-[380px] bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden animate-in slide-in-from-bottom-5 fade-in duration-200 flex flex-col">
        
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
          
          {/* Mode Selection */}
          <div className="flex bg-gray-100 p-0.5 rounded-lg mb-3">
            <button 
                onClick={() => setMode('general')}
                className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-md text-xs font-medium transition-all ${
                    mode === 'general' 
                    ? 'bg-white text-purple-600 shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
            >
                <LayoutDashboard size={14} />
                通用流图
            </button>
            <button 
                onClick={() => setMode('mindmap')}
                className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-md text-xs font-medium transition-all ${
                    mode === 'mindmap' 
                    ? 'bg-white text-purple-600 shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
            >
                <GitBranch size={14} />
                思维导图
            </button>
          </div>

          <div className="relative">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={mode === 'general' 
                  ? "描述流程图、架构图或图表需求..." 
                  : "描述思维导图的主题或结构..."}
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