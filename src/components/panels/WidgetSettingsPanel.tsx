import type { WidgetGridItem } from '../../store/gridStore';
import './Panel.css';

const widgetNames: Record<string, string> = {
  'clock': 'Clock',
  'cpu-temp': 'CPU Temperature',
  'gpu-temp': 'GPU Temperature',
};

interface Props {
  widget: WidgetGridItem;
  onClose: () => void;
}

export default function WidgetSettingsPanel({ widget, onClose }: Props) {
  const widgetName = widgetNames[widget.widgetType] || widget.widgetType;

  return (
    <div className="panel-overlay" onClick={onClose}>
      <div className="panel" onClick={(e) => e.stopPropagation()}>
        <div className="panel__header">
          <h2 className="panel__title">{widgetName} Settings</h2>
          <button className="panel__close" onClick={onClose}>✕</button>
        </div>
        <div className="panel__content">
          <p className="panel__placeholder">Widget settings for "{widgetName}" coming soon...</p>
        </div>
      </div>
    </div>
  );
}
