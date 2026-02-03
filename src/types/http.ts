export interface FigmaCommand {
  type: string;        // "lay_selection", "them_text", "tao_man_hinh"...
  data: any;           // Tool parameters
  id: string;          // Unique command ID
}

export interface FigmaResponse {
  id: string;          // Command ID tương ứng
  success: boolean;
  data?: any;
  error?: string;
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