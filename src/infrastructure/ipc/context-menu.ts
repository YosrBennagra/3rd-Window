import { IpcService } from '@application/services';

export async function enableContextMenu(): Promise<void> {
  await IpcService.contextMenu.enable();
}

export async function disableContextMenu(): Promise<void> {
  await IpcService.contextMenu.disable();
}

export async function checkContextMenuInstalled(): Promise<boolean> {
  return await IpcService.contextMenu.checkInstalled();
}
