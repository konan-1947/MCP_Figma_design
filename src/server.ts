import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
  ErrorCode,
  McpError
} from '@modelcontextprotocol/sdk/types.js';

import HttpClient from './utils/http-client.js';
import FigmaTools from './tools/index.js';

export class FigmaMCPServer {
  private server: Server;
  private httpClient: HttpClient;
  private tools: FigmaTools;

  constructor(httpUrl: string = 'http://localhost:8765') {
    this.server = new Server(
      {
        name: 'figma-mcp-controller',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.httpClient = new HttpClient(httpUrl);
    this.tools = new FigmaTools(this.httpClient);
    this.setupHandlers();
  }

  private setupHandlers(): void {
    // List tools handler
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: this.tools.getToolDefinitions()
      };
    });

    // Call tool handler
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        console.error(`[MCP Server] Calling tool: ${name}`);

        // Đảm bảo HTTP client đã kết nối
        if (!this.httpClient.isConnectedToServer()) {
          console.error('[MCP Server] HTTP client chưa kết nối, đang kết nối...');
          await this.httpClient.connect();
        }

        // All tools use the new API
        console.error(`[MCP Server] Executing tool: ${name}`);
        const result = await this.tools.executeNewTool(name, args);

        if (result.success) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  success: true,
                  data: result.data,
                  message: `Tool ${name} executed successfully`
                }, null, 2)
              }
            ]
          };
        } else {
          throw new McpError(
            ErrorCode.InternalError,
            result.error || `Tool ${name} failed`
          );
        }

      } catch (error) {
        console.error(`[MCP Server] Tool ${name} error:`, error);

        if (error instanceof McpError) {
          throw error;
        }

        throw new McpError(
          ErrorCode.InternalError,
          `Tool execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    });

    // Error handler
    this.server.onerror = (error) => {
      console.error('[MCP Server] Server error:', error);
    };
  }

  public async start(): Promise<void> {
    try {
      console.error('[MCP Server] Starting Figma MCP Controller...');

      // Kết nối HTTP client trước
      console.error('[MCP Server] Connecting to HTTP bridge...');
      await this.httpClient.connect();
      console.error('[MCP Server] HTTP client connected successfully');

      // Start MCP server với stdio transport
      const transport = new StdioServerTransport();
      await this.server.connect(transport);

      console.error('[MCP Server] Server started and ready to receive requests');

    } catch (error) {
      console.error('[MCP Server] Failed to start:', error);
      throw error;
    }
  }

  public async stop(): Promise<void> {
    try {
      console.error('[MCP Server] Stopping server...');
      await this.httpClient.disconnect();
      await this.server.close();
      console.error('[MCP Server] Server stopped');
    } catch (error) {
      console.error('[MCP Server] Error stopping server:', error);
    }
  }

  // Getter để test
  public getHttpClient(): HttpClient {
    return this.httpClient;
  }

  public getTools(): FigmaTools {
    return this.tools;
  }
}

export default FigmaMCPServer;