#!/usr/bin/env node

import FigmaMCPServer from './server.js';

async function main(): Promise<void> {
  const server = new FigmaMCPServer();

  // Graceful shutdown handlers
  const shutdown = async (signal: string) => {
    console.error(`\n[Main] Received ${signal}, shutting down gracefully...`);
    await server.stop();
    process.exit(0);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  // Handle uncaught errors
  process.on('uncaughtException', (error) => {
    console.error('[Main] Uncaught exception:', error);
    process.exit(1);
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('[Main] Unhandled rejection at:', promise, 'reason:', reason);
    process.exit(1);
  });

  try {
    await server.start();
  } catch (error) {
    console.error('[Main] Failed to start server:', error);
    process.exit(1);
  }
}

// Chạy main function
main().catch((error) => {
  console.error('[Main] Fatal error:', error);
  process.exit(1);
});

export default FigmaMCPServer;