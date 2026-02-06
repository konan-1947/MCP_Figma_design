# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Tổng quan dự án

Đây là hệ thống tích hợp Figma Design Assistant với Gemini AI. Dự án bao gồm nhiều thành phần:

- **Unified HTTP Server**: Server chính chạy cả Gemini API và Figma Plugin endpoints
- **Gemini Integration**: Chat API sử dụng Google Gemini AI để tạo design actions
- **Web UI**: React frontend để tương tác với Gemini chat
- **Electron App**: Desktop wrapper cho toàn bộ ứng dụng
- **Figma Plugin**: Thực thi các lệnh design trên Figma Canvas
- **MCP Compatibility**: Hỗ trợ tương tác qua Claude Desktop (legacy)

## Commands thường dùng

### Build và Development
```bash
# Build toàn bộ dự án (TypeScript + Web + Plugin)
npm run build

# Build riêng các thành phần
npm run build:web       # Build React web UI
npm run build:plugin    # Build Figma Plugin

# Development modes
npm run dev             # Start Unified HTTP Server (Gemini + Figma endpoints)
npm run dev:unified     # Alias for dev
npm run dev:web         # Start React development server
npm run dev:electron    # Start full Electron app với hot reload

# Start Electron app với tất cả services
npm run dev:all-app

# Production mode
npm start               # Start Unified HTTP Server
npm run package         # Build và package Electron app

# Clean build artifacts
npm run clean
```

### Plugin Development
```bash
cd plugin
npm install
npm run build
npm run dev              # Watch mode cho plugin
```

### Web UI Development
```bash
cd web
npm install
npm run dev             # Vite dev server (port 5173)
npm run build           # Build for production
npm run lint            # ESLint check
```

### Testing hệ thống
```bash
# Test Unified Server health
curl http://localhost:8765/health

# Test Figma Plugin connection
curl http://localhost:8765/figma/ping

# Test Gemini API connection
curl -X POST http://localhost:8765/api/debug/test-gemini
```

## Kiến trúc hệ thống

### Luồng hoạt động chính
```
User → Web UI → Unified HTTP Server → Gemini AI → Figma Tools → Figma Plugin → Figma Canvas
                        ↓
                   Session State Management

Legacy MCP Support:
Claude Desktop → MCP Server → HTTP API → Unified Server → Figma Plugin
```

### Entry Points
- **Main Entry**: `src/start-gemini-http.ts` - Khởi tạo Unified HTTP Server
- **Electron Entry**: `dist-electron/main.js` (built từ TypeScript)
- **Web UI Entry**: `web/src/main.tsx` (React app)
- **Plugin Entry**: `plugin/src/index.ts` (Figma Plugin)

### Các thành phần core

**Unified HTTP Server** (`src/unified-http-server.ts`, `src/start-gemini-http.ts`)
- Server chính chạy trên port 8765
- Kết hợp Gemini Chat API và Figma Plugin endpoints
- Client management và command queue cho Figma Plugin
- Token management cho Figma API

**Gemini Integration** (`src/gemini/`)
- `client.ts`: Google Gemini AI client wrapper
- `http-routes.ts`: Express routes cho chat API và session management
- `state-manager.ts`: Quản lý session state và conversation history
- `prompt-builder.ts`: Xây dựng prompts từ user input và context
- `system-prompt.ts`: System prompt cho Gemini AI

**Tools System** (`src/tools/`)
- `index.ts`: Main FigmaTools class với categorized tool execution
- `categories/`: Tools được tổ chức theo nhóm chức năng
  - `node-creation.ts`: Tạo frames, rectangles, ellipses, text
  - `node-modification.ts`: Positioning, resizing, visibility, naming
  - `style-modification.ts`: Colors, effects, styling
  - `text-operations.ts`: Text formatting và content
  - `figma-api.ts`: Direct Figma REST API calls
- `schemas/`: Zod validation schemas cho từng category
- `types.ts`: TypeScript types định nghĩa tool interfaces

**Web UI** (`web/`)
- `src/App.tsx`: Main React component với chat interface
- `src/App.css`: Styling cho chat UI
- Tương tác với Unified Server qua `/api/chat` endpoints

**Figma Plugin** (`plugin/src/`)
- `index.ts`: Entry point chính của plugin
- `core/plugin-client.ts`: Main plugin logic và HTTP polling
- `commands/`: Command handling system
  - `command-dispatcher.ts`: Route commands tới appropriate handlers
  - `handlers/`: Specific handlers cho từng tool category
