/**
 * Electron Preload Script
 * Securely exposes IPC and utilities to React renderer process
 */

import { contextBridge, ipcRenderer } from 'electron';

// Expose safe APIs to React
contextBridge.exposeInMainWorld('electron', {
  // IPC invoke (async)
  invoke: (channel: string, ...args: any[]) => {
    const validChannels = ['get-server-status', 'open-external'];
    if (validChannels.includes(channel)) {
      return ipcRenderer.invoke(channel, ...args);
    }
  },

  // IPC on (for events)
  on: (channel: string, callback: (event: any, ...args: any[]) => void) => {
    const validChannels = ['server-ready'];
    if (validChannels.includes(channel)) {
      ipcRenderer.on(channel, (event, ...args) => callback(event, ...args));
    }
  },

  // Platform info
  platform: process.platform,
  isDev: process.env.NODE_ENV === 'development'
});

console.log('[Preload] Electron APIs exposed to renderer');
