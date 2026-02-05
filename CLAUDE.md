# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Tổng quan dự án

Đây là hệ thống MCP (Model Context Protocol) Server cho phép Claude tương tác và điều khiển Figma Desktop thông qua HTTP REST API. Hệ thống bao gồm:

- **MCP Server**: Cung cấp tools cho Claude để tương tác với Figma
- **HTTP Server**: Bridge giữa MCP và Figma Plugin
- **Figma Plugin**: Thực thi các lệnh trên Figma Canvas

## Commands thường dùng

### Build và Development
```bash
# Build toàn bộ dự án
npm run build

# Build riêng Figma Plugin
npm run build:plugin

# Chạy HTTP Server (development)
npm run dev:http

# Chạy MCP Server (development)
npm run dev:mcp

# Chạy cả hai server cùng lúc
npm run dev:all

# Chạy production
npm start                  # MCP Server
npm run start:http        # HTTP Server

# Clean build artifacts
npm run clean
```

### Plugin Development
```bash
cd plugin
npm install
npm run build
npm run dev              # Watch mode
```

### Testing hệ thống
```bash
# Test HTTP Server health
curl http://localhost:8765/health

# Test Figma connection
curl http://localhost:8765/figma/ping
```

## Kiến trúc hệ thống

### Luồng hoạt động chính
```
Claude → MCP Server → HTTP API → HTTP Server → Figma Plugin → Figma Canvas
```

### Các thành phần core

**MCP Server** (`src/index.ts`, `src/server.ts`)
- Entry point chính của MCP Server
- Xử lý giao tiếp với Claude thông qua MCP protocol
- Chuyển đổi tool calls thành HTTP requests

**HTTP Server** (`src/http-server.ts`, `src/start-http.ts`)
- REST API server chạy trên port 8765
- Bridge layer giữa MCP và Figma Plugin
- Quản lý polling/response giữa client và plugin

**Tools System** (`src/tools/`)
- `index.ts`: Main FigmaTools class với New API
- `categories/`: Categorized tools (node-creation, node-modification, style-modification, text-operations)
- `schemas/`: Zod validation schemas theo từng category
- `types.ts`: TypeScript types cho tool system

**HTTP Client** (`src/utils/http-client.ts`)
- Wrapper cho việc gửi requests tới HTTP Server
- Xử lý timeout và error handling

**Figma Plugin** (`plugin/`)
- `src/code.ts`: Logic chính của plugin, HTTP polling
- `manifest.json`: Cấu hình plugin
- `dist/`: Build output cho Figma

### MCP Tools có sẵn

Hệ thống đã được refactor hoàn toàn sang **New API (Categorized Tools Architecture)**:

**Node Creation Tools** (`src/tools/categories/node-creation.ts`)
- `createFrame`: Tạo frame container
- `createRectangle`: Tạo hình chữ nhật
- `createEllipse`: Tạo hình ellipse
- `createText`: Tạo text element

**Node Modification Tools** (`src/tools/categories/node-modification.ts`)
- `setPosition`: Thay đổi vị trí node
- `resize`: Thay đổi kích thước node
- `setName`: Đặt tên cho node
- `setVisible`: Hiện/ẩn node

**Style Modification Tools** (`src/tools/categories/style-modification.ts`)
- Các tools để chỉnh sửa styling (fills, strokes, effects)

**Text Operations Tools** (`src/tools/categories/text-operations.ts`)
- Các operations đặc biệt cho text elements

**Figma API Tools** (`src/tools/categories/figma-api.ts`)
- `setFigmaToken`: Quản lý Figma access token
- `getFigmaFile`: Lấy thông tin file từ Figma REST API
- `getNodeChildren`: Lấy children của một node
- Direct REST API calls với token management

## Cấu hình quan trọng

### TypeScript Configuration
- Target: ES2022 với ESNext modules
- Strict mode enabled
- Output: `dist/` directory
- Source maps và declarations enabled

### Claude Desktop Integration
File `config/claude_desktop_config.json` chứa cấu hình để tích hợp với Claude Desktop. Entry point hiện tại đã được cấu hình chính xác tới `dist/index.js`.

**Setup cho Claude Desktop:**
- **Windows:** Copy config tới `%APPDATA%\Claude\claude_desktop_config.json`
- **macOS:** Copy config tới `~/Library/Application Support/Claude/claude_desktop_config.json`
- Update đường dẫn absolute trong config file phù hợp với system

### Figma Plugin
Plugin yêu cầu network access cho HTTP polling. Configured trong `plugin/manifest.json`.

## Setup hệ thống hoàn chỉnh

### Prerequisites và Installation
```bash
# Cài đặt dependencies cho main project
npm install

# Cài đặt dependencies cho plugin
cd plugin && npm install && cd ..
```

