// Placeholder quiet hours and recurrence helpers.
export function isQuietHour(now: Date, quietHours: { start: number; end: number }) {
  const hour = now.getHours();
  return hour >= quietHours.start || hour < quietHours.end;
}
