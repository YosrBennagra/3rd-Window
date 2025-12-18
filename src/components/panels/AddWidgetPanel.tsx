import './Panel.css';

interface WidgetOption {
  id: string;
  name: string;
  description?: string;
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
    <div className="panel-overlay" onClick={onClose}>
      <div className="panel" onClick={(e) => e.stopPropagation()}>
        <div className="panel__header">
          <h2 className="panel__title">Add Widget</h2>
          <button className="panel__close" onClick={onClose}>✕</button>
        </div>
        <div className="panel__content">
          {widgets.length === 0 ? (
            <p className="panel__placeholder">No widgets available</p>
          ) : (
            <ul className="panel__list">
              {widgets.map((widget) => (
                <li key={widget.id} className="panel__list-item">
                  <div className="panel__list-text">
                    <div className="panel__list-title">{widget.name}</div>
                    {widget.description && (
                      <div className="panel__list-description">{widget.description}</div>
                    )}
                  </div>
                  <button
                    className="panel__button"
                    disabled={widget.isActive}
                    onClick={() => handleAdd(widget.id)}
                  >
                    {widget.isActive ? 'Already Added' : 'Add'}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
