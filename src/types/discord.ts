// Discord OAuth2 and API Types

export interface DiscordAuthState {
  isConnected: boolean;
  user: DiscordUser | null;
  expiresAt: number | null; // Unix timestamp
}

export interface DiscordUser {
  id: string;
  username: string;
  discriminator: string;
  avatar: string | null;
  globalName: string | null;
}

export interface DiscordDMChannel {
  id: string;
  type: 1; // DM type
  lastMessageId: string | null;
  recipients: DiscordUser[];
}

export interface DiscordMessage {
  id: string;
  channelId: string;
  author: DiscordUser;
  content: string;
  timestamp: string; // ISO 8601
  edited_timestamp: string | null;
  type: number;
}

export interface DiscordDMNotification {
  id: string; // Message ID
  channelId: string;
  sender: DiscordUser;
  content: string;
  timestamp: string; // ISO 8601
  isUnread: boolean;
}

export interface DiscordConnectionStatus {
  connected: boolean;
  user: DiscordUser | null;
  error: string | null;
}

// OAuth2 Response Types
export interface DiscordOAuthTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
}

export interface DiscordOAuthCallbackParams {
  code: string;
  state: string;
}
