import type { ContextMenuProps } from '../../../domain/models/widget';

export function ContextMenu({ position, title, onClose, onProperties, onRemove }: ContextMenuProps) {
  if (!position) return null;

  return (
    <div 
      className="context-menu"
      style={{ left: position.x, top: position.y }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="context-menu__header">{title}</div>
      <div className="context-menu__divider" />
      {onProperties && (
        <button className="context-menu__item" onClick={() => { onProperties(); onClose(); }}>
          Properties
        </button>
      )}
      {onRemove && (
        <button className="context-menu__item" onClick={() => { onRemove(); onClose(); }}>
          Remove Widget
        </button>
      )}
    </div>
  );
}
