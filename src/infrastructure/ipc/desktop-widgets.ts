import IpcService from '../../services/ipc';
import type { WidgetWindowConfig } from '../../types/ipc';

export async function spawnDesktopWidget(config: WidgetWindowConfig): Promise<string> {
  return await IpcService.widget.spawn(config);
}

export async function closeDesktopWidget(widgetId: string): Promise<void> {
  await IpcService.widget.close({ widgetId });
}

export async function updateWidgetPosition(widgetId: string, x: number, y: number): Promise<void> {
  await IpcService.widget.updatePosition({ widgetId, x, y });
}

export async function updateWidgetSize(widgetId: string, width: number, height: number): Promise<void> {
  await IpcService.widget.updateSize({ widgetId, width, height });
}

export async function getDesktopWidgets(): Promise<WidgetWindowConfig[]> {
  return await IpcService.widget.list();
}
