// Connection Manager
// Extract từ connection lifecycle methods (lines 169-208)

import { HTTPClient } from './http-client';
import { Logger } from '../utilities/logger';
import { PLUGIN_CONFIG, ERROR_MESSAGES } from '../core/config';
import { ConnectionState } from '../types';

export class ConnectionManager {
  private httpClient: HTTPClient;
  private state: ConnectionState;

  constructor() {
    this.httpClient = new HTTPClient();
    this.state = {
      clientId: null,
      isConnected: false,
      reconnectAttempts: 0,
      pollInterval: null,
      keepAliveInterval: null
    };
  }

  /**
   * Kết nối tới HTTP server
   * Extract từ connect() method (lines 169-208)
   */
  async connect(): Promise<void> {
    try {
      Logger.logConnectionEvent('Connecting to HTTP server...');

      // Health check first
      const healthOk = await this.httpClient.healthCheck();
      if (!healthOk) {
        throw new Error(ERROR_MESSAGES.HEALTH_CHECK_FAILED);
      }

      // Register as Figma client
      const clientId = await this.httpClient.registerClient('figma-ui');

      // Update state
      this.state.clientId = clientId;
      this.state.isConnected = true;
      this.state.reconnectAttempts = 0;

      Logger.logConnectionSuccess(clientId);
      figma.notify('MCP Controller: Kết nối thành công', { timeout: 2000 });

    } catch (error) {
      Logger.logConnectionError(error instanceof Error ? error.message : 'Unknown error');
      this.state.isConnected = false;
      throw error;
    }
  }

  /**
   * Disconnect và cleanup
   */
  async disconnect(): Promise<void> {
    this.state.isConnected = false;
    this.state.clientId = null;
    this.state.reconnectAttempts = 0;

    Logger.logConnectionEvent('Disconnected from server');
  }

  /**
   * Check connection status
   */
  isConnected(): boolean {
    return this.state.isConnected;
  }

  /**
   * Get current client ID
   */
  getClientId(): string | null {
    return this.state.clientId;
  }

  /**
   * Get HTTP client instance
   */
  getHttpClient(): HTTPClient {
    return this.httpClient;
  }

  /**
   * Get connection state
   */
  getConnectionState(): ConnectionState {
    return { ...this.state };
  }

  /**
   * Update connection state
   */
  updateConnectionState(updates: Partial<ConnectionState>): void {
    this.state = { ...this.state, ...updates };
  }

  /**
   * Increment reconnect attempts
   */
  incrementReconnectAttempts(): number {
    this.state.reconnectAttempts++;
    return this.state.reconnectAttempts;
  }

  /**
   * Reset reconnect attempts
   */
  resetReconnectAttempts(): void {
    this.state.reconnectAttempts = 0;
  }

  /**
   * Check if should attempt reconnection
   */
  shouldReconnect(): boolean {
    return this.state.reconnectAttempts < PLUGIN_CONFIG.maxReconnectAttempts;
  }

  /**
   * Get reconnect attempts count
   */
  getReconnectAttempts(): number {
    return this.state.reconnectAttempts;
  }

  /**
   * Test connection với health check
   */
  async testConnection(): Promise<boolean> {
    try {
      return await this.httpClient.healthCheck();
    } catch (error) {
      return false;
    }
  }

  /**
   * Force reconnection
   */
  async forceReconnect(): Promise<void> {
    this.resetReconnectAttempts();
    await this.connect();
  }

  /**
   * Get max reconnect attempts
   */
  getMaxReconnectAttempts(): number {
    return PLUGIN_CONFIG.maxReconnectAttempts;
  }

  /**
   * Set connection intervals
   */
  setIntervals(pollInterval: any, keepAliveInterval: any): void {
    this.state.pollInterval = pollInterval;
    this.state.keepAliveInterval = keepAliveInterval;
  }

  /**
   * Clear connection intervals
   */
  clearIntervals(): void {
    if (this.state.pollInterval) {
      clearInterval(this.state.pollInterval);
      this.state.pollInterval = null;
    }
    if (this.state.keepAliveInterval) {
      clearInterval(this.state.keepAliveInterval);
      this.state.keepAliveInterval = null;
    }
  }

  /**
   * Connection status cho UI
   */
  getConnectionStatus(): {
    connected: boolean;
    clientId: string | null;
    reconnectAttempts: number;
    maxAttempts: number;
  } {
    return {
      connected: this.state.isConnected,
      clientId: this.state.clientId,
      reconnectAttempts: this.state.reconnectAttempts,
      maxAttempts: PLUGIN_CONFIG.maxReconnectAttempts
    };
  }
}