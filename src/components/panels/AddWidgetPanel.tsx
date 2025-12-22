import './Panel.css';

interface WidgetOption {
  id: string;
  name: string;
  isActive: boolean;
}

interface Props {
  onClose: () => void;
  onAdd: (widgetType: string) => void;
  widgets: WidgetOption[];
}

export default function AddWidgetPanel({ onClose, onAdd, widgets }: Props) {
  const handleAdd = (widgetType: string) => {
    onAdd(widgetType);
    onClose();
  };

  return (
    <>
      <div className="explorer-header" data-tauri-drag-region>
        <div className="explorer-header__left">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M1 1h6v6H1zM9 1h6v6H9zM1 9h6v6H1zM9 9h6v6H9z"/>
          </svg>
          <span>Add Widget</span>
        </div>
        <button 
          type="button"
          className="explorer-header__close" 
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onClose();
          }}
          onMouseDown={(e) => e.stopPropagation()}
          data-tauri-drag-region="false"
        >
          ✕
        </button>
      </div>

      <div className="explorer-content">
        {widgets.map((widget) => (
          <button
            key={widget.id}
            className="explorer-item"
            disabled={widget.isActive}
            onClick={() => handleAdd(widget.id)}
          >
            <div className="explorer-item__icon">
              {widget.id === 'clock' && (
                <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="24" cy="24" r="20"/>
                  <path d="M24 8v16l10 6"/>
                </svg>
              )}
              {widget.id === 'timer' && (
                <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 4h12"/>
                  <circle cx="24" cy="26" r="18"/>
                  <path d="M24 14v12l8 4"/>
                </svg>
              )}
              {widget.id !== 'clock' && widget.id !== 'timer' && (
                <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="12" y="12" width="24" height="24" rx="4"/>
                </svg>
              )}
            </div>
            <span className="explorer-item__name">{widget.name}</span>
          </button>
        ))}
      </div>
    </>
  );
}
