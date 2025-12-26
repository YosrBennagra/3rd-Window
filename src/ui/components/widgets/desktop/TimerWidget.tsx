import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { MouseEvent } from 'react';
import type { WidgetLayout } from '../../../../domain/models/layout';
import { ensureTimerWidgetSettings } from '../../../../domain/models/widgets';

interface Props {
  widget?: WidgetLayout;
}

type TimerState = 'idle' | 'running' | 'paused' | 'finished';

export function TimerWidget({ widget }: Props) {
  const settings = ensureTimerWidgetSettings(widget?.settings);
  const durationMs = useMemo(
    () => settings.durationMinutes * 60 * 1000 + settings.durationSeconds * 1000,
    [settings.durationMinutes, settings.durationSeconds],
  );

  const [remainingMs, setRemainingMs] = useState(durationMs);
  const [timerState, setTimerState] = useState<TimerState>('idle');

  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (timerState === 'idle') {
      setRemainingMs(durationMs);
    }
  }, [durationMs, timerState]);

  const clearTimerInterval = useCallback(() => {
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const handleTimerComplete = useCallback(() => {
    clearTimerInterval();
    setTimerState('finished');

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('timer-finished', {
          detail: {
            label: settings.label,
            duration: durationMs,
          },
        }),
      );
    }
  }, [clearTimerInterval, durationMs, settings.label]);

  useEffect(() => () => clearTimerInterval(), [clearTimerInterval]);

  useEffect(() => {
    if (timerState !== 'running') {
      clearTimerInterval();
      return;
    }

    clearTimerInterval();
    intervalRef.current = window.setInterval(() => {
      setRemainingMs((prev) => {
        if (prev <= 0) {
          handleTimerComplete();
          return 0;
        }
        const next = Math.max(0, prev - 1000);
        if (next === 0) {
          handleTimerComplete();
        }
        return next;
      });
    }, 1000);

    return clearTimerInterval;
  }, [timerState, clearTimerInterval, handleTimerComplete]);

  const formattedTime = useMemo(() => {
    const totalSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, [remainingMs]);

  const handleStart = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      if (timerState === 'running') return;

      if (timerState === 'idle' || timerState === 'finished') {
        setRemainingMs(durationMs);
      }
      setTimerState('running');
    },
    [durationMs, timerState],
  );

  const handlePause = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      if (timerState !== 'running') return;
      clearTimerInterval();
      setTimerState('paused');
    },
    [timerState, clearTimerInterval],
  );

  const handleReset = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      clearTimerInterval();
      setTimerState('idle');
      setRemainingMs(durationMs);
    },
    [clearTimerInterval, durationMs],
  );

  const isRunning = timerState === 'running';
  const containerClasses = ['widget', 'timer-widget', 'timer-widget--glass', `timer-widget--state-${timerState}`, isRunning ? 'timer-widget--active' : '']
    .filter(Boolean)
    .join(' ');

  const primaryHandler = timerState === 'running' ? handlePause : handleStart;
  const primaryLabel =
    timerState === 'running' ? 'Pause timer' : timerState === 'paused' ? 'Resume timer' : 'Start timer';

  return (
    <div className={containerClasses}>
      <div className="timer-widget__inner">
        <div className="timer-widget__stack">
          <div className={`timer-widget__time ${isRunning ? 'timer-widget__time--pulse' : ''}`}>{formattedTime}</div>
        </div>

        <div className="timer-widget__controls" onPointerDown={(e) => e.stopPropagation()}>
          <button
            type="button"
            className="timer-widget__control timer-widget__control--primary"
            onClick={primaryHandler}
            aria-label={primaryLabel}
          >
            {timerState === 'running' ? <PauseIcon /> : <PlayIcon />}
          </button>
          <button
            type="button"
            className="timer-widget__control timer-widget__control--secondary"
            onClick={handleReset}
            aria-label="Reset timer"
          >
            <ResetIcon />
          </button>
        </div>
      </div>
    </div>
  );
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" role="img" aria-hidden="true">
      <path d="M8 5v14l11-7z" fill="currentColor" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg viewBox="0 0 24 24" role="img" aria-hidden="true">
      <path d="M7 5h4v14H7zm6 0h4v14h-4z" fill="currentColor" />
    </svg>
  );
}

function ResetIcon() {
  return (
    <svg viewBox="0 0 20 20" role="img" aria-hidden="true">
      <path
        d="M10 4a6 6 0 0 1 5.62 4.06.75.75 0 0 0 1.42-.44A7.5 7.5 0 1 0 9.5 17v1.75a.75.75 0 0 0 1.28.53l3-3a.75.75 0 0 0 0-1.06l-3-3A.75.75 0 0 0 9.5 13v1.69A5 5 0 1 1 10 4Z"
        fill="currentColor"
      />
    </svg>
  );
}
