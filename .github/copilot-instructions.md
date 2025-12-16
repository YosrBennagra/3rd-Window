# Copilot Instructions

- **Style**: TypeScript/React, strict, prefer functional components.
- **Shell**: Tauri v2 (Rust) wrapper; use @tauri-apps/api for host calls and keep commands minimal/typed.
- **Security**: do not broaden IPC/command surface; keep CSP tight; no secrets or tokens in code.
- **Performance**: avoid heavy polling (default 8s refresh); batch host calls; prefer event-driven collectors.
- **Testing**: add unit/E2E when adding logic.
- **Docs**: update relevant docs when changing contracts or behaviors (include Tauri specifics and ports).

## Architecture Notes
- **State**: Zustand store with localStorage persistence via `src/services/storage.ts`
- **Persistence**: All settings auto-saved on change; loaded on mount via `initializeFromStorage()`
- **Widgets**: Visibility controlled via `widgetVisibility` store field; order via `widgetOrder`
- **Alerts**: Custom rules in `alertRules` array; evaluated in `evaluateAlerts()` with metric thresholds
- **Window**: Always-on-top via Tauri command `set_always_on_top`; escape key closes settings
- **Dev**: Vite on port 5173 (strictPort); `npm run tauri:dev` for dev mode
- **Build**: `npm run tauri:build` produces MSI + NSIS installers

## Adding New Features
1. **New Widget**: Add to `widgetDefinitions` in `src/config/widgets.ts`, implement component in `src/components/widgets/`, add to `widgetMap` in `WidgetHost.tsx`
2. **New Setting**: Add to `StoredSettings` interface in `storage.ts`, add default value in `defaultSettings`, add UI in appropriate settings component
3. **New Tauri Command**: Add Rust function in `src-tauri/src/main.rs`, add to `invoke_handler`, call via `invoke()` from frontend
4. **New Alert Rule**: Use existing `AlertRulesManager` component; rules auto-evaluate on metrics refresh

## Code Patterns
- **Store Actions**: Always call `persistSettings()` after state mutation (except `settingsOpen`)
- **Widget Visibility**: Check `widgetVisibility[id] !== false` (default true if undefined)
- **Error Handling**: Wrap async operations in try/catch; set `error` and `loading` states
- **Animations**: Use CSS animations (fadeIn, slideInRight) for modals/overlays
- **Empty States**: Show user-friendly message when no data/widgets available
