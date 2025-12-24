import { useEffect, useState, useRef } from 'react';
import { useRenderTracking } from '../../../utils/performanceMonitoring';

/**
 * Performance-optimized clock using requestAnimationFrame.
 * Only updates when second changes to avoid unnecessary re-renders.
 */
export default function ClockCalendar() {
  // Performance tracking
  useRenderTracking('ClockCalendar');

  const [now, setNow] = useState(new Date());
  const frameRef = useRef<number | null>(null);
  const lastSecondRef = useRef(now.getSeconds());

  useEffect(() => {
    const animate = () => {
      const current = new Date();
      const currentSecond = current.getSeconds();

      // Only update state when second changes
      if (currentSecond !== lastSecondRef.current) {
        setNow(current);
        lastSecondRef.current = currentSecond;
      }

      frameRef.current = requestAnimationFrame(animate);
    };

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, []);

  const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const date = now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });

  return (
    <div className="stat">
      <p className="muted tiny">Today</p>
      <p className="stat__value">{time}</p>
      <p className="muted">{date}</p>
    </div>
  );
}
