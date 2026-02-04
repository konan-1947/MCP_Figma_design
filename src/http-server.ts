import express from 'express';
import cors from 'cors';
import {
  FigmaCommand,
  FigmaResponse,
  ConnectionInfo,
  MessageType
} from './types/http.js';

interface PendingCommand {
  resolve: (value: any) => void;
  reject: (error: Error) => void;
  timeout: NodeJS.Timeout;
  timestamp: number;
}

interface RegisteredClient {
  id: string;
  type: 'mcp' | 'figma' | 'figma-ui';
  lastSeen: number;
  connected: boolean;
}

export class FigmaHttpServer {
  private app: express.Application;
  private server: any;
  private readonly port: number;

  // Client management
  private registeredClients: Map<string, RegisteredClient> = new Map();
  private pendingCommands: Map<string, PendingCommand> = new Map();
  private commandQueue: Map<string, FigmaCommand[]> = new Map(); // clientId -> commands[]

  // Token management
  private figmaAccessToken: string | null = null;

  constructor(port: number = 8765) {
    this.port = port;
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware(): void {
    // CORS configuration - Allow all origins including null (for Figma plugin data: URLs)
    this.app.use(cors({
      origin: true, // Allow all origins including null
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Client-Type', 'X-Client-ID']
    }));

    // JSON parsing
    this.app.use(express.json({ limit: '10mb' }));

    // Request logging
    this.app.use((req, res, next) => {
      console.error(`[HttpServer] ${new Date().toISOString()} ${req.method} ${req.path}`);
      console.error(`[HttpServer] Headers:`, req.headers);
      if (req.body && Object.keys(req.body).length > 0) {
        console.error(`[HttpServer] Body:`, JSON.stringify(req.body));
      }
      next();
    });

    // Cleanup expired clients periodically
    setInterval(() => {
      this.cleanupExpiredClients();
    }, 30000); // Every 30 seconds
  }

  private setupRoutes(): void {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'ok',
        timestamp: Date.now(),
        server: 'figma-http-server',
        version: '1.0.0'
      });
    });

    // Ping endpoint
    this.app.get('/figma/ping', (req, res) => {
      res.json({
        pong: true,
        timestamp: Date.now(),
        connections: this.getConnectionStatus()
      });
    });

    // Client registration
    this.app.post('/figma/register', (req, res) => {
      const { clientType, clientId } = req.body;

      if (!clientType || !['mcp', 'figma', 'figma-ui'].includes(clientType)) {
        return res.status(400).json({
          error: 'Invalid clientType. Must be: mcp, figma, or figma-ui'
        });
      }

      const id = clientId || this.generateClientId();

      this.registeredClients.set(id, {
        id,
        type: clientType,
        lastSeen: Date.now(),
        connected: true
      });

      console.error(`[HttpServer] 🔗 Client registered: ${id} (${clientType})`);

      res.json({
        success: true,
        clientId: id,
        message: `Client ${id} registered as ${clientType}`,
        timestamp: Date.now()
      });
    });

    // Status check
    this.app.get('/figma/status', (req, res) => {
      const status = this.getConnectionStatus();
      console.error(`[HttpServer] 📊 Status check:`, status);

      res.json({
        bridge_connected: true,
        figma_connected: status.figma,
        mcp_connected: status.mcp,
        connections: this.getConnections(),
        timestamp: Date.now()
      });
    });

    // Command execution from MCP Server
    this.app.post('/figma/command', async (req, res) => {
      try {
        const command: FigmaCommand = req.body;
        const clientId = req.headers['x-client-id'] as string;

        // Validate new command format
        if (!command || !command.id || !command.category || !command.operation || !command.parameters) {
          return res.status(400).json({
            error: 'Invalid command format. Required: id, category, operation, parameters'
          });
        }

        const commandDescription = `${command.category}.${command.operation}`;
        console.error(`[HttpServer] 🚀 Received command ${commandDescription} (${command.id})`);

        const figmaClient = this.findClientByType('figma');
        if (!figmaClient) {
          console.error(`[HttpServer] ❌ No Figma client available for command ${command.id}`);
          return res.status(503).json({
            error: 'Figma plugin not connected',
            commandId: command.id
          });
        }

        console.error(`[HttpServer] ✅ Found Figma client: ${figmaClient.id}`);

        // Add command to queue for Figma client
        if (!this.commandQueue.has(figmaClient.id)) {
          this.commandQueue.set(figmaClient.id, []);
        }
        this.commandQueue.get(figmaClient.id)!.push(command);

        // Wait for response with timeout
        const response = await this.waitForCommandResponse(command.id);
        res.json(response);

      } catch (error) {
        console.error(`[HttpServer] ❌ Command execution error:`, error);
        res.status(500).json({
          error: error instanceof Error ? error.message : 'Internal server error',
          timestamp: Date.now()
        });
      }
    });

    // Figma plugin polls for commands
    this.app.get('/figma/commands', (req, res) => {
      const clientId = req.headers['x-client-id'] as string;

      if (!clientId) {
        return res.status(400).json({ error: 'Missing X-Client-ID header' });
      }

      // Update last seen
      const client = this.registeredClients.get(clientId);
      if (client) {
        client.lastSeen = Date.now();
        client.connected = true;
      }

      // Get pending commands for this client
      const commands = this.commandQueue.get(clientId) || [];
      this.commandQueue.set(clientId, []); // Clear queue after sending

      console.error(`[HttpServer] 📥 Poll from ${clientId}, returning ${commands.length} commands`);

      res.json({
        commands,
        timestamp: Date.now(),
        hasMoreCommands: false
      });
    });

    // Figma plugin sends command responses
    this.app.post('/figma/response', (req, res) => {
      try {
        const response: FigmaResponse = req.body;
        const clientId = req.headers['x-client-id'] as string;

        if (!response || !response.id) {
          return res.status(400).json({
            error: 'Invalid response format. Required: id'
          });
        }

        console.error(`[HttpServer] 📥 Response from Figma for command ${response.id}:`,
                   response.success ? '✅ SUCCESS' : `❌ ERROR: ${response.error}`);

        // Update client last seen
        const client = this.registeredClients.get(clientId);
        if (client) {
          client.lastSeen = Date.now();
        }

        // Resolve pending command
        this.resolvePendingCommand(response.id, response);

        res.json({
          success: true,
          message: 'Response received',
          timestamp: Date.now()
        });

      } catch (error) {
        console.error(`[HttpServer] ❌ Response handling error:`, error);
        res.status(500).json({
          error: error instanceof Error ? error.message : 'Internal server error'
        });
      }
    });

    // Keep-alive endpoint for clients
    this.app.post('/figma/keepalive', (req, res) => {
      const clientId = req.headers['x-client-id'] as string;

      if (clientId && this.registeredClients.has(clientId)) {
        const client = this.registeredClients.get(clientId)!;
        client.lastSeen = Date.now();
        client.connected = true;

        console.error(`[HttpServer] 💓 Keep-alive from ${clientId}`);
      }

      res.json({ success: true, timestamp: Date.now() });
    });

    // === TOKEN MANAGEMENT ENDPOINTS ===

    // Set Figma access token
    this.app.post('/figma/token/set', (req, res) => {
      try {
        const { token } = req.body;

        if (!token || typeof token !== 'string' || token.trim().length === 0) {
          return res.status(400).json({
            error: 'Valid access token is required'
          });
        }

        this.figmaAccessToken = token.trim();

        console.error(`[HttpServer] 🔑 Access token set successfully`);

        res.json({
          success: true,
          message: 'Access token set successfully',
          timestamp: Date.now()
        });

      } catch (error) {
        console.error(`[HttpServer] ❌ Token set error:`, error);
        res.status(500).json({
          error: error instanceof Error ? error.message : 'Internal server error'
        });
      }
    });

    // Get Figma access token
    this.app.get('/figma/token/get', (req, res) => {
      res.json({
        hasToken: !!this.figmaAccessToken,
        token: this.figmaAccessToken, // Return actual token for MCP tools
        timestamp: Date.now()
      });
    });

    // Clear Figma access token
    this.app.post('/figma/token/clear', (req, res) => {
      this.figmaAccessToken = null;

      console.error(`[HttpServer] 🗑️ Access token cleared`);

      res.json({
        success: true,
        message: 'Access token cleared successfully',
        timestamp: Date.now()
      });
    });

    // Validate Figma access token
    this.app.post('/figma/token/validate', async (req, res) => {
      try {
        if (!this.figmaAccessToken) {
          return res.json({
            valid: false,
            message: 'No access token set',
            timestamp: Date.now()
          });
        }

        // Test the token by making a simple API call
        const response = await fetch('https://api.figma.com/v1/me', {
          headers: {
            'X-Figma-Token': this.figmaAccessToken
          }
        });

        if (response.ok) {
          const userData = await response.json();
          res.json({
            valid: true,
            message: 'Access token is valid',
            user: userData,
            timestamp: Date.now()
          });
        } else {
          const errorData = await response.json().catch(() => ({}));
          res.json({
            valid: false,
            message: `Token validation failed: ${errorData.message || response.statusText}`,
            error: errorData,
            timestamp: Date.now()
          });
        }

      } catch (error) {
        console.error(`[HttpServer] ❌ Token validation error:`, error);
        res.json({
          valid: false,
          message: `Token validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          timestamp: Date.now()
        });
      }
    });
  }

  private waitForCommandResponse(commandId: string, timeoutMs: number = 10000): Promise<FigmaResponse> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingCommands.delete(commandId);
        reject(new Error(`Command ${commandId} timeout (${timeoutMs}ms)`));
      }, timeoutMs);

      this.pendingCommands.set(commandId, {
        resolve,
        reject,
        timeout,
        timestamp: Date.now()
      });
    });
  }

  private resolvePendingCommand(commandId: string, response: FigmaResponse): void {
    const pending = this.pendingCommands.get(commandId);
    if (pending) {
      clearTimeout(pending.timeout);
      pending.resolve(response);
      this.pendingCommands.delete(commandId);
    }
  }

  private findClientByType(type: 'mcp' | 'figma' | 'figma-ui'): RegisteredClient | undefined {
    for (const client of this.registeredClients.values()) {
      // For figma type, also accept figma-ui connections
      const isMatchingType = type === 'figma'
        ? (client.type === 'figma' || client.type === 'figma-ui')
        : client.type === type;

      if (isMatchingType && client.connected && this.isClientAlive(client)) {
        return client;
      }
    }
    return undefined;
  }

  private isClientAlive(client: RegisteredClient): boolean {
    const maxAge = 60000; // 60 seconds
    return (Date.now() - client.lastSeen) < maxAge;
  }

  private cleanupExpiredClients(): void {
    const now = Date.now();
    const maxAge = 120000; // 2 minutes

    for (const [clientId, client] of this.registeredClients.entries()) {
      if ((now - client.lastSeen) > maxAge) {
        console.error(`[HttpServer] 🧹 Cleaning up expired client: ${clientId}`);
        this.registeredClients.delete(clientId);
        this.commandQueue.delete(clientId);
      }
    }

    // Cleanup expired pending commands
    for (const [commandId, pending] of this.pendingCommands.entries()) {
      if ((now - pending.timestamp) > 30000) { // 30 seconds
        console.error(`[HttpServer] 🧹 Cleaning up expired command: ${commandId}`);
        clearTimeout(pending.timeout);
        pending.reject(new Error('Command expired'));
        this.pendingCommands.delete(commandId);
      }
    }
  }

  private generateClientId(): string {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Public methods
  public getConnections(): ConnectionInfo[] {
    return Array.from(this.registeredClients.values()).map(client => ({
      id: client.id,
      type: client.type,
      connected: client.connected && this.isClientAlive(client),
      lastPing: client.lastSeen
    }));
  }

  public getConnectionStatus(): { mcp: boolean; figma: boolean } {
    return {
      mcp: Boolean(this.findClientByType('mcp')),
      figma: Boolean(this.findClientByType('figma'))
    };
  }

  public async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.server = this.app.listen(this.port, () => {
          console.error(`[HttpServer] 🚀 Server running on http://localhost:${this.port}`);
          console.error(`[HttpServer] 📝 Available endpoints:`);
          console.error(`[HttpServer]   GET  /health - Health check`);
          console.error(`[HttpServer]   GET  /figma/ping - Ping test`);
          console.error(`[HttpServer]   POST /figma/register - Register client`);
          console.error(`[HttpServer]   GET  /figma/status - Connection status`);
          console.error(`[HttpServer]   POST /figma/command - Execute command`);
          console.error(`[HttpServer]   GET  /figma/commands - Poll for commands (Figma)`);
          console.error(`[HttpServer]   POST /figma/response - Submit response (Figma)`);
          console.error(`[HttpServer]   POST /figma/keepalive - Keep connection alive`);
          console.error(`[HttpServer]   POST /figma/token/set - Set access token`);
          console.error(`[HttpServer]   GET  /figma/token/get - Get access token`);
          console.error(`[HttpServer]   POST /figma/token/clear - Clear access token`);
          console.error(`[HttpServer]   POST /figma/token/validate - Validate access token`);
          resolve();
        });

        this.server.on('error', (error: Error) => {
          reject(error);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  public async stop(): Promise<void> {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => {
          console.error('[HttpServer] 🛑 Server stopped');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }
}

// Start server if running directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = new FigmaHttpServer();

  server.start().catch(error => {
    console.error('[HttpServer] ❌ Failed to start server:', error);
    process.exit(1);
  });

  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.error('\n[HttpServer] 🛑 Shutting down...');
    await server.stop();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.error('\n[HttpServer] 🛑 Shutting down...');
    await server.stop();
    process.exit(0);
  });
}

export default FigmaHttpServer;