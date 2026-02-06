/**
 * Prompt Builder for Gemini
 * Constructs prompts with design context and conversation history
 */

import { DesignState, Message } from './types.js';

export class PromptBuilder {
  /**
   * Build a prompt with full context for Gemini
   */
  static buildPrompt(
    userInput: string,
    designState: DesignState,
    options: {
      includeHistory?: boolean;
      maxHistoryMessages?: number;
      includeDesignState?: boolean;
    } = {}
  ): string {
    const {
      includeHistory = true,
      maxHistoryMessages = 5,
      includeDesignState = true
    } = options;

    let prompt = '';

    // Add conversation history
    if (includeHistory && designState.conversationHistory.length > 0) {
      prompt += '=== CONVERSATION HISTORY ===\n';
      const historyMessages = designState.conversationHistory.slice(-maxHistoryMessages);
      
      for (const msg of historyMessages) {
        prompt += `[${msg.role.toUpperCase()}]: ${msg.content}\n`;
      }
      prompt += '\n';
    }

    // Add current design state
    if (includeDesignState) {
      prompt += '=== CURRENT DESIGN STATE ===\n';
      prompt += this.formatDesignState(designState.designState);
      prompt += '\n\n';
    }

    // Add current user request
    prompt += '=== USER REQUEST ===\n';
    prompt += userInput;
    prompt += '\n\n';

    // Add response format instruction
    prompt += '=== RESPONSE FORMAT ===\n';
    prompt += 'Respond with ONLY valid JSON (no markdown code blocks, no extra text):\n';
    prompt += '{\n';
    prompt += '  "thinking": "your step-by-step reasoning",\n';
    prompt += '  "actions": [\n';
    prompt += '    {\n';
    prompt += '      "tool": "toolName",\n';
    prompt += '      "params": { "param1": "value1" }\n';
    prompt += '    }\n';
    prompt += '  ],\n';
    prompt += '  "explanation": "user-friendly description of what was done"\n';
    prompt += '}\n';

    return prompt;
  }

  /**
   * Format design state for readability in prompt
   */
  private static formatDesignState(designState: DesignState['designState']): string {
    let formatted = '';

    if (designState.metadata) {
      formatted += '**Metadata:**\n';
      for (const [key, value] of Object.entries(designState.metadata)) {
        formatted += `- ${key}: ${JSON.stringify(value)}\n`;
      }
      formatted += '\n';
    }

    if (designState.frames && designState.frames.length > 0) {
      formatted += `**Frames (${designState.frames.length}):**\n`;
      for (const frame of designState.frames.slice(0, 5)) {
        formatted += `- ${frame.name || 'Unnamed'}: ${frame.width}x${frame.height}px\n`;
      }
      if (designState.frames.length > 5) {
        formatted += `- ... and ${designState.frames.length - 5} more\n`;
      }
      formatted += '\n';
    }

    if (designState.nodes && designState.nodes.length > 0) {
      formatted += `**Nodes (${designState.nodes.length}):**\n`;
      for (const node of designState.nodes.slice(0, 5)) {
        formatted += `- ${node.name || 'Unnamed'} (${node.type})\n`;
      }
      if (designState.nodes.length > 5) {
        formatted += `- ... and ${designState.nodes.length - 5} more\n`;
      }
      formatted += '\n';
    }

    if (designState.styles && Object.keys(designState.styles).length > 0) {
      formatted += `**Styles (${Object.keys(designState.styles).length}):**\n`;
      const styleKeys = Object.keys(designState.styles).slice(0, 5);
      for (const key of styleKeys) {
        formatted += `- ${key}\n`;
      }
      const remaining = Object.keys(designState.styles).length - styleKeys.length;
      if (remaining > 0) {
        formatted += `- ... and ${remaining} more\n`;
      }
      formatted += '\n';
    }

    if (!formatted) {
      formatted = '(Empty design state - start creating!)';
    }

    return formatted;
  }

  /**
   * Build a prompt for tool discovery
   */
  static buildToolDiscoveryPrompt(availableTools: Array<{ name: string; description: string }>): string {
    let prompt = 'Here are the available tools you can use:\n\n';

    for (const tool of availableTools) {
      prompt += `- **${tool.name}**: ${tool.description}\n`;
    }

    prompt += '\nUse these tools to implement user requests.';
    return prompt;
  }

  /**
   * Build a context summary (for debugging/logging)
   */
  static buildContextSummary(designState: DesignState): string {
    return `
Session: ${designState.sessionId}
Created: ${designState.timestamp}
History Length: ${designState.conversationHistory.length} messages
Frames: ${designState.designState.frames?.length || 0}
Nodes: ${designState.designState.nodes?.length || 0}
Styles: ${Object.keys(designState.designState.styles || {}).length}
    `.trim();
  }

  /**
   * Validate user input before sending to Gemini
   */
  static validateInput(input: string): { valid: boolean; error?: string } {
    if (!input || input.trim().length === 0) {
      return { valid: false, error: 'Input cannot be empty' };
    }

    if (input.length > 10000) {
      return { valid: false, error: 'Input too long (max 10000 characters)' };
    }

    // Check for potentially harmful content
    const suspiciousPatterns = [
      /rm\s+-rf/i,
      /delete\s+all/i,
      /drop\s+database/i,
      /\/\/\s*.*eval/i
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(input)) {
        return { valid: false, error: 'Input contains potentially harmful content' };
      }
    }

    return { valid: true };
  }

  /**
   * Format system message for conversation context
   */
  static getSystemMessage(): string {
    return `You are a professional UI/UX design assistant integrated with Figma. 
Help users create and modify designs through natural language commands.
Always respond with valid JSON containing thinking, actions, and explanation.`;
  }
}

export default PromptBuilder;
