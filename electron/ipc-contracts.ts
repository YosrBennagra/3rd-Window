// IPC channel allowlist.
export const channels = [
  'metrics:get',
  'notifications:get',
  'alerts:get',
  'alerts:ack',
  'settings:get',
  'settings:set'
] as const;
