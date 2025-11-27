import React, { memo, useEffect, useRef } from 'react';
import { NodeProps, Position } from 'reactflow';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Markdown } from 'tiptap-markdown';
import { NodeData } from '../../types';
import { CustomHandle, ShapeNodeWrapper } from './BaseNode';
import { useStore } from '../../store';
import { FileText } from 'lucide-react';

export const MarkdownNode = memo(({ id, data, selected, isConnectable }: NodeProps<NodeData>) => {
  const setNodes = useStore(s => s.setNodes);
  const takeSnapshot = useStore(s => s.takeSnapshot);
  
  // Use a ref to track if we are currently updating from props to avoid loop
  const isUpdatingFromProps = useRef(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Markdown,
    ],
    content: data.markdownContent || '# Markdown Editor\n\nType **markdown** here...',
    editorProps: {
      attributes: {
        class: 'w-full h-full outline-none tiptap prose prose-sm max-w-none text-gray-800',
      },
    },
    onUpdate: ({ editor }) => {
      if (isUpdatingFromProps.current) return;
      
      const markdown = editor.storage.markdown.getMarkdown();
      
      // Update store without triggering re-render of this component if possible
      // But we need to update the node data for persistence
      setNodes(nodes => nodes.map(n => {
        if (n.id === id) {
           // Basic optimization: only update if content changed significantly
           if (n.data.markdownContent !== markdown) {
             return { ...n, data: { ...n.data, markdownContent: markdown } };
           }
        }
        return n;
      }));
    },
    onFocus: () => {
        // We can capture snapshot when user starts editing significantly if needed,
        // or rely on blur/selection changes.
    },
    onBlur: () => {
        takeSnapshot();
    }
  });

  // Sync data updates (e.g. from undo/redo) back to editor
  useEffect(() => {
    if (editor && data.markdownContent !== undefined) {
       const currentContent = editor.storage.markdown.getMarkdown();
       if (currentContent !== data.markdownContent) {
           isUpdatingFromProps.current = true;
           editor.commands.setContent(data.markdownContent);
           isUpdatingFromProps.current = false;
       }
    }
  }, [data.markdownContent, editor]);

  return (
    <ShapeNodeWrapper selected={selected} minWidth={200} minHeight={150}>
      <div 
        className={`relative w-full h-full flex flex-col bg-white rounded-lg shadow-sm transition-all duration-300 ${
            selected ? 'ring-2 ring-blue-500 ring-offset-1 shadow-md' : 'border border-gray-200 hover:shadow-md'
        }`}
      >
        {/* Header Strip */}
        <div className="bg-gray-50 px-3 py-1.5 border-b border-gray-100 flex items-center gap-2 select-none rounded-t-lg">
             <FileText size={14} className="text-gray-500" />
             <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Markdown</span>
        </div>

        <div className="flex-1 p-4 overflow-y-auto overflow-x-hidden custom-scrollbar bg-white rounded-b-lg cursor-text"
             onMouseDown={(e) => e.stopPropagation()} // Stop propagation to allow text selection
        >
             {/* nodrag and nopan are essential for text interaction in React Flow */}
             <EditorContent editor={editor} className="nodrag nopan h-full" />
        </div>

        <CustomHandle type="source" position={Position.Top} id="top" selected={selected} isConnectable={isConnectable} />
        <CustomHandle type="source" position={Position.Right} id="right" selected={selected} isConnectable={isConnectable} />
        <CustomHandle type="source" position={Position.Bottom} id="bottom" selected={selected} isConnectable={isConnectable} />
        <CustomHandle type="source" position={Position.Left} id="left" selected={selected} isConnectable={isConnectable} />
      </div>
    </ShapeNodeWrapper>
  );
});