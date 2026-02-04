// Polling Manager
// Extract từ polling và reconnection logic (lines 233-302)

import { ConnectionManager } from './connection-manager';
import { Logger } from '../utilities/logger';
import { PLUGIN_CONFIG, getReconnectDelay } from '../core/config';
import { FigmaCommand } from '../types';

export class PollingManager {
  private connectionManager: ConnectionManager;
  private onCommandReceived: (commands: FigmaCommand[]) => void;

  constructor(
    connectionManager: ConnectionManager,
    onCommandReceived: (commands: FigmaCommand[]) => void
  ) {
    this.connectionManager = connectionManager;
    this.onCommandReceived = onCommandReceived;
  }

  /**
   * Start polling for commands
   * Extract từ startPolling() method (lines 233-259)
   */
  startPolling(): void {
    const state = this.connectionManager.getConnectionState();

    if (state.pollInterval) {
      return; // Already polling
    }

    const pollInterval = setInterval(async () => {
      try {
        if (!this.connectionManager.isConnected()) {
          return;
        }

        const httpClient = this.connectionManager.getHttpClient();
        const commands = await httpClient.pollForCommands();

        if (commands.length > 0) {
          Logger.info(`Received ${commands.length} commands`);
          this.onCommandReceived(commands);
        }
      } catch (error) {
        Logger.error(`Polling error: ${error}`);
        this.connectionManager.updateConnectionState({ isConnected: false });
        this.scheduleReconnect();
      }
    }, PLUGIN_CONFIG.pollIntervalMs);

    this.connectionManager.setIntervals(pollInterval, state.keepAliveInterval);
  }

  /**
   * Start keep-alive mechanism
   * Extract từ startKeepAlive() method (lines 261-276)
   */
  startKeepAlive(): void {
    const state = this.connectionManager.getConnectionState();

    if (state.keepAliveInterval) {
      return; // Already running
    }

    const keepAliveInterval = setInterval(async () => {
      try {
        if (!this.connectionManager.isConnected()) {
          return;
        }

        const httpClient = this.connectionManager.getHttpClient();
        const success = await httpClient.sendKeepAlive();

        if (!success) {
          Logger.error('Keep-alive failed');
        }
      } catch (error) {
        Logger.error(`Keep-alive error: ${error}`);
      }
    }, PLUGIN_CONFIG.keepAliveIntervalMs);

    this.connectionManager.setIntervals(state.pollInterval, keepAliveInterval);
  }

  /**
   * Stop polling và keep-alive
   */
  stopPolling(): void {
    this.connectionManager.clearIntervals();
  }

  /**
   * Schedule reconnection attempt
   * Extract từ scheduleReconnect() method (lines 278-302)
   */
  scheduleReconnect(): void {
    // Stop polling and keep-alive
    this.stopPolling();

    if (!this.connectionManager.shouldReconnect()) {
      figma.notify('MCP Controller: Không thể kết nối sau nhiều lần thử', { error: true });
      return;
    }

    const attempt = this.connectionManager.incrementReconnectAttempts();
    const maxAttempts = this.connectionManager.getMaxReconnectAttempts();
    const delay = getReconnectDelay(attempt);

    Logger.logReconnectAttempt(attempt, maxAttempts, delay);

    setTimeout(async () => {
      try {
        await this.connectionManager.connect();
        // Start polling again after successful reconnection
        this.startPolling();
        this.startKeepAlive();
      } catch (error) {
        // If reconnection fails, schedule another attempt
        this.scheduleReconnect();
      }
    }, delay);
  }

  /**
   * Start both polling và keep-alive
   */
  startAll(): void {
    this.startPolling();
    this.startKeepAlive();
  }

  /**
   * Stop all polling activities
   */
  stopAll(): void {
    this.stopPolling();
  }

  /**
   * Force reconnect và restart polling
   */
  async forceReconnect(): Promise<void> {
    this.stopAll();

    try {
      await this.connectionManager.forceReconnect();
      this.startAll();
      Logger.info('Reconnection successful');
    } catch (error) {
      Logger.error(`Force reconnect failed: ${error}`);
      this.scheduleReconnect();
    }
  }

  /**
   * Check if currently polling
   */
  isPolling(): boolean {
    const state = this.connectionManager.getConnectionState();
    return state.pollInterval !== null;
  }

  /**
   * Check if keep-alive is running
   */
  isKeepAliveActive(): boolean {
    const state = this.connectionManager.getConnectionState();
    return state.keepAliveInterval !== null;
  }

  /**
   * Get polling status cho debugging
   */
  getPollingStatus(): {
    isPolling: boolean;
    isKeepAliveActive: boolean;
    isConnected: boolean;
    reconnectAttempts: number;
    maxAttempts: number;
  } {
    return {
      isPolling: this.isPolling(),
      isKeepAliveActive: this.isKeepAliveActive(),
      isConnected: this.connectionManager.isConnected(),
      reconnectAttempts: this.connectionManager.getReconnectAttempts(),
      maxAttempts: this.connectionManager.getMaxReconnectAttempts()
    };
  }

  /**
   * Test single poll request
   */
  async testPoll(): Promise<FigmaCommand[]> {
    if (!this.connectionManager.isConnected()) {
      throw new Error('Not connected to server');
    }

    const httpClient = this.connectionManager.getHttpClient();
    return await httpClient.pollForCommands();
  }

  /**
   * Test keep-alive request
   */
  async testKeepAlive(): Promise<boolean> {
    if (!this.connectionManager.isConnected()) {
      throw new Error('Not connected to server');
    }

    const httpClient = this.connectionManager.getHttpClient();
    return await httpClient.sendKeepAlive();
  }
}