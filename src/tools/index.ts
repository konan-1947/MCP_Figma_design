import { z } from 'zod';
import { Tool } from '@modelcontextprotocol/sdk/types.js';
import HttpClient from '../utils/http-client.js';
import { MCPToolResult, FigmaCommand } from '../types/http.js';

// Import new API tools and schemas
import { allTools, toolsByCategory } from './categories/index.js';
import { McpTool, FigmaCommandTemplate } from './types.js';

export class FigmaTools {
  private httpClient: HttpClient;

  constructor(httpClient: HttpClient) {
    this.httpClient = httpClient;
  }

  // NEW API: Get tool definitions from categorized tools
  public getToolDefinitions(): Tool[] {
    return allTools.map(tool => ({
      name: tool.name,
      description: tool.description,
      inputSchema: this.zodSchemaToJsonSchema(tool.inputSchema)
    }));
  }

  // NEW API: Execute categorized tools
  public async executeNewTool(toolName: string, parameters: unknown): Promise<MCPToolResult> {
    try {
      // Find the tool in our categorized tools
      const tool = allTools.find(t => t.name === toolName);

      if (!tool) {
        return {
          success: false,
          error: `Tool ${toolName} not found`
        };
      }

      // Validate parameters
      const validatedParams = tool.inputSchema.parse(parameters);

      console.error(`[Tools] Executing NEW API ${toolName} with params:`, validatedParams);

      // Get command template from tool handler
      const commandTemplate = await tool.handler(validatedParams);

      // Convert template to full command with ID (will be set by HTTP client)
      const command: FigmaCommand = {
        ...commandTemplate,
        id: '' // Will be set by HTTP client
      };

      // Execute command via HTTP client
      const result = await this.httpClient.executeNewCommand(command);

      return result;

    } catch (error) {
      console.error(`[Tools] Error executing NEW API ${toolName}:`, error);

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


  // Helper method to convert Zod schema to JSON Schema for MCP
  private zodSchemaToJsonSchema(schema: z.ZodSchema<any>): any {
    // This is a simplified converter - in production you might want to use a library
    // For now, we'll use the schema's description and shape

    if (schema instanceof z.ZodObject) {
      const shape = schema.shape;
      const properties: any = {};
      const required: string[] = [];

      for (const [key, fieldSchema] of Object.entries(shape)) {
        const field = fieldSchema as z.ZodSchema<any>;
        properties[key] = this.zodFieldToJsonSchema(field);

        // Check if field is required
        if (!this.isOptional(field)) {
          required.push(key);
        }
      }

      return {
        type: 'object',
        properties,
        required: required.length > 0 ? required : undefined
      };
    }

    return { type: 'object' };
  }

  private zodFieldToJsonSchema(field: z.ZodSchema<any>): any {
    // Handle ZodOptional
    if (field instanceof z.ZodOptional) {
      return this.zodFieldToJsonSchema(field.unwrap());
    }

    // Handle ZodDefault
    if (field instanceof z.ZodDefault) {
      const schema = this.zodFieldToJsonSchema(field.removeDefault());
      schema.default = field._def.defaultValue();
      return schema;
    }

    // Handle basic types
    if (field instanceof z.ZodString) {
      const schema: any = { type: 'string' };
      if (field.description) {
        schema.description = field.description;
      }
      // Check for regex pattern
      if (field._def.checks) {
        const regexCheck = field._def.checks.find((c: any) => c.kind === 'regex');
        if (regexCheck && 'regex' in regexCheck) {
          schema.pattern = (regexCheck as any).regex.source;
        }
      }
      return schema;
    }

    if (field instanceof z.ZodNumber) {
      const schema: any = { type: 'number' };
      if (field.description) {
        schema.description = field.description;
      }
      // Add min/max constraints
      if (field._def.checks) {
        const minCheck = field._def.checks.find((c: any) => c.kind === 'min');
        const maxCheck = field._def.checks.find((c: any) => c.kind === 'max');
        if (minCheck && 'value' in minCheck) {
          schema.minimum = (minCheck as any).value;
        }
        if (maxCheck && 'value' in maxCheck) {
          schema.maximum = (maxCheck as any).value;
        }
      }
      return schema;
    }

    if (field instanceof z.ZodBoolean) {
      return {
        type: 'boolean',
        description: field.description
      };
    }

    if (field instanceof z.ZodEnum) {
      return {
        type: 'string',
        enum: field.options,
        description: field.description
      };
    }

    if (field instanceof z.ZodArray) {
      return {
        type: 'array',
        items: this.zodFieldToJsonSchema(field.element),
        description: field.description
      };
    }

    if (field instanceof z.ZodObject) {
      return this.zodSchemaToJsonSchema(field);
    }

    // Default fallback
    return {
      type: 'string',
      description: field.description
    };
  }

  private isOptional(field: z.ZodSchema<any>): boolean {
    return field instanceof z.ZodOptional ||
           (field instanceof z.ZodDefault);
  }

  // === NEW API CONVENIENCE METHODS ===

  // Node Creation (B1)
  public async createFrame(params: { name?: string; width?: number; height?: number; x?: number; y?: number }): Promise<MCPToolResult> {
    return this.executeNewTool('createFrame', params);
  }

  public async createRectangle(params: { width: number; height: number; x?: number; y?: number; name?: string }): Promise<MCPToolResult> {
    return this.executeNewTool('createRectangle', params);
  }

  public async createEllipse(params: { width: number; height: number; x?: number; y?: number; name?: string }): Promise<MCPToolResult> {
    return this.executeNewTool('createEllipse', params);
  }

  public async createText(params: { characters: string; x?: number; y?: number; fontSize?: number; name?: string }): Promise<MCPToolResult> {
    return this.executeNewTool('createText', params);
  }

  // Node Modification (B2)
  public async setPosition(params: { nodeId: string; x: number; y: number }): Promise<MCPToolResult> {
    return this.executeNewTool('setPosition', params);
  }

  public async resize(params: { nodeId: string; width: number; height: number }): Promise<MCPToolResult> {
    return this.executeNewTool('resize', params);
  }

  public async setName(params: { nodeId: string; name: string }): Promise<MCPToolResult> {
    return this.executeNewTool('setName', params);
  }

  public async setVisible(params: { nodeId: string; visible: boolean }): Promise<MCPToolResult> {
    return this.executeNewTool('setVisible', params);
  }


  // === UTILITY METHODS ===

  public getAvailableCategories(): string[] {
    return Object.keys(toolsByCategory);
  }

  public getToolsByCategory(category: string): McpTool[] {
    return toolsByCategory[category as keyof typeof toolsByCategory] || [];
  }

  public getAllNewTools(): McpTool[] {
    return allTools;
  }
}

export default FigmaTools;