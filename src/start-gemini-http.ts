/**
 * Start Unified HTTP Server
 * Combines Gemini API + Figma Plugin communication in single server
 * Port 8765: Serves both Gemini chat API and Figma plugin endpoints
 */

import 'dotenv/config';
import UnifiedHttpServer from './unified-http-server.js';
import GeminiClient from './gemini/client.js';
import StateManager from './gemini/state-manager.js';
import FigmaTools from './tools/index.js';
import HttpClient from './utils/http-client.js';

async function startServer() {
  try {
    // Validate required environment variables
    const geminiApiKey = process.env.GOOGLE_GEMINI_API_KEY;
    if (!geminiApiKey) {
      console.error('❌ GOOGLE_GEMINI_API_KEY is not set in .env');
      console.error('Please copy .env.example to .env and add your Gemini API key');
      console.error('Get your key from: https://ai.google.dev/');
      process.exit(1);
    }

    const httpPort = parseInt(process.env.HTTP_PORT || '8765', 10);
    const dataDir = process.env.DATA_DIR || './data';

    console.log('🚀 Starting Gemini HTTP Server...');
    console.log(`📍 Port: ${httpPort}`);
    console.log(`📁 Data directory: ${dataDir}`);

    // Initialize Gemini client
    console.log('🔌 Initializing Gemini client...');
    const geminiClient = new GeminiClient(geminiApiKey, process.env.GEMINI_MODEL || 'gemini-2.0-flash');
    
    // Test connection (non-blocking)
    try {
      const isConnected = await geminiClient.testConnection();
      if (isConnected) {
        console.log('✅ Gemini connection verified');
      } else {
        console.warn('⚠️  Could not verify Gemini connection, but proceeding...');
      }
    } catch (error: any) {
      if (error.status === 429) {
        console.warn('⚠️  Gemini API quota exceeded (rate limit). Will work after reset.');
      } else {
        console.warn('⚠️  Could not verify Gemini connection, but proceeding...');
      }
    }

    // Initialize state manager
    console.log('💾 Initializing state manager...');
    const stateManager = new StateManager(dataDir);

    // Initialize HTTP client for Figma Plugin communication
    const httpClient = new HttpClient(`http://localhost:${httpPort}`);

    // Initialize tools
    console.log('🛠️  Initializing Figma tools...');
    const figmaTools = new FigmaTools(httpClient);

    // Create unified HTTP server
    console.log('🌐 Creating unified HTTP server...');
    const unifiedServer = new UnifiedHttpServer(httpPort);

    // Initialize all routes (Gemini API + Figma Plugin endpoints)
    console.log('📡 Initializing all server routes...');
    await unifiedServer.initialize(geminiClient, stateManager, figmaTools);

    // Start the unified server
    console.log('🚀 Starting unified HTTP server...');
    await unifiedServer.start();

    // Graceful shutdown
    const shutdown = async () => {
      console.log('\n🛑 Shutting down gracefully...');
      await unifiedServer.stop();
      process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);

  } catch (error) {
    console.error('❌ Fatal error:', error);
    console.error(error instanceof Error ? error.stack : error);
    process.exit(1);
  }
}

// Start server
startServer();
