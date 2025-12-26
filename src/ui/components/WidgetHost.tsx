import WidgetFrame from './WidgetFrame';
import { widgetDefinitions } from '../../config/widgets';
import Notifications from './widgets/panel/Notifications';
import Temperature from './widgets/panel/Temperature';
import RamUsage from './widgets/panel/RamUsage';
import DiskUsage from './widgets/panel/DiskUsage';
import NetworkSpeed from './widgets/panel/NetworkSpeed';
import ClockCalendar from './widgets/panel/ClockCalendar';
import Notes from './widgets/panel/Notes';
import Alerts from './widgets/panel/Alerts';
import Shortcuts from './widgets/panel/Shortcuts';
import Integrations from './widgets/panel/Integrations';
import Pipelines from './widgets/panel/Pipelines';
import PowerMode from './widgets/panel/PowerMode';
import { useAppStore } from '../../application/store';

const widgetMap: Record<string, React.ComponentType> = {
  Notifications,
  Temperature,
  RamUsage,
  DiskUsage,
  NetworkSpeed,
  ClockCalendar,
  Notes,
  Alerts,
  Shortcuts,
  Integrations,
  Pipelines,
  PowerMode
};

export default function WidgetHost() {
  const powerSaving = useAppStore((s) => s.powerSaving);
  const visibleInPowerSaving = useAppStore((s) => s.powerSavingVisible);
  const widgetVisibility = useAppStore((s) => s.widgetVisibility);
  const widgetScale = useAppStore((s) => s.widgetScale);
  const widgetOrder = useAppStore((s) => s.widgetOrder);

  // Filter by power saving mode, widget visibility, then sort by order
  const orderedWidgets = widgetOrder
    .map((id) => widgetDefinitions.find((w) => w.id === id))
    .filter(Boolean) as typeof widgetDefinitions;

  // Filter widgets: undefined or true means visible, only explicit false means hidden
  // Filter widgets: undefined or true means visible, only explicit false means hidden
  const list = powerSaving
    ? orderedWidgets.filter(
        (w) => visibleInPowerSaving.includes(w.id) && (widgetVisibility[w.id] ?? true)
      )
    : orderedWidgets.filter((w) => widgetVisibility[w.id] ?? true);

  return (
    <div className="widget-host">
      {list.map((w) => {
        const Comp = widgetMap[w.component];
        const scale = widgetScale[w.id] || 'medium';
        return (
          <WidgetFrame key={w.id} title={w.title} description={w.description} scale={scale}>
            {Comp ? <Comp /> : <div className="widget-placeholder">Coming soon</div>}
          </WidgetFrame>
        );
      })}
      {list.length === 0 && (
        <div className="empty-state">
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ marginBottom: 12, fontSize: 32 }}>⚙️</h2>
            <p className="muted" style={{ fontSize: 16, marginBottom: 8 }}>No widgets enabled</p>
            <p className="muted tiny">Click the gear icon (⚙) in the top-right to enable widgets</p>
          </div>
        </div>
      )}
    </div>
  );
}
