import './Panel.css';

interface Props {
  onClose: () => void;
}

export default function AddWidgetPanel({ onClose }: Props) {
  return (
    <div className="panel-overlay" onClick={onClose}>
      <div className="panel" onClick={(e) => e.stopPropagation()}>
        <div className="panel__header">
          <h2 className="panel__title">Add Widget</h2>
          <button className="panel__close" onClick={onClose}>✕</button>
        </div>
        <div className="panel__content">
          <p className="panel__placeholder">Widget selection coming soon...</p>
        </div>
      </div>
    </div>
  );
}
