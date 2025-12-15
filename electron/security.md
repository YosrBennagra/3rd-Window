# Electron Security Notes

- Use contextIsolation and sandbox in BrowserWindow.
- Preload exposes allowlisted APIs only; no Node in renderer.
- Validate all IPC payloads; reject unknown channels.
- Configure CSP in renderer to allow local assets only.
