import { useGridStore } from '@application/stores';
import { widgetDefinitions } from '@config/widgets';

export function WidgetPalette() {
  const { addWidget, widgets } = useGridStore();

  const handleAddWidget = (widgetId: string) => {
    void addWidget(widgetId);
  };

  /*
  const handleClearAll = () => {
    if (confirm('Are you sure you want to remove all widgets?')) {
      clearAllWidgets();
    }
  };
  */

  return (
    <div className="widget-palette">
      <div className="widget-palette__header">
        <h3>Widgets</h3>
        <span className="widget-palette__count">{widgets.length}</span>
      </div>
      
      <div className="widget-palette__section">
        <h4>Add Widget</h4>
        <div className="widget-palette__grid">
          {widgetDefinitions.filter((widget) => !widget.disabled).map((widget) => (
            <button
              key={widget.id}
              className="widget-palette__item"
              onClick={() => handleAddWidget(widget.id)}
              title={widget.description}
            >
              <span className="widget-palette__name">{widget.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 
      <div className="widget-palette__section">
        <h4>Options</h4>
        <button
          className={`widget-palette__option ${showGrid ? 'widget-palette__option--active' : ''}`}
          onClick={toggleGrid}
        >
          {showGrid ? '👁️ Hide Grid' : '👁️‍🗨️ Show Grid'}
        </button>
        <button
          className="widget-palette__option widget-palette__option--danger"
          onClick={handleClearAll}
          disabled={widgets.length === 0}
        >
          🗑️ Clear All
        </button>
      </div>
      */}
    </div>
  );
}
