# CI/CD Setup and Release Process

Complete guide to ThirdScreen's continuous integration and delivery pipeline.

## Overview

ThirdScreen follows **CI/CD Awareness** principles from `docs/skills/ci-cd-awareness/skill.md`:

### Core Principles
- **Build Reproducibility**: Consistent outputs from same inputs
- **Environment Agnostic**: No hardcoded paths or machine-specific config
- **Automation-Friendly**: All workflows run unattended
- **Version Discipline**: Single source of truth for versioning
- **Security First**: Never commit secrets, externalize configuration

---

## Version Management

### Single Source of Truth

All version numbers must stay synchronized across:
- `package.json` → Frontend version
- `src-tauri/Cargo.toml` → Rust crate version
- `src-tauri/tauri.conf.json` → App bundle version

### Version Sync Script

```bash
# Check current versions
npm run version:check

# Set specific version
node scripts/sync-version.js 1.2.3

# Increment versions
node scripts/sync-version.js patch   # 1.0.0 → 1.0.1
node scripts/sync-version.js minor   # 1.0.0 → 1.1.0
node scripts/sync-version.js major   # 1.0.0 → 2.0.0
```

**When to update versions:**
- **Patch (1.0.x)**: Bug fixes, minor improvements
- **Minor (1.x.0)**: New features, backward-compatible changes
- **Major (x.0.0)**: Breaking changes, major rewrites

---

## Environment Variables

### Required for Development

None! ThirdScreen runs with zero configuration out of the box.

### Optional for Development

```bash
# Enable debug logging
RUST_LOG=debug npm run tauri:dev

# Use specific port (default: 5173)
VITE_PORT=3000 npm run dev
```

### Required for CI/CD

**Build Configuration:**
- `NODE_ENV=production` - Production build mode
- `CI=true` - Indicates CI environment (auto-set by GitHub Actions)

**Secrets (GitHub Actions only):**
- `TAURI_SIGNING_PRIVATE_KEY` - Windows code signing certificate (base64-encoded PFX)
- `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` - Certificate password

**Never commit secrets to repository!** See [`.env.example`](.env.example) for complete list.

---

## GitHub Actions Workflows

### 1. Build and Test Workflow

**File**: `.github/workflows/build.yml`

**Triggers**:
- Push to `main` or `develop` branches
- Pull requests targeting `main` or `develop`
- Manual trigger via GitHub UI

**Jobs**:

1. **Version Check** - Validates version consistency across all config files
2. **Lint** - TypeScript type check, Rust format check, Clippy lints
3. **Build** - Builds app for Windows (expandable to macOS, Linux)
4. **Test** - Runs Rust unit tests
5. **Security Audit** - npm audit + cargo audit for vulnerabilities

**Artifacts**: Debug builds uploaded for 7 days

### 2. Release Workflow

**File**: `.github/workflows/release.yml`

**Triggers**:
- Push tags matching `v*.*.*` (e.g., `v1.0.0`)
- Manual trigger with version input

**Jobs**:

1. **Validate Version** - Ensures tag/version consistency
2. **Build Release** - Builds signed installers for all platforms
3. **Create Release** - Creates GitHub release with artifacts

**Artifacts**: Production installers (MSI, EXE) + build metadata

---

## Build Process

### Local Development Build

```bash
# Install dependencies
npm install

# Run dev server (hot reload)
npm run tauri:dev

# Build for production
npm run tauri:build
```

### CI Build (Reproducible)

```bash
# 1. Validate environment
npm run build:validate

# 2. Install exact dependencies
npm ci

# 3. Build frontend
npm run build

# 4. Build Tauri app
npm run tauri build
```

**Key Differences:**
- `npm ci` (CI) vs `npm install` (local) - Installs exact lockfile versions
- `build:validate` runs automatically before builds via `prebuild` hook
- Production builds use `--release` Cargo profile

---

## Release Process

### Step-by-Step Release

1. **Update Version**
   ```bash
   # Sync version across all files
   node scripts/sync-version.js 1.0.0
   
   # Verify sync
   npm run version:check
   ```

2. **Commit and Tag**
   ```bash
   git add package.json src-tauri/Cargo.toml src-tauri/tauri.conf.json
   git commit -m "chore: bump version to 1.0.0"
   git tag v1.0.0
   ```

3. **Push to GitHub**
   ```bash
   git push origin main
   git push origin v1.0.0
   ```

