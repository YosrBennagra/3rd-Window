# Discord OAuth Setup - Final Steps

## ✅ Implementation Complete!

The automatic Discord OAuth flow has been successfully implemented with:
- ✅ PKCE (Proof Key for Code Exchange) security
- ✅ Custom protocol handler (`thirdscreen://discord-callback`)
- ✅ Automatic browser opening
- ✅ Zero manual copy/paste required
- ✅ Inline UI status messages
- ✅ Full Rust + Frontend integration

## 🚨 CRITICAL: Discord Developer Portal Configuration

**Before testing OAuth, you MUST update your Discord application settings:**

### Step 1: Access Discord Developer Portal
1. Go to: https://discord.com/developers/applications
2. Select your application (Client ID: `1451349429960577114`)
3. Navigate to: **OAuth2** → **General**

### Step 2: Add Redirect URI
In the "Redirects" section, click **"Add Redirect"** and enter:

```
thirdscreen://discord-callback
```

**Important**: 
- The protocol is `thirdscreen://` (not `http://` or `https://`)
- The path is exactly `discord-callback` (case-sensitive)
- Click **"Save Changes"** at the bottom of the page

### Step 3: Verify Configuration
Your redirect URIs should now include:
- ✅ `thirdscreen://discord-callback` ← **NEW** (required for desktop app)
- Any previous URIs (e.g., `http://localhost:5173/oauth-callback`) can remain

---

## 🧪 Testing the OAuth Flow

### Test in Development Mode

```powershell
npm run tauri:dev
```

### Expected Flow:
1. User clicks **"Connect Discord"** in Widget Settings
2. Status shows: **"⏳ Waiting for authorization..."**
3. Browser opens automatically with Discord OAuth consent screen
4. User clicks **"Authorize"** on Discord
5. Browser redirects to `thirdscreen://discord-callback?code=...`
6. App captures authorization code automatically (no copy/paste!)
7. App exchanges code for tokens using PKCE verification
8. Status updates: **"✅ Connected successfully!"** or **"❌ Connection failed"**
9. Tokens stored securely via `CredentialsStore`

### Troubleshooting

**Error: "Invalid redirect_uri"**
- → You forgot to add `thirdscreen://discord-callback` in Discord Developer Portal (see Step 2 above)

**Error: "Failed to open browser"**
- → Check system default browser settings
- → Try running app as administrator

**No callback received**
- → Windows may not have registered the protocol handler yet
- → Try: Close app → Rebuild → Restart Windows → Test again

**Status stuck on "Waiting for authorization..."**
- → Check browser console for errors
- → Verify Discord app is authorized (check https://discord.com/authorized-applications)
- → Check Tauri event listener registered correctly

---

## 🔐 Security Notes

### PKCE Implementation
- **Code Verifier**: 128-character random string (stored in `PkceState`)
- **Code Challenge**: SHA-256 hash of verifier, base64-url encoded
- **Challenge Method**: `S256` (required by OAuth 2.1 spec)

### Token Storage
- Tokens stored via `tauri-plugin-store` (encrypted at rest)
- Credentials never logged or exposed to frontend
- PKCE verifier cleared after token exchange

### Protocol Handler Security
- `thirdscreen://` protocol only accepts `discord-callback` path
- Authorization code extracted safely from query parameters
- Deep-link event handler validates URL format before emitting

---

## 📝 Implementation Details

### Frontend Changes
- **File**: `src/services/discord.ts`
- **Method**: `startOAuthFlow()` - Returns Promise that resolves when OAuth completes
- **Event**: Listens for `discord-oauth-callback` event from Tauri

### Backend Changes
- **Command**: `discord_start_oauth` - Generates PKCE, opens browser
- **Handler**: Deep-link listener in `lib.rs` - Captures redirect, emits event
- **Storage**: `PkceState` manages code_verifier across OAuth flow

### UI Changes
- **File**: `src/components/panels/WidgetSettingsPanel.tsx`
- **Removed**: `alert()` and `prompt()` for authorization code
- **Added**: Inline `connectionStatus` with loading indicators

### Dependencies Added
- `tauri-plugin-deep-link` v2.4.5 - Custom protocol registration
- `tauri-plugin-opener` v2.5.2 - Cross-platform browser opening (replaces deprecated shell)
- `sha2` v0.10 - SHA-256 for PKCE challenge
- `rand` v0.8 - Cryptographically secure random generation

---

## 🎯 Next Steps

1. **REQUIRED**: Update Discord Developer Portal redirect URI (see Step 2 above)
2. **Test**: Run `npm run tauri:dev` and test full OAuth flow
3. **Verify**: Check tokens stored in `tauri-plugin-store` data file
4. **Document**: Update user-facing documentation with new flow
5. **Deploy**: Build production installer: `npm run tauri:build`

---

## 📚 Related Documentation

- [DISCORD_OAUTH_AUTOMATIC.md](./DISCORD_OAUTH_AUTOMATIC.md) - Full technical implementation details
- [docs/security/hardening.md](./docs/security/hardening.md) - Security best practices
- Discord OAuth2 Docs: https://discord.com/developers/docs/topics/oauth2

---

## ✨ Status: READY FOR TESTING

All code changes are complete. Only the Discord Developer Portal configuration remains (5-minute task).
