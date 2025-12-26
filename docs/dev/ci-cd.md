# CI/CD — Commands, Critical Notes, and Future Improvements

This file now contains only the essential commands, critical operational notes, and prioritized future enhancements for CI/CD.

Critical notes
- **Secrets:** never commit code-signing certificates or secrets. Required GitHub Actions secrets: `TAURI_SIGNING_PRIVATE_KEY`, `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`.
- **Version single source:** keep `package.json`, `src-tauri/Cargo.toml`, and `src-tauri/tauri.conf.json` in sync.
- **CI env:** ensure `CI=true` and `NODE_ENV=production` in CI jobs.

Key commands
- Version check / sync
```bash
# Check versions
npm run version:check

# Set specific version
node scripts/sync-version.js 1.2.3
```

- Local dev / build
```bash
# Dev (hot reload)
npm run tauri:dev

# Build frontend
npm run build

# Build Tauri app (local)
npm run tauri:build
```

- CI reproducible build
```bash
# Validate environment
npm run build:validate

# Install exact deps
npm ci

# Build frontend and bundle app
npm run build
npm run tauri build
```

- Release (minimal steps)
```bash
# Sync and verify
node scripts/sync-version.js 1.0.0
npm run version:check

# Commit, tag and push
git add package.json src-tauri/Cargo.toml src-tauri/tauri.conf.json
git commit -m "chore: bump version to 1.0.0"
git tag v1.0.0
git push origin main
git push origin v1.0.0
```

- Hotfix flow
```bash
# From a release tag
git checkout -b hotfix/1.0.1 v1.0.0
# make fixes, bump patch
node scripts/sync-version.js patch
git checkout main && git merge hotfix/1.0.1
git tag v1.0.1
git push origin main --tags
```

Essential validation & troubleshooting
- Run pre-build validation before CI or local release:
```bash
npm run build:validate
```
- Common fixes
  - If Rust toolchain error: `rustup update stable` then `rustc --version`.
  - If version mismatch: `node scripts/sync-version.js <version>` then commit.
  - If CI fails due to signing: ensure code-signing secrets exist in repository Secrets.

Prioritized future improvements
1. Auto-update: integrate Tauri updater, delta updates, and a rollback mechanism.
2. Multi-platform CI: add macOS and Linux runners and cross-platform testing.
3. Testing: add Playwright E2E, visual regression, and performance benchmarks.
4. Distribution: Microsoft Store / Chocolatey / WinGet manifests.

Optional / low-effort enhancements
- Add a lint rule blocking new `@ts-ignore` or `any` in PRs.
- Add a small CI job that validates a representative set of IPC payloads against backend types.

Last updated: 2025-01-01
