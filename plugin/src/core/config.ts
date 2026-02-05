// Plugin Configuration
// Constants từ FigmaHttpClient (lines 22-28)

import { PluginConfig } from '../types';

export const PLUGIN_CONFIG: PluginConfig = {
  baseUrl: 'http://localhost:8765',
  maxReconnectAttempts: 10,
  pollIntervalMs: 200,         // Poll every 200ms for responsive drawing
  keepAliveIntervalMs: 30000   // Every 30 seconds
};

// HTTP request defaults
export const HTTP_DEFAULTS = {
  timeout: 10000,              // 10 second timeout
  headers: {
    'Content-Type': 'application/json',
    'X-Client-Type': 'figma-ui'
  }
};

// UI configuration
export const UI_CONFIG = {
  width: 400,
  height: 600,
  title: 'MCP Controller'
};

// Error messages
export const ERROR_MESSAGES = {
  NODE_NOT_FOUND: (nodeId: string) => `Node not found: ${nodeId}`,
  INVALID_NODE_TYPE: (nodeId: string, operation: string) => `Node ${nodeId} does not support ${operation}`,
  CONNECTION_FAILED: 'Failed to connect to HTTP server',
  HEALTH_CHECK_FAILED: 'Health check failed',
  REGISTRATION_FAILED: 'Registration failed',
  UNKNOWN_CATEGORY: (category: string) => `Unknown command category: ${category}`,
  UNKNOWN_OPERATION: (operation: string, category: string) => `Unknown ${category} operation: ${operation}`,
  FONT_LOAD_ERROR: 'Cannot load any font'
};

// Reconnection delays (exponential backoff with max cap)
export const getReconnectDelay = (attempt: number): number => {
  return Math.min(1000 * Math.pow(2, attempt - 1), 30000);
};