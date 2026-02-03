import { FigmaHttpServer } from './http-server.js';

const server = new FigmaHttpServer();

server.start().catch(error => {
  console.error('[HttpServer] ❌ Failed to start server:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.error('\n[HttpServer] 🛑 Shutting down...');
  await server.stop();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.error('\n[HttpServer] 🛑 Shutting down...');
  await server.stop();
  process.exit(0);
});