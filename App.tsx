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
import { ToolType, NodeData } from './types';
import Toolbar from './components/Toolbar';
import PropertiesPanel from './components/PropertiesPanel';
import LayersPanel from './components/LayersPanel';
import ContextMenu from './components/ContextMenu';
import AIGenerator from './components/AIGenerator';
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
    MindMapNode, 
    StickyNoteNode 
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
  [ToolType.MINDMAP]: MindMapNode,
  [ToolType.STICKY_NOTE]: StickyNoteNode,
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
      takeSnapshot
  } = useStore();

  const { project, getNodes, screenToFlowPosition } = useReactFlow();
  
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
    if (node.type === ToolType.PEN || node.type === ToolType.MINDMAP || tool === ToolType.ERASER) return; 
    
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
              // We should probably debounce snapshot here or snapshot on mouse down
              // For simplicity, we might spam history here if not careful. 
              // A better eraser would track session.
              // We'll skip snapshot here for performance or accept it.
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
      let currentId: string | undefined = targetId;
      while (currentId) {
          const node = allNodes.find(n => n.id === currentId);
          if (!node) break;
          if (node.parentNode === potentialAncestorId) return true;
          currentId = node.parentNode;
      }
      return false;
  }, []);

  const findTargetGroup = useCallback((node: Node, allNodes: Node[]) => {
      const absX = node.positionAbsolute?.x ?? node.position.x;
      const absY = node.positionAbsolute?.y ?? node.position.y;
      const width = node.width || Number(node.style?.width) || 150;
      const height = node.height || Number(node.style?.height) || 50;
      const centerX = absX + width / 2;
      const centerY = absY + height / 2;

      const groups = allNodes.filter(n => n.type === ToolType.GROUP && n.id !== node.id);

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
      const targetGroup = findTargetGroup(node, allNodes);
      
      if (targetGroup && isDescendant(targetGroup.id, node.id, allNodes)) {
          return; 
      }

      setNodes((currentNodes) => currentNodes.map(n => {
          if (n.type === ToolType.GROUP) {
              const isHighlight = targetGroup?.id === n.id;
              if (n.data.isHighlight !== isHighlight) {
                  return { ...n, data: { ...n.data, isHighlight } };
              }
          }
          return n;
      }));
  }, [getNodes, setNodes, findTargetGroup, isDescendant]);

  const onNodeDragStop: NodeDragHandler = useCallback(
    (event, node, draggedNodes) => {
        setNodes(nds => nds.map(n => n.type === ToolType.GROUP ? { ...n, data: { ...n.data, isHighlight: false } } : n));

        const nodesToProcess = draggedNodes && draggedNodes.length > 0 ? draggedNodes : [node];
        
        setNodes((currentNodes) => {
            let updatedNodesList = [...currentNodes];
            const nodeMap = new Map(updatedNodesList.map(n => [n.id, n]));

            nodesToProcess.forEach((draggedNode) => {
                const currentNodeState = nodeMap.get(draggedNode.id);
                if (!currentNodeState) return;

                let targetGroup = findTargetGroup(draggedNode, updatedNodesList);
                
                if (targetGroup && isDescendant(targetGroup.id, draggedNode.id, updatedNodesList)) {
                    targetGroup = undefined;
                }

                const absX = draggedNode.positionAbsolute?.x ?? draggedNode.position.x;
                const absY = draggedNode.positionAbsolute?.y ?? draggedNode.position.y;

                if (targetGroup) {
                    if (currentNodeState.parentNode !== targetGroup.id) {
                        const groupAbsX = targetGroup.positionAbsolute?.x ?? targetGroup.position.x;
                        const groupAbsY = targetGroup.positionAbsolute?.y ?? targetGroup.position.y;

                        const newNode = {
                            ...currentNodeState,
                            parentNode: targetGroup.id,
                            extent: undefined, 
                            position: {
                                x: absX - groupAbsX,
                                y: absY - groupAbsY
                            },
                        };
                        const idx = updatedNodesList.findIndex(n => n.id === newNode.id);
                        if (idx !== -1) updatedNodesList[idx] = newNode;
                    }
                } else {
                    if (currentNodeState.parentNode) {
                        const newNode = {
                            ...currentNodeState,
                            parentNode: undefined,
                            extent: undefined,
                            position: {
                                x: absX,
                                y: absY
                            }
                        };
                        const idx = updatedNodesList.findIndex(n => n.id === newNode.id);
                        if (idx !== -1) {
                            updatedNodesList.splice(idx, 1);
                            updatedNodesList.push(newNode);
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
      
      if (!selectedNodes.includes(node.id)) {
        setNodes((nds) => nds.map((n) => ({
            ...n,
            selected: n.id === node.id
        })));
        setSelectedNodes([node.id]);
      }

      setMenuState({
        isOpen: true,
        x: event.clientX,
        y: event.clientY,
      });
    },
    [selectedNodes, setSelectedNodes, setNodes]
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
      if(['delete', 'paste', 'front', 'back', 'forward', 'backward', 'group', 'ungroup'].includes(action)) {
          takeSnapshot();
      }

      switch(action) {
          case 'delete':
              const nodesToDeleteIds = [...selectedNodes];
              const groupsToDelete = selectedNodeObjs.filter(n => n.type === ToolType.GROUP);
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
                  
                  const padding = 30;
                  const width = maxX - minX + (padding * 2);
                  const height = maxY - minY + (padding * 2);
                  const groupX = minX - padding;
                  const groupY = minY - padding;

                  const groupId = `group-${Date.now()}`;

                  const groupNode: Node<NodeData> = {
                      id: groupId,
                      type: ToolType.GROUP,
                      position: { x: groupX, y: groupY },
                      style: { width, height },
                      data: { 
                          ...defaultStyle, 
                          label: '新建分区', 
                          align: 'left',
                          verticalAlign: 'top',
                          backgroundColor: 'rgba(240, 244, 255, 0.5)',
                          borderColor: '#94a3b8'
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
              const groups = selectedNodeObjs.filter(n => n.type === ToolType.GROUP);
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
  }, [selectedNodes, copiedNodes, menuState, getNodes, setNodes, setSelectedNodes, setCopiedNodes, screenToFlowPosition, defaultStyle, takeSnapshot]);


  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow') as ToolType;
      if (typeof type === 'undefined' || !type) {
        return;
      }

      let position = { x: 0, y: 0 };
      
      if (screenToFlowPosition) {
        position = screenToFlowPosition({
            x: event.clientX,
            y: event.clientY,
        });
      }

      takeSnapshot(); // Snapshot on new element drop

      const specificStyles = getShapeStyles(type);

      const newNode: Node<NodeData> = {
        id: `${type}-${Date.now()}`,
        type,
        position,
        data: {
          label: type === ToolType.TEXT ? '双击编辑' : (type === ToolType.GROUP ? '分区' : (type === ToolType.STICKY_NOTE ? '添加文本' : '形状')),
          ...defaultStyle,
          ...specificStyles,
          ...(type === ToolType.GROUP ? {
              align: 'left',
              verticalAlign: 'top',
              backgroundColor: 'rgba(240, 244, 255, 0.4)',
              borderColor: '#94a3b8',
              borderWidth: 2
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
             width: (type === ToolType.TEXT) ? undefined : (type === ToolType.GROUP ? 300 : 150), 
             height: (type === ToolType.TEXT) ? undefined : (type === ToolType.GROUP ? 300 : 150)
        }
      };

      setNodes((nds) => nds.concat(newNode));
      setTool(ToolType.SELECT);
    },
    [project, screenToFlowPosition, setNodes, setTool, defaultStyle, takeSnapshot]
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

        const newNode: Node<NodeData> = {
          id: `${tool}-${Date.now()}`,
          type: tool,
          position,
          data: {
            label: tool === ToolType.TEXT ? '双击编辑' : (tool === ToolType.GROUP ? '分区' : (tool === ToolType.STICKY_NOTE ? '添加文本' : '形状')),
            ...defaultStyle,
            ...specificStyles,
            ...(tool === ToolType.GROUP ? {
              align: 'left',
              verticalAlign: 'top',
              backgroundColor: 'rgba(240, 244, 255, 0.4)',
              borderColor: '#94a3b8',
              borderWidth: 2
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
             width: (tool === ToolType.TEXT) ? undefined : (tool === ToolType.GROUP ? 300 : 150), 
             height: (tool === ToolType.TEXT) ? undefined : (tool === ToolType.GROUP ? 300 : 150)
        }
      };

      setNodes((nds) => nds.concat(newNode));
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
              const isInput = activeElement instanceof HTMLInputElement || activeElement instanceof HTMLTextAreaElement;
              if (!isInput) {
                  handleMenuAction('delete');
              }
          }
          
          if (e.code === 'Space' && !e.repeat) {
            const activeElement = document.activeElement;
            const isInput = activeElement instanceof HTMLInputElement || activeElement instanceof HTMLTextAreaElement;
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
      case ToolType.GROUP: return 'crosshair';
      default: return 'cell';
    }
  };

  const isGroupSelected = selectedNodes.length === 1 && getNodes().find(n => n.id === selectedNodes[0])?.type === ToolType.GROUP;

  const panOnDrag = tool === ToolType.HAND || (tool === ToolType.SELECT && isSpacePressed);
  const selectionOnDrag = tool === ToolType.SELECT && !isSpacePressed;
  const nodesDraggable = tool !== ToolType.PEN && tool !== ToolType.ERASER;

  return (
    <div className="w-screen h-screen bg-gray-50" ref={reactFlowWrapper}>
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
        onNodeDragStart={onNodeDragStart} // Added
        onNodeDrag={onNodeDrag}
        onNodeContextMenu={onNodeContextMenu}
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
             <h1 className="font-bold text-gray-800 tracking-tight">CanvasFlow 画板</h1>
           </div>
        </Panel>

        <Toolbar />
        <PropertiesPanel />
        <LayersPanel />
        <AIGenerator />
        
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

      </ReactFlow>
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