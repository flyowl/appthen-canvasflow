
import React, { useCallback, useRef, useState, useEffect } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  ReactFlowProvider,
  useNodesState, // Removed usage
  useEdgesState, // Removed usage
  addEdge,
  Connection,
  Edge,
  Node,
  Panel,
  useReactFlow,
  OnSelectionChangeParams,
  XYPosition,
  NodeDragHandler,
  MarkerType,
  ConnectionMode,
  NodeMouseHandler,
} from 'reactflow';

import { useStore } from './store';
import { ToolType, NodeData, SavedResource } from './types';
import Toolbar from './components/Toolbar';
import PropertiesPanel from './components/PropertiesPanel';
import LayersPanel from './components/LayersPanel';
import SectionPanel from './components/SectionPanel';
import SearchBar from './components/SearchBar';
import ContextMenu from './components/ContextMenu';
import AIGenerator from './components/AIGenerator';
import ResourceMarket from './components/ResourceMarket';
import SaveResourceModal from './components/SaveResourceModal';

import { 
    RectangleNode, 
    CircleNode, 
    TextNode, 
    TriangleNode, 
    DiamondNode, 
    ParallelogramNode, 
    HexagonNode, 
    CylinderNode, 
    CloudNode, 
    DocumentNode,
    DrawingNode, 
    GroupNode,
    SectionNode, // Imported
    MindMapNode, 
    StickyNoteNode, 
    ImageNode, 
    VideoNode,
    CustomAgentNode,
    MarkdownNode
} from './components/nodes/CustomNodes';

const nodeTypes = {
  [ToolType.RECTANGLE]: RectangleNode,
  [ToolType.CIRCLE]: CircleNode,
  [ToolType.TRIANGLE]: TriangleNode,
  [ToolType.DIAMOND]: DiamondNode,
  [ToolType.PARALLELOGRAM]: ParallelogramNode,
  [ToolType.HEXAGON]: HexagonNode,
  [ToolType.CYLINDER]: CylinderNode,
  [ToolType.CLOUD]: CloudNode,
  [ToolType.DOCUMENT]: DocumentNode,
  [ToolType.TEXT]: TextNode,
  [ToolType.PEN]: DrawingNode,
  [ToolType.GROUP]: GroupNode,
  [ToolType.SECTION]: SectionNode, // Registered
  [ToolType.MINDMAP]: MindMapNode,
  [ToolType.STICKY_NOTE]: StickyNoteNode,
  [ToolType.IMAGE]: ImageNode,
  [ToolType.VIDEO]: VideoNode,
  [ToolType.CUSTOM_AGENT]: CustomAgentNode,
  [ToolType.MARKDOWN]: MarkdownNode,
};

// Helper to get distinct colors for each shape type
const getShapeStyles = (type: ToolType) => {
    switch (type) {
        case ToolType.RECTANGLE:
            return { backgroundColor: '#93c5fd', borderColor: '#2563eb' }; // Blue 300 / 600
        case ToolType.CIRCLE:
            return { backgroundColor: '#fcd34d', borderColor: '#d97706' }; // Amber 300 / 600
        case ToolType.TRIANGLE:
            return { backgroundColor: '#86efac', borderColor: '#16a34a' }; // Green 300 / 600
        case ToolType.DIAMOND:
            return { backgroundColor: '#d8b4fe', borderColor: '#9333ea' }; // Purple 300 / 600
        case ToolType.PARALLELOGRAM:
            return { backgroundColor: '#67e8f9', borderColor: '#0891b2' }; // Cyan 300 / 600
        case ToolType.HEXAGON:
            return { backgroundColor: '#f9a8d4', borderColor: '#db2777' }; // Pink 300 / 600
        case ToolType.CYLINDER:
            return { backgroundColor: '#cbd5e1', borderColor: '#475569' }; // Slate 300 / 600
        case ToolType.CLOUD:
            return { backgroundColor: '#7dd3fc', borderColor: '#0284c7' }; // Sky 300 / 600
        case ToolType.DOCUMENT:
            return { backgroundColor: '#e5e7eb', borderColor: '#4b5563' }; // Gray 200 / 600
        case ToolType.IMAGE:
        case ToolType.VIDEO:
        case ToolType.CUSTOM_AGENT:
        case ToolType.MARKDOWN:
            return { backgroundColor: '#ffffff', borderColor: '#e2e8f0' };
        default:
            return {};
    }
};

