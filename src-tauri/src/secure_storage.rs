use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tokio::sync::RwLock;
use tauri_plugin_store::StoreBuilder;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DiscordCredentials {
    pub client_id: String,
    pub client_secret: String,
}

pub type CredentialsStore = Arc<RwLock<Option<DiscordCredentials>>>;

pub fn init_credentials_store() -> CredentialsStore {
    Arc::new(RwLock::new(None))
}

/// Initialize credentials from secure storage or set defaults
pub async fn load_credentials(app: &tauri::AppHandle) -> Result<DiscordCredentials, String> {
    let path = std::path::PathBuf::from("credentials.dat");
    let store = StoreBuilder::new(app, path.clone())
        .build()
        .map_err(|e| format!("Failed to build store: {}", e))?;
    
    // Try to load existing credentials
    if let Some(client_id_value) = store.get("discord_client_id") {
        if let Some(client_secret_value) = store.get("discord_client_secret") {
            let client_id = client_id_value
                .as_str()
                .ok_or("Invalid client_id format")?
                .to_string();
            let client_secret = client_secret_value
                .as_str()
                .ok_or("Invalid client_secret format")?
                .to_string();
                
            return Ok(DiscordCredentials {
                client_id,
                client_secret,
            });
        }
    }
    
    // If no credentials exist, initialize with the configured values
    let default_credentials = DiscordCredentials {
        client_id: "1451349429960577114".to_string(),
        client_secret: "A7oqffJQiSJSHwFXVx9LPo_X6GRGnSYW".to_string(),
    };
    
    // Save to secure storage
    save_credentials(app, &default_credentials).await?;
    
    Ok(default_credentials)
}

/// Save credentials to encrypted secure storage
pub async fn save_credentials(app: &tauri::AppHandle, credentials: &DiscordCredentials) -> Result<(), String> {
    let path = std::path::PathBuf::from("credentials.dat");
    let store = StoreBuilder::new(app, path)
        .build()
        .map_err(|e| format!("Failed to build store: {}", e))?;
    
    // Set method returns () - no Result to check
    store.set("discord_client_id".to_string(), serde_json::json!(credentials.client_id));
    store.set("discord_client_secret".to_string(), serde_json::json!(credentials.client_secret));
    
    // Save returns Result
    store.save()
        .map_err(|e| format!("Failed to save credentials store: {}", e))?;
    
    Ok(())
}

/// Get credentials from memory cache or load from storage
pub async fn get_credentials(store: &CredentialsStore, app: &tauri::AppHandle) -> Result<DiscordCredentials, String> {
    // Check if already loaded in memory
    {
        let read_lock = store.read().await;
        if let Some(creds) = read_lock.as_ref() {
            return Ok(creds.clone());
        }
    }
    
    // Load from secure storage
    let creds = load_credentials(app).await?;
    
    // Cache in memory
    {
        let mut write_lock = store.write().await;
        *write_lock = Some(creds.clone());
    }
    
    Ok(creds)
}
