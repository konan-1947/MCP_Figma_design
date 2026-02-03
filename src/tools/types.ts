import { z } from 'zod';

// Base command structure for new API
export interface FigmaCommand {
  category: string;
  operation: string;
  parameters: Record<string, any>;
  id: string;
}

// Response structure
export interface FigmaResponse<T = any> {
  id: string;
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

// Command template (without ID, which is added later)
export interface FigmaCommandTemplate {
  category: string;
  operation: string;
  parameters: Record<string, any>;
}

// MCP Tool definition
export interface McpTool {
  name: string;
  description: string;
  inputSchema: z.ZodSchema<any>;
  handler: (params: any) => Promise<FigmaCommandTemplate>;
}

// Tool categories enum
export enum ToolCategory {
  NODE_CREATION = 'node-creation',
  NODE_MODIFICATION = 'node-modification',
  STYLE_MODIFICATION = 'style-modification',
  TEXT_OPERATIONS = 'text-operations',
  LAYOUT_OPERATIONS = 'layout-operations',
  COMPONENT_OPERATIONS = 'component-operations',
  BOOLEAN_OPERATIONS = 'boolean-operations',
  HIERARCHY_OPERATIONS = 'hierarchy-operations',
  SELECTION_NAVIGATION = 'selection-navigation',
  EXPORT_OPERATIONS = 'export-operations'
}

// Common response types
export interface NodeResponse {
  id: string;
  name: string;
  type: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  visible?: boolean;
  locked?: boolean;
}

export interface SelectionResponse {
  nodes: NodeResponse[];
  count: number;
}

export interface ErrorResponse {
  code: string;
  message: string;
  nodeId?: string;
  operation?: string;
}