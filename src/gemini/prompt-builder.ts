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
    prompt += '}\n\n';

    // Add important constraints including spatial guidelines
    prompt += '=== IMPORTANT CONSTRAINTS ===\n';
    prompt += '1. ALWAYS create nodes BEFORE modifying them\n';
    prompt += '2. Creation tools: createFrame, createRectangle, createEllipse, createText\n';
    prompt += '3. Modification tools: setPosition, resize, setOpacity, setVisible, setName, etc.\n';
    prompt += '4. Order actions correctly: CREATE → MODIFY\n';
    prompt += '5. Use real node IDs from Figma, not made-up ones\n';
    prompt += '6. Do not use modifiers on non-existent nodes\n';
    prompt += '7. **SPATIAL POSITIONING**: DO NOT specify x,y coordinates unless user explicitly requests specific positions\n';
    prompt += '8. **SMART POSITIONING**: Let the smart positioning system handle element placement to avoid overlaps\n';
    prompt += '9. **AVOID ORIGIN CLUSTERING**: Never default to (0,0) coordinates - omit x,y for auto-positioning\n';
    prompt += '10. **PROFESSIONAL LAYOUTS**: Elements should flow naturally and maintain proper spacing\n';

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
        const position = frame.x !== undefined && frame.y !== undefined ? ` at (${frame.x}, ${frame.y})` : '';
        formatted += `- ${frame.name || 'Unnamed'}: ${frame.width}x${frame.height}px${position}\n`;
      }
      if (designState.frames.length > 5) {
        formatted += `- ... and ${designState.frames.length - 5} more\n`;
      }
      formatted += '\n';
    }

    if (designState.nodes && designState.nodes.length > 0) {
      formatted += `**Existing Elements (${designState.nodes.length}):**\n`;

      // Group by position for spatial awareness
      const positionedNodes = designState.nodes.filter(node =>
        node.x !== undefined && node.y !== undefined
      ).slice(0, 5);

      const originNodes = positionedNodes.filter(node =>
        (node.x === 0 || Math.abs(node.x || 0) < 10) &&
        (node.y === 0 || Math.abs(node.y || 0) < 10)
      );

      if (originNodes.length > 0) {
        formatted += `- **⚠️  CLUSTERED AT ORIGIN**: ${originNodes.length} elements at/near (0,0) - avoid this area!\n`;
      }

      for (const node of positionedNodes) {
        const position = `(${node.x}, ${node.y})`;
        const size = node.width && node.height ? ` ${node.width}x${node.height}px` : '';
        formatted += `- ${node.name || 'Unnamed'} (${node.type})${size} at ${position}\n`;
      }

      const nonPositioned = designState.nodes.length - positionedNodes.length;
      if (nonPositioned > 0) {
        formatted += `- ... and ${nonPositioned} more elements\n`;
      }
      formatted += '\n';

      // Add spatial summary
      if (positionedNodes.length > 0) {
        const bounds = this.calculateContentBounds(positionedNodes);
        formatted += `**Spatial Layout Summary:**\n`;
        formatted += `- Content area: ${bounds.minX}-${bounds.maxX}px (width: ${bounds.maxX - bounds.minX}px)\n`;
        formatted += `- Vertical range: ${bounds.minY}-${bounds.maxY}px (height: ${bounds.maxY - bounds.minY}px)\n`;
        formatted += `- Elements clustered at origin: ${originNodes.length}/${positionedNodes.length}\n`;
        formatted += `- **Recommended positioning**: Use areas away from existing content or flow naturally after existing elements\n\n`;
      }
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
   * Calculate content bounds for spatial awareness
   */
  private static calculateContentBounds(nodes: any[]): {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  } {
    const positions = nodes
      .filter(node => node.x !== undefined && node.y !== undefined)
      .map(node => ({
        x: node.x as number,
        y: node.y as number,
        width: (node.width as number) || 100,
        height: (node.height as number) || 100
      }));

    if (positions.length === 0) {
      return { minX: 0, maxX: 0, minY: 0, maxY: 0 };
    }

    return {
      minX: Math.min(...positions.map(p => p.x)),
      maxX: Math.max(...positions.map(p => p.x + p.width)),
      minY: Math.min(...positions.map(p => p.y)),
      maxY: Math.max(...positions.map(p => p.y + p.height))
    };
  }

  /**
   * Format system message for conversation context
   */
  static getSystemMessage(): string {
    return `You are a professional UI/UX design assistant integrated with Figma.
Help users create and modify designs through natural language commands.
Always respond with valid JSON containing thinking, actions, and explanation.
CRITICAL: Never position elements at (0,0) unless explicitly requested - use smart positioning instead.`;
  }
}

export default PromptBuilder;