### Build và Deploy
```bash
# Build toàn bộ system
npm run build
npm run build:plugin
```

### Chạy Development Environment
```bash
# Start cả HTTP Server và MCP Server
npm run dev:all

# Hoặc chạy riêng lẻ trong terminals khác nhau
npm run dev:http    # Terminal 1
npm run dev:mcp     # Terminal 2
```

### Cài đặt Figma Plugin
1. Mở Figma Desktop
2. Vào Plugins → Development → Import plugin from manifest
3. Chọn `plugin/manifest.json`
4. Chạy plugin và kết nối tới HTTP Server

### Verification Commands
```bash
# Kiểm tra HTTP Server
curl http://localhost:8765/health

# Kiểm tra Figma connection
curl http://localhost:8765/figma/ping
```

## Patterns và Conventions

### Tool Architecture
- **Category-based Organization**: Tools được tổ chức trong `src/tools/categories/` theo từng nhóm chức năng
- **Zod Schema Validation**: End-to-end type safety với schemas trong `src/tools/schemas/`
- **Automatic JSON Schema Generation**: Zod schemas được convert tự động sang MCP JSON Schema
- **Single API Path**: Đã migration hoàn toàn từ legacy tools sang New API
- **Centralized Tool Registration**: All tools được export thông qua `src/tools/categories/index.ts`

### Error Handling
- MCP Server sử dụng structured error responses
- HTTP Server có health check endpoints
- Plugin có reconnection logic với backoff
- Comprehensive error handling cho New API

### HTTP API Design
RESTful endpoints với consistent naming:
- `/health`, `/figma/ping`: Health checks
- `/figma/command`: Execute commands
- `/figma/commands`: Poll for commands (Plugin)
- `/figma/response`: Submit responses (Plugin)

### Development vs Production
- **Development**: Watch mode với hot reload using `tsx`
- **Production**: Compiled JavaScript từ `dist/` directory
- **Environment variables**: Sử dụng `NODE_ENV=production` cho Claude Desktop integration
- **Module System**: ESNext modules với Node.js resolution
- **Build Pipeline**: TypeScript → JavaScript với source maps và type declarations

## Troubleshooting thường gặp

### HTTP connection refused
- Đảm bảo HTTP Server đang chạy: `npm run dev:http`
- Kiểm tra port 8765 không bị conflict

### Plugin không load được
- Kiểm tra `plugin/dist/code.js` đã được build
- Restart Figma Desktop và reload plugin

### MCP Server không kết nối
- Kiểm tra đường dẫn trong `claude_desktop_config.json`
- Đảm bảo `dist/index.js` đã được build: `npm run build`

### Commands không hoạt động
- Cần cả 3 thành phần chạy: HTTP Server, MCP Server, Figma Plugin
- Test HTTP endpoints để isolate issues

### Tool Debugging
- Tất cả tools sử dụng New API thông qua `executeNewTool()` trong `FigmaTools` class
- Tools được organize theo categories trong `src/tools/categories/`
- Schema validation errors sẽ hiển thị detailed field-level errors
- HTTP client có comprehensive error handling và timeout management
- Sử dụng console logs trong MCP Server và Plugin để trace execution flow

### Adding New Tools
1. Tạo Zod schema trong `src/tools/schemas/[category]-schemas.ts`
2. Implement tool handler trong `src/tools/categories/[category].ts`
3. Export tool từ category và add vào `allTools` array
4. Test tool với Claude Desktop hoặc test harness
5. Update documentation nếu cần

### Key File Locations
- **Main entry**: `src/index.ts`
- **MCP Server**: `src/server.ts` (FigmaMCPServer class)
- **HTTP Bridge**: `src/http-server.ts` (FigmaHttpServer), `src/start-http.ts`
- **Tool System**: `src/tools/index.ts` (FigmaTools class)
- **Tool Categories**: `src/tools/categories/` (node-creation, node-modification, style-modification, text-operations, figma-api)
- **Schemas**: `src/tools/schemas/` (Zod validation schemas)
- **HTTP Client**: `src/utils/http-client.ts`
- **Plugin Code**: `plugin/src/code.ts`
- **Plugin Manifest**: `plugin/manifest.json`
- **Claude Config**: `config/claude_desktop_config.json`

### Architecture Dependencies
- **MCP Protocol**: `@modelcontextprotocol/sdk` cho MCP server implementation
- **HTTP Layer**: Express.js server với CORS và Axios client
- **Validation**: Zod schemas với automatic JSON Schema generation
- **Build Tools**: TypeScript compiler cho main project, Webpack cho plugin
- **Development**: tsx cho watch mode, concurrently cho parallel processes