import React, { useState } from 'react';
import { useStore } from '../store';
import { useReactFlow, Node, Edge } from 'reactflow';
import { X, Sparkles, Loader2, Play } from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";
import { ToolType, NodeData } from '../types';

const AIGenerator: React.FC = () => {
  const { isAIModalOpen, toggleAIModal, defaultStyle } = useStore();
  const { getNodes, setNodes, setEdges } = useReactFlow();
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isAIModalOpen) return null;

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      // Calculate a position to place new nodes (to the right of existing ones)
      const existingNodes = getNodes();
      let startX = 100;
      let startY = 100;
      
      if (existingNodes.length > 0) {
         const maxX = Math.max(...existingNodes.map(n => n.position.x + (n.width || 150)));
         startX = maxX + 100;
      }

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Create a node-based diagram for: "${prompt}". 
        
        The available node types are: RECTANGLE, CIRCLE, TRIANGLE, TEXT.
        - Use RECTANGLE for processes, services, entities, or generic blocks.
        - Use CIRCLE for start/end points, interfaces, or users.
        - Use TRIANGLE for decisions or gateways.
        
        Guidelines:
        - Generate a logical layout with X and Y coordinates. Assume the top-left is (0,0).
        - Spacing between nodes should be sufficient (at least 200px horizontally or 150px vertically).
        - Provide a short, descriptive label for each node.
        - Connect related nodes with edges.
        - Suggest a background color for nodes if relevant (e.g., different colors for different layers), otherwise default to white.
        `,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              nodes: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING, description: "Unique ID for the node (e.g., '1', '2')" },
                    type: { type: Type.STRING, description: "One of: RECTANGLE, CIRCLE, TRIANGLE, TEXT" },
                    label: { type: Type.STRING },
                    x: { type: Type.NUMBER },
                    y: { type: Type.NUMBER },
                    width: { type: Type.NUMBER, description: "Default around 150" },
                    height: { type: Type.NUMBER, description: "Default around 80" },
                    backgroundColor: { type: Type.STRING, description: "Hex color code" },
                    textColor: { type: Type.STRING, description: "Hex color code, usually black or white" }
                  }
                }
              },
              edges: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    source: { type: Type.STRING, description: "ID of the source node" },
                    target: { type: Type.STRING, description: "ID of the target node" },
                    label: { type: Type.STRING, description: "Optional label for the connection" }
                  }
                }
              }
            }
          }
        }
      });

      const data = JSON.parse(response.text || '{}');
      
      if (!data.nodes || !Array.isArray(data.nodes)) {
        throw new Error("Invalid response format from AI");
      }

      const timestamp = Date.now();
      
      // Map AI nodes to React Flow nodes
      const newNodes: Node<NodeData>[] = data.nodes.map((n: any) => ({
        id: `ai-${timestamp}-${n.id}`,
        type: n.type || ToolType.RECTANGLE,
        position: { x: n.x + startX, y: n.y + startY },
        style: { width: n.width || 150, height: n.height || 80 },
        data: {
          ...defaultStyle,
          label: n.label,
          backgroundColor: n.backgroundColor || defaultStyle.backgroundColor,
          textColor: n.textColor || defaultStyle.textColor,
          width: n.width || 150,
          height: n.height || 80,
          align: 'center',
          verticalAlign: 'center'
        }
      }));

      // Map AI edges to React Flow edges
      const newEdges: Edge[] = (data.edges || []).map((e: any, i: number) => ({
        id: `edge-${timestamp}-${i}`,
        source: `ai-${timestamp}-${e.source}`,
        target: `ai-${timestamp}-${e.target}`,
        label: e.label,
        type: 'default', // or 'smoothstep', 'bezier'
        animated: false
      }));

      setNodes((nds) => [...nds, ...newNodes]);
      setEdges((eds) => [...eds, ...newEdges]);
      
      toggleAIModal();
      setPrompt('');
      
    } catch (err: any) {
      console.error("AI Generation Error:", err);
      setError(err.message || "Failed to generate diagram. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-50 to-white px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2 text-purple-700">
            <Sparkles size={20} />
            <h2 className="font-semibold text-lg">AI 智能生成</h2>
          </div>
          <button 
            onClick={toggleAIModal}
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            你想画什么？
          </label>
          <div className="relative">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="例如：生成一个电商系统的微服务架构图，包含用户服务、订单服务、支付服务和数据库..."
              className="w-full h-32 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-none text-sm transition-all"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                  handleGenerate();
                }
              }}
            />
            <div className="absolute bottom-3 right-3 text-xs text-gray-400">
              Ctrl + Enter 发送
            </div>
          </div>

          {error && (
            <div className="mt-3 p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-start gap-2">
               <span className="mt-0.5">⚠️</span>
               <span>{error}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
          <button
            onClick={toggleAIModal}
            className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors text-sm"
          >
            取消
          </button>
          <button
            onClick={handleGenerate}
            disabled={isLoading || !prompt.trim()}
            className={`flex items-center gap-2 px-6 py-2 rounded-lg font-medium text-white text-sm transition-all shadow-sm
              ${isLoading || !prompt.trim() 
                ? 'bg-purple-300 cursor-not-allowed' 
                : 'bg-purple-600 hover:bg-purple-700 shadow-purple-200 hover:shadow-purple-300'}
            `}
          >
            {isLoading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                正在思考...
              </>
            ) : (
              <>
                <Sparkles size={16} />
                生成
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIGenerator;