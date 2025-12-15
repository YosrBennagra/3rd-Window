# Security Model

- Renderer sandboxed; no Node in renderer; preload exposes minimal APIs.
- IPC allowlist with typed contracts; reject unknown channels.
- No elevated privileges; read-only metrics where possible.
- CSP enforcing local assets; no remote code.
- Secrets: stored outside repo; .env.example for templates only.