4. **Monitor CI**
   - Go to [Actions tab](https://github.com/YosrBennagra/3rd-Window/actions)
   - Watch "Release" workflow execute
   - Builds Windows MSI/EXE installers
   - Creates GitHub release with artifacts

5. **Verify Release**
   - Check [Releases page](https://github.com/YosrBennagra/3rd-Window/releases)
   - Download and test installers
   - Verify version numbers in "About" dialog

### Hotfix Releases

For urgent bug fixes:

```bash
# Create hotfix branch from tag
git checkout -b hotfix/1.0.1 v1.0.0

# Make fixes
git commit -m "fix: critical bug"

# Bump patch version
node scripts/sync-version.js patch  # 1.0.0 → 1.0.1

# Merge to main and tag
git checkout main
git merge hotfix/1.0.1
git tag v1.0.1
git push origin main --tags
```

---

## Build Validation

### Pre-Build Checks

The `validate-build.js` script runs automatically before builds and checks:

- ✅ Node.js version (18+)
- ✅ npm installed
- ✅ Rust toolchain (1.77.2+)
- ✅ Tauri CLI configured
- ✅ Version consistency
- ✅ Required files exist
- ✅ No committed .env files

**Manual validation:**
```bash
npm run build:validate
```

### Post-Build Verification

After building, verify:

1. **Installer exists**: `src-tauri/target/release/bundle/msi/*.msi`
2. **Version matches**: Check "About" dialog in installed app
3. **App starts**: Launch and test basic functionality
4. **No errors**: Check Windows Event Viewer for crashes

---

## Troubleshooting

### Version Mismatch Error

```
❌ Error: package.json version (1.0.0) doesn't match Cargo.toml (0.1.0)
```

**Fix:**
```bash
node scripts/sync-version.js 1.0.0
git commit -am "chore: sync versions"
```

### Build Validation Fails

```
❌ Rust 1.77.2+ required
```

**Fix:**
```bash
# Update Rust
rustup update stable

# Verify version
rustc --version
```

### CI Build Fails (Windows)

**Common issues:**
- Missing code signing secrets → Add to GitHub repository secrets
- Rust compilation error → Check `cargo check` locally
- TypeScript errors → Run `npm run build` locally

**Debug:**
```bash
# Check GitHub Actions logs
# Enable debug logging in workflow:
env:
  ACTIONS_STEP_DEBUG: true
```

### Release Workflow Skipped

**Cause:** Tag doesn't match `v*.*.*` pattern

**Fix:**
```bash
# Delete wrong tag
git tag -d wrong-tag
git push origin :refs/tags/wrong-tag

# Create correct tag
git tag v1.0.0
git push origin v1.0.0
```

---

## Security

### Secrets Management

**Never commit:**
- `.env` files
- Code signing certificates
- API keys or tokens
- Private keys

**Use GitHub Secrets:**
1. Go to repository Settings → Secrets and variables → Actions
2. Add secrets:
   - `TAURI_SIGNING_PRIVATE_KEY` (base64-encoded PFX)
   - `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`

**Encoding certificate:**
```bash
# Windows PowerShell
$bytes = [System.IO.File]::ReadAllBytes("cert.pfx")
[System.Convert]::ToBase64String($bytes) | Out-File cert-base64.txt
```

### Dependency Audits

**Automatic (CI):**
- `npm audit` checks JavaScript dependencies
- `cargo audit` checks Rust dependencies
- Runs on every build

**Manual:**
```bash
# Check npm vulnerabilities
npm audit

# Fix automatically
npm audit fix

# Check Rust vulnerabilities
cargo install cargo-audit
cargo audit --file src-tauri/Cargo.lock
```

---

## Platform-Specific Notes

### Windows

**Installers Generated:**
- `.msi` - Windows Installer (recommended)
- `.exe` - NSIS installer (portable)

**Code Signing:**
- Requires valid code signing certificate
- Optional but recommended for production
- Prevents "Unknown Publisher" warnings

**Requirements:**
- Visual Studio Build Tools (automatically installed by Rust)
- No admin privileges needed for build

### macOS (Future)

**Installers:**
- `.dmg` - Disk image
- `.app` - Application bundle

**Code Signing:**
- Requires Apple Developer account
- Must be signed and notarized for distribution

### Linux (Future)

**Installers:**
- `.deb` - Debian package
- `.AppImage` - Portable executable

**Dependencies:**
- webkit2gtk-4.0
- gtk-3
- libayatana-appindicator3

---

## Performance Optimizations

### Build Times

**Local builds (~2-5 minutes):**
- Frontend: 10-30s (TypeScript + Vite)
- Rust: 1-4min (first build, then incremental)

**CI builds (~5-10 minutes):**
- Includes dependency download
- Rust cache speeds up subsequent builds

**Optimization tips:**
```bash
# Use incremental Rust compilation (default in dev)
export CARGO_INCREMENTAL=1

# Parallel builds
cargo build --release -j$(nproc)

# Rust cache in CI (already configured)
# uses: Swatinem/rust-cache@v2
```

### Artifact Sizes

**Development (debug):**
- Frontend bundle: ~2-5 MB
- Rust binary: ~50-100 MB (includes debug symbols)

**Production (release):**
- MSI installer: ~8-15 MB
- Installed size: ~20-30 MB

---

## Monitoring

### Build Success Rate

Monitor in [GitHub Actions insights](https://github.com/YosrBennagra/3rd-Window/actions):
- Build duration trends
- Success/failure rates
- Flaky tests

### Release Metrics

Track in repository:
- Time between releases
- Download counts (GitHub Insights)
- Issue reports post-release

---

## Future Enhancements

### Planned Improvements

1. **Auto-Update System**
   - Tauri updater integration
   - Delta updates for smaller downloads
   - Rollback mechanism

2. **Multi-Platform CI**
   - macOS builds (GitHub-hosted macOS runners)
   - Linux builds (Ubuntu 22.04 LTS)
   - Cross-platform testing

3. **Testing**
   - E2E tests with Playwright
   - Visual regression tests
   - Performance benchmarks

4. **Distribution**
   - Microsoft Store submission
   - Chocolatey package
   - WinGet manifest

---

## References

- [Tauri v2 Documentation](https://tauri.app/v2/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Semantic Versioning](https://semver.org/)
- [Conventional Commits](https://www.conventionalcommits.org/)

---

**Last Updated**: 2025-01-01  
**CI/CD Version**: 1.0.0  
**Workflow Coverage**: Build, Test, Release
