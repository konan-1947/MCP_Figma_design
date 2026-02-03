# Migration từ WebSocket sang HTTP API

## Tổng quan

Project đã được migration từ kiến trúc WebSocket sang HTTP REST API để đơn giản hóa và tăng tính ổn định.

## Thay đổi chính

### Kiến trúc cũ (WebSocket)
```
Claude → MCP Server → WebSocket Client → Bridge Server → Figma Plugin (WebSocket)
```

### Kiến trúc mới (HTTP)
```
Claude → MCP Server → HTTP Client → HTTP Server → Figma Plugin (HTTP Polling)
```

## Files đã thay đổi

### 1. Thay thế WebSocket Bridge
- **Xóa:** `bridge/server.ts` (WebSocket bridge)
- **Thêm:** `src/http-server.ts` (HTTP server)

### 2. MCP Server Updates
- **Sửa:** `src/server.ts`
  - Thay `WebSocketClient` bằng `HttpClient`
  - Update connection logic
- **Sửa:** `src/tools/index.ts`
  - Thay websocket client bằng http client

### 3. HTTP Client
- **Xóa:** `src/utils/websocket-client.ts`
- **Thêm:** `src/utils/http-client.ts`
  - Axios-based HTTP client
  - Retry mechanism với exponential backoff
  - Connection pooling
  - Keep-alive functionality

### 4. Figma Plugin Updates
- **Sửa:** `plugin/src/code.ts`
  - Thay `FigmaWebSocketClient` bằng `FigmaHttpClient`
  - HTTP polling thay vì WebSocket messages
  - Keep-alive requests

### 5. Dependencies
- **Xóa:** `ws`, `@types/ws`
- **Thêm:** `express`, `cors`, `axios`, `@types/express`, `@types/cors`

### 6. Scripts
- **Thay đổi:** `package.json`
  - `dev:bridge` → `dev:http`
  - `dev:all` giờ chạy HTTP server + MCP server

## API Endpoints mới

### HTTP Server (port 8765)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/figma/ping` | Ping test |
| POST | `/figma/register` | Register client |
| GET | `/figma/status` | Connection status |
| POST | `/figma/command` | Execute command (từ MCP) |
| GET | `/figma/commands` | Poll for commands (Figma plugin) |
| POST | `/figma/response` | Submit response (từ Figma) |
| POST | `/figma/keepalive` | Keep connection alive |

### Client Registration

Mỗi client cần register với server:

```json
POST /figma/register
{
  "clientType": "mcp" | "figma" | "figma-ui",
  "clientId": "optional-existing-id"
}
```

Response:
```json
{
  "success": true,
  "clientId": "client_1234567890_abcdef123",
  "message": "Client registered as mcp"
}
```

## Ưu điểm của HTTP approach

### 1. Đơn giản hơn
- Không cần manage WebSocket connections
- Standard HTTP status codes
- Dễ debug với curl/Postman

### 2. Ổn định hơn
- HTTP có built-in retry mechanisms
- No connection state to manage
- Better error handling

### 3. Scalable
- Stateless design
- Easy to add load balancing
- Better caching opportunities

### 4. Developer friendly
- Standard REST API patterns
- Better logging và monitoring
- Easy integration testing

## Migration process

### 1. Backup old files
- `bridge/` folder (WebSocket bridge)
- `src/utils/websocket-client.ts`

### 2. Update dependencies
```bash
npm uninstall ws @types/ws
npm install express cors axios @types/express @types/cors
```

### 3. Update scripts
```json
{
  "dev:http": "tsx --watch src/http-server.ts",
  "dev:all": "concurrently \"npm run dev:http\" \"npm run dev:mcp\""
}
```

### 4. Start migration
1. Tạo HTTP server
2. Tạo HTTP client
3. Update MCP server
4. Update Figma plugin
5. Testing

## Performance comparison

### WebSocket approach
- **Pros:** Real-time bi-directional communication
- **Cons:** Connection management complexity, reconnection logic

### HTTP approach
- **Pros:** Simplicity, reliability, standard tooling
- **Cons:** Polling overhead (mitigated by efficient 1s polling)

### Polling overhead
- Polling interval: 1 second
- Empty polls are lightweight (~100 bytes)
- Command execution still fast (~same latency)

## Rollback plan

If needed, rollback to WebSocket:

1. Restore `bridge/` folder
2. Restore `src/utils/websocket-client.ts`
3. Revert `src/server.ts` và `src/tools/index.ts`
4. Revert `plugin/src/code.ts`
5. Update dependencies back to WebSocket

## Testing checklist

- [ ] HTTP server starts successfully
- [ ] MCP server connects to HTTP server
- [ ] Figma plugin connects and polls
- [ ] Commands execute end-to-end
- [ ] Error handling works
- [ ] Reconnection logic works
- [ ] Performance is acceptable

## Troubleshooting

### Common issues

1. **Port conflict:** Đảm bảo port 8765 available
2. **CORS errors:** HTTP server có CORS config cho Figma domain
3. **Polling stops:** Check keep-alive và error handling
4. **Command timeout:** HTTP client có retry logic

### Debug commands

```bash
# Test health
curl http://localhost:8765/health

# Test registration
curl -X POST http://localhost:8765/figma/register \
  -H "Content-Type: application/json" \
  -d '{"clientType": "mcp"}'

# Test status
curl http://localhost:8765/figma/status
```