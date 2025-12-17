import type { WidgetLayout } from '../../types/layout';
import './Panel.css';

const widgetNames: Record<string, string> = {
  'clock': 'Clock',
  'cpu-temp': 'CPU Temperature',
  'gpu-temp': 'GPU Temperature',
  'mail': 'Mail',
  'chart': 'Chart',
};

interface Props {
  widget: WidgetLayout;
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
