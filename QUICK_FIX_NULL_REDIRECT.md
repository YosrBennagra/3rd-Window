# 🔧 QUICK FIX: Discord Shows "null" Redirect

## What You're Seeing:
```
Once you authorize, you will be redirected outside of Discord to:
null    ← THIS IS THE PROBLEM
```

## Why This Happens:
Discord doesn't recognize `thirdscreen://discord-callback` because you haven't added it to your Discord application's allowed redirect URIs yet.

## ✅ HOW TO FIX (2 MINUTES):

### Visual Steps:

```
Step 1: Open Discord Developer Portal
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
URL: https://discord.com/developers/applications
```

```
Step 2: Select Your Application
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Look for: "3rd window" or similar name
Client ID: 1451349429960577114
```

```
Step 3: Navigate to OAuth2 Settings
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Left Sidebar → Click "OAuth2"
                  ↓
              Click "General" tab
```

```
Step 4: Find the Redirects Section
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Scroll down until you see:

    ┌─────────────────────────────────────────┐
    │ Redirects                                │
    ├─────────────────────────────────────────┤
    │ [+ Add Redirect]                         │  ← CLICK THIS
    │                                          │
    └─────────────────────────────────────────┘
```

```
Step 5: Enter the Redirect URI
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Type EXACTLY:

    thirdscreen://discord-callback

⚠️ Important:
   - No spaces
   - No trailing slash
   - Lowercase "thirdscreen"
   - Exactly "discord-callback"
```

```
Step 6: Save Your Changes
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Scroll to BOTTOM of page and click:

    [ Save Changes ]  ← CRITICAL STEP!

You should now see:
    ┌─────────────────────────────────────────┐
    │ Redirects                                │
    ├─────────────────────────────────────────┤
    │ ✓ thirdscreen://discord-callback        │
    │ [+ Add Redirect]                         │
    └─────────────────────────────────────────┘
```

```
Step 7: Test Again
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Close the stuck Discord OAuth window
2. Go back to ThirdScreen app
3. Click "Connect Discord" again
4. Discord should now show:
   
   "Once you authorize, you will be redirected outside of Discord to:
    thirdscreen://discord-callback"    ← FIXED!
   
5. Click "Authorize"
6. ✅ SUCCESS! Tokens stored automatically.
```

---

## 🎯 Expected Result After Fix:

### BEFORE (Current - Broken):
```
Discord OAuth Page shows:
"redirected outside of Discord to: null"
                                   ^^^^
                                   BAD!
```

### AFTER (Fixed):
```
Discord OAuth Page shows:
"redirected outside of Discord to: thirdscreen://discord-callback"
                                   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
                                   GOOD!
```

---

## ❓ Common Mistakes:

❌ **Typo in redirect URI**
   - Must be exactly: `thirdscreen://discord-callback`
   - NOT: `thirdScreen://` (capital S)
   - NOT: `third-screen://` (dash)
   - NOT: `thirdscreen://discord-callback/` (trailing slash)

❌ **Forgot to click "Save Changes"**
   - Changes don't apply until you click the button at the bottom!

❌ **Wrong application selected**
   - Make sure Client ID matches: `1451349429960577114`

---

## 🔍 How to Verify It Worked:

After adding the redirect URI and clicking "Save Changes":

1. Go back to Discord Developer Portal
2. OAuth2 → General → Redirects
3. You should see: `✓ thirdscreen://discord-callback` in the list

If you see it in the list, you're done! Try the OAuth flow again.

---

## 📞 Still Seeing "null"?

If you've added the redirect URI and still see "null":

1. **Hard refresh the Discord OAuth page**: `Ctrl + F5` or `Cmd + Shift + R`
2. **Wait 30 seconds**: Discord's servers may need to sync
3. **Try in a different browser**: Clear cache issues
4. **Double-check the Client ID**: Make sure you edited the correct Discord application
5. **Check for typos**: The redirect URI must be EXACTLY `thirdscreen://discord-callback`

---

## 📚 Technical Explanation:

**Why "null"?**
- Discord checks if the `redirect_uri` parameter in the OAuth URL matches one of the whitelisted URIs in your application settings
- If no match is found, Discord shows "null" as a security measure (won't redirect to unrecognized URLs)
- This prevents malicious apps from hijacking OAuth flows

**What we changed:**
- Old redirect: `http://localhost:5173/oauth-callback` (for browser-based flow)
- New redirect: `thirdscreen://discord-callback` (for desktop app protocol handler)
- This allows the app to capture the authorization code automatically without copy/paste

**Security:**
- PKCE (Proof Key for Code Exchange) prevents authorization code interception
- Custom protocol handler ensures only ThirdScreen app can receive the callback
- Tokens stored encrypted via tauri-plugin-store

---

## ✅ Checklist:

- [ ] Opened Discord Developer Portal
- [ ] Selected correct application (Client ID: 1451349429960577114)
- [ ] Navigated to OAuth2 → General
- [ ] Clicked "+ Add Redirect"
- [ ] Entered: `thirdscreen://discord-callback`
- [ ] Clicked "Save Changes" at bottom
- [ ] Verified redirect appears in the list
- [ ] Closed stuck OAuth window
- [ ] Tried OAuth flow again in ThirdScreen app
- [ ] Saw "thirdscreen://discord-callback" instead of "null"
- [ ] Clicked "Authorize"
- [ ] Received success message in app

---

**Once you complete these steps, the OAuth will work perfectly! The code is ready - it just needs the Discord portal configuration. 🚀**
