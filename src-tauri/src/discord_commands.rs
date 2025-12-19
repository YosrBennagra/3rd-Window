use crate::discord::{
    generate_oauth_url, DiscordAuthState, DiscordClientState, DiscordConnectionStatus,
    DiscordDMNotification,
};
use crate::secure_storage::{CredentialsStore, get_credentials};
use tauri::{State, AppHandle};

// ✅ SECURE: Credentials loaded from encrypted storage
// No hardcoded secrets in source code

#[tauri::command]
pub async fn discord_get_oauth_url(
    credentials_store: State<'_, CredentialsStore>,
    app: AppHandle,
) -> Result<String, String> {
    let creds = get_credentials(&credentials_store, &app).await?;
    let state = uuid::Uuid::new_v4().to_string();
    Ok(generate_oauth_url(&creds.client_id, &state))
}

#[tauri::command]
pub async fn discord_connect(
    code: String,
    discord_client: State<'_, DiscordClientState>,
    credentials_store: State<'_, CredentialsStore>,
    app: AppHandle,
) -> Result<DiscordConnectionStatus, String> {
    let creds = get_credentials(&credentials_store, &app).await?;
    let client_arc = discord_client.inner().clone();
    
    {
        let mut client = client_arc.lock().await;
        client.exchange_code(&code, &creds.client_id, &creds.client_secret).await?;
    }

    let client = client_arc.lock().await;
    Ok(DiscordConnectionStatus {
        connected: true,
        user: client.get_auth_state().user,
        error: None,
    })
}

#[tauri::command]
pub async fn discord_disconnect(discord_client: State<'_, DiscordClientState>) -> Result<(), String> {
    let mut client = discord_client.inner().lock().await;
    client.disconnect();
    Ok(())
}

#[tauri::command]
pub async fn discord_get_auth_state(
    discord_client: State<'_, DiscordClientState>,
) -> Result<DiscordAuthState, String> {
    let client = discord_client.inner().lock().await;
    Ok(client.get_auth_state())
}

#[tauri::command]
pub async fn discord_get_dms(
    discord_client: State<'_, DiscordClientState>,
    credentials_store: State<'_, CredentialsStore>,
    app: AppHandle,
    limit_per_channel: Option<u8>,
) -> Result<Vec<DiscordDMNotification>, String> {
    let client_arc = discord_client.inner().clone();
    let limit = limit_per_channel.unwrap_or(5);
    
    // Check connection and token expiry
    let (is_connected, is_expired) = {
        let client = client_arc.lock().await;
        (client.is_connected(), client.is_token_expired())
    };

    if !is_connected {
        return Err("Not connected to Discord".into());
    }

    // Refresh token if expired
    if is_expired {
        let creds = get_credentials(&credentials_store, &app).await?;
        let mut client = client_arc.lock().await;
        client.refresh_access_token(&creds.client_id, &creds.client_secret).await?;
    }

    // Fetch DMs
    let client = client_arc.lock().await;
    fetch_dm_notifications(&client, limit).await
}

async fn fetch_dm_notifications(
    client: &crate::discord::DiscordClient,
    limit_per_channel: u8,
) -> Result<Vec<DiscordDMNotification>, String> {
    // Get all DM channels
    let channels = client.get_dm_channels().await?;

    let mut all_notifications = Vec::new();

    // For each DM channel, get recent messages
    for channel in channels {
        let messages = client
            .get_channel_messages(&channel.id, limit_per_channel)
            .await
            .unwrap_or_default();

        for message in messages {
            // Only show messages from others (not self)
            if let Some(current_user) = &client.get_auth_state().user {
                if message.author.id == current_user.id {
                    continue;
                }
            }

            let notification = DiscordDMNotification {
                id: message.id,
                channel_id: message.channel_id,
                sender: message.author,
                content: message.content,
                timestamp: message.timestamp,
                is_unread: true, // For now, all are marked unread (proper tracking needs read state API)
            };

            all_notifications.push(notification);
        }
    }

    // Sort by timestamp (newest first)
    all_notifications.sort_by(|a, b| b.timestamp.cmp(&a.timestamp));

    Ok(all_notifications)
}

#[tauri::command]
pub fn discord_open_dm(channel_id: String) -> Result<(), String> {
    // Open Discord desktop app or web to specific DM
    let url = format!("https://discord.com/channels/@me/{}", channel_id);
    
    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("cmd")
            .args(&["/C", "start", &url])
            .spawn()
            .map_err(|e| format!("Failed to open Discord: {}", e))?;
    }
    
    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open")
            .arg(&url)
            .spawn()
            .map_err(|e| format!("Failed to open Discord: {}", e))?;
    }
    
    #[cfg(target_os = "linux")]
    {
        std::process::Command::new("xdg-open")
            .arg(&url)
            .spawn()
            .map_err(|e| format!("Failed to open Discord: {}", e))?;
    }
    
    Ok(())
}
