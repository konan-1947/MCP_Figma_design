/**
 * Gemini Integration Types
 */

export interface DesignState {
  sessionId: string;
  timestamp: string;
  designState: {
    frames?: any[];
    nodes?: any[];
    styles?: Record<string, any>;
    currentFileKey?: string;
    metadata?: Record<string, any>;
  };
  conversationHistory: Message[];
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
  actions?: GeminiAction[];
}

export interface GeminiAction {
  tool: string;
  params: Record<string, any>;
}

export interface GeminiResponse {
  thinking: string;
  actions: GeminiAction[];
  explanation: string;
}

export interface ChatRequest {
  sessionId: string;
  userMessage: string;
}

export interface ChatResponse {
  success: boolean;
  sessionId: string;
  explanation: string;
  actions: GeminiAction[];
  responses?: any[];
  error?: string;
}

export interface SessionCreateResponse {
  sessionId: string;
  timestamp: string;
}
