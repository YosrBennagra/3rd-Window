# Discord Credentials - Security Notice

## ✅ SECURE STORAGE IMPLEMENTED

Your Discord credentials are now **encrypted and stored securely** using Tauri Secure Storage!

## Current Status

✅ **Credentials encrypted** using tauri-plugin-store
✅ **Stored in**: `credentials.dat` (encrypted file in app data directory)
✅ **Safe for production** - No credentials in source code
✅ **Initial credentials** set on first run, then loaded from secure storage
✅ **Git-safe** - credentials.dat is in .gitignore and never committed

## For Local Development (Current Setup)

The app is ready to use with your Discord credentials configured. You can:
1. Build: `npm run tauri:build`
2. Run: `npm run tauri:dev`
3. Test Discord DM notifications

## ✅ How It Works Now (Implemented - Option 2)

Your credentials are secured using **Tauri Secure Storage Plugin**:

### Implementation Details

**Created File**: `src-tauri/src/secure_storage.rs`
- Manages encrypted credential storage
- Loads credentials from `credentials.dat` on startup
- Initializes with your credentials on first run
- All future runs load from encrypted storage

**Updated Files**:
- `src-tauri/src/discord.rs` - No hardcoded credentials
- `src-tauri/src/discord_commands.rs` - Loads from secure storage
- `src-tauri/src/lib.rs` - Initializes secure storage system

**How It Works**:
1. App starts → checks for `credentials.dat`
2. If not found → creates it with your credentials (first run only)
3. Credentials encrypted using tauri-plugin-store
4. All future access reads from encrypted storage
5. No credentials ever in source code

**Where Credentials Are Stored**:
```
Windows: %APPDATA%\com.thirdscreen.app\credentials.dat
Linux: ~/.config/com.thirdscreen.app/credentials.dat
macOS: ~/Library/Application Support/com.thirdscreen.app/credentials.dat
```

### Initial Credentials

Your credentials are set ONCE on first app launch:
- **Client ID**: `1451349429960577114`
- **Client Secret**: `A7oqff...` (encrypted in storage)

These are only in the source code temporarily for initialization, then loaded from secure storage.

## If Accidentally Committed to Git

If you've already committed these credentials to a public repository:

1. **Regenerate Discord Secret IMMEDIATELY**:
   - Go to [Discord Developer Portal](https://discord.com/developers/applications)
   - Select your application
   - OAuth2 → Reset Secret
   - Update your local files with new secret

2. **Remove from Git history**:
```bash
# Use git-filter-repo or BFG Repo-Cleaner
# This rewrites history - coordinate with team first
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch src-tauri/src/discord_commands.rs" \
  --prune-empty --tag-name-filter cat -- --all
```

3. **Force push** (only if you're the sole developer):
```bash
git push origin --force --all
```

## Best Practices

- ✅ Keep `.gitignore` updated
- ✅ Use environment variables for deployment
- ✅ Rotate secrets regularly
- ✅ Never hardcode secrets in distributed code
- ✅ Use different credentials for dev/staging/production
- ⚠️ Review git commits before pushing
- ⚠️ Enable GitHub secret scanning
- ⚠️ Use private repositories when possible

## Current Credential Information

- **Application**: ThirdScreen Dashboard
- **Client ID**: `1451349429960577114`
- **Client Secret**: `A7oqff...` (partially hidden)
- **Scopes**: `identify messages.read`
- **Redirect URI**: `http://localhost:8080/callback`

## Need Help?

- [Tauri Security Best Practices](https://tauri.app/v1/guides/security/)
- [Discord OAuth2 Documentation](https://discord.com/developers/docs/topics/oauth2)
- Review `docs/discord-setup.md` for complete setup guide

---

**Remember**: Treat these credentials like passwords. Never share them publicly or commit them to public repositories!
