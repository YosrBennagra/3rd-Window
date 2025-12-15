# Performance Budget (Draft)

- Idle CPU: < 2% target.
- Memory: minimize widget overhead; avoid leaking listeners.
- GPU: prefer canvas/light DOM; avoid expensive animations.
- Polling: adaptive intervals; slow down when idle.
- IPC: batch requests; avoid chatty channels.