- `connection/`: HTTP communication với Unified Server
- `utilities/`: Helper functions cho color, paint conversion

### Figma Tools System

Hệ thống tools được tổ chức theo **Categorized Architecture** với validation và type safety đầy đủ:

**Node Creation Tools** (`src/tools/categories/node-creation.ts`)
- `createFrame`: Tạo frame containers với position/size
- `createRectangle`: Tạo rectangle shapes với styling
- `createEllipse`: Tạo ellipse/circle shapes
- `createText`: Tạo text elements với content và formatting
- Support cho multiple node creation trong một lần call

**Node Modification Tools** (`src/tools/categories/node-modification.ts`)
- `setPosition`: Di chuyển nodes tới vị trí mới
- `resize`: Thay đổi width/height của nodes
- `setName`: Đặt tên layer cho nodes
- `setVisible`: Toggle visibility của nodes
- `setOpacity`, `setLocked`, `setBlendMode`, `setRotation`: Advanced properties

**Style Modification Tools** (`src/tools/categories/style-modification.ts`)
- Fill operations: solid colors, gradients, image fills
- Stroke operations: colors, weights, styles
- Effect operations: shadows, blurs, glows
- Corner radius và advanced styling properties

**Text Operations Tools** (`src/tools/categories/text-operations.ts`)
- Text content modification
- Font family, size, weight, style changes
- Text alignment và spacing
- Color và styling cho text elements

**Figma API Tools** (`src/tools/categories/figma-api.ts`)
- `setFigmaToken`: Cài đặt Figma Personal Access Token
- `getFigmaFile`: Lấy file metadata từ Figma REST API
- `getNodeChildren`: Traverse node hierarchy
- Direct API integration với authentication

## Cấu hình quan trọng

### Environment Variables (.env)
```bash
# Required
GOOGLE_GEMINI_API_KEY=your_gemini_api_key_here

# Optional
GEMINI_MODEL=gemini-2.0-flash        # Default model
HTTP_PORT=8765                       # Server port
DATA_DIR=./data                      # Session storage directory
```

### Ports và Services
- **8765**: Unified HTTP Server (Gemini API + Figma endpoints)
- **5173**: Web UI development server (Vite)
- **Electron**: Wraps web UI và unified server

### TypeScript Configuration
- Target: ES2022 với ESM modules
- Strict mode enabled cho type safety
- Build outputs: `dist/` (main), `dist-web/` (web), `dist-electron/` (electron)
- Separate configs cho main project, web UI, và plugin

### Claude Desktop Integration (Legacy)
File `config/claude_desktop_config.json` để tích hợp với Claude Desktop qua MCP.
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`
- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`

### Electron Configuration
- Main process: `dist-electron/main.js`
- Renderer: Web UI tại `dist-web/`
- Auto-start unified server khi launch
- Windows installer configuration với NSIS

## Setup hệ thống hoàn chỉnh

### Prerequisites và Installation
```bash
# Cài đặt dependencies cho main project
npm install

# Cài đặt dependencies cho web UI và plugin
cd web && npm install && cd ..
cd plugin && npm install && cd ..
```

### Environment Setup
```bash
# Tạo .env file từ template
cp .env.example .env
# Thêm GOOGLE_GEMINI_API_KEY vào .env file
```

### Build và Deploy
```bash
# Build tất cả components
npm run build           # TypeScript main
npm run build:web       # React web UI
npm run build:plugin    # Figma plugin

# Hoặc build Electron app hoàn chỉnh
npm run package
```

### Development Workflow
```bash
# Phát triển fullstack với Electron
npm run dev:all-app     # Starts: Unified Server + Web UI + Electron

# Hoặc phát triển riêng biệt
npm run dev            # Terminal 1: Unified HTTP Server
npm run dev:web        # Terminal 2: Web UI dev server

# Plugin development (riêng biệt)
cd plugin && npm run dev
```

### Cài đặt Figma Plugin
1. Mở Figma Desktop
2. Vào Plugins → Development → Import plugin from manifest
3. Chọn `plugin/manifest.json`
4. Chạy plugin để connect tới HTTP Server (port 8765)

### Verification Commands
```bash
# Test server health
curl http://localhost:8765/health

# Test Figma plugin connectivity
curl http://localhost:8765/figma/ping

# Test Gemini AI connection
curl -X POST http://localhost:8765/api/debug/test-gemini

# Check if Web UI is running
curl http://localhost:5173  # Development
# hoặc check Electron app UI
```

