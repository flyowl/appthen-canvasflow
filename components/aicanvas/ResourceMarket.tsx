import React, { useState } from 'react';
import { useStore } from './store';
import { SavedResource } from './types';
import { X, Box, Trash2, GripVertical, ShoppingBag, User } from 'lucide-react';

const ResourceMarket: React.FC = () => {
    const { 
        isResourceMarketOpen, 
        toggleResourceMarket, 
        savedResources, 
        removeResource 
    } = useStore();
    const [activeTab, setActiveTab] = useState<'my' | 'market'>('my');

    if (!isResourceMarketOpen) return null;

    const onDragStart = (event: React.DragEvent, resource: SavedResource) => {
        // Serialize resource data for drop
        event.dataTransfer.setData('application/canvas-resource', JSON.stringify(resource));
        // Must match the dropEffect in App.tsx (move)
        event.dataTransfer.effectAllowed = 'move';
    };

    return (
        <div className="fixed top-0 left-0 h-full w-72 bg-white shadow-2xl border-r border-gray-200 z-[100] flex flex-col animate-in slide-in-from-left duration-300">
            {/* Header */}
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="font-semibold text-gray-800">资源市场</h2>
                <button 
                    onClick={toggleResourceMarket}
                    className="p-1 text-gray-400 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <X size={18} />
                </button>
            </div>

            {/* Tabs */}
            <div className="flex p-2 gap-1 bg-gray-50 border-b border-gray-100">
                <button
                    onClick={() => setActiveTab('my')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all ${
                        activeTab === 'my' 
                        ? 'bg-white text-blue-600 shadow-sm' 
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                    <User size={14} />
                    我的
                </button>
                <button
                    onClick={() => setActiveTab('market')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all ${
                        activeTab === 'market' 
                        ? 'bg-white text-purple-600 shadow-sm' 
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                    <ShoppingBag size={14} />
                    市场
                </button>
            </div>

            {/* Content List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-3">
                {activeTab === 'my' ? (
                    <>
                        {savedResources.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-40 text-gray-400 text-sm">
                                <Box size={32} className="mb-2 opacity-50" />
                                <p>暂无保存的组件</p>
                                <p className="text-xs mt-1">选中画板元素 -> 右键 -> 保存到我的</p>
                            </div>
                        ) : (
                            savedResources.map((resource) => (
                                <div 
                                    key={resource.id}
                                    draggable
                                    onDragStart={(e) => onDragStart(e, resource)}
                                    className="group bg-white border border-gray-200 rounded-lg p-3 hover:border-blue-300 hover:shadow-md transition-all cursor-grab active:cursor-grabbing relative"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="bg-blue-50 p-2 rounded text-blue-500">
                                            <Box size={20} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-medium text-gray-800 text-sm truncate">{resource.name}</h3>
                                            {resource.description && (
                                                <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{resource.description}</p>
                                            )}
                                            <div className="flex items-center gap-2 mt-2 text-[10px] text-gray-400">
                                                <span>{resource.nodes.length} 个节点</span>
                                            </div>
                                        </div>
                                        <div className="text-gray-300">
                                            <GripVertical size={16} />
                                        </div>
                                    </div>
                                    
                                    <button 
                                        onClick={() => removeResource(resource.id)}
                                        className="absolute bottom-2 right-2 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors opacity-0 group-hover:opacity-100"
                                        title="删除"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))
                        )}
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center h-40 text-gray-400 text-sm">
                        <ShoppingBag size={32} className="mb-2 opacity-50" />
                        <p>市场功能开发中...</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ResourceMarket;