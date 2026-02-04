// Main Entry Point - New Module Architecture
// Thay thế code.ts với PluginClient orchestrator

import { PluginClient } from './core/plugin-client';
import { UI_CONFIG } from './core/config';

// Show UI first before creating client (từ lines 1829-1830 trong code.ts)
figma.showUI(__html__, {
  width: UI_CONFIG.width,
  height: UI_CONFIG.height,
  title: UI_CONFIG.title
});

// Initialize plugin với module architecture
console.log('[Figma Plugin] Starting MCP Controller Plugin with Module Architecture...');

// Create main plugin client thay vì FigmaHttpClient
const pluginClient = new PluginClient();

// Export for debugging (optional)
(globalThis as any).pluginClient = pluginClient;

// Handle UI messages for Figma token management
figma.ui.onmessage = async (msg) => {
  if (msg.type === 'figma-token') {
    // Save token to clientStorage
    try {
      await figma.clientStorage.setAsync('figma-token', msg.token);
      console.log('[Figma Plugin] Saved Figma API token');
    } catch (error) {
      console.error('[Figma Plugin] Failed to save token:', error);
    }

  } else if (msg.type === 'clear-token') {
    // Clear token from clientStorage
    try {
      await figma.clientStorage.deleteAsync('figma-token');
      console.log('[Figma Plugin] Cleared Figma API token');
    } catch (error) {
      console.error('[Figma Plugin] Failed to clear token:', error);
    }

  } else if (msg.type === 'test-api') {
    // Test Figma API with stored token
    try {
      const token = await figma.clientStorage.getAsync('figma-token');
      if (!token) {
        figma.ui.postMessage({
          type: 'api-test-result',
          payload: {
            operation: msg.operation,
            success: false,
            error: 'No token found'
          }
        });
        return;
      }

      // Test API call based on operation
      if (msg.operation === 'getUserTeams') {
        const response = await fetch('https://api.figma.com/v1/teams', {
          headers: { 'X-Figma-Token': token }
        });

        if (response.ok) {
          const data = await response.json();
          figma.ui.postMessage({
            type: 'api-test-result',
            payload: {
              operation: msg.operation,
              success: true,
              data: data
            }
          });
        } else {
          figma.ui.postMessage({
            type: 'api-test-result',
            payload: {
              operation: msg.operation,
              success: false,
              error: `HTTP ${response.status}: ${response.statusText}`
            }
          });
        }
      }
    } catch (error) {
      figma.ui.postMessage({
        type: 'api-test-result',
        payload: {
          operation: msg.operation,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      });
    }
  }
};

// Load saved token on startup
(async () => {
  try {
    const savedToken = await figma.clientStorage.getAsync('figma-token');
    if (savedToken) {
      figma.ui.postMessage({
        type: 'token-loaded',
        payload: {
          hasToken: true,
          token: savedToken
        }
      });
    }
  } catch (error) {
    console.error('[Figma Plugin] Failed to load saved token:', error);
  }
})();