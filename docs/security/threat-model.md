# Threat Model (Draft)

- Assets: user data (settings, notes), alert rules, system metrics.
- Entry points: IPC, renderer UI, auto-update channel.
- Trust boundaries: main vs renderer; external integrations.
- Risks: arbitrary IPC, XSS in renderer, malicious updates.
