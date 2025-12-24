import type { WidgetLayout } from '../../../domain/models/layout';
import { useSystemMetrics } from '../../../application/hooks/useSystemMetrics';
import { useTemperatureColor, getTemperaturePercentage } from '../../../application/hooks/useTemperatureColor';

/**
 * TemperatureWidget Component (React 18 Best Practice)
 * 
 * Follows React principles:
 * - Function component only
 * - Custom hooks for behavior (useSystemMetrics, useTemperatureColor)
 * - No business logic in component
 * - Extracted formatting logic to hooks
 * - No inline styles (delegated to CSS modules where possible)
 */

interface Props {
  widget: WidgetLayout;
}

export default function TemperatureWidget({ widget: _widget }: Props) {
  const { metrics } = useSystemMetrics({ interval: 2000 });
  
  const cpuTemp = metrics?.cpuTemp ?? 0;
  const gpuTemp = metrics?.gpuTemp ?? 0;
  const cpuUsage = metrics?.cpuUsage ?? 0;
  
  const cpuColor = useTemperatureColor(cpuTemp, { type: 'cpu' });
  const gpuColor = useTemperatureColor(gpuTemp, { type: 'gpu' });

  return (
    <div
      className="widget-content"
      style={{
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        height: '100%',
      }}
    >
      {/* CPU Temperature */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ fontSize: '20px' }}>🖥️</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '11px', opacity: 0.6 }}>CPU</div>
            <div style={{ fontSize: '12px', opacity: 0.5 }}>{cpuUsage.toFixed(0)}% Usage</div>
          </div>
          <div style={{
            fontSize: '24px',
            fontWeight: '600',
            color: cpuTemp > 0 ? cpuColor.color : 'rgba(255,255,255,0.3)'
          }}>
            {cpuTemp > 0 ? `${Math.round(cpuTemp)}°` : '--°'}
          </div>
        </div>
        
        {cpuTemp > 0 && (
          <div style={{
            width: '100%',
            height: '4px',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '2px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${getTemperaturePercentage(cpuTemp)}%`,
              height: '100%',
              background: cpuColor.color,
              transition: 'width 0.3s ease'
            }} />
          </div>
        )}
      </div>

      {/* GPU Temperature */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ fontSize: '20px' }}>🎮</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '11px', opacity: 0.6 }}>GPU</div>
            <div style={{ fontSize: '12px', opacity: 0.5 }}>Graphics Card</div>
          </div>
          <div style={{
            fontSize: '24px',
            fontWeight: '600',
            color: gpuTemp > 0 ? gpuColor.color : 'rgba(255,255,255,0.3)'
          }}>
            {gpuTemp > 0 ? `${Math.round(gpuTemp)}°` : '--°'}
          </div>
        </div>
        
        {gpuTemp > 0 && (
          <div style={{
            width: '100%',
            height: '4px',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '2px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${getTemperaturePercentage(gpuTemp)}%`,
              height: '100%',
              background: gpuColor.color,
              transition: 'width 0.3s ease'
            }} />
          </div>
        )}
      </div>

      {!metrics && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flex: 1,
          fontSize: '11px',
          opacity: 0.5
        }}>
          Loading...
        </div>
      )}
    </div>
  );
}