## Patterns và Conventions

### Tool Architecture
- **Category-based Organization**: Tools trong `src/tools/categories/` theo chức năng
- **Zod Schema Validation**: Type safety từ input tới execution
- **Automatic JSON Schema Generation**: Zod schemas → MCP JSON schemas
- **Unified Tool Execution**: Tất cả tools đi qua `FigmaTools.executeNewTool()`
- **Dependency Sorting**: Actions được sắp xếp theo thứ tự (creation → modification)

### Gemini Integration Patterns
- **Session-based**: Mỗi conversation có unique session ID
- **Context Preservation**: Conversation history và design state được lưu trữ
- **Action Generation**: Gemini AI tạo structured actions từ natural language
- **Tool Mapping**: Gemini actions được map trực tiếp tới Figma tools

### API Architecture
**Core Endpoints:**
- `/health`, `/figma/ping`: Health checks
- `/figma/register`: Client registration (MCP/Plugin/UI)
- `/figma/command`: Execute commands từ tools

**Gemini Chat Endpoints:**
- `/api/session/create`: Tạo chat session mới
- `/api/session/:id`: Get/delete session
- `/api/chat`: Send message và receive actions
- `/api/tools`: List available tools cho UI

**Figma Plugin Endpoints:**
- `/figma/commands`: Plugin polls cho pending commands
- `/figma/response`: Plugin submit execution results
- `/figma/token/*`: Figma access token management

### Development vs Production
- **Development**: Multi-process với hot reload
  - `tsx --watch` cho TypeScript
  - Vite cho web UI
  - Webpack watch cho plugin
- **Production**: Pre-compiled binaries
- **Electron**: Desktop app wrapper với auto-startup
- **Module System**: Full ESM với proper Node.js resolution

## Troubleshooting thường gặp

### Gemini API Issues
```bash
# Check API key configuration
cat .env | grep GOOGLE_GEMINI_API_KEY

# Test connection
curl -X POST http://localhost:8765/api/debug/test-gemini
```

### Server không khởi động
- Kiểm tra environment variables trong `.env`
- Port 8765 có thể bị conflict: `netstat -an | grep 8765`
- Check logs để thấy missing dependencies

### Plugin không kết nối
- Đảm bảo plugin được build: `cd plugin && npm run build`
- Restart Figma Desktop sau khi update plugin
- Check plugin console cho connection errors
- Verify HTTP server đang chạy: `curl http://localhost:8765/figma/ping`

### Web UI không load
- Check Vite dev server: `cd web && npm run dev`
- Đảm bảo dependencies installed: `cd web && npm install`
- Clear browser cache nếu có stale assets

### Electron App Issues
- Build tất cả components trước: `npm run build && npm run build:web`
- Check Electron logs trong terminal
- Verify unified server start successful

### Session và Chat Issues
- Sessions được lưu trong `./data` directory
- Check session files có corrupt không
- Clear sessions: `rm -rf ./data/sessions/*`
- Verify Gemini model accessibility

### Tool Execution Errors
- All tools đi qua `FigmaTools.executeNewTool()`
- Schema validation errors chi tiết trong console
- Check Figma Plugin connection status
- Tools dependency order: creation → modification → others

### Development Debugging
```bash
# Enable verbose logging
DEBUG=* npm run dev

# Check component health individually
curl http://localhost:8765/health     # Unified server
curl http://localhost:5173            # Web UI
curl http://localhost:8765/figma/ping # Plugin bridge
```

### Key File Locations
- **Unified Server**: `src/unified-http-server.ts`, `src/start-gemini-http.ts`
- **Gemini Integration**: `src/gemini/` (client, routes, state-manager)
- **Tool System**: `src/tools/index.ts` (FigmaTools class)
- **Web UI**: `web/src/App.tsx` (React chat interface)
- **Plugin Core**: `plugin/src/core/plugin-client.ts`
- **Electron Main**: Built từ TypeScript sang `dist-electron/main.js`
- **Environment Config**: `.env`, `.env.example`

### Architecture Dependencies
- **Gemini AI**: `@google/generative-ai` cho chat integration
- **React Stack**: Vite + React 19 cho web UI
- **Electron**: Desktop app wrapper với builder
- **Express**: HTTP server với CORS, session management
- **Build Pipeline**: TypeScript → JavaScript với multiple targets
- **Plugin System**: Modular command handlers với HTTP polling