import { useEffect } from 'react';
import { useContextMenu } from '../../../application/hooks/useContextMenu';
import { useSystemTemps } from '../../../application/hooks/useSystemTemps';
import { ContextMenu } from '../ui';

export function CpuTempWidget() {
  const { data } = useSystemTemps(1000);
  const { contextMenu, handleContextMenu, closeContextMenu } = useContextMenu();

  useEffect(() => {
    if (data) {
      console.log('[CPU Widget] Available sensors:', data.available_sensors);
      console.log('[CPU Widget] CPU temp:', data.cpu_temp);
    }
  }, [data]);

  const getTempColor = (temp: number) => {
    if (temp < 50) return '#10b981';
    if (temp < 70) return '#f59e0b';
    return '#ef4444';
  };

  const temp = data?.cpu_temp;

  return (
    <>
      <div 
        className="widget widget--medium" 
        onContextMenu={handleContextMenu}
      >
        <div className="widget__content">
          <div className="temp-widget">
            <div className="temp-widget__icon">🖥️</div>
            <div className="temp-widget__value" style={{ color: temp ? getTempColor(temp) : 'inherit' }}>
              {temp !== null && temp !== undefined ? `${Math.round(temp)}°C` : '--°C'}
            </div>
            <div className="temp-widget__label">CPU Temperature</div>
          </div>
        </div>
      </div>
      
      <ContextMenu
        position={contextMenu}
        title="CPU Temperature"
        onClose={closeContextMenu}
        onProperties={() => console.log('Open properties')}
        onRemove={() => console.log('Remove widget')}
      />
    </>
  );
}
