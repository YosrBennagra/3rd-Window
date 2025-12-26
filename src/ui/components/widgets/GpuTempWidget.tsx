import { useContextMenu } from '../../../application/hooks/useContextMenu';
import { useSystemTemps } from '../../../application/hooks/useSystemTemps';
import { ContextMenu } from '../ui';

export function GpuTempWidget() {
  const { data } = useSystemTemps(1000);
  const { contextMenu, handleContextMenu, closeContextMenu } = useContextMenu();

  const getTempColor = (temp: number) => {
    if (temp < 60) return '#10b981';
    if (temp < 80) return '#f59e0b';
    return '#ef4444';
  };

  const temp = data?.gpu_temp;

  return (
    <>
      <div 
        className="widget widget--medium" 
        onContextMenu={handleContextMenu}
      >
        <div className="widget__content">
          <div className="temp-widget">
            <div className="temp-widget__icon">🎮</div>
            <div className="temp-widget__value" style={{ color: temp ? getTempColor(temp) : 'inherit' }}>
              {temp !== null && temp !== undefined ? `${Math.round(temp)}°C` : '--°C'}
            </div>
            <div className="temp-widget__label">GPU Temperature</div>
          </div>
        </div>
      </div>
      
      {/* Context menu functionality removed - to be implemented with proper event handlers */}
    </>
  );
}
