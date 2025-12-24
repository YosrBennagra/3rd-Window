# CI/CD Architecture Overview

Visual guide to ThirdScreen's complete CI/CD pipeline.

## Pipeline Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      DEVELOPER WORKFLOW                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┴──────────┐
                    │  Local Development  │
                    │  npm run tauri:dev  │
                    └─────────┬──────────┘
                              │
              ┌───────────────┴───────────────┐
              │                               │
    ┌─────────▼─────────┐         ┌─────────▼──────────┐
    │  Code Changes      │         │  Version Update    │
    │  git commit        │         │  sync-version.js   │
    └─────────┬─────────┘         └─────────┬──────────┘
              │                               │
              └───────────────┬───────────────┘
                              │
                    ┌─────────▼──────────┐
                    │  git push / tag    │
                    └─────────┬──────────┘
                              │
┌─────────────────────────────┴─────────────────────────────┐
│                    GITHUB ACTIONS CI/CD                    │
└────────────────────────────────────────────────────────────┘
                              │
            ┌─────────────────┼─────────────────┐
            │                 │                 │
    ┌───────▼────────┐  ┌────▼─────┐  ┌───────▼────────┐
    │  Push to main  │  │  PR      │  │  Tag v*.*.*    │
    │  /develop      │  │  Review  │  │  Release       │
    └───────┬────────┘  └────┬─────┘  └───────┬────────┘
            │                │                 │
            └────────────────┼─────────────────┘
                             │
                   ┌─────────▼──────────┐
                   │  BUILD WORKFLOW    │
                   │  .github/workflows │
                   │  /build.yml        │
                   └─────────┬──────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
┌───────▼────────┐  ┌────────▼─────────┐  ┌──────▼───────┐
│ Version Check  │  │  Lint & Format   │  │  Build       │
│ - package.json │  │  - TypeScript    │  │  - Frontend  │
│ - Cargo.toml   │  │  - Rust fmt      │  │  - Rust      │
│ - tauri.conf   │  │  - Clippy        │  │  - Windows   │
└───────┬────────┘  └────────┬─────────┘  └──────┬───────┘
        │                    │                    │
        └────────────────────┼────────────────────┘
                             │
                   ┌─────────▼──────────┐
                   │  Test & Audit      │
                   │  - Rust tests      │
                   │  - npm audit       │
                   │  - cargo audit     │
                   └─────────┬──────────┘
                             │
                   ┌─────────▼──────────┐
                   │  Upload Artifacts  │
                   │  (7-day retention) │
                   └────────────────────┘

            ┌─────────────────────────────────┐
            │  RELEASE WORKFLOW               │
            │  (Triggered by version tag)     │
            └─────────┬───────────────────────┘
                      │
        ┌─────────────┼─────────────┐
        │             │             │
┌───────▼────────┐  ┌─▼──────────┐  ┌─────────▼─────────┐
│ Validate       │  │ Build      │  │ Create Release    │
│ Version        │  │ Signed     │  │ - MSI installer   │
│ Consistency    │  │ Installers │  │ - EXE installer   │
└───────┬────────┘  └────┬───────┘  │ - Release notes   │
        │                │          │ - Build metadata  │
        └────────────────┼──────────┘                   │
                         │                              │
                         └──────────────────────────────┘
                                    │
                    ┌───────────────▼───────────────┐
                    │  GITHUB RELEASE               │
                    │  - Installers published       │
                    │  - Version tagged             │
                    │  - Downloads available        │
                    └───────────────────────────────┘
```

## File Structure

```
ThirdScreen/
├── .github/
│   └── workflows/
│       ├── build.yml          # CI: Build, test, lint (main/develop/PR)
│       └── release.yml        # CD: Release automation (tags)
│
├── scripts/
│   ├── sync-version.js        # Version synchronization tool
│   └── validate-build.js      # Build environment validator
│
├── docs/
│   └── dev/
│       ├── ci-cd.md           # Complete CI/CD guide
│       └── ci-cd-quick-ref.md # Quick reference
│
├── .env.example               # Environment variable template
├── .gitignore                 # Secrets excluded
├── package.json               # Version: 1.0.0 + CI scripts
├── package-lock.json          # Locked dependencies
│
└── src-tauri/
    ├── Cargo.toml             # Version: 1.0.0
    ├── Cargo.lock             # Locked dependencies
    └── tauri.conf.json        # Version: 1.0.0
```

## Build Matrix

| Trigger | Workflow | Jobs | Artifacts | Duration |
|---------|----------|------|-----------|----------|
| Push to main/develop | build.yml | Version check, Lint, Build, Test, Audit | Debug builds | ~5-10 min |
| Pull Request | build.yml | Version check, Lint, Build, Test, Audit | Debug builds | ~5-10 min |
| Tag `v*.*.*` | release.yml | Validate, Build (signed), Release | MSI, EXE | ~10-15 min |
| Manual | release.yml | Validate, Build (signed), Release | MSI, EXE | ~10-15 min |

## Version Management Flow

```
┌──────────────────────────────────────────────────────────┐
│  Developer runs: node scripts/sync-version.js 1.2.3      │
└──────────────┬───────────────────────────────────────────┘
               │
       ┌───────┴────────┐
       │  Sync Script   │
       │  Validates     │
       │  semver format │
       └───────┬────────┘
               │
   ┌───────────┼───────────┐
   │           │           │
