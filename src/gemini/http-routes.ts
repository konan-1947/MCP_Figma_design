/**
 * HTTP Routes for Gemini Integration
 * Adds /api/chat and /api/session endpoints to Express app
 */

import { Express, Request, Response } from 'express';
import GeminiClient from './client.js';
import StateManager from './state-manager.js';
import PromptBuilder from './prompt-builder.js';
import FigmaTools from '../tools/index.js';
import HttpClient from '../utils/http-client.js';
import { ChatRequest, ChatResponse, SessionCreateResponse } from './types.js';

// Helper function to sort actions by dependency
function sortActionsByDependency(actions: any[]): any[] {
  const creationTools = ['createFrame', 'createRectangle', 'createEllipse', 'createText'];
  const modificationTools = ['setPosition', 'resize', 'setOpacity', 'setVisible', 'setLocked', 'setName', 'setBlendMode', 'setRotation'];
  
  // Separate actions by type
  const creations = actions.filter(a => creationTools.includes(a.tool));
  const modifications = actions.filter(a => modificationTools.includes(a.tool));
  const others = actions.filter(a => !creationTools.includes(a.tool) && !modificationTools.includes(a.tool));
  
  // Return in order: creations → modifications → others
  return [...creations, ...modifications, ...others];
}

export function setupGeminiRoutes(
  app: Express,
  geminiClient: GeminiClient,
  stateManager: StateManager,
  figmaTools: FigmaTools
): void {
  /**
   * POST /api/session/create
   * Create a new design session
   */
  app.post('/api/session/create', async (req: Request, res: Response) => {
    try {
      const sessionId = await stateManager.createSession();
      
      const response: SessionCreateResponse = {
        sessionId,
        timestamp: new Date().toISOString()
      };

      res.json(response);
    } catch (error) {
      console.error('[GeminiRoutes] Error creating session:', error);
      res.status(500).json({
        error: 'Failed to create session',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * GET /api/session/:sessionId
   * Get session details and conversation history
   */
  app.get('/api/session/:sessionId', async (req: Request, res: Response) => {
    try {
      const { sessionId } = req.params;
      const state = await stateManager.load(sessionId);

      if (!state) {
        return res.status(404).json({
          error: 'Session not found',
          sessionId
        });
      }

      // Remove sensitive data, keep conversation history
      const response = {
        sessionId: state.sessionId,
        timestamp: state.timestamp,
        conversationHistory: state.conversationHistory,
        designState: state.designState,
        messageCount: state.conversationHistory.length
      };

      res.json(response);
    } catch (error) {
      console.error('[GeminiRoutes] Error getting session:', error);
      res.status(500).json({
        error: 'Failed to get session',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * DELETE /api/session/:sessionId
   * Delete a session
   */
  app.delete('/api/session/:sessionId', async (req: Request, res: Response) => {
    try {
      const { sessionId } = req.params;
      await stateManager.deleteSession(sessionId);

      res.json({
        success: true,
        sessionId,
        message: 'Session deleted'
      });
    } catch (error) {
      console.error('[GeminiRoutes] Error deleting session:', error);
      res.status(500).json({
        error: 'Failed to delete session',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * GET /api/sessions
   * List all sessions
   */
  app.get('/api/sessions', async (req: Request, res: Response) => {
    try {
      const sessions = await stateManager.listSessions();
      res.json({ sessions, count: sessions.length });
    } catch (error) {
      console.error('[GeminiRoutes] Error listing sessions:', error);
      res.status(500).json({
        error: 'Failed to list sessions',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * POST /api/chat
   * Send a message and get design actions from Gemini
   */
  app.post('/api/chat', async (req: Request, res: Response) => {
    try {
      const { sessionId, userMessage } = req.body as ChatRequest;

      // Validate input
      if (!sessionId || !userMessage) {
        return res.status(400).json({
          error: 'Missing required fields: sessionId, userMessage'
        });
      }

      const validation = PromptBuilder.validateInput(userMessage);
      if (!validation.valid) {
        return res.status(400).json({
          error: validation.error
        });
      }

      console.log(`[GeminiRoutes] Chat request for session ${sessionId}`);
      console.log(`[GeminiRoutes] User message: ${userMessage.substring(0, 100)}...`);

      // Load session state
      const state = await stateManager.load(sessionId);
      if (!state) {
        return res.status(404).json({
          error: 'Session not found',
          sessionId
        });
      }

      // Build prompt with context
      const prompt = PromptBuilder.buildPrompt(userMessage, state, {
        includeHistory: true,
        maxHistoryMessages: 5,
        includeDesignState: true
      });

      // Call Gemini API
      console.log('[GeminiRoutes] Calling Gemini API...');
      const geminiResponse = await geminiClient.generateActions(userMessage, {
        conversationHistory: state.conversationHistory.map(m => ({
          role: m.role,
          content: m.content
        })),
        designState: JSON.stringify(state.designState, null, 2)
      });

      console.log('[GeminiRoutes] Gemini response received with', geminiResponse.actions.length, 'actions');

      // Add user message to history
      await stateManager.addMessage(sessionId, {
        role: 'user',
        content: userMessage,
        timestamp: new Date().toISOString()
      });

      // Execute actions if any
      const executedResponses = [];
      if (geminiResponse.actions && geminiResponse.actions.length > 0) {
        console.log('[GeminiRoutes] Executing', geminiResponse.actions.length, 'actions...');

        // Sort actions: creation first, then modifications
        const sortedActions = sortActionsByDependency(geminiResponse.actions);

        for (const action of sortedActions) {
          try {
            const result = await figmaTools.executeNewTool(action.tool, action.params);
            executedResponses.push({
              tool: action.tool,
              success: result.success,
              data: result.data || result.error
            });
            console.log(`[GeminiRoutes] ✓ Executed ${action.tool}`);
          } catch (error) {
            console.error(`[GeminiRoutes] ✗ Error executing ${action.tool}:`, error);
            executedResponses.push({
              tool: action.tool,
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error'
            });
          }
        }
      }

      // Add assistant response to history
      await stateManager.addMessage(sessionId, {
        role: 'assistant',
        content: geminiResponse.explanation,
        timestamp: new Date().toISOString(),
        actions: geminiResponse.actions
      });

      // Build response
      const response: ChatResponse = {
        success: true,
        sessionId,
        explanation: geminiResponse.explanation,
        actions: geminiResponse.actions,
        responses: executedResponses
      };

      res.json(response);
    } catch (error) {
      console.error('[GeminiRoutes] Error in chat endpoint:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to process chat request',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * GET /api/tools
   * Get list of available tools for UI
   */
  app.get('/api/tools', (req: Request, res: Response) => {
    try {
      const tools = figmaTools.getToolDefinitions();
      const categorizedTools = figmaTools.getAvailableCategories();

      res.json({
        tools: tools.map(t => ({
          name: t.name,
          description: t.description
        })),
        categories: categorizedTools,
        count: tools.length
      });
    } catch (error) {
      console.error('[GeminiRoutes] Error getting tools:', error);
      res.status(500).json({
        error: 'Failed to get tools',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * POST /api/debug/test-gemini
   * Test Gemini connection (debug endpoint)
   */
  app.post('/api/debug/test-gemini', async (req: Request, res: Response) => {
    try {
      const isConnected = await geminiClient.testConnection();
      res.json({
        connected: isConnected,
        modelInfo: geminiClient.getModelInfo()
      });
    } catch (error) {
      console.error('[GeminiRoutes] Error testing Gemini:', error);
      res.status(500).json({
        connected: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  console.log('[GeminiRoutes] Gemini API routes registered');
}

export default setupGeminiRoutes;
