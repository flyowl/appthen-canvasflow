import React, { useState } from 'react';
import { useStore } from './store';
import { useReactFlow, Node, Edge } from 'reactflow';
import { X, Save, Box } from 'lucide-react';
import { SavedResource, NodeData } from './types';

const SaveResourceModal: React.FC = () => {
    const { 
        isSaveResourceModalOpen, 
        closeSaveResourceModal, 
        selectedNodes, 
        addResource 
    } = useStore();
    const { getNodes, getEdges } = useReactFlow();

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');

    if (!isSaveResourceModalOpen) return null;

    const handleSave = () => {
        if (!name.trim()) {
            alert("请输入组件名称");
            return;
        }

        const allNodes = getNodes();
        const allEdges = getEdges();
        const nodesToSave = allNodes.filter(n => selectedNodes.includes(n.id));
        
        // Find connected edges where both source and target are in the selection
        const edgesToSave = allEdges.filter(e => 
            selectedNodes.includes(e.source) && selectedNodes.includes(e.target)
        );

        // 1. Calculate bounding box of the selection using Absolute Positions
        let minAbsX = Infinity;
        let minAbsY = Infinity;

        nodesToSave.forEach(n => {
            const absX = n.positionAbsolute?.x ?? n.position.x;
            const absY = n.positionAbsolute?.y ?? n.position.y;
            if (absX < minAbsX) minAbsX = absX;
            if (absY < minAbsY) minAbsY = absY;
        });

        // 2. Normalize nodes
        const normalizedNodes = nodesToSave.map(n => {
            const isParentSelected = n.parentNode && selectedNodes.includes(n.parentNode);
            
            // Create a clean node object to avoid circular references or internal RF state
            const cleanNode = {
                id: n.id,
                type: n.type,
                data: { ...n.data, selected: false, isEditing: false },
                style: { ...n.style },
                width: n.width,
                height: n.height,
                parentNode: n.parentNode,
                extent: n.extent,
                position: { ...n.position }
            };

            if (isParentSelected) {
                // If parent is also saved, keep position relative (no change)
                return cleanNode;
            } else {
                // If root of selection, normalize position relative to bounding box
                const absX = n.positionAbsolute?.x ?? n.position.x;
                const absY = n.positionAbsolute?.y ?? n.position.y;
                
                return {
                    ...cleanNode,
                    // Detach from original parent if parent wasn't selected
                    parentNode: undefined,
                    position: {
                        x: absX - minAbsX,
                        y: absY - minAbsY
                    }
                };
            }
        });

        const resource: SavedResource = {
            id: `res-${Date.now()}`,
            name,
            description,
            nodes: normalizedNodes,
            edges: edgesToSave
        };

        addResource(resource);
        closeSaveResourceModal();
        setName('');
        setDescription('');
    };

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-[400px] overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                    <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                        <Box size={18} className="text-blue-600" />
                        保存到我的组件
                    </h3>
                    <button onClick={closeSaveResourceModal} className="text-gray-400 hover:text-gray-600">
                        <X size={20} />
                    </button>
                </div>
                
                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">名称</label>
                        <input 
                            type="text" 
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="例如：登录表单模版"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                            autoFocus
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">备注 (可选)</label>
                        <textarea 
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="描述该组件的用途..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm resize-none h-24"
                        />
                    </div>

                    <div className="bg-blue-50 p-3 rounded-lg text-xs text-blue-700">
                        已选中 {selectedNodes.length} 个节点。保存后可在“资源市场”中重复使用。
                    </div>
                </div>

                <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3 border-t border-gray-100">
                    <button 
                        onClick={closeSaveResourceModal}
                        className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
                    >
                        取消
                    </button>
                    <button 
                        onClick={handleSave}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                    >
                        <Save size={16} />
                        保存
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SaveResourceModal;