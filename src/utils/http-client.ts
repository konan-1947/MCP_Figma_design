import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import {
  FigmaCommand,
  FigmaResponse,
  MCPToolResult,
  CommandExecutionContext
} from '../types/http.js';

interface HttpClientConfig {
  baseURL: string;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
  keepAliveTimeout: number;
}

interface PendingCommand {
  resolve: (result: MCPToolResult) => void;
  reject: (error: Error) => void;
  timeout: NodeJS.Timeout;
  context: CommandExecutionContext;
}

export class HttpClient {
  private client: AxiosInstance;
  private config: HttpClientConfig;
  private clientId: string | null = null;
  private isConnected = false;
  private connectionPromise: Promise<void> | null = null;
  private keepAliveInterval: NodeJS.Timeout | null = null;
  private pendingCommands: Map<string, PendingCommand> = new Map();

  constructor(baseURL: string = 'http://localhost:8765', config: Partial<HttpClientConfig> = {}) {
    this.config = {
      baseURL,
      timeout: 5000,  // 5 seconds for drawing operations
      retryAttempts: 3,
      retryDelay: 1000, // 1 second
      keepAliveTimeout: 30000, // 30 seconds
      ...config
    };

    this.client = axios.create({
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
        'X-Client-Type': 'mcp'
      }
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor - add client ID to headers
    this.client.interceptors.request.use(
      (config) => {
        if (this.clientId) {
          config.headers = config.headers || {};
          config.headers['X-Client-ID'] = this.clientId;
        }
        console.error(`[HTTP Client] 📤 ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('[HTTP Client] Request interceptor error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor - log responses and handle errors
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        console.error(`[HTTP Client] 📥 ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`);
        return response;
      },
      (error) => {
        console.error(`[HTTP Client] ❌ ${error.response?.status || 'NETWORK'} ${error.config?.method?.toUpperCase()} ${error.config?.url}:`,
                     error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  public async connect(): Promise<void> {
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    this.connectionPromise = this.performConnection();
    return this.connectionPromise;
  }

  private async performConnection(): Promise<void> {
    try {
      console.error(`[HTTP Client] 🔗 Connecting to ${this.config.baseURL}...`);

      // Health check first
      await this.retryRequest(() => this.client.get('/health'), 'Health check');

      // Register as MCP client
      const registerResponse = await this.retryRequest(
        () => this.client.post('/figma/register', {
          clientType: 'mcp',
          clientId: this.clientId || undefined
        }),
        'Client registration'
      );

      this.clientId = registerResponse.data.clientId;
      this.isConnected = true;

      console.error(`[HTTP Client] ✅ Connected successfully as client: ${this.clientId}`);

      // Setup keep-alive interval
      this.setupKeepAlive();

    } catch (error) {
      this.isConnected = false;
      this.connectionPromise = null;
      console.error('[HTTP Client] ❌ Connection failed:', error);
      throw new Error(`Failed to connect: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async retryRequest<T>(
    requestFunc: () => Promise<T>,
    operation: string,
    retryCount: number = 0
  ): Promise<T> {
    try {
      return await requestFunc();
    } catch (error) {
      const shouldRetry = retryCount < this.config.retryAttempts &&
                         this.isRetryableError(error);

      if (shouldRetry) {
        const delay = this.config.retryDelay * Math.pow(2, retryCount); // Exponential backoff
        console.error(`[HTTP Client] 🔄 Retrying ${operation} in ${delay}ms (attempt ${retryCount + 1}/${this.config.retryAttempts})`);

        await this.sleep(delay);
        return this.retryRequest(requestFunc, operation, retryCount + 1);
      }

      throw error;
    }
  }

  private isRetryableError(error: any): boolean {
    // Retry on network errors and 5xx server errors
    if (!error.response) return true; // Network error
    const status = error.response.status;
    return status >= 500 && status < 600; // Server errors
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private setupKeepAlive(): void {
    this.cleanupKeepAlive();

    this.keepAliveInterval = setInterval(async () => {
      try {
        await this.client.post('/figma/keepalive');
        console.error(`[HTTP Client] 💓 Keep-alive sent`);
      } catch (error) {
        console.error('[HTTP Client] ❌ Keep-alive failed:', error);
        this.isConnected = false;
        this.cleanupKeepAlive();
      }
    }, this.config.keepAliveTimeout);
  }

  private cleanupKeepAlive(): void {
    if (this.keepAliveInterval) {
      clearInterval(this.keepAliveInterval);
      this.keepAliveInterval = null;
    }
  }

  // Execute command via New API
  public async executeNewCommand(command: FigmaCommand): Promise<MCPToolResult> {
    if (!this.isConnected) {
      await this.connect();
    }

    return new Promise((resolve, reject) => {
      const commandId = this.generateCommandId();
      const fullCommand: FigmaCommand = {
        ...command,
        id: commandId
      };

      const context: CommandExecutionContext = {
        commandId,
        toolName: `${command.category}.${command.operation}`,
        parameters: command.parameters,
        startTime: Date.now()
      };

      // Dynamic timeout based on operation type
      const timeoutMs = this.getTimeoutForOperation(command.category, command.operation);
      const timeout = setTimeout(() => {
        this.pendingCommands.delete(commandId);
        reject(new Error(`Command ${command.category}.${command.operation} timeout after ${timeoutMs}ms`));
      }, timeoutMs);

      // Store pending command
      this.pendingCommands.set(commandId, {
        resolve,
        reject,
        timeout,
        context
      });

      // Execute command via HTTP
      this.executeHttpCommand(fullCommand)
        .then((response) => {
          // Clear timeout and remove from pending
          clearTimeout(timeout);
          this.pendingCommands.delete(commandId);

          const executionTime = Date.now() - context.startTime;
          console.error(`[HTTP Client] ✅ Command ${command.category}.${command.operation} completed in ${executionTime}ms`);

          // Convert HTTP response to MCPToolResult
          const result: MCPToolResult = {
            success: response.success,
            data: response.data,
            error: typeof response.error === 'string' ? response.error : response.error?.message,
            commandId: response.id
          };

          if (response.success) {
            resolve(result);
          } else {
            reject(new Error(result.error || 'Command failed'));
          }
        })
        .catch((error) => {
          clearTimeout(timeout);
          this.pendingCommands.delete(commandId);
          reject(error);
        });
    });
  }


  private async executeHttpCommand(command: FigmaCommand): Promise<FigmaResponse> {
    try {
      console.error(`[HTTP Client] 🚀 Executing command: ${command.category}.${command.operation} (${command.id})`);

      const response = await this.retryRequest(
        () => this.client.post('/figma/command', command),
        `Command ${command.category}.${command.operation}`
      );

      return response.data;
    } catch (error) {
      console.error(`[HTTP Client] ❌ Command execution failed:`, error);

      // Convert HTTP error to FigmaResponse format
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const httpError = error as any;
      const statusCode = httpError.response?.status;

      return {
        id: command.id,
        success: false,
        error: {
          code: `HTTP_${statusCode || 'ERROR'}`,
          message: errorMessage,
          details: httpError.response?.data
        },
        data: null
      };
    }
  }


  public async checkConnection(): Promise<{ bridge_connected: boolean; figma_connected: boolean }> {
    try {
      const response = await this.client.get('/figma/status');
      return {
        bridge_connected: response.data.bridge_connected || false,
        figma_connected: response.data.figma_connected || false
      };
    } catch (error) {
      console.error('[HTTP Client] ❌ Status check failed:', error);
      return {
        bridge_connected: false,
        figma_connected: false
      };
    }
  }

  public async ping(): Promise<boolean> {
    try {
      const response = await this.client.get('/figma/ping');
      return response.data.pong === true;
    } catch (error) {
      console.error('[HTTP Client] ❌ Ping failed:', error);
      return false;
    }
  }

  private generateCommandId(): string {
    return `cmd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getTimeoutForOperation(category: string, operation: string): number {
    // Fast drawing operations - 5 seconds
    const fastOperations = ['node-creation', 'node-modification', 'style-modification', 'text-operations'];
    if (fastOperations.includes(category)) {
      return 5000;
    }

    // File operations or complex API calls - 30 seconds
    if (category === 'figma-api' && (operation.includes('File') || operation.includes('file'))) {
      return 30000;
    }

    // Default timeout
    return this.config.timeout;
  }

  public isConnectedToServer(): boolean {
    return this.isConnected;
  }

  public getPendingCommandsCount(): number {
    return this.pendingCommands.size;
  }

  public getClientId(): string | null {
    return this.clientId;
  }

  public async disconnect(): Promise<void> {
    console.error('[HTTP Client] 🔌 Disconnecting...');

    this.cleanupKeepAlive();

    // Reject all pending commands
    const error = new Error('Client disconnected');
    for (const [commandId, pending] of this.pendingCommands.entries()) {
      clearTimeout(pending.timeout);
      pending.reject(error);
    }
    this.pendingCommands.clear();

    this.isConnected = false;
    this.connectionPromise = null;
    this.clientId = null;

    console.error('[HTTP Client] ✅ Disconnected');
  }

  // Additional utility methods
  public getConnectionInfo(): {
    connected: boolean;
    clientId: string | null;
    baseURL: string;
    pendingCommands: number;
  } {
    return {
      connected: this.isConnected,
      clientId: this.clientId,
      baseURL: this.config.baseURL,
      pendingCommands: this.pendingCommands.size
    };
  }

  public updateConfig(newConfig: Partial<HttpClientConfig>): void {
    this.config = { ...this.config, ...newConfig };

    // Update axios instance if baseURL changed
    if (newConfig.baseURL) {
      this.client.defaults.baseURL = newConfig.baseURL;
    }

    if (newConfig.timeout) {
      this.client.defaults.timeout = newConfig.timeout;
    }
  }
}

export default HttpClient;