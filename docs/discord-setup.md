# Discord Integration Setup Guide

## Overview

ThirdScreen includes real Discord DM (Direct Message) notification support. This is a **read-only** integration that displays your Discord Direct Messages in the notification widget.

## Features

✅ **OAuth2 Authentication** - Secure, official Discord authentication  
✅ **DM-Only** - Shows Direct Messages only (no server messages)  
✅ **Real-Time** - Automatically refreshes to show new DMs  
✅ **Read-Only** - Safe, productivity-focused (no message sending)  
✅ **OS-Like UI** - Clean, flat design matching system notifications  

## Discord Application Setup

Before you can use Discord DM notifications, you need to create a Discord application:

### 1. Create Discord Application

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application"
3. Name it "ThirdScreen Dashboard" (or your preferred name)
4. Click "Create"

### 2. Configure OAuth2

1. In your application, go to **OAuth2** → **General**
2. Under **Redirects**, add:
   ```
   http://localhost:8080/callback
   ```
3. Click "Save Changes"

### 3. Get Your Credentials

1. Copy your **CLIENT ID** from the OAuth2 page
2. Click "Reset Secret" to generate a **CLIENT SECRET**
3. Copy the client secret immediately (you won't be able to see it again)

### 4. Update ThirdScreen Source Code

#### File: `src-tauri/src/discord.rs`

Line 9-10, replace:
```rust
pub const DISCORD_CLIENT_ID: &str = "YOUR_CLIENT_ID_HERE";
```

With your actual client ID:
```rust
pub const DISCORD_CLIENT_ID: &str = "123456789012345678";
```

#### File: `src-tauri/src/discord_commands.rs`

Line 8, replace:
```rust
const DISCORD_CLIENT_SECRET: &str = "YOUR_CLIENT_SECRET_HERE";
```

With your actual client secret:
```rust
const DISCORD_CLIENT_SECRET: &str = "your_secret_here_abc123xyz";
```

### 5. Rebuild Application

After updating the credentials:

```bash
npm run tauri:build
```

Or for development:

```bash
npm run tauri:dev
```

## Usage

### Connecting Discord

1. Add a **Notifications** widget to your dashboard
2. Right-click the widget → **Settings**
3. Select **Discord** as the source
4. Click **Connect Discord**
5. Complete the OAuth flow in your browser
6. Copy the authorization code
7. Paste the code when prompted
8. Your Discord DMs will now appear in the widget!

### Widget Settings

- **Time Format**: Choose between relative (2m ago) or absolute (3:45 PM)
- **On Click**: Choose whether clicking a DM opens Discord
- **Connection**: View connected account and disconnect option

## Security Notes

### ⚠️ IMPORTANT

- **NEVER commit your Client ID or Client Secret to version control**
- Keep your credentials private
- The current implementation stores tokens in memory (lost on restart)
- For production use, implement proper secure storage (Tauri Keyring plugin recommended)

### Recommended: Environment Variables (Future Enhancement)

Instead of hardcoding credentials, use environment variables:

```rust
// Future implementation
const DISCORD_CLIENT_ID: &str = env!("DISCORD_CLIENT_ID");
const DISCORD_CLIENT_SECRET: &str = env!("DISCORD_CLIENT_SECRET");
```

Then create `.env` file:
```
DISCORD_CLIENT_ID=your_client_id
DISCORD_CLIENT_SECRET=your_client_secret
```

Add `.env` to `.gitignore`!

## API Scopes

ThirdScreen requests only minimal Discord permissions:

- `identify` - Get user's username and avatar
- `messages.read` - Read Direct Messages

**We DO NOT request:**
- Server access
- Message sending
- Presence updates
- Guild (server) information

## Limitations

### Current Version

- **Manual OAuth flow**: Users must copy/paste authorization code
- **No persistent token storage**: Reconnect required on app restart
- **No webhook support**: Uses polling (30-second refresh interval)
- **Unread status**: All messages marked as unread (Discord read state API requires bot token)

### Planned Improvements

- Local OAuth callback server for seamless authentication
- Persistent token storage using Tauri secure storage
- Discord Gateway WebSocket for real-time updates
- Proper unread tracking
- Message preview length customization

## Troubleshooting

### "Failed to connect to Discord"

- Verify CLIENT_ID and CLIENT_SECRET are correct
- Check that redirect URI matches exactly: `http://localhost:8080/callback`
- Ensure Discord application is not deleted or suspended

### "No Discord DMs" showing

- Verify you're connected (check settings panel)
- Try refreshing (close and reopen widget settings)
- Check browser console for errors (`F12` in dev mode)

### Token expired errors

- Tokens expire after a period
- Disconnect and reconnect to refresh
- Future versions will auto-refresh tokens

## Development Notes

### Architecture

```
Frontend (TypeScript)
  ↓
  discordService (services/discord.ts)
  ↓
  Tauri IPC
  ↓
Backend (Rust)
  ↓
  discord_commands.rs
  ↓
  discord.rs (DiscordClient)
  ↓
  Discord REST API
```

### Key Files

- **Frontend Service**: `src/services/discord.ts`
- **Widget Component**: `src/components/widgets/NotificationsWidget.tsx`
- **Rust Discord Client**: `src-tauri/src/discord.rs`
- **Tauri Commands**: `src-tauri/src/discord_commands.rs`
- **Types**: `src/types/discord.ts`

### Adding Features

To extend Discord integration:

1. Add Rust command in `discord_commands.rs`
2. Register command in `lib.rs`
3. Add TypeScript wrapper in `services/discord.ts`
4. Update UI in `NotificationsWidget.tsx`

## Discord Terms of Service

This integration complies with [Discord's Developer Terms](https://discord.com/developers/docs/policies-and-agreements/developer-terms-of-service):

✅ Uses official OAuth2 flow  
✅ Requests minimal scopes  
✅ Read-only access  
✅ No automation or self-bots  
✅ Proper attribution (Discord logo)  

## Support

For issues or questions:

1. Check the troubleshooting section above
2. Review Discord Developer Portal for application status
3. Check application logs (`npm run tauri:dev` for console output)
4. Verify all credentials are correctly configured

---

**Remember**: This is a productivity tool, not a chat client. It's designed to help you see important DMs without switching windows, while you focus on work.
