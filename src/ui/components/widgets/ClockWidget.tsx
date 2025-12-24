import { useCallback } from 'react';
import type { MouseEvent } from 'react';
import type { WidgetLayout } from '../../../domain/models/layout';
import { ensureClockWidgetSettings } from '../../../domain/models/widgets';
import { invoke } from '@tauri-apps/api/core';
import { useClock } from '../../../application/hooks/useClock';
import { useFormattedTime } from '../../../application/hooks/useFormattedTime';

/**
 * ClockWidget Component (React 18 Best Practice)
 * 
 * Follows React principles:
 * - Function component only
 * - Minimal local state (none - delegated to custom hooks)
 * - Custom hooks for behavior extraction
 * - No business logic in JSX
 * - Stable event handlers via useCallback
 */

interface Props {
  widget?: WidgetLayout;
}

export function ClockWidget({ widget }: Props) {
  const settings = ensureClockWidgetSettings(widget?.settings);
  const time = useClock({ interval: 60000 });
  const { timeText, dateText } = useFormattedTime(time, settings);

  const handleClick = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      event.stopPropagation();
      if (settings.clickBehavior !== 'open-system-clock') return;
      void invoke('open_system_clock').catch(() => {
        if (typeof window !== 'undefined') {
          window.open('ms-clock:', '_blank');
        }
      });
    },
    [settings.clickBehavior],
  );

  return (
    <div className="widget clock-widget clock-widget--static">
      <div className="widget__content clock-widget__content" onClick={handleClick}>
        <div className="clock-static">
          <div className="clock-static__time">{timeText}</div>
          <div className="clock-static__date">{dateText}</div>
        </div>
      </div>
    </div>
  );
}
