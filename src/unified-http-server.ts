/**
 * Unified HTTP Server
 * Combines FigmaHttpServer + GeminiRoutes into single Express server
 * Serves both Figma plugin commands AND Gemini chat API
 */

import 'dotenv/config';
import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import {
  FigmaCommand,
  FigmaResponse,
  ConnectionInfo,
} from './types/http.js';
import GeminiClient from './gemini/client.js';
import StateManager from './gemini/state-manager.js';
import FigmaTools from './tools/index.js';
import HttpClient from './utils/http-client.js';
import setupGeminiRoutes from './gemini/http-routes.js';

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

export class UnifiedHttpServer {
  private app: Express;
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
  }

  private setupMiddleware(): void {
    // CORS configuration
    this.app.use(cors({
      origin: true,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Client-Type', 'X-Client-ID']
    }));

    // JSON parsing
    this.app.use(express.json({ limit: '10mb' }));

    // Request logging
    this.app.use((req, res, next) => {
      console.error(`[UnifiedServer] ${new Date().toISOString()} ${req.method} ${req.path}`);
      next();
    });

    // Cleanup expired clients periodically
    setInterval(() => {
      this.cleanupExpiredClients();
    }, 30000);
  }

  public async initialize(geminiClient: GeminiClient, stateManager: StateManager, figmaTools: FigmaTools): Promise<void> {
    // Setup CORE endpoints
    this.setupCoreEndpoints();

    // Setup FIGMA PLUGIN endpoints (command queue, polling, responses)
    this.setupFigmaPluginEndpoints();

    // Setup FIGMA TOKEN management endpoints
    this.setupFigmaTokenEndpoints();

    // Mount GEMINI API routes (chat, sessions, tools, etc.)
    setupGeminiRoutes(this.app, geminiClient, stateManager, figmaTools);

    console.error('[UnifiedServer] ✅ All routes configured');
  }

  private setupCoreEndpoints(): void {
    // Health check
    this.app.get('/health', (req: Request, res: Response) => {
      res.json({
        status: 'ok',
        timestamp: Date.now(),
        server: 'figma-gemini-unified-server',
        version: '1.0.0'
      });
    });

    // Ping endpoint
    this.app.get('/figma/ping', (req: Request, res: Response) => {
      res.json({
        pong: true,
        timestamp: Date.now(),
        connections: this.getConnectionStatus()
      });
    });

    // Client registration
    this.app.post('/figma/register', (req: Request, res: Response) => {
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

      console.error(`[UnifiedServer] 🔗 Client registered: ${id} (${clientType})`);

      res.json({
        success: true,
        clientId: id,
        message: `Client ${id} registered as ${clientType}`,
        timestamp: Date.now()
      });
    });

    // Status check
    this.app.get('/figma/status', (req: Request, res: Response) => {
      const status = this.getConnectionStatus();

      res.json({
        bridge_connected: true,
        figma_connected: status.figma,
        mcp_connected: status.mcp,
        connections: this.getConnections(),
        timestamp: Date.now()
      });
    });
  }

  private setupFigmaPluginEndpoints(): void {
    // Command execution from MCP or Gemini
    this.app.post('/figma/command', async (req: Request, res: Response) => {
      try {
        const command: FigmaCommand = req.body;
        const clientId = req.headers['x-client-id'] as string;

        if (!command || !command.id || !command.category || !command.operation || !command.parameters) {
          return res.status(400).json({
            error: 'Invalid command format. Required: id, category, operation, parameters'
          });
        }

        const commandDescription = `${command.category}.${command.operation}`;
        console.error(`[UnifiedServer] 🚀 Received command ${commandDescription} (${command.id})`);

        const figmaClient = this.findClientByType('figma');
        if (!figmaClient) {
          console.error(`[UnifiedServer] ❌ No Figma plugin available for command ${command.id}`);
          return res.status(503).json({
            error: 'Figma plugin not connected',
            commandId: command.id
          });
        }

        console.error(`[UnifiedServer] ✅ Found Figma plugin: ${figmaClient.id}`);

        // Add command to queue for Figma plugin
        if (!this.commandQueue.has(figmaClient.id)) {
          this.commandQueue.set(figmaClient.id, []);
        }
        this.commandQueue.get(figmaClient.id)!.push(command);

        // Wait for response with timeout
        const response = await this.waitForCommandResponse(command.id);
        res.json(response);

      } catch (error) {
        console.error(`[UnifiedServer] ❌ Command execution error:`, error);
        res.status(500).json({
          error: error instanceof Error ? error.message : 'Internal server error',
          timestamp: Date.now()
        });
      }
    });

    // Figma plugin polls for commands
    this.app.get('/figma/commands', (req: Request, res: Response) => {
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

      console.error(`[UnifiedServer] 📥 Poll from ${clientId}, returning ${commands.length} commands`);

      res.json({
        commands,
        timestamp: Date.now(),
        hasMoreCommands: false
      });
    });

    // Figma plugin sends command responses
    this.app.post('/figma/response', (req: Request, res: Response) => {
      try {
        const response: FigmaResponse = req.body;
        const clientId = req.headers['x-client-id'] as string;

        if (!response || !response.id) {
          return res.status(400).json({
            error: 'Invalid response format. Required: id'
          });
        }

        console.error(`[UnifiedServer] 📥 Response from Figma for command ${response.id}:`,
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
        console.error(`[UnifiedServer] ❌ Response handling error:`, error);
        res.status(500).json({
          error: error instanceof Error ? error.message : 'Internal server error'
        });
      }
    });

    // Keep-alive endpoint for clients
    this.app.post('/figma/keepalive', (req: Request, res: Response) => {
      const clientId = req.headers['x-client-id'] as string;

      if (clientId) {
        const client = this.registeredClients.get(clientId);
        if (client) {
          client.lastSeen = Date.now();
          client.connected = true;
        }
      }

      res.json({
        success: true,
        timestamp: Date.now()
      });
    });
  }

  private setupFigmaTokenEndpoints(): void {
    // Set Figma access token
    this.app.post('/figma/token/set', (req: Request, res: Response) => {
      try {
        const { token } = req.body;

        if (!token || typeof token !== 'string' || token.trim().length === 0) {
          return res.status(400).json({
            error: 'Valid access token is required'
          });
        }

        this.figmaAccessToken = token.trim();

        console.error(`[UnifiedServer] 🔑 Access token set successfully`);

        res.json({
          success: true,
          message: 'Access token set successfully',
          timestamp: Date.now()
        });

      } catch (error) {
        console.error(`[UnifiedServer] ❌ Token set error:`, error);
        res.status(500).json({
          error: error instanceof Error ? error.message : 'Internal server error'
        });
      }
    });

    // Get Figma access token
    this.app.get('/figma/token/get', (req: Request, res: Response) => {
      res.json({
        hasToken: !!this.figmaAccessToken,
        token: this.figmaAccessToken,
        timestamp: Date.now()
      });
    });

    // Clear Figma access token
    this.app.post('/figma/token/clear', (req: Request, res: Response) => {
      this.figmaAccessToken = null;

      console.error(`[UnifiedServer] 🗑️ Access token cleared`);

      res.json({
        success: true,
        message: 'Access token cleared successfully',
        timestamp: Date.now()
      });
    });

    // Validate Figma access token
    this.app.post('/figma/token/validate', async (req: Request, res: Response) => {
      try {
        if (!this.figmaAccessToken) {
          return res.json({
            valid: false,
            message: 'No access token set',
            timestamp: Date.now()
          });
        }

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
        console.error(`[UnifiedServer] ❌ Token validation error:`, error);
        res.json({
          valid: false,
          message: `Token validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          timestamp: Date.now()
        });
      }
    });
  }

  // Private utility methods
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
        console.error(`[UnifiedServer] 🧹 Cleaning up expired client: ${clientId}`);
        this.registeredClients.delete(clientId);
        this.commandQueue.delete(clientId);
      }
    }

    for (const [commandId, pending] of this.pendingCommands.entries()) {
      if ((now - pending.timestamp) > 30000) {
        console.error(`[UnifiedServer] 🧹 Cleaning up expired command: ${commandId}`);
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
          console.error('');
          console.error('╔══════════════════════════════════════════════════╗');
          console.error('║  ✅ Unified HTTP Server is Running!             ║');
          console.error(`║  🌐 http://localhost:${this.port}                  ║`);
          console.error('╠══════════════════════════════════════════════════╣');
          console.error('║  CORE Endpoints:                                 ║');
          console.error('║  - GET    /health - Health check                ║');
          console.error('║  - GET    /figma/ping - Ping test               ║');
          console.error('║  - GET    /figma/status - Connection status     ║');
          console.error('║  - POST   /figma/register - Register client     ║');
          console.error('╠══════════════════════════════════════════════════╣');
          console.error('║  FIGMA PLUGIN Endpoints:                         ║');
          console.error('║  - GET    /figma/commands - Poll for commands   ║');
          console.error('║  - POST   /figma/response - Submit response     ║');
          console.error('║  - POST   /figma/keepalive - Keep alive signal  ║');
          console.error('║  - POST   /figma/command - Execute command      ║');
          console.error('╠══════════════════════════════════════════════════╣');
          console.error('║  FIGMA TOKEN Endpoints:                          ║');
          console.error('║  - POST   /figma/token/set - Set access token   ║');
          console.error('║  - GET    /figma/token/get - Get access token   ║');
          console.error('║  - POST   /figma/token/clear - Clear token      ║');
          console.error('║  - POST   /figma/token/validate - Validate      ║');
          console.error('╠══════════════════════════════════════════════════╣');
          console.error('║  GEMINI API Endpoints:                           ║');
          console.error('║  - POST   /api/session/create - Create session  ║');
          console.error('║  - GET    /api/session/:id - Get session        ║');
          console.error('║  - DELETE /api/session/:id - Delete session     ║');
          console.error('║  - GET    /api/sessions - List all sessions     ║');
          console.error('║  - POST   /api/chat - Chat with Gemini AI       ║');
          console.error('║  - GET    /api/tools - List available tools     ║');
          console.error('║  - POST   /api/debug/test-gemini - Test Gemini  ║');
          console.error('╚══════════════════════════════════════════════════╝');
          console.error('');
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
          console.error('[UnifiedServer] 🛑 Server stopped');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }
}

export default UnifiedHttpServer;