const CanvasBoard: React.FC = () => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  // Use Store for Nodes and Edges
  const { 
      nodes, edges, onNodesChange, onEdgesChange, setNodes, setEdges, onConnect: onStoreConnect,
      tool, setTool, defaultStyle, setSelectedNodes, selectedNodes, copiedNodes, setCopiedNodes, setSelectedEdges,
      takeSnapshot, openSaveResourceModal, isAIModalOpen, toggleAIModal
  } = useStore();

  const { project, getNodes, screenToFlowPosition, getViewport } = useReactFlow();
  
  // Interaction State
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const isMouseDown = useRef(false);

  // Drawing State
  const isDrawing = useRef(false);
  const currentPath = useRef<{x: number, y: number}[]>([]);
  const currentDrawingId = useRef<string | null>(null);

  // Context Menu State
  const [menuState, setMenuState] = useState<{
    isOpen: boolean;
    x: number;
    y: number;
  }>({ isOpen: false, x: 0, y: 0 });

  // Paste Event Listener
  useEffect(() => {
    const handlePaste = (event: ClipboardEvent) => {
        // Check if target is an input/textarea to avoid hijacking text pasting
        const target = event.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable || target.closest('.ProseMirror')) return;

        const items = event.clipboardData?.items;
        if (!items) return;

        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            
            // Handle Images (Bitmap & SVG Files)
            if (item.type.indexOf('image') !== -1) {
                const blob = item.getAsFile();
                if (blob) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        takeSnapshot();
                        
                        // Calculate center position based on current viewport
                        const { x, y, zoom } = getViewport();
                        // Assume standard screen center roughly
                        const centerX = (-x + (window.innerWidth / 2)) / zoom;
                        const centerY = (-y + (window.innerHeight / 2)) / zoom;

                        const src = event.target?.result as string;
                        const isSVG = blob.type.includes('svg');

                        const newNode: Node<NodeData> = {
                            id: `IMAGE-${Date.now()}`,
                            type: ToolType.IMAGE,
                            position: { x: centerX - 100, y: centerY - 100 }, // Center node
                            data: {
                                ...defaultStyle,
                                src: src,
                                label: isSVG ? 'SVG Graphics' : 'Pasted Image',
                                objectFit: 'contain'
                            },
                            style: { width: 200, height: 200 }
                        };
                        setNodes((nds) => nds.concat(newNode));
                    };
                    reader.readAsDataURL(blob);
                }
            } 
            // Handle SVG Text Code (text/plain)
            else if (item.type === 'text/plain') {
                item.getAsString((text) => {
                    const trimmed = text.trim();
                    // Robust check for SVG start tag, allowing for XML declaration or whitespace
                    // Checks if it contains <svg and </svg>
                    if (trimmed.match(/^(\s*<\?xml[^>]*\?>)?(\s*<!DOCTYPE[^>]*>)?\s*<svg/i) && trimmed.includes('</svg>')) {
                         takeSnapshot();
                         const { x, y, zoom } = getViewport();
                         const centerX = (-x + (window.innerWidth / 2)) / zoom;
                         const centerY = (-y + (window.innerHeight / 2)) / zoom;

                         // Use Blob to generate Data URL for the SVG text
                         const blob = new Blob([trimmed], { type: 'image/svg+xml' });
                         const reader = new FileReader();
                         reader.onload = (e) => {
                             const src = e.target?.result as string;
                             const newNode: Node<NodeData> = {
                                id: `SVG-${Date.now()}`,
                                type: ToolType.IMAGE,
                                position: { x: centerX - 100, y: centerY - 100 },
                                data: {
                                    ...defaultStyle,
                                    src: src,
                                    label: 'Pasted SVG',
                                    objectFit: 'contain'
                                },
                                style: { width: 200, height: 200 }
                             };
                             setNodes((nds) => nds.concat(newNode));
                         };
                         reader.readAsDataURL(blob);
                    }
                });
            }
        }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [setNodes, takeSnapshot, getViewport, defaultStyle]);


  const onConnect = useCallback(
    (params: Connection | Edge) => {
        // Wrap params to ensure default styles
        const connection = {
            ...params, 
            type: 'default', 
            markerEnd: { type: MarkerType.ArrowClosed, color: '#000000' },
            style: { stroke: '#000000', strokeWidth: 2 }
        };
        onStoreConnect(connection as Connection);
    },
    [onStoreConnect]
  );

  const onSelectionChange = useCallback(({ nodes, edges }: OnSelectionChangeParams) => {
    setSelectedNodes(nodes.map(n => n.id));
    setSelectedEdges(edges.map(e => e.id));
  }, [setSelectedNodes, setSelectedEdges]);

  // Double click node to edit text
  const onNodeDoubleClick = useCallback((event: React.MouseEvent, node: Node) => {
    event.preventDefault();
    if (node.type === ToolType.PEN || node.type === ToolType.MINDMAP || node.type === ToolType.IMAGE || node.type === ToolType.VIDEO || node.type === ToolType.MARKDOWN || tool === ToolType.ERASER) return; 
    
    // Direct update to store for editing state (no snapshot needed strictly for UI toggle)
    setNodes((nds) => nds.map((n) => {
        if (n.id === node.id) {
            return { ...n, data: { ...n.data, isEditing: true } };
        }
        return n;
    }));
  }, [setNodes, tool]);

  // Eraser Logic: Click to erase
  const onNodeClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
        if (tool === ToolType.ERASER && node.type === ToolType.PEN) {
            takeSnapshot();
            setNodes((nds) => nds.filter((n) => n.id !== node.id));
        }
    },
    [tool, setNodes, takeSnapshot]
  );

  // Eraser Logic: Drag to erase (Hover while mouse down)
  const onNodeMouseEnter = useCallback(
      (event: React.MouseEvent, node: Node) => {
          if (tool === ToolType.ERASER && isMouseDown.current && node.type === ToolType.PEN) {
              setNodes((nds) => nds.filter((n) => n.id !== node.id));
          }
      },
      [tool, setNodes]
  );

  // Double click edge to edit label
  const onEdgeDoubleClick = useCallback((event: React.MouseEvent, edge: Edge) => {
    event.preventDefault();
    const currentLabel = typeof edge.label === 'string' ? edge.label : '';
    const newLabel = window.prompt('请输入连接线文字:', currentLabel);
    
    if (newLabel !== null) {
        takeSnapshot();
        setEdges((eds) => eds.map((e) => {
            if (e.id === edge.id) {
                return { ...e, label: newLabel };
            }
            return e;
        }));
    }
  }, [setEdges, takeSnapshot]);

  const isDescendant = useCallback((targetId: string, potentialAncestorId: string, allNodes: Node[]) => {
      if (targetId === potentialAncestorId) return true;
      let currentId: string | undefined = targetId;
      while (currentId) {
          const node = allNodes.find(n => n.id === currentId);
          if (!node) break;
          if (node.parentNode === potentialAncestorId) return true;
          currentId = node.parentNode;
      }
      return false;
  }, []);

  const findTargetGroup = useCallback((node: Node, allNodes: Node[], absPos?: {x: number, y: number}) => {
      // Use provided absolute position or fallback to node's internal state
      const absX = absPos ? absPos.x : (node.positionAbsolute?.x ?? node.position.x);
      const absY = absPos ? absPos.y : (node.positionAbsolute?.y ?? node.position.y);
      const width = node.width || Number(node.style?.width) || 150;
      const height = node.height || Number(node.style?.height) || 50;
      const centerX = absX + width / 2;
      const centerY = absY + height / 2;

      // Filter for SECTIONS ONLY (Partition feature). Exclude logical Groups from drop-to-parent.
      const groups = allNodes.filter(n => n.type === ToolType.SECTION && n.id !== node.id);

      // Check intersections (reverse order to hit top-most group first)
      for (let i = groups.length - 1; i >= 0; i--) {
          const group = groups[i];
          const gX = group.positionAbsolute?.x ?? group.position.x;
          const gY = group.positionAbsolute?.y ?? group.position.y;
          const gW = group.width || Number(group.style?.width) || 0;
          const gH = group.height || Number(group.style?.height) || 0;

          if (centerX >= gX && centerX <= gX + gW && centerY >= gY && centerY <= gY + gH) {
              return group;
          }
      }
      return undefined;
  }, []);

  // Snapshot before dragging starts
  const onNodeDragStart: NodeDragHandler = useCallback(() => {
      takeSnapshot();
  }, [takeSnapshot]);

  const onNodeDrag: NodeDragHandler = useCallback((event, node, draggedNodes) => {
      const allNodes = getNodes();
      
      // Determine which nodes we are actively dragging
      // When dragging a selection, draggedNodes contains all of them.
      const nodesToCheck = draggedNodes && draggedNodes.length > 0 ? draggedNodes : [node];
      const sectionsToHighlight = new Set<string>();

      nodesToCheck.forEach(draggedNode => {
          let absX = draggedNode.positionAbsolute?.x;
          let absY = draggedNode.positionAbsolute?.y;
          
          // Calculate absolute position if missing
          if (typeof absX !== 'number' || typeof absY !== 'number') {
             const originalNode = allNodes.find(n => n.id === draggedNode.id);
             if (originalNode && originalNode.parentNode) {
                 const parent = allNodes.find(n => n.id === originalNode.parentNode);
                 if (parent && parent.positionAbsolute) {
                     absX = parent.positionAbsolute.x + draggedNode.position.x;
                     absY = parent.positionAbsolute.y + draggedNode.position.y;
                 } else {
                     absX = draggedNode.position.x;
                     absY = draggedNode.position.y;
                 }
             } else {
                 absX = draggedNode.position.x;
                 absY = draggedNode.position.y;
             }
          }

          // Use basic intersection check for highlighting
          const targetGroup = findTargetGroup(draggedNode, allNodes, { x: absX!, y: absY! });
          
          if (targetGroup && !isDescendant(targetGroup.id, draggedNode.id, allNodes)) {
              sectionsToHighlight.add(targetGroup.id);
          }
      });

      setNodes((currentNodes) => currentNodes.map(n => {
          if (n.type === ToolType.SECTION) {
              const shouldHighlight = sectionsToHighlight.has(n.id);
              if (n.data.isHighlight !== shouldHighlight) {
                  return { ...n, data: { ...n.data, isHighlight: shouldHighlight } };
              }
          }
          return n;
      }));
  }, [getNodes, setNodes, findTargetGroup, isDescendant]);

  const onNodeDragStop: NodeDragHandler = useCallback(
    (event, node, draggedNodes) => {
        // Reset all section highlights
        setNodes(nds => nds.map(n => n.type === ToolType.SECTION ? { ...n, data: { ...n.data, isHighlight: false } } : n));

        // Get fresh layout data
        const nodesWithLayout = getNodes();
        
        // IMPORTANT: Process all dragged nodes if selection was dragged
        const nodesToProcess = draggedNodes && draggedNodes.length > 0 ? draggedNodes : [node];
        
        setNodes((currentNodes) => {
            let updatedNodesList = [...currentNodes];
            const nodeMap = new Map(updatedNodesList.map(n => [n.id, n]));

            nodesToProcess.forEach((draggedNode) => {
                const currentNodeState = nodeMap.get(draggedNode.id);
                if (!currentNodeState) return;

                // 1. Determine the Absolute Position of the dragged node
                let absX = draggedNode.positionAbsolute?.x;
                let absY = draggedNode.positionAbsolute?.y;

                // Robust fallback for absolute position calculation
                if (typeof absX !== 'number' || typeof absY !== 'number') {
                    if (currentNodeState.parentNode) {
                        const parent = nodesWithLayout.find(n => n.id === currentNodeState.parentNode);
                        if (parent && parent.positionAbsolute) {
                            absX = parent.positionAbsolute.x + draggedNode.position.x;
                            absY = parent.positionAbsolute.y + draggedNode.position.y;
                        } else {
                            // Fallback to position if parent not found or parent is root
                            absX = draggedNode.position.x;
                            absY = draggedNode.position.y;
                        }
                    } else {
                         absX = draggedNode.position.x;
                         absY = draggedNode.position.y;
                    }
                }

                // Try to get dimensions from various sources
                const width = (draggedNode as any).measured?.width ?? draggedNode.width ?? currentNodeState.width ?? currentNodeState.style?.width ?? 150;
                const height = (draggedNode as any).measured?.height ?? draggedNode.height ?? currentNodeState.height ?? currentNodeState.style?.height ?? 50;

                // 2. Check for intersection with a SECTION
                const checkNode = {
                    ...draggedNode,
                    id: draggedNode.id,
                    width: Number(width), 
                    height: Number(height),
                    positionAbsolute: { x: absX!, y: absY! },
                    position: { x: absX!, y: absY! }
                };

                // Filter explicitly searches only for SECTION
                let targetGroup = findTargetGroup(checkNode, nodesWithLayout, { x: absX!, y: absY! });
                
                // Prevent circular referencing
                if (targetGroup && (targetGroup.id === draggedNode.id || isDescendant(targetGroup.id, draggedNode.id, nodesWithLayout))) {
                    targetGroup = undefined;
                }

                // 3. Update Parent and Position logic
                if (targetGroup) {
                    // Moving INTO a Section
                    if (currentNodeState.parentNode !== targetGroup.id) {
                        const groupAbsX = targetGroup.positionAbsolute?.x ?? targetGroup.position.x;
                        const groupAbsY = targetGroup.positionAbsolute?.y ?? targetGroup.position.y;

                        const newNode = {
                            ...currentNodeState,
                            parentNode: targetGroup.id,
                            extent: undefined, 
                            position: {
                                x: absX! - groupAbsX,
                                y: absY! - groupAbsY
                            },
                            // Preserve layout dims if needed or rely on component style
                            width: currentNodeState.width,
                            height: currentNodeState.height,
                            style: currentNodeState.style
                        };
                        const idx = updatedNodesList.findIndex(n => n.id === newNode.id);
                        if (idx !== -1) updatedNodesList[idx] = newNode;
                    }
                } else {
                    // Moving OUT...
                    if (currentNodeState.parentNode) {
                        const parentNode = nodesWithLayout.find(n => n.id === currentNodeState.parentNode);
                        
                        // Only detach automatically if the parent was a SECTION. 
                        // If parent was a GROUP (Logical combination), do not detach on drag.
                        if (!parentNode || parentNode.type === ToolType.SECTION) {
                            const newNode = {
                                ...currentNodeState,
                                parentNode: undefined,
                                extent: undefined,
                                position: {
                                    x: absX!,
                                    y: absY!
                                },
                                width: currentNodeState.width,
                                height: currentNodeState.height,
                                style: currentNodeState.style
                            };
                            const idx = updatedNodesList.findIndex(n => n.id === newNode.id);
                            if (idx !== -1) {
                                updatedNodesList[idx] = newNode;
                            }
                        }
                    }
                }
            });

            return updatedNodesList;
        });
    },
    [getNodes, setNodes, findTargetGroup, isDescendant]
  );

  const onNodeContextMenu = useCallback(
    (event: React.MouseEvent, node: Node) => {
      event.preventDefault();
      
      // If the clicked node is NOT in the current selection, select ONLY it
      if (!selectedNodes.includes(node.id)) {
        setNodes((nds) => nds.map((n) => ({
            ...n,
            selected: n.id === node.id
        })));
        setSelectedNodes([node.id]);
      }
      // If it IS in the selection, do NOT clear selection, just open menu

      setMenuState({
        isOpen: true,
        x: event.clientX,
        y: event.clientY,
      });
    },
    [selectedNodes, setSelectedNodes, setNodes]
  );

  // Handler for multiple selection context menu (when clicking the selection box or items)
  const onSelectionContextMenu = useCallback(
    (event: React.MouseEvent, nodes: Node[]) => {
      event.preventDefault();
      setMenuState({
        isOpen: true,
        x: event.clientX,
        y: event.clientY,
      });
    },
    []
  );

  const onPaneContextMenu = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault();
      setMenuState({
        isOpen: true,
        x: event.clientX,
        y: event.clientY,
      });
    },
    []
  );

  const closeContextMenu = useCallback(() => {
      setMenuState((prev) => ({ ...prev, isOpen: false }));
  }, []);

  const handleMenuAction = useCallback((action: string) => {
      const selectedNodeObjs = getNodes().filter(n => selectedNodes.includes(n.id));

      // Actions that modify structure need snapshots
      if(['delete', 'paste', 'front', 'back', 'forward', 'backward', 'group', 'ungroup', 'ai_generate'].includes(action)) {
          takeSnapshot();
      }

      switch(action) {
          case 'ai_generate':
              if (!isAIModalOpen) toggleAIModal();
              break;
              
          case 'saveResource':
              openSaveResourceModal();
              break;

          case 'delete':
              const nodesToDeleteIds = [...selectedNodes];
              const groupsToDelete = selectedNodeObjs.filter(n => n.type === ToolType.GROUP || n.type === ToolType.SECTION);
              if (groupsToDelete.length > 0) {
                  const allNodes = getNodes();
                  groupsToDelete.forEach(g => {
                      const children = allNodes.filter(n => n.parentNode === g.id);
                      nodesToDeleteIds.push(...children.map(c => c.id));
                  });
              }
              setNodes((nds) => nds.filter(n => !nodesToDeleteIds.includes(n.id)));
              setSelectedNodes([]);
              break;
          
          case 'copy':
              setCopiedNodes(selectedNodeObjs);
              break;
          
          case 'paste':
              if (copiedNodes.length > 0) {
                  const minX = Math.min(...copiedNodes.map(n => n.position.x));
                  const minY = Math.min(...copiedNodes.map(n => n.position.y));
                  
                  let offsetX = 20;
                  let offsetY = 20;

                  if (menuState.isOpen && reactFlowWrapper.current) {
                      const flowPos = screenToFlowPosition({ x: menuState.x, y: menuState.y });
                      offsetX = flowPos.x - minX;
                      offsetY = flowPos.y - minY;
                  }

                  const newNodes = copiedNodes.map((node) => ({
                      ...node,
                      id: `${node.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                      position: {
                          x: node.position.x + offsetX,
                          y: node.position.y + offsetY
                      },
                      selected: true,
                      parentNode: undefined,
                      data: { ...node.data, isEditing: false } 
                  }));
                  
                  setNodes((nds) => nds.map(n => ({...n, selected: false})).concat(newNodes));
                  setSelectedNodes(newNodes.map(n => n.id));
              }
              break;

          case 'front': 
              setNodes((prevNodes) => {
                  const selected = new Set(selectedNodes);
                  const movingNodes = prevNodes.filter(n => selected.has(n.id));
                  const otherNodes = prevNodes.filter(n => !selected.has(n.id));
                  return [...otherNodes, ...movingNodes];
              });
              break;

          case 'back': 
              setNodes((prevNodes) => {
                  const selected = new Set(selectedNodes);
                  const movingNodes = prevNodes.filter(n => selected.has(n.id));
                  const otherNodes = prevNodes.filter(n => !selected.has(n.id));
                  return [...movingNodes, ...otherNodes];
              });
              break;

          case 'forward': 
              setNodes((prevNodes) => {
                  const newNodes = [...prevNodes];
                  for (let i = newNodes.length - 2; i >= 0; i--) {
                      const node = newNodes[i];
                      if (selectedNodes.includes(node.id)) {
                          const nextNode = newNodes[i+1];
                          if (!selectedNodes.includes(nextNode.id)) {
                              newNodes[i] = nextNode;
                              newNodes[i+1] = node;
                          }
                      }
                  }
                  return newNodes;
              });
              break;

          case 'backward':
              setNodes((prevNodes) => {
                  const newNodes = [...prevNodes];
                  for (let i = 1; i < newNodes.length; i++) {
                      const node = newNodes[i];
                      if (selectedNodes.includes(node.id)) {
                          const prevNode = newNodes[i-1];
                          if (!selectedNodes.includes(prevNode.id)) {
                              newNodes[i] = prevNode;
                              newNodes[i-1] = node;
                          }
                      }
                  }
                  return newNodes;
              });
              break;

          case 'group':
              if (selectedNodeObjs.length > 1) {
                  const minX = Math.min(...selectedNodeObjs.map(n => n.position.x));
                  const minY = Math.min(...selectedNodeObjs.map(n => n.position.y));
                  
                  let maxX = -Infinity;
                  let maxY = -Infinity;

                  selectedNodeObjs.forEach(n => {
                      const w = (n.style?.width as number) || n.width || 0;
                      const h = (n.style?.height as number) || n.height || 0;
                      maxX = Math.max(maxX, n.position.x + w);
                      maxY = Math.max(maxY, n.position.y + h);
                  });
                  
                  const padding = 20; 
                  const width = maxX - minX + (padding * 2);
                  const height = maxY - minY + (padding * 2);
                  const groupX = minX - padding;
                  const groupY = minY - padding;

                  const groupId = `group-${Date.now()}`;

                  const groupNode: Node<NodeData> = {
                      id: groupId,
                      type: ToolType.GROUP, // Logical grouping
                      position: { x: groupX, y: groupY },
                      style: { width, height },
                      data: { 
                          ...defaultStyle, 
                          label: '', 
                          align: 'left',
                          verticalAlign: 'top',
                          backgroundColor: 'transparent', 
                          borderColor: 'transparent',
                          borderWidth: 0
                      },
                  };

                  const updatedChildren = selectedNodeObjs.map(n => ({
                      ...n,
                      parentNode: groupId,
                      position: {
                          x: n.position.x - groupX,
                          y: n.position.y - groupY
                      },
                      draggable: false 
                  }));

                  setNodes((nds) => {
                      const nonSelected = nds.filter(n => !selectedNodes.includes(n.id));
                      return [...nonSelected, groupNode, ...updatedChildren];
                  });
                  
                  setSelectedNodes([groupId]);
              }
              break;

          case 'ungroup':
              const groups = selectedNodeObjs.filter(n => n.type === ToolType.GROUP || n.type === ToolType.SECTION);
              if (groups.length > 0) {
                  const groupIds = groups.map(g => g.id);
                  const children = getNodes().filter(n => groupIds.includes(n.parentNode || ''));
                  
                  const ungroupedChildren = children.map(child => {
                      const parent = groups.find(g => g.id === child.parentNode);
                      if (!parent) return child;
                      
                      const parentAbsX = parent.positionAbsolute?.x || parent.position.x;
                      const parentAbsY = parent.positionAbsolute?.y || parent.position.y;

                      return {
                          ...child,
                          parentNode: undefined,
                          extent: undefined,
                          position: {
                              x: child.position.x + parentAbsX,
                              y: child.position.y + parentAbsY
                          },
                          draggable: true
                      };
                  });

                  setNodes((nds) => {
                      const remaining = nds.filter(n => !groupIds.includes(n.id) && !children.find(c => c.id === n.id));
                      return [...remaining, ...ungroupedChildren];
                  });
                  setSelectedNodes(ungroupedChildren.map(n => n.id));
              }
              break;
      }
  }, [selectedNodes, copiedNodes, menuState, getNodes, setNodes, setSelectedNodes, setCopiedNodes, screenToFlowPosition, defaultStyle, takeSnapshot, openSaveResourceModal, isAIModalOpen, toggleAIModal]);


  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      let position = { x: 0, y: 0 };
      if (screenToFlowPosition) {
        position = screenToFlowPosition({
            x: event.clientX,
            y: event.clientY,
        });
      }

      // 0. Handle Resource Market Drops
      const resourceData = event.dataTransfer.getData('application/canvas-resource');
      if (resourceData) {
          try {
              const resource: SavedResource = JSON.parse(resourceData);
              takeSnapshot();
              
              const idMap = new Map<string, string>();
              
              // 1. Generate ID Map to ensure unique IDs on drop
              resource.nodes.forEach(node => {
                  const newId = `res-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
                  idMap.set(node.id, newId);
              });

              // Calculate bounding box of root nodes to center the drop
              let maxWidth = 0;
              let maxHeight = 0;
              resource.nodes.forEach(n => {
                    // Only consider root nodes for centering logic (no parent in the set)
                    if (!n.parentNode || !resource.nodes.find(p => p.id === n.parentNode)) {
                        const w = n.width || n.style?.width || 150;
                        const h = n.height || n.style?.height || 50;
                        // Since roots are normalized to (0,0) based on SaveResourceModal logic,
                        // we can assume position represents offset from the top-left of the original selection.
                        const right = n.position.x + Number(w);
                        const bottom = n.position.y + Number(h);
                        if (right > maxWidth) maxWidth = right;
                        if (bottom > maxHeight) maxHeight = bottom;
                    }
              });

              // Offset to center the resource group under cursor
              const offsetX = position.x - (maxWidth / 2);
              const offsetY = position.y - (maxHeight / 2);

              // 2. Reconstruct Nodes
              const newNodes = resource.nodes.map(node => {
                  const newId = idMap.get(node.id)!;
                  
                  // Check if parent was also dragged/saved. If so, remap parent ID.
                  let newParentId = undefined;
                  if (node.parentNode && idMap.has(node.parentNode)) {
                      newParentId = idMap.get(node.parentNode);
                  }

                  // Clone position to avoid mutation
                  let newPos = { ...node.position };

                  // If this node does NOT have a parent in the new set (i.e. it's a root node of this group),
                  // shift its position to the mouse drop location.
                  // Note: node.position for root nodes in the resource is already normalized relative to the group origin.
                  if (!newParentId) {
                      newPos.x += offsetX;
                      newPos.y += offsetY;
                  }
                  
                  return {
                      ...node,
                      id: newId,
                      parentNode: newParentId,
                      position: newPos,
                      // Ensure fresh state
                      selected: true,
                      dragging: false,
                      positionAbsolute: undefined, // Let React Flow recalculate
                      data: { ...node.data, isEditing: false }
                  };
              });
              
              // 3. Reconstruct Edges
              const newEdges = resource.edges.map(edge => ({
                  ...edge,
                  id: `res-edge-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
                  source: idMap.get(edge.source) || edge.source,
                  target: idMap.get(edge.target) || edge.target,
                  selected: false
              }));
              
              setNodes(nds => [...nds.map(n => ({...n, selected: false})), ...newNodes]);
              setEdges(eds => [...eds, ...newEdges]);
              setSelectedNodes(newNodes.map(n => n.id));
              
          } catch (e) {
              console.error("Failed to parse resource drop", e);
          }
          return;
      }

      // 1. Handle File Drops from Desktop (Images/Videos)
      if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
          takeSnapshot();
          const files = Array.from(event.dataTransfer.files);
          let offset = 0;

          files.forEach((fileItem) => {
              const file = fileItem as File;
              if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
                  const isVideo = file.type.startsWith('video/');
                  const toolType = isVideo ? ToolType.VIDEO : ToolType.IMAGE;
                  
                  const reader = new FileReader();
                  reader.onload = (e) => {
                      const result = e.target?.result as string;
                      const newNode: Node<NodeData> = {
                          id: `${toolType}-${Date.now()}-${offset}`,
                          type: toolType,
                          position: { x: position.x + offset, y: position.y + offset },
                          data: {
                              ...defaultStyle,
                              src: result,
                              label: file.name
                          },
                          style: { width: isVideo ? 300 : 200, height: isVideo ? 200 : 200 }
                      };
                      setNodes((nds) => nds.concat(newNode));
                      offset += 30; // Cascade effect
                  };
                  reader.readAsDataURL(file);
              }
          });
          return;
      }

      // 2. Handle Tool Drops from Toolbar
      const type = event.dataTransfer.getData('application/reactflow') as ToolType;
      if (typeof type === 'undefined' || !type) {
        return;
      }

      takeSnapshot(); 

      const specificStyles = getShapeStyles(type);
      const isLarge = type === ToolType.SECTION || type === ToolType.VIDEO || type === ToolType.CUSTOM_AGENT || type === ToolType.MARKDOWN;

      const newNode: Node<NodeData> = {
        id: `${type}-${Date.now()}`,
        type,
        position,
        data: {
          label: type === ToolType.TEXT ? '双击编辑' : (
              type === ToolType.SECTION ? '分区' : (
                type === ToolType.STICKY_NOTE ? '添加文本' : (
                  type === ToolType.CUSTOM_AGENT ? '写一个小红书文案 桌子' : (
                    type === ToolType.MARKDOWN ? 'Markdown Editor' : '形状'
                  )
                )
              )
          ),
          ...defaultStyle,
          ...specificStyles,
          ...(type === ToolType.SECTION ? {
              align: 'left',
              verticalAlign: 'top',
              backgroundColor: 'rgba(241, 245, 249, 0.5)', 
              borderColor: 'transparent',
              borderWidth: 0
          } : {}),
          ...(type === ToolType.STICKY_NOTE ? {
            backgroundColor: '#fef08a', 
            borderColor: 'transparent',
            borderWidth: 0,
            align: 'left',
            verticalAlign: 'top',
            fontSize: 14,
            textColor: '#422006',
          } : {}),
           ...(type === ToolType.CUSTOM_AGENT ? {
             align: 'left',
             verticalAlign: 'top',
             fontSize: 14,
             textColor: '#334155',
             backgroundColor: '#ffffff',
             borderColor: '#e2e8f0'
          } : {}),
           ...(type === ToolType.MARKDOWN ? {
             backgroundColor: '#ffffff',
             borderColor: '#e2e8f0',
             borderWidth: 1,
             width: 150,
             height: 400,
             markdownContent: '请编写内容...'
           } : {}),
          ...(type === ToolType.MINDMAP ? {
             mindMapRoot: {
                 id: 'root',
                 label: '中心主题',
                 children: [
                     { id: `c-${Date.now()}-1`, label: '分支 1', children: [] },
                     { id: `c-${Date.now()}-2`, label: '分支 2', children: [] },
                 ]
             }
          }: {})
        },
        style: {
             width: (type === ToolType.TEXT) ? undefined : (isLarge ? 300 : 150), 
             height: (type === ToolType.TEXT) ? undefined : (isLarge ? 300 : 150)
        }
      };

      // SECTIONs should be added at the beginning of the array to render at the bottom (Z-index 0)
      if (type === ToolType.SECTION) {
          setNodes((nds) => [newNode, ...nds]);
      } else {
          setNodes((nds) => nds.concat(newNode));
      }
      setTool(ToolType.SELECT);
    },
    [project, screenToFlowPosition, setNodes, setTool, defaultStyle, takeSnapshot, setEdges, setSelectedNodes]
  );


  const onPaneClick = useCallback(
    (event: React.MouseEvent) => {
      closeContextMenu();
      
      setNodes((nds) => nds.map(n => {
        if (n.data.isEditing) {
            return { ...n, data: { ...n.data, isEditing: false } };
        }
        return n;
    }));

      if (tool === ToolType.SELECT || tool === ToolType.HAND || tool === ToolType.PEN || tool === ToolType.ERASER) return;

      const target = event.target as HTMLElement;
      if(target.closest('.react-flow__panel') || target.closest('button')) return;

      if (reactFlowWrapper.current) {
        const bounds = reactFlowWrapper.current.getBoundingClientRect();
        const position = project({
          x: event.clientX - bounds.left,
          y: event.clientY - bounds.top,
        });

        takeSnapshot(); // Snapshot on new element click create

        const specificStyles = getShapeStyles(tool);
        const isLarge = tool === ToolType.SECTION || tool === ToolType.VIDEO || tool === ToolType.CUSTOM_AGENT || tool === ToolType.MARKDOWN;

        const newNode: Node<NodeData> = {
          id: `${tool}-${Date.now()}`,
          type: tool,
          position,
          data: {
            label: tool === ToolType.TEXT ? '双击编辑' : (
                tool === ToolType.SECTION ? '分区' : (
                    tool === ToolType.STICKY_NOTE ? '添加文本' : (
                         tool === ToolType.CUSTOM_AGENT ? '写一个小红书文案 桌子' : (
                            tool === ToolType.MARKDOWN ? 'Markdown Editor' : '形状'
                         )
                    )
                )
            ),
            ...defaultStyle,
            ...specificStyles,
            ...(tool === ToolType.SECTION ? {
              align: 'left',
              verticalAlign: 'top',
              backgroundColor: 'rgba(241, 245, 249, 0.5)', 
              borderColor: 'transparent',
              borderWidth: 0
            } : {}),
            ...(tool === ToolType.STICKY_NOTE ? {
              backgroundColor: '#fef08a',
              borderColor: 'transparent',
              borderWidth: 0,
              align: 'left',
              verticalAlign: 'top',
              fontSize: 14,
              textColor: '#422006',
            } : {}),
             ...(tool === ToolType.CUSTOM_AGENT ? {
                align: 'left',
                verticalAlign: 'top',
                fontSize: 14,
                textColor: '#334155',
                backgroundColor: '#ffffff',
                borderColor: '#e2e8f0'
            } : {}),
            ...(tool === ToolType.MARKDOWN ? {
                backgroundColor: '#ffffff',
                borderColor: '#e2e8f0',
                borderWidth: 1,
                width: 150,
                height: 400,
                markdownContent: '请编写内容...'
            } : {}),
            ...(tool === ToolType.MINDMAP ? {
                mindMapRoot: {
                    id: 'root',
                    label: '中心主题',
                    children: [
                        { id: `c-${Date.now()}-1`, label: '分支 1', children: [] },
                        { id: `c-${Date.now()}-2`, label: '分支 2', children: [] },
                    ]
                }
             }: {})
          },
          style: {
             width: (tool === ToolType.TEXT) ? undefined : (isLarge ? 300 : 150), 
             height: (tool === ToolType.TEXT) ? undefined : (isLarge ? 300 : 150)
        }
      };

      // SECTIONs should be added at the beginning of the array to render at the bottom (Z-index 0)
      if (tool === ToolType.SECTION) {
        setNodes((nds) => [newNode, ...nds]);
      } else {
        setNodes((nds) => nds.concat(newNode));
      }
      setTool(ToolType.SELECT);
    }
    },
    [project, tool, setTool, setNodes, defaultStyle, closeContextMenu, takeSnapshot]
  );

  const onMouseDown = useCallback(
    (event: React.MouseEvent) => {
      isMouseDown.current = true;
      
      if(menuState.isOpen) closeContextMenu();

      const target = event.target as HTMLElement;
      if(target.closest('.react-flow__panel') || target.closest('button') || target.closest('.react-flow__controls') || target.closest('.react-flow__minimap')) return;

      if (tool !== ToolType.PEN || !reactFlowWrapper.current) return;

      const bounds = reactFlowWrapper.current.getBoundingClientRect();
      const position = project({
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      });

      isDrawing.current = true;
      currentDrawingId.current = `pen-${Date.now()}`;
      currentPath.current = [{ x: 0, y: 0 }]; 

      // For pen, we snapshot at start
      takeSnapshot();

      const newNode: Node<NodeData> = {
        id: currentDrawingId.current,
        type: ToolType.PEN,
        position,
        data: {
          backgroundColor: 'transparent',
          borderColor: defaultStyle.borderColor,
          borderWidth: defaultStyle.borderWidth || 3, // Ensure visible width if default is 0
          textColor: 'transparent',
          fontSize: 0,
          path: `M 0 0`,
        },
        draggable: false, 
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [tool, project, defaultStyle, setNodes, menuState, closeContextMenu, takeSnapshot]
  );

  const onMouseMove = useCallback(
    (event: React.MouseEvent) => {
      if (!isDrawing.current || tool !== ToolType.PEN || !reactFlowWrapper.current || !currentDrawingId.current) return;

      const currentNode = getNodes().find(n => n.id === currentDrawingId.current);
      if(!currentNode) return;

      const bounds = reactFlowWrapper.current.getBoundingClientRect();
      const currentPos = project({
         x: event.clientX - bounds.left,
         y: event.clientY - bounds.top
      });
      
      const relativeX = currentPos.x - currentNode.position.x;
      const relativeY = currentPos.y - currentNode.position.y;

      currentPath.current.push({ x: relativeX, y: relativeY });
      
      const pathData = `M ${currentPath.current.map(p => `${p.x} ${p.y}`).join(' L ')}`;

      setNodes((nds) => 
        nds.map((n) => {
            if (n.id === currentDrawingId.current) {
                return {
                    ...n,
                    data: { ...n.data, path: pathData },
                    style: { width: Math.max(100, relativeX), height: Math.max(100, relativeY) }
                }
            }
            return n;
        })
      );
    },
    [tool, project, getNodes, setNodes]
  );

  const onMouseUp = useCallback(() => {
    isMouseDown.current = false;
    if (isDrawing.current && currentDrawingId.current) {
         setNodes((nds) => 
            nds.map(n => n.id === currentDrawingId.current ? { ...n, draggable: true } : n)
         );
    }
    isDrawing.current = false;
    currentDrawingId.current = null;
    currentPath.current = [];
  }, [setNodes]);

  useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
          if ((e.ctrlKey || e.metaKey) && e.key === 'c') handleMenuAction('copy');
          if ((e.ctrlKey || e.metaKey) && e.key === 'v') handleMenuAction('paste');
          if ((e.ctrlKey || e.metaKey) && e.key === 'g') {
              e.preventDefault();
              handleMenuAction('group');
          }
          if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'G') {
             e.preventDefault();
             handleMenuAction('ungroup');
          }
          if (e.key === 'Delete' || e.key === 'Backspace') {
              const activeElement = document.activeElement;
              const isInput = activeElement instanceof HTMLInputElement || activeElement instanceof HTMLTextAreaElement || activeElement?.closest('.ProseMirror');
              if (!isInput) {
                  handleMenuAction('delete');
              }
          }
          
          if (e.code === 'Space' && !e.repeat) {
            const activeElement = document.activeElement;
            const isInput = activeElement instanceof HTMLInputElement || activeElement instanceof HTMLTextAreaElement || activeElement?.closest('.ProseMirror');
            if (!isInput) {
               setIsSpacePressed(true);
            }
          }
      };
      
      const handleKeyUp = (e: KeyboardEvent) => {
        if (e.code === 'Space') {
          setIsSpacePressed(false);
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('keyup', handleKeyUp);
      return () => {
          window.removeEventListener('keydown', handleKeyDown);
          window.removeEventListener('keyup', handleKeyUp);
      };
  }, [handleMenuAction]);

  const getCursor = () => {
    if (isSpacePressed) return 'grab';
    switch (tool) {
      case ToolType.HAND: return 'grab';
      case ToolType.PEN: return 'crosshair';
      case ToolType.ERASER: return 'crosshair';
      case ToolType.SELECT: return 'default';
      case ToolType.SECTION: return 'crosshair';
      case ToolType.IMAGE: return 'crosshair';
      case ToolType.VIDEO: return 'crosshair';
      case ToolType.CUSTOM_AGENT: return 'crosshair';
      case ToolType.MARKDOWN: return 'text';
      default: return 'cell';
    }
  };

  const isGroupSelected = selectedNodes.length === 1 && (
      getNodes().find(n => n.id === selectedNodes[0])?.type === ToolType.GROUP || 
      getNodes().find(n => n.id === selectedNodes[0])?.type === ToolType.SECTION
  );

  const panOnDrag = tool === ToolType.HAND || (tool === ToolType.SELECT && isSpacePressed);
  const selectionOnDrag = tool === ToolType.SELECT && !isSpacePressed;
  const nodesDraggable = tool !== ToolType.PEN && tool !== ToolType.ERASER;

  return (
    <div 
        className="w-screen h-screen bg-gray-50" 
        ref={reactFlowWrapper}
        onContextMenu={(e) => e.preventDefault()} // Globally prevent native context menu to ensure consistency
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onPaneClick={onPaneClick}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onSelectionChange={onSelectionChange}
        onNodeDoubleClick={onNodeDoubleClick}
        onEdgeDoubleClick={onEdgeDoubleClick}
        onNodeClick={onNodeClick}
        onNodeMouseEnter={onNodeMouseEnter}
        onNodeDragStop={onNodeDragStop}
        onNodeDragStart={onNodeDragStart} 
        onNodeDrag={onNodeDrag}
        onNodeContextMenu={onNodeContextMenu}
        onSelectionContextMenu={onSelectionContextMenu} // Correctly passed to handle multi-selection context menu
        onPaneContextMenu={onPaneContextMenu}
        onDragOver={onDragOver}
        onDrop={onDrop}
        nodeTypes={nodeTypes}
        connectionMode={ConnectionMode.Loose}
        isValidConnection={() => true}
        panOnDrag={panOnDrag}
        selectionOnDrag={selectionOnDrag}
        nodesDraggable={nodesDraggable}
        panOnScroll={true}
        zoomOnScroll={true}
        minZoom={0.1}
        maxZoom={4}
        style={{ cursor: getCursor() }}
        proOptions={{ hideAttribution: true }}
        elevateNodesOnSelect={false}
        defaultEdgeOptions={{ type: 'default', animated: false }}
        deleteKeyCode={null}
      >
        <Background color="#94a3b8" gap={20} size={1} />
        <Controls className="!bg-white !shadow-lg !border-gray-100 !rounded-lg overflow-hidden [&>button]:!border-b-gray-100 [&>button]:!text-gray-600 hover:[&>button]:!bg-gray-50" />
        <MiniMap 
            className="!bg-white !shadow-lg !border-gray-100 !rounded-lg" 
            nodeColor={(n) => n.data.backgroundColor || '#eee'} 
            maskColor="rgba(240, 245, 255, 0.6)"
        />
        
        <Panel position="top-left" className="ml-4 mt-4">
           <div className="bg-white/90 backdrop-blur px-4 py-2 rounded-lg border border-gray-200 shadow-sm flex items-center gap-3">
             <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">C</div>
             <h1 className="font-bold text-gray-800 tracking-tight">H3C画板</h1>
           </div>
        </Panel>

        <Toolbar />
        <SearchBar />
        <PropertiesPanel />
        <LayersPanel />
        <SectionPanel />
        <AIGenerator />
        <ResourceMarket />
        <SaveResourceModal />
        
      </ReactFlow>

      {/* Moved ContextMenu outside of ReactFlow to prevent event bubbling issues */}
      {menuState.isOpen && (
            <ContextMenu 
                x={menuState.x} 
                y={menuState.y} 
                onClose={closeContextMenu}
                onAction={handleMenuAction}
                hasSelection={selectedNodes.length > 0}
                hasClipboard={copiedNodes.length > 0}
                isGroup={isGroupSelected}
            />
        )}
    </div>
  );
};

export default function App() {
  return (
    <ReactFlowProvider>
      <CanvasBoard />
    </ReactFlowProvider>
  );
}
