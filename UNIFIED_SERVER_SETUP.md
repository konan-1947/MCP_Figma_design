# Unified HTTP Server Setup

## Tổng Quan
Tất cả HTTP endpoints (Gemini API + Figma Plugin) giờ được combine vào **1 unified server** trên port 8765.

### Trước đây (2 servers độc lập):
```
❌ FigmaHttpServer (start-http.ts) - /figma/commands, /figma/response
❌ GeminiHttpServer (start-gemini-http.ts) - /api/chat, /api/session
```

### Bây giờ (1 unified server):
```
✅ UnifiedHttpServer (unified-http-server.ts)
   ├─ Gemini API: /api/chat, /api/session, /api/tools
   ├─ Figma Plugin: /figma/commands, /figma/response, /figma/keepalive
   └─ Token Management: /figma/token/set, /figma/token/get, /figma/token/validate
```

## Chạy Ứng Dụng

### 1. Build Project
```bash
npm run build          # Build main + web
npm run build:plugin   # Build Figma plugin
```

### 2. Cài Đặt Figma Plugin
- Mở **Figma Desktop**
- **Plugins** → **Development** → **Import plugin from manifest**
- Chọn `plugin/manifest.json`

### 3. Chạy Development Environment

**Option A: Chỉ server (development)**
```bash
npm run dev:unified
```
Khởi động Unified HTTP Server trên port 8765.

**Option B: Toàn bộ app (Electron + React + Server)**
```bash
npm run dev:all-app
```
Tự động:
- Khởi động Unified HTTP Server (port 8765)
- Khởi động Vite dev server (port 5173)
- Mở Electron window
- Tự động reload khi code thay đổi

**Option C: React UI riêng**
```bash
npm run dev:web
```
Chạy Vite dev server trên port 5173.

### 4. Cách Sử Dụng
1. Mở **Electron window** hoặc truy cập `http://localhost:5173`
2. **Figma Desktop** → Plugins → Chạy **Figma MCP Controller**
3. Gõ message vào chat trong UI
4. Gemini sẽ generate design actions → Plugin thực thi trên Figma

## Kiểm Tra Kết Nối

### Health Check
```bash
curl http://localhost:8765/health
```

### Figma Plugin Status
```bash
curl http://localhost:8765/figma/status
```

### Test Gemini Connection
```bash
curl -X POST http://localhost:8765/api/debug/test-gemini
```

## Endpoints Documentation

### Core
- `GET /health` - Health check
- `GET /figma/ping` - Ping test
- `POST /figma/register` - Register client
- `GET /figma/status` - Connection status

### Figma Plugin Communication
- `GET /figma/commands` - Plugin polls for commands
- `POST /figma/response` - Plugin sends response
- `POST /figma/keepalive` - Keep connection alive
- `POST /figma/command` - Execute command (from MCP/Gemini)

### Figma Token Management
- `POST /figma/token/set` - Set access token
- `GET /figma/token/get` - Get access token
- `POST /figma/token/clear` - Clear token
- `POST /figma/token/validate` - Validate token

### Gemini API
- `POST /api/session/create` - Create new session
- `GET /api/session/:sessionId` - Get session details
- `DELETE /api/session/:sessionId` - Delete session
- `GET /api/sessions` - List all sessions
- `POST /api/chat` - Send chat message (Gemini generates actions)
- `GET /api/tools` - List available tools
- `POST /api/debug/test-gemini` - Test Gemini connection

## Architecture Flow

```
React UI                 Figma Desktop
  │                           │
  ├─ POST /api/chat           ├─ GET /figma/commands (polling)
  │                           │
  ▼                           ▼
┌─────────────────────────────────────────┐
│   UnifiedHttpServer (Port 8765)         │
├─────────────────────────────────────────┤
│ • GeminiClient                          │
│ • StateManager (sessions)               │
│ • FigmaTools (action execution)         │
│ • HttpClient (Figma Plugin bridge)      │
└─────────────────────────────────────────┘
  │                           │
  ├─ Call Gemini API          ├─ POST /figma/response
  │                           │
  ▼                           ▼
Gemini Cloud              Figma Canvas
(AI Generation)          (Design Rendering)
```

## Troubleshooting

### "Polling error: Not Found"
**Nguyên nhân:** Plugin đang poll endpoint `/figma/commands` nhưng server không có.
**Cách sửa:** Đảm bảo UnifiedHttpServer đang chạy và có endpoint `/figma/commands`.

### Plugin không receive commands
1. Kiểm tra plugin có register chưa:
   ```bash
   curl http://localhost:8765/figma/status
   ```
2. Kiểm tra HTTP Server đang chạy:
   ```bash
   curl http://localhost:8765/health
   ```
3. Mở Figma plugin UI console để xem logs

### Gemini API quota exceeded
- Đợi quota reset (Gemini free tier có giới hạn 1500 requests/day)
- Hoặc nâng cấp Gemini API plan

### Port 8765 đã bị chiếm
```bash
# Tìm process chiếm port
lsof -i :8765        # macOS/Linux
netstat -ano | findstr :8765  # Windows

# Kill process
kill -9 <PID>         # macOS/Linux
taskkill /PID <PID> /F  # Windows
```

## Environment Variables (.env)

```env
# Google Gemini API
GOOGLE_GEMINI_API_KEY=your_key_here
GEMINI_MODEL=gemini-2.5-flash-lite

# Server
HTTP_PORT=8765
WEB_PORT=3000

# Data
DATA_DIR=./data

# Logging
LOG_LEVEL=info

# Session
SESSION_TIMEOUT_DAYS=7
MAX_HISTORY_MESSAGES=20
```

## Lưu Ý Quan Trọng

1. **Chỉ 1 server**: UnifiedHttpServer thay thế 2 server cũ
2. **Tất cả endpoints**: /api/*, /figma/*, /health trong 1 server
3. **Seamless integration**: Gemini AI → FigmaTools → Figma Plugin đều communicate qua UnifiedHttpServer
4. **CORS enabled**: Cho phép requests từ tất cả origins (safe vì local dev)

## File thay đổi

- ✅ `src/unified-http-server.ts` - New unified server
- ✅ `src/start-gemini-http.ts` - Sử dụng UnifiedHttpServer
- ✅ `package.json` - Updated npm scripts
- ✅ Build thành công ✓
