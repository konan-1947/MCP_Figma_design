/**
 * Electron TypeScript Definitions
 * Extends window interface for IPC types
 */

declare global {
  interface Window {
    electron: {
      invoke: (channel: string, ...args: any[]) => Promise<any>;
      on: (channel: string, callback: (...args: any[]) => void) => void;
      platform: string;
      isDev: boolean;
    };
  }
}

export {};
