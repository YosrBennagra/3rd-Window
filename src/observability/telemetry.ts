// Placeholder telemetry emitter.
export function trackEvent(name: string, props?: Record<string, unknown>) {
  console.debug('telemetry', name, props);
}
