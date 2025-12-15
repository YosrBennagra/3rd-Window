import { contextBridge, ipcRenderer } from 'electron';
import { channels } from './ipc-contracts';

// Expose minimal, typed IPC surface to renderer.
contextBridge.exposeInMainWorld('api', {
  invoke: (channel: string, payload?: unknown) => {
    if (!channels.includes(channel)) throw new Error('Channel not allowed');
    return ipcRenderer.invoke(channel, payload);
  }
});
