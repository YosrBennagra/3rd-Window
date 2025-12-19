import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import type {
  DiscordAuthState,
  DiscordConnectionStatus,
  DiscordDMNotification,
  DiscordUser,
} from '../types/discord';

/**
 * Discord Service - Handles Discord OAuth2 authentication
 * 
 * IMPORTANT ARCHITECTURE NOTES:
 * ============================
 * 
 * OAuth = Identity Only (User info)
 * - This service handles OAuth2 authentication
 * - OAuth tokens can ONLY access user profile data
 * - OAuth CANNOT read messages or DMs (requires bot token)
 * 
 * Bot = Messages & Real-time Events
 * - Reading DMs requires a Discord Bot with Gateway connection
 * - Bot tokens use WebSocket (not REST) for real-time updates
 * - Bot functionality is NOT YET IMPLEMENTED
 * 
 * Current Status:
 * - ✅ OAuth authentication (identity only)
 * - ❌ Bot connection (TODO: requires bot token + Gateway WebSocket)
 * - ❌ DM notifications (TODO: requires bot MESSAGE_CREATE events)
 */

class DiscordService {
  private authState: DiscordAuthState | null = null;
  private checkInterval: number | null = null;

  /**
   * Start OAuth flow - opens browser and automatically completes when callback received
   * The backend HTTP server (port 53172) handles the callback and token exchange
   */
  async startOAuthFlow(): Promise<DiscordConnectionStatus> {
    return new Promise(async (resolve, reject) => {
      try {
        // Listen for successful authentication from backend
        const unlistenSuccess = await listen<DiscordUser>('discord-auth-success', async (event) => {
          console.log('[Discord] ✅ Authentication successful:', event.payload.username);
          
          // Fetch full auth state from backend
          const authState = await this.getAuthState();
          this.authState = authState;
          
          unlistenSuccess();
          if (unlistenError) unlistenError();
          if (this.checkInterval) clearInterval(this.checkInterval);
          
          resolve({
            connected: true,
            user: event.payload,
            error: null,
          });
        });
        
        // Listen for authentication errors from backend
        const unlistenError = await listen<string>('discord-auth-error', (event) => {
          console.error('[Discord] ❌ Authentication failed:', event.payload);
          
          unlistenSuccess();
          if (unlistenError) unlistenError();
          if (this.checkInterval) clearInterval(this.checkInterval);
          
          reject(new Error(`Discord authentication failed: ${event.payload}`));
        });
        
        // Start the OAuth flow (opens browser, starts callback server)
        console.log('[Discord] Starting OAuth flow...');
        await invoke<string>('discord_start_oauth');
        console.log('[Discord] Browser opened - waiting for user authorization...');
        
        // Poll for connection status as backup (in case events don't fire)
        this.checkInterval = window.setInterval(async () => {
          try {
            const state = await this.getAuthState();
            if (state.isConnected && state.user) {
              console.log('[Discord] ✅ Connected (detected via polling)');
              this.authState = state;
              
              unlistenSuccess();
              if (unlistenError) unlistenError();
              if (this.checkInterval) clearInterval(this.checkInterval);
              
              resolve({
                connected: true,
                user: state.user,
                error: null,
              });
            }
          } catch (err) {
            console.error('[Discord] Status check error:', err);
          }
        }, 1000); // Check every second
        
        // Timeout after 5 minutes
        setTimeout(() => {
          unlistenSuccess();
          if (unlistenError) unlistenError();
          if (this.checkInterval) clearInterval(this.checkInterval);
          reject(new Error('OAuth flow timed out after 5 minutes'));
        }, 5 * 60 * 1000);
        
      } catch (error) {
        console.error('[Discord] Failed to start OAuth flow:', error);
        if (this.checkInterval) clearInterval(this.checkInterval);
        reject(new Error('Failed to initialize Discord authentication'));
      }
    });
  }

  /**
   * Disconnect from Discord
   */
  async disconnect(): Promise<void> {
    try {
      await invoke('discord_disconnect');
      this.authState = null;
      if (this.checkInterval) {
        clearInterval(this.checkInterval);
        this.checkInterval = null;
      }
    } catch (error) {
      console.error('[Discord] Disconnect failed:', error);
      throw error;
    }
  }

  /**
   * Get current authentication state
   */
  async getAuthState(): Promise<DiscordAuthState> {
    try {
      const state = await invoke<DiscordAuthState>('discord_get_auth_state');
      this.authState = state;
      return state;
    } catch (error) {
      console.error('[Discord] Failed to get auth state:', error);
      return {
        isConnected: false,
        user: null,
        expiresAt: null,
      };
    }
  }

  /**
   * Get Discord DM notifications
   * Uses OAuth with messages.read scope to fetch DM messages
   */
  async getDMs(limitPerChannel: number = 5): Promise<DiscordDMNotification[]> {
    try {
      const dms = await invoke<DiscordDMNotification[]>('discord_get_dm_notifications', {
        limit: limitPerChannel,
      });
      return dms;
    } catch (error) {
      console.error('[Discord] Failed to fetch DMs:', error);
      return [];
    }
  }

  /**
   * Open Discord app/web to specific DM channel
   */
  async openDM(channelId: string): Promise<void> {
    try {
      await invoke('discord_open_dm', { channelId });
    } catch (error) {
      console.error('[Discord] Failed to open DM:', error);
    }
  }

  /**
   * Check if currently connected
   */
  isConnected(): boolean {
    return this.authState?.isConnected ?? false;
  }

  /**
   * Get current user
   */
  getCurrentUser() {
    return this.authState?.user ?? null;
  }
}

// Export singleton instance
export const discordService = new DiscordService();
