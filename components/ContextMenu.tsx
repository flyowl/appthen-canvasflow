import React, { useEffect, useRef } from 'react';
import { 
  Copy, 
  Clipboard, 
  Trash2, 
  BringToFront, 
  SendToBack, 
  Group, 
  Ungroup,
  ArrowUp,
  ArrowDown
} from 'lucide-react';

interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  onAction: (action: string) => void;
  hasSelection: boolean;
  hasClipboard: boolean;
  isGroup?: boolean;
}

const ContextMenu: React.FC<ContextMenuProps> = ({ 
  x, 
  y, 
  onClose, 
  onAction, 
  hasSelection, 
  hasClipboard,
  isGroup 
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  const style: React.CSSProperties = {
      top: y,
      left: x,
  };
  
  if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      if (x + rect.width > window.innerWidth) {
          style.left = x - rect.width;
      }
      if (y + rect.height > window.innerHeight) {
          style.top = y - rect.height;
      }
  }

  const MenuItem = ({ 
    icon: Icon, 
    label, 
    action, 
    shortcut, 
    disabled = false,
    danger = false 
  }: any) => (
    <button
      onClick={(e) => {
        // Critical: Stop propagation to ensure the action fires before any outside click handlers
        e.stopPropagation();
        e.nativeEvent.stopImmediatePropagation();
        if(!disabled) {
            onAction(action);
            onClose();
        }
      }}
      // Stop mousedown to prevent App's onMouseDown from closing the menu before click fires
      onMouseDown={(e) => { e.stopPropagation(); }}
      disabled={disabled}
      className={`w-full flex items-center justify-between px-3 py-2 text-sm transition-colors text-left
        ${disabled ? 'opacity-50 cursor-not-allowed text-gray-400' : 
          danger ? 'text-red-600 hover:bg-red-50' : 'text-gray-700 hover:bg-gray-100'}
      `}
    >
      <div className="flex items-center gap-2 pointer-events-none">
        <Icon size={14} />
        <span>{label}</span>
      </div>
      {shortcut && <span className="text-xs text-gray-400 ml-4 pointer-events-none">{shortcut}</span>}
    </button>
  );

  return (
    <div 
      ref={menuRef}
      style={style}
      className="fixed z-[9999] min-w-[220px] bg-white rounded-lg shadow-xl border border-gray-200 py-1.5 animate-in fade-in zoom-in-95 duration-100 select-none"
      onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); }}
      // Stop all propagation from the menu container to avoid conflict with React Flow canvas listeners
      onMouseDown={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      onDoubleClick={(e) => e.stopPropagation()}
    >
      <MenuItem 
        icon={Copy} 
        label="复制" 
        action="copy" 
        shortcut="Ctrl+C" 
        disabled={!hasSelection} 
      />
      <MenuItem 
        icon={Clipboard} 
        label="粘贴" 
        action="paste" 
        shortcut="Ctrl+V" 
        disabled={!hasClipboard} 
      />
      
      <div className="h-px bg-gray-100 my-1.5 pointer-events-none" />
      
      {isGroup ? (
         <MenuItem 
            icon={Ungroup} 
            label="解除组合" 
            action="ungroup" 
            shortcut="Ctrl+Shift+G" 
        />
      ) : (
        <MenuItem 
            icon={Group} 
            label="组合" 
            action="group" 
            shortcut="Ctrl+G" 
            disabled={!hasSelection} 
        />
      )}

      <div className="h-px bg-gray-100 my-1.5 pointer-events-none" />

      <MenuItem 
        icon={BringToFront} 
        label="置于顶层" 
        action="front" 
        disabled={!hasSelection} 
      />
       <MenuItem 
        icon={ArrowUp} 
        label="上移一层" 
        action="forward" 
        disabled={!hasSelection} 
      />
       <MenuItem 
        icon={ArrowDown} 
        label="下移一层" 
        action="backward" 
        disabled={!hasSelection} 
      />
      <MenuItem 
        icon={SendToBack} 
        label="置于底层" 
        action="back" 
        disabled={!hasSelection} 
      />

      <div className="h-px bg-gray-100 my-1.5 pointer-events-none" />

      <MenuItem 
        icon={Trash2} 
        label="删除" 
        action="delete" 
        shortcut="Del" 
        disabled={!hasSelection} 
        danger
      />
    </div>
  );
};

export default ContextMenu;