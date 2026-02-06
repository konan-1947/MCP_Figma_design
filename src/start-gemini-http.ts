/**
 * Start Gemini HTTP Server
 * Runs the HTTP server with Gemini API integration
 * This replaces the MCP approach for standalone desktop app usage
 */

import 'dotenv/config';
import FigmaHttpServer from './http-server.js';
import GeminiClient from './gemini/client.js';
import StateManager from './gemini/state-manager.js';
import FigmaTools from './tools/index.js';
import HttpClient from './utils/http-client.js';
import setupGeminiRoutes from './gemini/http-routes.js';
import express from 'express';
import cors from 'cors';

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

    // Create Express app for Gemini routes
    const app = express();
    
    // Setup Gemini API routes
    console.log('📡 Setting up Gemini API routes...');
    setupGeminiRoutes(app, geminiClient, stateManager, figmaTools);

    // Start HTTP server with Gemini routes integrated
    console.log('🌐 Starting HTTP server with Figma integration...');
    const httpServer = new FigmaHttpServer(httpPort);

    // Mount Gemini routes to the HTTP server's app
    // This is a bit hacky but works - we need to access the app instance
    // For now, we'll create a hybrid approach
    
    // Alternative: Start both servers
    // For simplicity, we'll modify the approach to use just Express

    // Create a combined server
    const combinedApp = express();
    
    // Setup CORS
    combinedApp.use(cors({
      origin: true,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Client-Type', 'X-Client-ID']
    }));

    // JSON parsing
    combinedApp.use(express.json({ limit: '10mb' }));

    // Health check
    combinedApp.get('/health', (req, res) => {
      res.json({
        status: 'ok',
        timestamp: Date.now(),
        server: 'figma-gemini-server',
        version: '1.0.0'
      });
    });

    // Figma Plugin endpoints (from HTTP server)
    combinedApp.post('/figma/register', (req, res) => {
      res.json({ registered: true, clientId: req.body.clientId });
    });

    combinedApp.get('/figma/ping', (req, res) => {
      res.json({ pong: true, timestamp: Date.now() });
    });

    // Mount Gemini routes
    setupGeminiRoutes(combinedApp, geminiClient, stateManager, figmaTools);

    // Start server
    const server = combinedApp.listen(httpPort, () => {
      console.log('');
      console.log('╔════════════════════════════════════════╗');
      console.log('║  ✅ Gemini HTTP Server is Running!    ║');
      console.log(`║  🌐 http://localhost:${httpPort}          ║`);
      console.log('╠════════════════════════════════════════╣');
      console.log('║  Available Endpoints:                   ║');
      console.log('║  - POST   /api/session/create          ║');
      console.log('║  - GET    /api/session/:sessionId      ║');
      console.log('║  - POST   /api/chat                    ║');
      console.log('║  - GET    /api/tools                   ║');
      console.log('║  - GET    /api/sessions                ║');
      console.log('║  - GET    /health                      ║');
      console.log('║  - GET    /figma/ping                  ║');
      console.log('╚════════════════════════════════════════╝');
      console.log('');
    });

    // Graceful shutdown
    const shutdown = async () => {
      console.log('\n🛑 Shutting down gracefully...');
      server.close(() => {
        console.log('✅ Server stopped');
        process.exit(0);
      });
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);

    // Error handling
    server.on('error', (error: any) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${httpPort} is already in use`);
        console.error('Try changing HTTP_PORT in .env or kill the process using the port');
      } else {
        console.error('❌ Server error:', error);
      }
      process.exit(1);
    });

  } catch (error) {
    console.error('❌ Fatal error:', error);
    console.error(error instanceof Error ? error.stack : error);
    process.exit(1);
  }
}

// Start server
startServer();
