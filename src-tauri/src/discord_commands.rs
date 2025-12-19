use crate::discord::{
    generate_oauth_url, generate_code_verifier, generate_code_challenge,
    DiscordAuthState, DiscordClientState, DiscordConnectionStatus,
    DiscordDMNotification,
};
use crate::secure_storage::{CredentialsStore, get_credentials};
use tauri::{State, AppHandle, Emitter};
use tauri_plugin_opener::OpenerExt;
use std::sync::Arc;
use tokio::sync::Mutex;
use tiny_http::{Server, Response};
use url::Url;

// ✅ SECURE: Credentials loaded from encrypted storage
// No hardcoded secrets in source code

// Store for PKCE state (code_verifier and state need to be saved for later validation)
#[derive(Clone)]
pub struct PkceState {
    pub code_verifier: Arc<Mutex<Option<String>>>,
    pub oauth_state: Arc<Mutex<Option<String>>>,
}

impl PkceState {
    pub fn new() -> Self {
        Self {
            code_verifier: Arc::new(Mutex::new(None)),
            oauth_state: Arc::new(Mutex::new(None)),
        }
    }
}

#[tauri::command]
pub async fn discord_start_oauth(
    credentials_store: State<'_, CredentialsStore>,
    pkce_state: State<'_, PkceState>,
    discord_client: State<'_, DiscordClientState>,
    app: AppHandle,
) -> Result<String, String> {
    let creds = get_credentials(&credentials_store, &app).await?;
    
    // Generate PKCE parameters
    let code_verifier = generate_code_verifier();
    let code_challenge = generate_code_challenge(&code_verifier);
    let state = uuid::Uuid::new_v4().to_string();
    
    // Store code_verifier and state for later validation
    {
        let mut verifier = pkce_state.code_verifier.lock().await;
        *verifier = Some(code_verifier.clone());
        let mut oauth_state = pkce_state.oauth_state.lock().await;
        *oauth_state = Some(state.clone());
    }
    
    let oauth_url = generate_oauth_url(&creds.client_id, &state, &code_challenge);
    
    log::info!("✅ [OAuth] Generated authorization URL");
    log::info!("✅ [OAuth] Starting callback server on http://127.0.0.1:53172");
    
    // Clone states for the callback server thread
    let pkce_state_clone = pkce_state.inner().clone();
    let discord_client_clone = discord_client.inner().clone();
    let client_id = creds.client_id.clone();
    let app_handle = app.clone();
    
    // Start local HTTP server in background thread to handle callback
    tokio::spawn(async move {
        if let Err(e) = run_callback_server(pkce_state_clone, discord_client_clone, client_id, app_handle).await {
            log::error!("❌ [OAuth] Callback server error: {}", e);
        }
    });
    
    // Small delay to ensure server starts before opening browser
    tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
    
    // Open URL in default browser
    log::info!("✅ [OAuth] Opening browser for user authorization");
    app.opener().open_url(&oauth_url, None::<&str>)
        .map_err(|e| format!("Failed to open browser: {}", e))?;
    
    Ok("OAuth flow started - waiting for callback on http://127.0.0.1:53172...".to_string())
}

