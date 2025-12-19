# 🚨 OAUTH STUCK - TROUBLESHOOTING GUIDE

## Problem: Discord shows "redirect to: null"

You're seeing this Discord OAuth screen:
- ✅ Application name shown correctly ("3rd window")
- ✅ Permissions displayed correctly
- ❌ **"redirected outside of Discord to: null"** ← THIS IS THE PROBLEM

## Root Cause

Discord OAuth is showing "null" as the redirect URI because **the redirect URI hasn't been whitelisted in Discord Developer Portal yet**.

---

## ⚡ IMMEDIATE FIX (5 minutes)

### Step 1: Access Discord Developer Portal
1. Open browser and go to: **https://discord.com/developers/applications**
2. Log in if needed
3. Click on your application: **"3rd window"** (or whatever your app name is)
   - Client ID should be: `1451349429960577114`

### Step 2: Navigate to OAuth2 Settings
1. In the left sidebar, click: **"OAuth2"**
2. Click the **"General"** sub-tab (should be selected by default)
3. Scroll down to find the **"Redirects"** section

### Step 3: Add the Custom Protocol Redirect
In the "Redirects" section:
1. Click the **"+ Add Redirect"** button
2. Enter EXACTLY: `thirdscreen://discord-callback`
3. **Click "Save Changes"** at the bottom of the page (CRITICAL - changes won't apply otherwise!)

**Important Notes:**
- ⚠️ The protocol MUST be `thirdscreen://` (not http:// or https://)
- ⚠️ The path MUST be `discord-callback` (case-sensitive)
- ⚠️ No trailing slash
- ⚠️ Don't forget to click "Save Changes"!

### Step 4: Verify
After saving, your Redirects section should show:
```
✅ thirdscreen://discord-callback
```

You can also keep any existing redirect URIs (like `http://localhost:...`) if you had them.

---

## 🔄 Test Again

### After adding the redirect URI:

1. **Close** the stuck Discord OAuth window
2. **Go back to ThirdScreen app**
3. Click **"Connect Discord"** again
4. Discord OAuth should now show: **"redirected outside of Discord to: thirdscreen://discord-callback"**
5. Click **"Authorize"**
6. ✅ App should automatically capture the code and complete authorization!

---

## 🐛 Still Stuck? Additional Checks

### Check 1: Verify Redirect URI in Developer Portal
Go back to Discord Developer Portal → OAuth2 → General → Redirects
- Does it show `thirdscreen://discord-callback`?
- Did you click "Save Changes"?

### Check 2: Verify Client ID Matches
In [src-tauri/src/secure_storage.rs](src-tauri/src/secure_storage.rs), check that your client ID matches the one in Discord portal.

### Check 3: Check Browser Console
If using development mode (`npm run tauri:dev`):
1. Open browser DevTools (F12)
2. Check Console tab for errors
3. Look for network requests to `discord.com/oauth2/authorize`
4. Verify the `redirect_uri` parameter in the URL

### Check 4: Verify the Generated URL
The OAuth URL should look like this:
```
https://discord.com/oauth2/authorize
  ?client_id=1451349429960577114
  &redirect_uri=thirdscreen%3A%2F%2Fdiscord-callback
  &response_type=code
  &scope=identify%20messages.read
  &state=<random-uuid>
  &code_challenge=<random-string>
  &code_challenge_method=S256
```

The `redirect_uri` should be URL-encoded to: `thirdscreen%3A%2F%2Fdiscord-callback`

---

## 📝 What Changed?

### Previous OAuth Flow (Manual)
- Used `http://localhost:5173/oauth-callback` redirect
- User had to copy/paste authorization code manually

### New OAuth Flow (Automatic)
- Uses `thirdscreen://discord-callback` custom protocol
- App registers as protocol handler with operating system
- Discord redirects directly to app
- App captures code automatically (no copy/paste!)

**This is why you need to update the redirect URI in Discord portal.**

---

## ✅ Expected Behavior After Fix

1. Click "Connect Discord" in ThirdScreen
2. Status shows: "⏳ Waiting for authorization..."
3. Browser opens with Discord OAuth page
4. Page shows: **"redirected outside of Discord to: thirdscreen://discord-callback"**
5. Click "Authorize"
6. Browser URL changes to: `thirdscreen://discord-callback?code=...`
7. Operating system passes URL to ThirdScreen app
8. App captures authorization code
9. App exchanges code for tokens (PKCE verification)
10. Status updates: "✅ Connected successfully!"
11. Done! No manual steps required.

---

## 🔐 Security Note

The "null" redirect doesn't mean your app is broken - it's Discord's way of saying "I don't recognize this redirect URI, so I'm not going to tell the user where they'll be redirected."

This is actually a **security feature** - Discord won't redirect users to unauthorized URLs, which prevents malicious apps from hijacking OAuth flows.

---

## 📚 Related Files

- [DISCORD_OAUTH_SETUP.md](./DISCORD_OAUTH_SETUP.md) - Full setup guide
- [DISCORD_OAUTH_AUTOMATIC.md](./DISCORD_OAUTH_AUTOMATIC.md) - Technical implementation details
- [src-tauri/src/discord.rs](./src-tauri/src/discord.rs) - OAuth URL generation (line 331)
- [src-tauri/src/discord_commands.rs](./src-tauri/src/discord_commands.rs) - OAuth command (line 23)

---

## 🆘 Need More Help?

If the OAuth is still stuck after:
1. ✅ Adding redirect URI to Discord portal
2. ✅ Clicking "Save Changes"
3. ✅ Retrying the OAuth flow

Check the Tauri logs for the generated OAuth URL:
```powershell
npm run tauri:dev
```

Look for a log line like:
```
[INFO] Generated OAuth URL: https://discord.com/oauth2/authorize?client_id=...
```

Copy that full URL and verify the `redirect_uri` parameter is included and correct.
