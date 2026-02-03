// Command format for New API
export interface FigmaCommand {
  category: string;    // "node-creation", "node-modification", etc.
  operation: string;   // "createFrame", "setPosition", etc.
  parameters: Record<string, any>; // Tool parameters
  id: string;          // Unique command ID
}

export interface FigmaResponse<T = any> {
  id: string;          // Command ID tương ứng
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  } | string; // Support both new error format and legacy string format
}

export interface ConnectionInfo {
  id: string;
  type: 'mcp' | 'figma' | 'figma-ui';  // Extended to include figma-ui
  connected: boolean;
  lastPing?: number;
}

export enum MessageType {
  COMMAND = 'command',
  RESPONSE = 'response',
  PING = 'ping',
  PONG = 'pong',
  CONNECT = 'connect',
  DISCONNECT = 'disconnect'
}

// MCP-specific types
export interface MCPToolResult {
  success: boolean;
  data?: any;
  error?: string;
  commandId?: string;
}

export interface CommandExecutionContext {
  commandId: string;
  toolName: string;
  parameters: Record<string, any>;
  startTime: number;
}