import React, { useState, useRef } from 'react';
import { useReactFlow, Panel } from 'reactflow';
import { useStore } from '../store';
import { Search, ChevronUp, ChevronDown, X } from 'lucide-react';
import { ToolType } from '../types';

const SearchBar: React.FC = () => {
    const { getNodes } = useReactFlow();
    const { setSelectedNodes } = useStore();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<string[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const { fitView } = useReactFlow();
    const inputRef = useRef<HTMLInputElement>(null);

    const performSearch = (text: string) => {
        if (!text.trim()) {
            setResults([]);
            setCurrentIndex(0);
            return;
        }

        const lowerQuery = text.toLowerCase();
        const allNodes = getNodes();
        
        // Sort nodes spatially (Top-Left to Bottom-Right) for logical navigation
        const sortedNodes = [...allNodes].sort((a, b) => {
            const ay = a.positionAbsolute?.y ?? a.position.y;
            const by = b.positionAbsolute?.y ?? b.position.y;
            const ax = a.positionAbsolute?.x ?? a.position.x;
            const bx = b.positionAbsolute?.x ?? b.position.x;
            
            // Tolerance of 50px for "same row"
            if (Math.abs(ay - by) > 50) return ay - by;
            return ax - bx;
        });

        const matches = sortedNodes.filter(node => {
            // Label
            if (node.data.label && String(node.data.label).toLowerCase().includes(lowerQuery)) return true;
            
            // Text Content (Sticky notes etc)
            if (node.data.text && String(node.data.text).toLowerCase().includes(lowerQuery)) return true;

            // Mind Map Content
            if (node.type === ToolType.MINDMAP && node.data.mindMapRoot) {
                const checkMindMap = (item: any): boolean => {
                    if (item.label && item.label.toLowerCase().includes(lowerQuery)) return true;
                    if (item.children) return item.children.some(checkMindMap);
                    return false;
                };
                return checkMindMap(node.data.mindMapRoot);
            }
            return false;
        }).map(n => n.id);

        setResults(matches);
        
        if (matches.length > 0) {
            setCurrentIndex(0);
            focusNode(matches[0]);
        } else {
            setCurrentIndex(0);
        }
    };

    const focusNode = (nodeId: string) => {
        const node = getNodes().find(n => n.id === nodeId);
        if (node) {
            setSelectedNodes([nodeId]);
            fitView({ 
                nodes: [node], 
                padding: 1, 
                duration: 800,
                maxZoom: 1.5
            });
        }
    };

    const handleNext = () => {
        if (results.length === 0) return;
        const nextIndex = (currentIndex + 1) % results.length;
        setCurrentIndex(nextIndex);
        focusNode(results[nextIndex]);
    };

    const handlePrev = () => {
        if (results.length === 0) return;
        const prevIndex = (currentIndex - 1 + results.length) % results.length;
        setCurrentIndex(prevIndex);
        focusNode(results[prevIndex]);
    };

    const handleClear = () => {
        setQuery('');
        setResults([]);
        setCurrentIndex(0);
        inputRef.current?.focus();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (e.shiftKey) {
                handlePrev();
            } else {
                handleNext();
            }
        }
    };

    return (
        <Panel position="top-right" className="m-4 mt-5">
            <div className="bg-white rounded-lg shadow-lg border border-gray-200 flex items-center p-1.5 transition-all w-64 focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-300">
                <Search size={16} className="text-gray-400 ml-2" />
                <input
                    ref={inputRef}
                    type="text"
                    placeholder="搜索画布..."
                    className="w-full text-sm bg-transparent border-none outline-none px-2 text-gray-700 placeholder-gray-400"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        performSearch(e.target.value);
                    }}
                    onKeyDown={handleKeyDown}
                />
                
                {query && (
                    <div className="flex items-center gap-1 border-l border-gray-100 pl-1 shrink-0">
                        <span className="text-[10px] text-gray-400 font-mono w-10 text-center select-none">
                            {results.length > 0 ? `${currentIndex + 1}/${results.length}` : '0/0'}
                        </span>
                        
                        <div className="flex flex-col gap-0.5">
                            <button 
                                onClick={handlePrev}
                                disabled={results.length === 0}
                                className="p-0.5 hover:bg-gray-100 rounded text-gray-500 disabled:opacity-30"
                                title="上一个 (Shift+Enter)"
                            >
                                <ChevronUp size={10} />
                            </button>
                            <button 
                                onClick={handleNext}
                                disabled={results.length === 0}
                                className="p-0.5 hover:bg-gray-100 rounded text-gray-500 disabled:opacity-30"
                                title="下一个 (Enter)"
                            >
                                <ChevronDown size={10} />
                            </button>
                        </div>

                        <button 
                            onClick={handleClear}
                            className="p-1 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 ml-1"
                        >
                            <X size={14} />
                        </button>
                    </div>
                )}
            </div>
        </Panel>
    );
};

export default SearchBar;