/// Local HTTP server to handle OAuth callback
/// Listens on port 53172 for Discord redirect
async fn run_callback_server(
    pkce_state: PkceState,
    discord_client: DiscordClientState,
    client_id: String,
    app_handle: AppHandle,
) -> Result<(), String> {
    // ✅ Start HTTP server on localhost:53172
    let server = Server::http("127.0.0.1:53172")
        .map_err(|e| format!("Failed to start callback server: {}", e))?;
    
    log::info!("✅ [Callback Server] Listening on http://127.0.0.1:53172");
    log::info!("✅ [Callback Server] Accepting requests on / and /discord/callback");
    
    // Wait for a single request (the OAuth callback)
    for request in server.incoming_requests() {
        let url_path = request.url();
        log::info!("✅ [Callback Server] Received request: {}", url_path);
        
        // Handle both root path and /discord/callback path
        if !url_path.starts_with("/discord/callback") && !url_path.starts_with("/?code=") {
            log::warn!("⚠️ [Callback Server] Invalid path: {}", url_path);
            let response = Response::from_string("Invalid endpoint - expected /discord/callback or /?code=")
                .with_status_code(404);
            let _ = request.respond(response);
            continue;
        }
        
        // Parse query parameters from URL
        let full_url = format!("http://127.0.0.1:53172{}", url_path);
        let parsed = Url::parse(&full_url)
            .map_err(|e| format!("Failed to parse callback URL: {}", e))?;
        
        let mut code_opt: Option<String> = None;
        let mut state_opt: Option<String> = None;
        
        for (key, value) in parsed.query_pairs() {
            if key == "code" {
                code_opt = Some(value.into_owned());
            } else if key == "state" {
                state_opt = Some(value.into_owned());
            }
        }
        
        let code = code_opt.ok_or("Missing 'code' parameter")?;
        let received_state = state_opt.ok_or("Missing 'state' parameter")?;
        
        log::info!("✅ [Callback Server] Extracted authorization code (length: {})", code.len());
        log::info!("✅ [Callback Server] Extracted state parameter");
        
        // ✅ Validate state (CSRF protection)
        let expected_state = {
            let state_guard = pkce_state.oauth_state.lock().await;
            state_guard.clone().ok_or("No OAuth flow in progress")?
        };
        
        if received_state != expected_state {
            log::error!("❌ [Callback Server] State mismatch! Expected: {}, Got: {}", expected_state, received_state);
            let response = Response::from_string("State validation failed - possible CSRF attack")
                .with_status_code(400);
            let _ = request.respond(response);
            return Err("State validation failed".to_string());
        }
        
        log::info!("✅ [Callback Server] State validated successfully (CSRF protection passed)");
        
        // ✅ Retrieve code_verifier for PKCE
        let code_verifier = {
            let verifier_guard = pkce_state.code_verifier.lock().await;
            verifier_guard.clone().ok_or("No code verifier found")?
        };
        
        // ✅ Exchange authorization code for access token
        log::info!("✅ [Token Exchange] Exchanging authorization code for access token...");
        let mut client = discord_client.lock().await;
        match client.exchange_code(&code, &client_id, &code_verifier).await {
            Ok(_) => {
                log::info!("✅ [Token Exchange] Success! Access token received");
                log::info!("✅ [Token Exchange] User info fetched from Discord API");
                
                // Emit event to frontend to notify successful authentication
                let user_info = client.get_auth_state().user.clone();
                if let Some(user) = user_info {
                    log::info!("✅ [OAuth Complete] User authenticated: {}", user.username);
                    let _ = app_handle.emit("discord-auth-success", user);
                } else {
                    log::warn!("⚠️ [OAuth] No user info available after authentication");
                }
                
                // Send success response to browser
                let html = r#"
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <title>Discord Connected</title>
                        <style>
                            body { font-family: sans-serif; text-align: center; padding: 50px; background: #2f3136; color: #fff; }
                            h1 { color: #5865f2; }
                        </style>
                    </head>
                    <body>
                        <h1>✅ Success!</h1>
                        <p>Discord account connected to ThirdScreen.</p>
                        <p>You can close this window now.</p>
                    </body>
                    </html>
                "#;
                let response = Response::from_string(html)
                    .with_header(tiny_http::Header::from_bytes(&b"Content-Type"[..], &b"text/html"[..]).unwrap());
                let _ = request.respond(response);
                
                // Clear stored PKCE state
                {
                    let mut verifier_guard = pkce_state.code_verifier.lock().await;
                    *verifier_guard = None;
                    let mut state_guard = pkce_state.oauth_state.lock().await;
                    *state_guard = None;
                }
                
                log::info!("✅ [Callback Server] OAuth flow complete - shutting down server");
                log::info!("✅ [Callback Server] Port 53172 released");
                
                // Exit the loop - server will shut down
                return Ok(());
            }
            Err(e) => {
                log::error!("❌ [Token Exchange] Failed: {}", e);
                let _ = app_handle.emit("discord-auth-error", e.clone());
                let html = format!(r#"
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <title>Connection Failed</title>
                        <style>
                            body {{ font-family: sans-serif; text-align: center; padding: 50px; background: #2f3136; color: #fff; }}
                            h1 {{ color: #ed4245; }}
                        </style>
                    </head>
                    <body>
                        <h1>❌ Connection Failed</h1>
                        <p>{}</p>
                        <p>Please try again in ThirdScreen.</p>
                    </body>
                    </html>
                "#, e);
                let response = Response::from_string(html)
                    .with_header(tiny_http::Header::from_bytes(&b"Content-Type"[..], &b"text/html"[..]).unwrap());
                let _ = request.respond(response);
                return Err(e);
            }
        }
    }
    
    Ok(())
}

// ✅ This command is now optional - the callback server handles auth automatically
// Keeping it for manual flows or status checks
#[tauri::command]
pub async fn discord_connect(
    discord_client: State<'_, DiscordClientState>,
) -> Result<DiscordConnectionStatus, String> {
    let client = discord_client.inner().lock().await;
    Ok(DiscordConnectionStatus {
        connected: client.is_connected(),
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
        client.refresh_access_token(&creds.client_id).await?;
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
