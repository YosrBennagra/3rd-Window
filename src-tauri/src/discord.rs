use serde::{Deserialize, Serialize};
use tokio::sync::Mutex;
use std::sync::Arc;

// Discord API Constants
const DISCORD_API_BASE: &str = "https://discord.com/api/v10";
const DISCORD_OAUTH_AUTHORIZE: &str = "https://discord.com/oauth2/authorize";
const DISCORD_OAUTH_TOKEN: &str = "https://discord.com/api/v10/oauth2/token";
const DISCORD_REDIRECT_URI: &str = "http://localhost:8080/callback";
const DISCORD_SCOPES: &str = "identify messages.read";

// ✅ SECURE: Credentials now loaded from encrypted storage via secure_storage.rs
// No hardcoded credentials in source code

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DiscordUser {
    pub id: String,
    pub username: String,
    pub discriminator: String,
    pub avatar: Option<String>,
    #[serde(rename = "global_name")]
    pub global_name: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DiscordMessage {
    pub id: String,
    #[serde(rename = "channel_id")]
    pub channel_id: String,
    pub author: DiscordUser,
    pub content: String,
    pub timestamp: String,
    #[serde(rename = "edited_timestamp")]
    pub edited_timestamp: Option<String>,
    #[serde(rename = "type")]
    pub message_type: u8,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DiscordDMChannel {
    pub id: String,
    #[serde(rename = "type")]
    pub channel_type: u8, // 1 = DM
    #[serde(rename = "last_message_id")]
    pub last_message_id: Option<String>,
    pub recipients: Vec<DiscordUser>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DiscordOAuthTokenResponse {
    pub access_token: String,
    pub token_type: String,
    pub expires_in: u64,
    pub refresh_token: String,
    pub scope: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DiscordAuthState {
    pub is_connected: bool,
    pub user: Option<DiscordUser>,
    pub expires_at: Option<u64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DiscordConnectionStatus {
    pub connected: bool,
    pub user: Option<DiscordUser>,
    pub error: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DiscordDMNotification {
    pub id: String,
    #[serde(rename = "channelId")]
    pub channel_id: String,
    pub sender: DiscordUser,
    pub content: String,
    pub timestamp: String,
    #[serde(rename = "isUnread")]
    pub is_unread: bool,
}

// Discord Client State
pub struct DiscordClient {
    access_token: Option<String>,
    refresh_token: Option<String>,
    expires_at: Option<u64>,
    user: Option<DiscordUser>,
    client: reqwest::Client,
}

impl DiscordClient {
    pub fn new() -> Self {
        Self {
            access_token: None,
            refresh_token: None,
            expires_at: None,
            user: None,
            client: reqwest::Client::new(),
        }
    }

    pub fn is_connected(&self) -> bool {
        self.access_token.is_some() && self.user.is_some()
    }

    pub fn is_token_expired(&self) -> bool {
        if let Some(expires_at) = self.expires_at {
            let now = std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs();
            return now >= expires_at;
        }
        true
    }

    pub async fn exchange_code(&mut self, code: &str, client_id: &str, client_secret: &str) -> Result<(), String> {
        let params = [
            ("client_id", client_id),
            ("client_secret", client_secret),
            ("grant_type", "authorization_code"),
            ("code", code),
            ("redirect_uri", DISCORD_REDIRECT_URI),
        ];

        let response = self
            .client
            .post(DISCORD_OAUTH_TOKEN)
            .form(&params)
            .send()
            .await
            .map_err(|e| format!("Failed to exchange code: {}", e))?;

        if !response.status().is_success() {
            let error_text = response.text().await.unwrap_or_default();
            return Err(format!("Discord OAuth error: {}", error_text));
        }

        let token_response: DiscordOAuthTokenResponse = response
            .json()
            .await
            .map_err(|e| format!("Failed to parse token response: {}", e))?;

        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs();

        self.access_token = Some(token_response.access_token);
        self.refresh_token = Some(token_response.refresh_token);
        self.expires_at = Some(now + token_response.expires_in);

        // Fetch user info
        self.fetch_user().await?;

        Ok(())
    }

    pub async fn refresh_access_token(&mut self, client_id: &str, client_secret: &str) -> Result<(), String> {
        let refresh_token = self
            .refresh_token
            .as_ref()
            .ok_or("No refresh token available")?;

        let params = [
            ("client_id", client_id),
            ("client_secret", client_secret),
            ("grant_type", "refresh_token"),
            ("refresh_token", refresh_token),
        ];

        let response = self
            .client
            .post(DISCORD_OAUTH_TOKEN)
            .form(&params)
            .send()
            .await
            .map_err(|e| format!("Failed to refresh token: {}", e))?;

        if !response.status().is_success() {
            return Err("Failed to refresh token".into());
        }

        let token_response: DiscordOAuthTokenResponse = response
            .json()
            .await
            .map_err(|e| format!("Failed to parse refresh response: {}", e))?;

        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs();

        self.access_token = Some(token_response.access_token);
        self.refresh_token = Some(token_response.refresh_token);
        self.expires_at = Some(now + token_response.expires_in);

        Ok(())
    }

    async fn fetch_user(&mut self) -> Result<(), String> {
        let token = self
            .access_token
            .as_ref()
            .ok_or("No access token available")?;

        let response = self
            .client
            .get(format!("{}/users/@me", DISCORD_API_BASE))
            .header("Authorization", format!("Bearer {}", token))
            .send()
            .await
            .map_err(|e| format!("Failed to fetch user: {}", e))?;

        if !response.status().is_success() {
            return Err("Failed to fetch user info".into());
        }

        let user: DiscordUser = response
            .json()
            .await
            .map_err(|e| format!("Failed to parse user: {}", e))?;

        self.user = Some(user);
        Ok(())
    }

    pub async fn get_dm_channels(&self) -> Result<Vec<DiscordDMChannel>, String> {
        let token = self
            .access_token
            .as_ref()
            .ok_or("Not authenticated")?;

        let response = self
            .client
            .get(format!("{}/users/@me/channels", DISCORD_API_BASE))
            .header("Authorization", format!("Bearer {}", token))
            .send()
            .await
            .map_err(|e| format!("Failed to fetch DM channels: {}", e))?;

        if !response.status().is_success() {
            return Err("Failed to fetch DM channels".into());
        }

        let channels: Vec<DiscordDMChannel> = response
            .json()
            .await
            .map_err(|e| format!("Failed to parse channels: {}", e))?;

        // Filter only DM channels (type 1)
        Ok(channels.into_iter().filter(|c| c.channel_type == 1).collect())
    }

    pub async fn get_channel_messages(&self, channel_id: &str, limit: u8) -> Result<Vec<DiscordMessage>, String> {
        let token = self
            .access_token
            .as_ref()
            .ok_or("Not authenticated")?;

        let response = self
            .client
            .get(format!("{}/channels/{}/messages", DISCORD_API_BASE, channel_id))
            .query(&[("limit", limit.to_string())])
            .header("Authorization", format!("Bearer {}", token))
            .send()
            .await
            .map_err(|e| format!("Failed to fetch messages: {}", e))?;

        if !response.status().is_success() {
            return Err("Failed to fetch messages".into());
        }

        let messages: Vec<DiscordMessage> = response
            .json()
            .await
            .map_err(|e| format!("Failed to parse messages: {}", e))?;

        Ok(messages)
    }

    pub fn disconnect(&mut self) {
        self.access_token = None;
        self.refresh_token = None;
        self.expires_at = None;
        self.user = None;
    }

    pub fn get_auth_state(&self) -> DiscordAuthState {
        DiscordAuthState {
            is_connected: self.is_connected(),
            user: self.user.clone(),
            expires_at: self.expires_at,
        }
    }
}

pub type DiscordClientState = Arc<Mutex<DiscordClient>>;

pub fn init_discord_client() -> DiscordClientState {
    Arc::new(Mutex::new(DiscordClient::new()))
}

// Helper function to generate OAuth URL
pub fn generate_oauth_url(client_id: &str, state: &str) -> String {
    format!(
        "{}?client_id={}&redirect_uri={}&response_type=code&scope={}&state={}",
        DISCORD_OAUTH_AUTHORIZE,
        client_id,
        urlencoding::encode(DISCORD_REDIRECT_URI),
        urlencoding::encode(DISCORD_SCOPES),
        state
    )
}
