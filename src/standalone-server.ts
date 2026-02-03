#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
  ErrorCode,
  McpError
} from '@modelcontextprotocol/sdk/types.js';

// Simplified MCP Server without HTTP client dependencies for standalone use
class StandaloneFigmaMCPServer {
  private server: Server;

  constructor() {
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

    this.setupHandlers();
  }

  private setupHandlers(): void {
    // List tools handler
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'lay_selection',
            description: 'Lấy thông tin về các element đang được chọn trong Figma',
            inputSchema: {
              type: 'object',
              properties: {},
              required: []
            }
          },
          {
            name: 'them_text',
            description: 'Thêm text element vào Figma canvas',
            inputSchema: {
              type: 'object',
              properties: {
                noi_dung: {
                  type: 'string',
                  description: 'Nội dung text cần thêm'
                },
                x: {
                  type: 'number',
                  description: 'Vị trí X (mặc định: 0)'
                },
                y: {
                  type: 'number',
                  description: 'Vị trí Y (mặc định: 0)'
                },
                font_size: {
                  type: 'number',
                  description: 'Kích thước font (mặc định: 16)'
                },
                mau_chu: {
                  type: 'string',
                  description: 'Màu chữ hex (mặc định: #000000)'
                }
              },
              required: ['noi_dung']
            }
          },
          {
            name: 'tao_man_hinh',
            description: 'Tạo frame/màn hình mới với header',
            inputSchema: {
              type: 'object',
              properties: {
                ten: {
                  type: 'string',
                  description: 'Tên frame/màn hình'
                },
                tieu_de: {
                  type: 'string',
                  description: 'Tiêu đề header'
                },
                loai: {
                  type: 'string',
                  enum: ['mobile', 'tablet', 'desktop'],
                  description: 'Loại màn hình'
                }
              },
              required: ['ten', 'tieu_de', 'loai']
            }
          },
          {
            name: 'figma_status',
            description: 'Kiểm tra trạng thái kết nối Figma Plugin',
            inputSchema: {
              type: 'object',
              properties: {},
              required: []
            }
          }
        ]
      };
    });

    // Call tool handler
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        console.error(`[MCP Standalone] Tool called: ${name}`); // Use stderr for debugging

        // Simple responses without HTTP client dependency
        switch (name) {
          case 'figma_status':
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify({
                    success: true,
                    status: 'MCP Server đang hoạt động',
                    message: 'Để sử dụng đầy đủ tính năng, hãy đảm bảo Figma Plugin và Bridge Server đang chạy',
                    bridge_required: true,
                    plugin_required: true
                  }, null, 2)
                }
              ]
            };

          case 'lay_selection':
          case 'them_text':
          case 'tao_man_hinh':
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify({
                    success: false,
                    error: 'Figma Plugin chưa kết nối',
                    message: 'Để sử dụng tool này, hãy:\n1. Chạy Bridge Server: npm run dev:bridge\n2. Load và chạy Figma Plugin\n3. Thử lại command',
                    tool: name,
                    parameters: args
                  }, null, 2)
                }
              ]
            };

          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown tool: ${name}`
            );
        }

      } catch (error) {
        console.error(`[MCP Standalone] Tool ${name} error:`, error);

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
      console.error('[MCP Standalone] Server error:', error);
    };
  }

  public async start(): Promise<void> {
    try {
      console.error('[MCP Standalone] Starting Figma MCP Controller (Standalone Mode)...');

      // Start MCP server với stdio transport
      const transport = new StdioServerTransport();
      await this.server.connect(transport);

      console.error('[MCP Standalone] Server started successfully');

    } catch (error) {
      console.error('[MCP Standalone] Failed to start:', error);
      throw error;
    }
  }

  public async stop(): Promise<void> {
    try {
      console.error('[MCP Standalone] Stopping server...');
      await this.server.close();
      console.error('[MCP Standalone] Server stopped');
    } catch (error) {
      console.error('[MCP Standalone] Error stopping server:', error);
    }
  }
}

async function main(): Promise<void> {
  const server = new StandaloneFigmaMCPServer();

  // Graceful shutdown handlers
  const shutdown = async (signal: string) => {
    console.error(`\n[MCP Standalone] Received ${signal}, shutting down gracefully...`);
    await server.stop();
    process.exit(0);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  // Handle uncaught errors
  process.on('uncaughtException', (error) => {
    console.error('[MCP Standalone] Uncaught exception:', error);
    process.exit(1);
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('[MCP Standalone] Unhandled rejection at:', promise, 'reason:', reason);
    process.exit(1);
  });

  try {
    await server.start();
  } catch (error) {
    console.error('[MCP Standalone] Failed to start server:', error);
    process.exit(1);
  }
}

// Chạy main function
main().catch((error) => {
  console.error('[MCP Standalone] Fatal error:', error);
  process.exit(1);
});

export default StandaloneFigmaMCPServer;