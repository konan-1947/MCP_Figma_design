import { z } from 'zod';
import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { ToolSchemas, ToolSchemaTypes } from './schemas.js';
import HttpClient from '../utils/http-client.js';
import { MCPToolResult } from '../types/http.js';

export class FigmaTools {
  private httpClient: HttpClient;

  constructor(httpClient: HttpClient) {
    this.httpClient = httpClient;
  }

  // Tool definitions cho MCP Server
  public getToolDefinitions(): Tool[] {
    return [
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
        name: 'them_button',
        description: 'Thêm button component vào canvas',
        inputSchema: {
          type: 'object',
          properties: {
            text: {
              type: 'string',
              description: 'Text trên button'
            },
            x: {
              type: 'number',
              description: 'Vị trí X'
            },
            y: {
              type: 'number',
              description: 'Vị trí Y'
            },
            mau_nen: {
              type: 'string',
              description: 'Màu nền button (mặc định: #3B82F6)'
            },
            mau_chu: {
              type: 'string',
              description: 'Màu chữ (mặc định: #FFFFFF)'
            },
            width: {
              type: 'number',
              description: 'Chiều rộng (mặc định: 120)'
            },
            height: {
              type: 'number',
              description: 'Chiều cao (mặc định: 44)'
            }
          },
          required: ['text', 'x', 'y']
        }
      },
      {
        name: 'them_hinh_chu_nhat',
        description: 'Thêm hình chữ nhật vào canvas',
        inputSchema: {
          type: 'object',
          properties: {
            x: {
              type: 'number',
              description: 'Vị trí X'
            },
            y: {
              type: 'number',
              description: 'Vị trí Y'
            },
            width: {
              type: 'number',
              description: 'Chiều rộng'
            },
            height: {
              type: 'number',
              description: 'Chiều cao'
            },
            mau_nen: {
              type: 'string',
              description: 'Màu nền fill'
            },
            border_radius: {
              type: 'number',
              description: 'Bo góc (mặc định: 0)'
            }
          },
          required: ['x', 'y', 'width', 'height', 'mau_nen']
        }
      },
      {
        name: 'tao_form_login',
        description: 'Tạo form login template hoàn chỉnh',
        inputSchema: {
          type: 'object',
          properties: {
            tieu_de: {
              type: 'string',
              description: 'Tiêu đề form (mặc định: "Đăng nhập")'
            }
          },
          required: []
        }
      },
      {
        name: 'tao_card',
        description: 'Tạo card component với header và content',
        inputSchema: {
          type: 'object',
          properties: {
            tieu_de: {
              type: 'string',
              description: 'Tiêu đề card'
            },
            mo_ta: {
              type: 'string',
              description: 'Mô tả nội dung'
            },
            hinh_anh_url: {
              type: 'string',
              description: 'URL hình ảnh (tùy chọn)'
            },
            x: {
              type: 'number',
              description: 'Vị trí X (mặc định: 0)'
            },
            y: {
              type: 'number',
              description: 'Vị trí Y (mặc định: 0)'
            }
          },
          required: ['tieu_de', 'mo_ta']
        }
      },
      {
        name: 'xoa_selection',
        description: 'Xóa các element đang được chọn',
        inputSchema: {
          type: 'object',
          properties: {},
          required: []
        }
      }
    ];
  }

  // Execute tool với validation
  public async executeTool<T extends keyof ToolSchemaTypes>(
    toolName: T,
    parameters: unknown
  ): Promise<MCPToolResult> {
    try {
      // Validate parameters với Zod schema
      const schema = ToolSchemas[toolName];
      const validatedParams = schema.parse(parameters);

      console.error(`[Tools] Executing ${toolName} with params:`, validatedParams);

      // Gửi command qua HTTP
      const result = await this.httpClient.executeCommand(
        toolName,
        validatedParams
      );

      return result;

    } catch (error) {
      console.error(`[Tools] Error executing ${toolName}:`, error);

      if (error instanceof z.ZodError) {
        return {
          success: false,
          error: `Invalid parameters: ${error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`
        };
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Helper methods cho specific tools
  public async laySelection(): Promise<MCPToolResult> {
    return this.executeTool('lay_selection', {});
  }

  public async themText(params: ToolSchemaTypes['them_text']): Promise<MCPToolResult> {
    return this.executeTool('them_text', params);
  }

  public async taoManHinh(params: ToolSchemaTypes['tao_man_hinh']): Promise<MCPToolResult> {
    return this.executeTool('tao_man_hinh', params);
  }

  public async themButton(params: ToolSchemaTypes['them_button']): Promise<MCPToolResult> {
    return this.executeTool('them_button', params);
  }

  public async themHinhChuNhat(params: ToolSchemaTypes['them_hinh_chu_nhat']): Promise<MCPToolResult> {
    return this.executeTool('them_hinh_chu_nhat', params);
  }

  public async taoFormLogin(params: ToolSchemaTypes['tao_form_login'] = {}): Promise<MCPToolResult> {
    return this.executeTool('tao_form_login', params);
  }

  public async taoCard(params: ToolSchemaTypes['tao_card']): Promise<MCPToolResult> {
    return this.executeTool('tao_card', params);
  }

  public async xoaSelection(): Promise<MCPToolResult> {
    return this.executeTool('xoa_selection', {});
  }
}

export default FigmaTools;