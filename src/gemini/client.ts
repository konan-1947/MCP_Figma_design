/**
 * Gemini API Client Wrapper
 * Handles communication with Google Gemini API
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { GeminiResponse, GeminiAction } from './types.js';
import { SYSTEM_PROMPT } from './system-prompt.js';

export class GeminiClient {
  private client: GoogleGenerativeAI;
  private model: string;
  private apiKey: string;

  constructor(apiKey: string, model: string = 'gemini-2.0-flash') {
    if (!apiKey) {
      throw new Error('GOOGLE_GEMINI_API_KEY is required');
    }
    this.apiKey = apiKey;
    this.model = model;
    this.client = new GoogleGenerativeAI(apiKey);
  }

  /**
   * Generate design actions from user prompt
   * Includes conversation history and design state for context
   */
  async generateActions(
    userPrompt: string,
    contextData?: {
      designState?: string;
      conversationHistory?: Array<{ role: string; content: string }>;
      systemInstructions?: string;
    }
  ): Promise<GeminiResponse> {
    try {
      const model = this.client.getGenerativeModel({ 
        model: this.model,
        systemInstruction: SYSTEM_PROMPT
      });

      // Build full prompt with context
      const fullPrompt = this.buildFullPrompt(userPrompt, contextData);

      console.log('[GeminiClient] Sending prompt to model:', this.model);
      console.log('[GeminiClient] Prompt length:', fullPrompt.length, 'chars');

      const response = await model.generateContent({
        contents: [
          { 
            role: 'user', 
            parts: [{ text: fullPrompt }] 
          }
        ]
      });

      const text = response.response.text();
      console.log('[GeminiClient] Received response:', text.substring(0, 200) + '...');

      // Parse response
      const parsed = this.parseResponse(text);
      return parsed;
    } catch (error) {
      console.error('[GeminiClient] Error:', error);
      throw new Error(`Failed to generate actions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Build full prompt with context
   */
  private buildFullPrompt(
    userPrompt: string,
    contextData?: {
      designState?: string;
      conversationHistory?: Array<{ role: string; content: string }>;
      systemInstructions?: string;
    }
  ): string {
    let prompt = '';

    // Add conversation history if available
    if (contextData?.conversationHistory && contextData.conversationHistory.length > 0) {
      prompt += '=== CONVERSATION HISTORY (Last 5 messages) ===\n';
      const lastMessages = contextData.conversationHistory.slice(-5);
      for (const msg of lastMessages) {
        prompt += `${msg.role.toUpperCase()}: ${msg.content}\n`;
      }
      prompt += '\n';
    }

    // Add current design state if available
    if (contextData?.designState) {
      prompt += '=== CURRENT DESIGN STATE ===\n';
      prompt += contextData.designState;
      prompt += '\n\n';
    }

    // Add user's current request
    prompt += '=== USER REQUEST ===\n';
    prompt += userPrompt;
    prompt += '\n\n';

    // Add response format instruction
    prompt += '=== RESPONSE FORMAT ===\n';
    prompt += 'Respond with ONLY valid JSON (no markdown, no extra text):\n';
    prompt += '{\n';
    prompt += '  "thinking": "your reasoning",\n';
    prompt += '  "actions": [\n';
    prompt += '    { "tool": "toolName", "params": { ...params } }\n';
    prompt += '  ],\n';
    prompt += '  "explanation": "what you did"\n';
    prompt += '}\n';

    return prompt;
  }

  /**
   * Parse Gemini's JSON response
   */
  private parseResponse(text: string): GeminiResponse {
    try {
      // Try to extract JSON from the response
      // Gemini might wrap it in markdown code blocks
      let jsonStr = text;

      // Remove markdown code blocks if present
      const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1].trim();
      } else {
        // Try to find JSON object directly
        const objectMatch = text.match(/\{[\s\S]*\}/);
        if (objectMatch) {
          jsonStr = objectMatch[0];
        }
      }

      const parsed = JSON.parse(jsonStr) as GeminiResponse;

      // Validate response structure
      if (!parsed.thinking || !parsed.actions || !parsed.explanation) {
        throw new Error('Invalid response structure: missing required fields');
      }

      // Validate actions are valid
      if (!Array.isArray(parsed.actions)) {
        throw new Error('Actions must be an array');
      }

      for (const action of parsed.actions) {
        if (!action.tool || !action.params) {
          throw new Error('Each action must have "tool" and "params"');
        }
      }

      console.log('[GeminiClient] Parsed response with', parsed.actions.length, 'actions');
      return parsed;
    } catch (error) {
      console.error('[GeminiClient] Parse error:', error);
      console.error('[GeminiClient] Raw response:', text.substring(0, 500));
      
      // Return empty actions on parse error
      return {
        thinking: 'Error parsing response',
        actions: [],
        explanation: `Failed to parse response: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Check if API key is valid by making a simple request
   */
  async testConnection(): Promise<boolean> {
    try {
      const model = this.client.getGenerativeModel({ model: this.model });
      const response = await model.generateContent('Test');
      return !!response.response.text();
    } catch (error) {
      console.error('[GeminiClient] Connection test failed:', error);
      return false;
    }
  }

  /**
   * Get available models info
   */
  getModelInfo(): {
    model: string;
    apiKey: string;
  } {
    return {
      model: this.model,
      apiKey: this.apiKey.substring(0, 10) + '...' // Hide key
    };
  }
}

export default GeminiClient;
