import { invoke } from '@tauri-apps/api/core';
import { DesktopWidgetConfig } from '../types/desktop-widget';

export async function spawnDesktopWidget(config: DesktopWidgetConfig): Promise<string> {
  return await invoke<string>('spawn_desktop_widget', { config });
}

export async function closeDesktopWidget(widgetId: string): Promise<void> {
  await invoke('close_desktop_widget', { widgetId });
}

export async function updateWidgetPosition(widgetId: string, x: number, y: number): Promise<void> {
  await invoke('update_widget_position', { widgetId, x, y });
}

export async function updateWidgetSize(widgetId: string, width: number, height: number): Promise<void> {
  await invoke('update_widget_size', { widgetId, width, height });
}

export async function getDesktopWidgets(): Promise<DesktopWidgetConfig[]> {
  return await invoke<DesktopWidgetConfig[]>('get_desktop_widgets');
}
