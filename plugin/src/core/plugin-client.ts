// Plugin Client - Main Orchestrator
// Thay thế FigmaHttpClient class với module architecture

import { ConnectionManager } from '../connection/connection-manager';
import { PollingManager } from '../connection/polling-manager';
import { CommandDispatcher } from '../commands/command-dispatcher';
import { Logger } from '../utilities/logger';
import { FigmaCommand, FigmaResponse } from '../types';

export class PluginClient {
  private connectionManager: ConnectionManager;
  private pollingManager: PollingManager;
  private commandDispatcher: CommandDispatcher;

  constructor() {
    Logger.info('FigmaPluginClient đang khởi tạo');

    // Initialize core components
    this.connectionManager = new ConnectionManager();
    this.commandDispatcher = new CommandDispatcher();

    // Initialize polling manager with command callback
    this.pollingManager = new PollingManager(
      this.connectionManager,
      this.handleCommands.bind(this)
    );

    // Start connection process
    this.initialize();
  }

  /**
   * Initialize plugin client
   */
  private async initialize(): Promise<void> {
    try {
      // Connect to HTTP server
      await this.connectionManager.connect();

      // Start polling for commands and keep-alive
      this.pollingManager.startAll();

    } catch (error) {
      Logger.error(`Initialization failed: ${error}`);
      // Polling manager sẽ tự động schedule reconnection
      this.pollingManager.scheduleReconnect();
    }
  }

  /**
   * Handle incoming commands
   * Callback từ PollingManager
   */
  private async handleCommands(commands: FigmaCommand[]): Promise<void> {
    for (const command of commands) {
      try {
        // Process command
        const response = await this.commandDispatcher.handleCommand(command);

        // Send response back
        await this.sendResponse(response);

      } catch (error) {
        // Send error response
        const errorResponse: FigmaResponse = {
          id: command.id,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };

        await this.sendResponse(errorResponse);
      }
    }
  }

  /**
   * Send response back to server
   */
  private async sendResponse(response: FigmaResponse): Promise<void> {
    try {
      const httpClient = this.connectionManager.getHttpClient();
      const success = await httpClient.sendResponse(response);

      if (!success) {
        Logger.error('Failed to send response to server');
      }
    } catch (error) {
      Logger.error(`Error sending response: ${error}`);
    }
  }

  /**
   * Public API methods (compatibility với FigmaHttpClient)
   */

  /**
   * Get connection status
   */
  isConnected(): boolean {
    return this.connectionManager.isConnected();
  }

  /**
   * Get client ID
   */
  getClientId(): string | null {
    return this.connectionManager.getClientId();
  }

  /**
   * Force reconnect
   */
  async reconnect(): Promise<void> {
    await this.pollingManager.forceReconnect();
  }

  /**
   * Get connection status for debugging
   */
  getStatus(): {
    connection: ReturnType<ConnectionManager['getConnectionStatus']>;
    polling: ReturnType<PollingManager['getPollingStatus']>;
  } {
    return {
      connection: this.connectionManager.getConnectionStatus(),
      polling: this.pollingManager.getPollingStatus()
    };
  }

  /**
   * Test connection
   */
  async testConnection(): Promise<boolean> {
    return await this.connectionManager.testConnection();
  }

  /**
   * Shutdown client gracefully
   */
  async shutdown(): Promise<void> {
    Logger.info('Shutting down plugin client...');

    // Stop polling
    this.pollingManager.stopAll();

    // Disconnect
    await this.connectionManager.disconnect();

    Logger.info('Plugin client shutdown complete');
  }

  /**
   * Process single command (for testing)
   */
  async processCommand(command: FigmaCommand): Promise<FigmaResponse> {
    return await this.commandDispatcher.handleCommand(command);
  }

  /**
   * Manual polling trigger (for debugging)
   */
  async manualPoll(): Promise<FigmaCommand[]> {
    return await this.pollingManager.testPoll();
  }

  /**
   * Test keep-alive (for debugging)
   */
  async testKeepAlive(): Promise<boolean> {
    return await this.pollingManager.testKeepAlive();
  }

  /**
   * Get supported command categories
   */
  getSupportedCategories(): string[] {
    return this.commandDispatcher.getSupportedCategories();
  }

  /**
   * Get command statistics
   */
  getCommandStats(): ReturnType<CommandDispatcher['getStats']> {
    return this.commandDispatcher.getStats();
  }

  /**
   * Health check entire system
   */
  async healthCheck(): Promise<{
    connection: boolean;
    httpServer: boolean;
    polling: boolean;
    keepAlive: boolean;
    overall: boolean;
  }> {
    const health = {
      connection: this.isConnected(),
      httpServer: await this.testConnection(),
      polling: this.pollingManager.isPolling(),
      keepAlive: this.pollingManager.isKeepAliveActive(),
      overall: false
    };

    health.overall = health.connection && health.httpServer;

    return health;
  }

  /**
   * Restart entire client (for debugging)
   */
  async restart(): Promise<void> {
    Logger.info('Restarting plugin client...');

    // Shutdown
    await this.shutdown();

    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Reinitialize
    await this.initialize();

    Logger.info('Plugin client restart complete');
  }
}