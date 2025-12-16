import { useState, useEffect } from 'react';
import { useContextMenu } from '../../hooks/useContextMenu';
import { ContextMenu } from '../ui';

export function ClockWidget() {
  const [time, setTime] = useState(new Date());
  const { contextMenu, handleContextMenu, closeContextMenu } = useContextMenu();

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <div 
        className="widget widget--medium" 
        onContextMenu={handleContextMenu}
      >
        <div className="widget__content">
          <div className="clock__time">
            {time.toLocaleTimeString('en-US', { 
              hour: '2-digit', 
              minute: '2-digit',
              second: '2-digit'
            })}
          </div>
          <div className="clock__date">
            {time.toLocaleDateString('en-US', { 
              weekday: 'long',
              month: 'long',
              day: 'numeric',
              year: 'numeric'
            })}
          </div>
        </div>
      </div>
      
      <ContextMenu
        position={contextMenu}
        title="Date & Time Widget"
        onClose={closeContextMenu}
        onProperties={() => console.log('Open properties')}
        onRemove={() => console.log('Remove widget')}
      />
    </>
  );
}
