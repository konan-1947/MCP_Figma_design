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

# Build riêng MCP Server
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

Hệ thống sử dụng **New API (Categorized Tools)**:
- `node-creation`: `createFrame`, `createRectangle`, `createEllipse`, `createText`
- `node-modification`: `setPosition`, `resize`, `setName`, `setVisible`
- `style-modification`: Các tools chỉnh sửa style
- `text-operations`: Các operations với text

## Cấu hình quan trọng

### TypeScript Configuration
- Target: ES2022 với ESNext modules
- Strict mode enabled
- Output: `dist/` directory
- Source maps và declarations enabled

### Claude Desktop Integration
File `config/claude_desktop_config.json` chứa cấu hình để tích hợp với Claude Desktop. Path cần được update theo môi trường thực tế.

### Figma Plugin
Plugin yêu cầu network access cho HTTP polling. Configured trong `plugin/manifest.json`.

## Patterns và Conventions

### Tool Architecture
- **Category-based Organization**: Tools được nhóm theo chức năng (node-creation, node-modification, etc.)
- **Zod Schema Validation**: End-to-end type safety với automatic JSON Schema conversion
- **Single API Path**: Simplified architecture với chỉ New API

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
- Development: Watch mode với hot reload
- Production: Compiled JavaScript từ `dist/`
- Environment variables qua `NODE_ENV`

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
- Tất cả tools sử dụng New API trong `categories/` và `executeNewTool()`
- Kiểm tra tool categories và naming khi debug
- Sử dụng console logs để trace tool execution