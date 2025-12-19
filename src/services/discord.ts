import { invoke } from '@tauri-apps/api/core';
import type {
  DiscordAuthState,
  DiscordConnectionStatus,
  DiscordDMNotification,
} from '../types/discord';

/**
 * Discord Service - Handles Discord OAuth2 and DM notifications
 * Read-only Discord DM integration following official OAuth2 flow
 */

class DiscordService {
  private authState: DiscordAuthState | null = null;
  private refreshInterval: number | null = null;
  private readonly REFRESH_INTERVAL_MS = 30000; // 30 seconds

  /**
   * Initialize OAuth flow - returns URL to open in browser
   */
  async getOAuthUrl(): Promise<string> {
    try {
      const url = await invoke<string>('discord_get_oauth_url');
      return url;
    } catch (error) {
      console.error('[Discord] Failed to get OAuth URL:', error);
      throw new Error('Failed to initialize Discord authentication');
    }
  }

  /**
   * Complete OAuth flow with authorization code
   */
  async connect(code: string): Promise<DiscordConnectionStatus> {
    try {
      const status = await invoke<DiscordConnectionStatus>('discord_connect', { code });
      
      if (status.connected && status.user) {
        this.authState = {
          isConnected: true,
          user: status.user,
          expiresAt: null, // Backend handles expiry
        };
        this.startAutoRefresh();
      }
      
      return status;
    } catch (error) {
      console.error('[Discord] Connection failed:', error);
      return {
        connected: false,
        user: null,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Disconnect from Discord
   */
  async disconnect(): Promise<void> {
    try {
      await invoke('discord_disconnect');
      this.authState = null;
      this.stopAutoRefresh();
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
   */
  async getDMs(limitPerChannel: number = 5): Promise<DiscordDMNotification[]> {
    try {
      const dms = await invoke<DiscordDMNotification[]>('discord_get_dms', {
        limitPerChannel,
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

  /**
   * Start auto-refresh of DMs
   */
  private startAutoRefresh() {
    if (this.refreshInterval !== null) {
      return;
    }

    this.refreshInterval = window.setInterval(() => {
      // Refresh will be triggered by components calling getDMs()
      // This just keeps the connection alive
      this.getAuthState().catch(console.error);
    }, this.REFRESH_INTERVAL_MS);
  }

  /**
   * Stop auto-refresh
   */
  private stopAutoRefresh() {
    if (this.refreshInterval !== null) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }

  /**
   * Open OAuth flow in default browser
   */
  async startOAuthFlow(): Promise<void> {
    try {
      const url = await this.getOAuthUrl();
      
      // Open URL in default browser
      window.open(url, '_blank');
    } catch (error) {
      console.error('[Discord] Failed to start OAuth flow:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const discordService = new DiscordService();