┌──▼─────┐ ┌──▼────────┐ ┌▼──────────────┐
│package │ │Cargo.toml │ │tauri.conf.json│
│.json   │ │version =  │ │version: 1.2.3 │
│v:1.2.3 │ │"1.2.3"    │ └───────────────┘
└────────┘ └───────────┘
               │
               │ git commit -am "chore: bump version to 1.2.3"
               │ git tag v1.2.3
               │ git push --tags
               ▼
      ┌────────────────┐
      │ GitHub Actions │
      │ Validates all  │
      │ versions match │
      └────────────────┘
```

## Environment Variables

### Development (Local)
- None required! Works out of the box.

### CI (GitHub Actions)
**Automatic:**
- `CI=true`
- `GITHUB_ACTIONS=true`
- `GITHUB_SHA=<commit>`
- `GITHUB_REF=<branch/tag>`

**Manual (GitHub Secrets):**
- `TAURI_SIGNING_PRIVATE_KEY`
- `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`

### Production (Optional)
- `RUST_LOG=debug` - Enable debug logging
- `NODE_ENV=production` - Production build mode

## Security Model

```
┌────────────────────────────────────────┐
│         SECURITY BOUNDARIES            │
└────────────────────────────────────────┘

✅ SAFE (Committed to repository):
   - package.json (version, dependencies)
   - Cargo.toml (version, dependencies)
   - tauri.conf.json (app config)
   - .env.example (template only)
   - Lockfiles (package-lock.json, Cargo.lock)

❌ NEVER COMMIT (gitignored):
   - .env, .env.local, .env.production
   - Code signing certificates (.pfx)
   - API keys, tokens, secrets
   - src-tauri/target/ (build artifacts)

🔒 EXTERNALIZED (GitHub Secrets):
   - TAURI_SIGNING_PRIVATE_KEY
   - TAURI_SIGNING_PRIVATE_KEY_PASSWORD

🔍 AUTOMATED SCANNING:
   - npm audit (JavaScript vulnerabilities)
   - cargo audit (Rust vulnerabilities)
   - Dependabot (dependency updates)
```

## Release Cadence

| Type | Increment | Example | Trigger | Frequency |
|------|-----------|---------|---------|-----------|
| **Patch** | 1.0.x | Bug fixes, hotfixes | As needed | Weekly-Monthly |
| **Minor** | 1.x.0 | New features | Feature complete | Monthly-Quarterly |
| **Major** | x.0.0 | Breaking changes | Major rewrite | Yearly |

## Artifact Retention

| Artifact Type | Location | Retention | Size |
|---------------|----------|-----------|------|
| Debug builds | GitHub Actions | 7 days | ~50-100 MB |
| Release builds | GitHub Releases | Permanent | ~8-15 MB (MSI) |
| Build metadata | GitHub Actions | 90 days | ~1 KB |

## Monitoring & Metrics

### GitHub Actions Insights
- Build success rate: Track in Actions tab
- Build duration trends: Compare workflow runs
- Artifact downloads: Release insights

### Key Metrics
- **Build Time**: Target < 10 minutes for CI builds
- **Test Coverage**: Expand as project grows
- **Security Vulnerabilities**: Zero high/critical
- **Version Consistency**: 100% (enforced by CI)

## Failure Handling

```
┌─────────────────────────────────────────┐
│  CI Build Failure Scenarios             │
└─────────────────────────────────────────┘

Version Mismatch
├─ Detected by: version-check job
├─ Fix: node scripts/sync-version.js <version>
└─ Blocks: All subsequent jobs

TypeScript Errors
├─ Detected by: lint job
├─ Fix: npm run build locally
└─ Blocks: Build job

Rust Errors
├─ Detected by: lint job (clippy)
├─ Fix: cargo clippy --fix
└─ Blocks: Build job

Test Failures
├─- Detected by: test-rust job
├─ Fix: cargo test locally
└─ Blocks: Release (but not build)

Security Vulnerabilities
├─ Detected by: security-audit job
├─ Fix: npm audit fix / cargo update
└─ Warning only (doesn't block)
```

## Next Steps for CI/CD Maturity

### Phase 1 (Current) ✅
- [x] Version synchronization
- [x] Build validation
- [x] Automated builds (Windows)
- [x] Automated releases
- [x] Security scanning

### Phase 2 (Planned)
- [ ] Multi-platform builds (macOS, Linux)
- [ ] E2E testing with Playwright
- [ ] Visual regression tests
- [ ] Performance benchmarks
- [ ] Code coverage tracking

### Phase 3 (Future)
- [ ] Auto-update system
- [ ] Staged rollouts (beta → stable)
- [ ] Crash reporting integration
- [ ] Analytics pipeline
- [ ] A/B testing framework

## Resources

- **Workflows**: [.github/workflows/](.github/workflows/)
- **Scripts**: [scripts/](scripts/)
- **Documentation**: [docs/dev/ci-cd.md](docs/dev/ci-cd.md)
- **Quick Reference**: [docs/dev/ci-cd-quick-ref.md](docs/dev/ci-cd-quick-ref.md)

---

**Architecture Version**: 1.0.0  
**Last Updated**: 2025-01-01  
**Status**: Production Ready ✅
