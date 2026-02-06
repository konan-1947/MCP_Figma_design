/**
 * State Manager for Design Sessions
 * Handles persistent storage of design state and conversation history
 */

import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { DesignState, Message } from './types.js';

export class StateManager {
  private sessionDir: string;

  constructor(dataDir: string = './data') {
    this.sessionDir = path.join(dataDir, 'sessions');
    this.ensureDirectories();
  }

  /**
   * Ensure necessary directories exist
   */
  private ensureDirectories(): void {
    if (!fs.existsSync(this.sessionDir)) {
      fs.mkdirSync(this.sessionDir, { recursive: true });
      console.log('[StateManager] Created session directory:', this.sessionDir);
    }
  }

  /**
   * Create a new design session
   */
  async createSession(): Promise<string> {
    const sessionId = uuidv4();
    const state: DesignState = {
      sessionId,
      timestamp: new Date().toISOString(),
      designState: {
        frames: [],
        nodes: [],
        styles: {},
        metadata: {}
      },
      conversationHistory: []
    };

    await this.save(sessionId, state);
    console.log('[StateManager] Created session:', sessionId);
    return sessionId;
  }

  /**
   * Save design state to disk
   */
  async save(sessionId: string, state: DesignState): Promise<void> {
    try {
      const filePath = this.getSessionPath(sessionId);
      const content = JSON.stringify(state, null, 2);
      await fs.promises.writeFile(filePath, content, 'utf-8');
      console.log('[StateManager] Saved session:', sessionId);
    } catch (error) {
      console.error('[StateManager] Error saving session:', error);
      throw new Error(`Failed to save session: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Load design state from disk
   */
  async load(sessionId: string): Promise<DesignState | null> {
    try {
      const filePath = this.getSessionPath(sessionId);
      
      if (!fs.existsSync(filePath)) {
        console.warn('[StateManager] Session not found:', sessionId);
        return null;
      }

      const content = await fs.promises.readFile(filePath, 'utf-8');
      const state = JSON.parse(content) as DesignState;
      console.log('[StateManager] Loaded session:', sessionId, 'with', state.conversationHistory.length, 'messages');
      return state;
    } catch (error) {
      console.error('[StateManager] Error loading session:', error);
      return null;
    }
  }

  /**
   * Add message to conversation history
   */
  async addMessage(sessionId: string, message: Message): Promise<void> {
    const state = await this.load(sessionId);
    if (!state) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    state.conversationHistory.push({
      ...message,
      timestamp: message.timestamp || new Date().toISOString()
    });

    // Keep only last 20 messages to avoid huge files
    if (state.conversationHistory.length > 20) {
      state.conversationHistory = state.conversationHistory.slice(-20);
    }

    await this.save(sessionId, state);
  }

  /**
   * Update design state data
   */
  async updateDesignState(sessionId: string, updates: Partial<DesignState['designState']>): Promise<void> {
    const state = await this.load(sessionId);
    if (!state) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    state.designState = {
      ...state.designState,
      ...updates
    };
    state.timestamp = new Date().toISOString();

    await this.save(sessionId, state);
  }

  /**
   * Delete a session
   */
  async deleteSession(sessionId: string): Promise<void> {
    try {
      const filePath = this.getSessionPath(sessionId);
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
        console.log('[StateManager] Deleted session:', sessionId);
      }
    } catch (error) {
      console.error('[StateManager] Error deleting session:', error);
      throw new Error(`Failed to delete session: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * List all sessions
   */
  async listSessions(): Promise<Array<{ sessionId: string; timestamp: string }>> {
    try {
      const files = await fs.promises.readdir(this.sessionDir);
      const sessions = [];

      for (const file of files) {
        if (file.endsWith('.json')) {
          const state = await this.load(file.replace('.json', ''));
          if (state) {
            sessions.push({
              sessionId: state.sessionId,
              timestamp: state.timestamp
            });
          }
        }
      }

      // Sort by timestamp (newest first)
      sessions.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      return sessions;
    } catch (error) {
      console.error('[StateManager] Error listing sessions:', error);
      return [];
    }
  }

  /**
   * Get conversation history for a session
   */
  async getConversationHistory(sessionId: string): Promise<Message[]> {
    const state = await this.load(sessionId);
    return state?.conversationHistory || [];
  }

  /**
   * Get total token usage estimate (simple count)
   */
  async getTokenEstimate(sessionId: string): Promise<number> {
    const state = await this.load(sessionId);
    if (!state) return 0;

    // Very rough estimate: ~4 chars = 1 token
    const conversationText = state.conversationHistory
      .map(m => m.content)
      .join('')
      .length;

    const stateText = JSON.stringify(state.designState).length;

    return Math.ceil((conversationText + stateText) / 4);
  }

  /**
   * Clean up old sessions (older than days)
   */
  async cleanupOldSessions(olderThanDays: number = 7): Promise<number> {
    try {
      const sessions = await this.listSessions();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      let deleted = 0;
      for (const session of sessions) {
        if (new Date(session.timestamp) < cutoffDate) {
          await this.deleteSession(session.sessionId);
          deleted++;
        }
      }

      if (deleted > 0) {
        console.log('[StateManager] Cleaned up', deleted, 'old sessions');
      }

      return deleted;
    } catch (error) {
      console.error('[StateManager] Error during cleanup:', error);
      return 0;
    }
  }

  /**
   * Get file path for session
   */
  private getSessionPath(sessionId: string): string {
    return path.join(this.sessionDir, `${sessionId}.json`);
  }

  /**
   * Get directory info
   */
  getDirectoryInfo(): {
    sessionDir: string;
    exists: boolean;
  } {
    return {
      sessionDir: this.sessionDir,
      exists: fs.existsSync(this.sessionDir)
    };
  }
}

export default StateManager;
