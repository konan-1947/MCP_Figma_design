// Figma Plugin Types
/// <reference types="@figma/plugin-typings" />

// Command interfaces từ code.ts (lines 5-18)
export interface FigmaCommand {
  category: string;
  operation: string;
  parameters: Record<string, any>;
  id: string;
}

export interface FigmaResponse {
  id: string;
  success: boolean;
  data?: any;
  error?: string | { code: string; message: string; details?: any };
}

// Log level types cho Logger
export type LogLevel = 'info' | 'success' | 'error' | 'warning';

// Message types cho UI communication
export interface UILogMessage {
  type: 'log';
  payload: {
    message: string;
    level: LogLevel;
  };
}

// Connection state types
export interface ConnectionState {
  clientId: string | null;
  isConnected: boolean;
  reconnectAttempts: number;
  pollInterval: any;
  keepAliveInterval: any;
}

// Configuration types
export interface PluginConfig {
  baseUrl: string;
  maxReconnectAttempts: number;
  pollIntervalMs: number;
  keepAliveIntervalMs: number;
}

// Color utility types
export interface RGBA {
  r: number;
  g: number;
  b: number;
  a: number;
}

export interface RGB {
  r: number;
  g: number;
  b: number;
}

// HTTP request types
export interface HTTPRequestOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
}

// Handler result types
export interface HandlerResult {
  success: boolean;
  data?: any;
  error?: string;
}