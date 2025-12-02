import { Node } from 'reactflow';
import { ToolType, NodeData } from '../../types';

// Helper to get distinct colors for each shape type
export const getShapeStyles = (type: ToolType) => {
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

export const createNewNode = (type: ToolType, position: { x: number, y: number }, defaultStyle: any): Node<NodeData> => {
    const specificStyles = getShapeStyles(type);
    const isLarge = type === ToolType.SECTION || type === ToolType.VIDEO || type === ToolType.CUSTOM_AGENT || type === ToolType.MARKDOWN;

    return {
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
};