import { invoke } from '@tauri-apps/api/core';

export async function enableContextMenu(): Promise<void> {
  await invoke('enable_context_menu');
}

export async function disableContextMenu(): Promise<void> {
  await invoke('disable_context_menu');
}

export async function isContextMenuInstalled(): Promise<boolean> {
  return await invoke<boolean>('check_context_menu_installed');
}
