# Discord OAuth Implementation - Quick Reference

## ✅ Current Status: FIXED

**OAuth Method**: Localhost HTTP redirect with embedded callback server

---

## Discord Developer Portal Setup

### Redirect URI Configuration

**Go to**: https://discord.com/developers/applications

**Application**: Client ID `1451349429960577114`

**OAuth2 → General → Redirects**:

✅ **ADD THIS**:
```
http://127.0.0.1:53172/discord/callback
```

❌ **REMOVE THIS** (old, broken):
```
thirdscreen://discord-callback
```

**Don't forget to click "Save Changes"!**

---

## How OAuth Flow Works

```
User clicks "Connect Discord"
         ↓
OAuth URL generated with PKCE
         ↓
Browser opens Discord authorization page
         ↓
User clicks "Authorize"
         ↓
Discord redirects to: http://127.0.0.1:53172/discord/callback?code=...&state=...
         ↓
Local HTTP server (port 53172) receives callback
         ↓
Server validates state (CSRF protection)
         ↓
Server exchanges code for access token (PKCE)
         ↓
Browser shows success page
         ↓
Server shuts down
         ↓
✅ User connected!
```

---

## Code Architecture

### Key Files

1. **src-tauri/src/discord.rs**
   - OAuth URL generation
   - Token exchange logic
   - Discord API client
   - Constants: redirect URI, scopes, endpoints

2. **src-tauri/src/discord_commands.rs**
   - `discord_start_oauth()` - Initiates flow, starts callback server
   - `run_callback_server()` - HTTP server on port 53172
   - `discord_connect()` - Status check command
   - `discord_disconnect()` - Logout command

3. **src-tauri/src/lib.rs**
   - Registers Tauri commands
   - Initializes Discord client state
   - PKCE state management

### Key Components

**PKCE State Store**:
```rust
pub struct PkceState {
    pub code_verifier: Arc<Mutex<Option<String>>>,  // For token exchange
    pub oauth_state: Arc<Mutex<Option<String>>>,    // For CSRF protection
}
```

**Callback Server**:
- Port: `53172`
- Path: `/discord/callback`
- Method: `GET`
- Single-use (shuts down after one callback)
- Returns HTML success/error page

**Security Features**:
- ✅ PKCE (S256 challenge method)
- ✅ State validation (CSRF protection)
- ✅ No client_secret in app code
- ✅ Tokens stored in memory (not logged)
- ✅ Single-use callback server

---

## Testing Commands

### Check Rust Compilation
```bash
cargo check --manifest-path src-tauri/Cargo.toml
```

### Build App
```bash
npm run tauri:dev
```

### Watch Logs
Look for these messages in the console:
```
✅ OAuth URL generated: https://discord.com/oauth2/authorize?...
✅ Callback server listening on http://127.0.0.1:53172/discord/callback
✅ Received callback: /discord/callback?code=...&state=...
✅ State validated successfully
✅ Token exchange successful!
✅ OAuth flow complete - server shutting down
```

---

## Troubleshooting

### "null" redirect in Discord OAuth page
**Fix**: Add `http://127.0.0.1:53172/discord/callback` to Discord Developer Portal

### Connection refused on callback
**Fix**: 
- Check if port 53172 is already in use
- Check firewall settings
- Restart the app

### Invalid redirect_uri error
**Fix**: 
- Verify redirect URI in Discord portal exactly matches: `http://127.0.0.1:53172/discord/callback`
- No typos, no trailing slash, use 127.0.0.1 (not localhost)
- Click "Save Changes" in Discord portal

### State validation failed
**Cause**: CSRF protection (this is working as intended)
**Fix**: Start a fresh OAuth flow from the app

### Callback server already running
**Fix**: 
- Close all instances of ThirdScreen
- Wait 10 seconds for port to release
- Restart app

---

## Configuration Constants

**File**: `src-tauri/src/discord.rs`

```rust
const DISCORD_API_BASE: &str = "https://discord.com/api/v10";
const DISCORD_OAUTH_AUTHORIZE: &str = "https://discord.com/oauth2/authorize";
const DISCORD_OAUTH_TOKEN: &str = "https://discord.com/api/v10/oauth2/token";
const DISCORD_REDIRECT_URI: &str = "http://127.0.0.1:53172/discord/callback";
const DISCORD_SCOPES: &str = "identify";
```

**To change port**: Update `DISCORD_REDIRECT_URI` and update Discord Developer Portal

---

## OAuth URL Structure

```
https://discord.com/oauth2/authorize?
  client_id=1451349429960577114
  &redirect_uri=http%3A%2F%2F127.0.0.1%3A53172%2Fdiscord%2Fcallback
  &response_type=code
  &scope=identify
  &state=<uuid>
  &code_challenge=<sha256_hash>
  &code_challenge_method=S256
```

**Parameters**:
- `client_id`: Discord application ID
- `redirect_uri`: URL-encoded callback URL
- `response_type`: `code` (authorization code flow)
- `scope`: `identify` (basic user info only)
- `state`: Random UUID for CSRF protection
- `code_challenge`: SHA-256 hash of code_verifier
- `code_challenge_method`: `S256` (PKCE)

---

## Token Exchange Request

**Endpoint**: `POST https://discord.com/api/v10/oauth2/token`

**Headers**: `Content-Type: application/x-www-form-urlencoded`

**Body**:
```
client_id=<discord_client_id>
&grant_type=authorization_code
&code=<authorization_code>
&redirect_uri=http://127.0.0.1:53172/discord/callback
&code_verifier=<pkce_verifier>
```

**Response**:
```json
{
  "access_token": "<token>",
  "token_type": "Bearer",
  "expires_in": 604800,
  "refresh_token": "<refresh_token>",
  "scope": "identify"
}
```

---

## Dependencies Added

**Cargo.toml**:
```toml
tiny_http = "0.12"
```

**Purpose**: Lightweight HTTP server for OAuth callback handling

---

## Frontend Integration

**Tauri Commands**:
```typescript
import { invoke } from '@tauri-apps/api/core';

// Start OAuth flow
await invoke('discord_start_oauth');

// Check connection status
const status = await invoke('discord_connect');

// Disconnect
await invoke('discord_disconnect');

// Get auth state
const state = await invoke('discord_get_auth_state');

// Get DM notifications
const notifications = await invoke('discord_get_dm_notifications', { limit: 10 });
```

**No more manual code entry!** The OAuth flow completes automatically.

---

## Success Criteria

✅ User clicks "Connect Discord" button
✅ Browser opens automatically
✅ User authorizes on Discord
✅ Browser shows success page
✅ ThirdScreen shows "Connected" status
✅ User info displayed in app
✅ No errors in console logs

---

## What's Next

After successful connection:
1. Fetch Discord user info
2. Poll for DM notifications
3. Display unread message count
4. Implement Discord widget in dashboard
5. Add notification settings

---

**Last Updated**: 2025-12-19
**Status**: ✅ Implementation Complete
**Action Required**: Update Discord Developer Portal redirect URI
