# Figma MCP Controller

Hệ thống điều khiển Figma Desktop thông qua MCP Server, cho phép Claude tạo và chỉnh sửa UI components trực tiếp trên Figma.

## Kiến trúc hệ thống

```
Claude → MCP Server → HTTP API → HTTP Server → Figma Plugin → Figma Canvas
```

**Đã migration từ WebSocket sang HTTP REST API để đơn giản hóa kiến trúc.**

## Cài đặt và chạy

### 1. Cài đặt dependencies

```bash
# Root project
npm install

# Figma Plugin
cd plugin
npm install
cd ..
```

### 2. Build project

```bash
# Build MCP Server
npm run build

# Build Figma Plugin
npm run build:plugin
```

### 3. Chạy hệ thống

**Terminal 1 - HTTP Server:**
```bash
npm run dev:http
```

**Terminal 2 - MCP Server:**
```bash
npm run dev:mcp
```

**Hoặc chạy cả hai cùng lúc:**
```bash
npm run dev:all
```

**Figma Desktop:**
1. Mở Figma Desktop
2. Vào Plugins → Development → Import plugin from manifest
3. Chọn `plugin/manifest.json`
4. Chạy plugin

### 4. Cấu hình Claude Desktop

Copy nội dung `config/claude_desktop_config.json` vào Claude Desktop config:

**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`
**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`

## MCP Tools có sẵn

### 1. `lay_selection`
Lấy thông tin về các element đang được chọn trong Figma.

### 2. `them_text`
Thêm text element vào canvas.
- `noi_dung`: Nội dung text
- `x`, `y`: Vị trí (tùy chọn)
- `font_size`: Kích thước font (tùy chọn)
- `mau_chu`: Màu chữ hex (tùy chọn)

### 3. `tao_man_hinh`
Tạo frame/màn hình mới với header.
- `ten`: Tên frame
- `tieu_de`: Tiêu đề header
- `loai`: "mobile" | "tablet" | "desktop"

### 4. `them_button`
Thêm button component.
- `text`: Text trên button
- `x`, `y`: Vị trí
- `mau_nen`, `mau_chu`: Màu nền và chữ (tùy chọn)
- `width`, `height`: Kích thước (tùy chọn)

### 5. `them_hinh_chu_nhat`
Thêm hình chữ nhật.
- `x`, `y`, `width`, `height`: Vị trí và kích thước
- `mau_nen`: Màu nền
- `border_radius`: Bo góc (tùy chọn)

### 6. `tao_form_login`
Tạo form login template hoàn chỉnh.
- `tieu_de`: Tiêu đề form (tùy chọn)

### 7. `tao_card`
Tạo card component.
- `tieu_de`: Tiêu đề card
- `mo_ta`: Mô tả nội dung
- `hinh_anh_url`: URL hình ảnh (tùy chọn)
- `x`, `y`: Vị trí (tùy chọn)

### 8. `xoa_selection`
Xóa các element đang được chọn.

## Ví dụ sử dụng từ Claude

```
Tạo màn hình mobile tên "Login Screen" với tiêu đề "Đăng nhập"
Thêm text "Welcome" tại vị trí x:100, y:50 với font size 24
Tạo button "Đăng nhập" tại vị trí x:150, y:200 màu xanh
Lấy thông tin về các element đang được chọn
```

## Cấu trúc dự án

```
MCP_Figma_design/
├── src/                    # MCP Server
│   ├── index.ts           # Entry point
│   ├── server.ts          # MCP server chính
│   ├── http-server.ts     # HTTP server thay thế WebSocket bridge
│   ├── tools/             # MCP tools implementation
│   ├── types/             # Type definitions
│   └── utils/             # HTTP client
│       └── http-client.ts # HTTP client implementation
├── plugin/                # Figma Plugin (updated to use HTTP)
│   ├── src/code.ts        # Plugin logic chính (HTTP polling)
│   ├── src/ui.html        # Plugin UI
│   └── manifest.json      # Plugin configuration
├── config/                # Configurations
└── dist/                  # Build output
```

## Troubleshooting

### HTTP connection refused
- Đảm bảo HTTP Server đang chạy: `npm run dev:http`
- Kiểm tra port 8765 không bị conflict
- Test server với: `curl http://localhost:8765/health`

### Plugin không load được
- Kiểm tra `plugin/dist/code.js` đã được build
- Restart Figma Desktop và reload plugin

### MCP Server không kết nối
- Kiểm tra đường dẫn trong `claude_desktop_config.json`
- Đảm bảo `dist/index.js` đã được build: `npm run build`

### Commands không hoạt động
- Kiểm tra cả 3 thành phần đang chạy: HTTP Server, MCP Server, Figma Plugin
- Test HTTP endpoints với curl hoặc Postman
- Xem logs trong Plugin UI để debug

### HTTP API Endpoints
- `GET /health` - Health check
- `GET /figma/ping` - Ping test
- `POST /figma/register` - Register client
- `GET /figma/status` - Connection status
- `POST /figma/command` - Execute command
- `GET /figma/commands` - Poll for commands (Figma)
- `POST /figma/response` - Submit response (Figma)
- `POST /figma/keepalive` - Keep connection alive

## Development

### Hot reload
- MCP Server: `npm run dev:mcp`
- HTTP Server: `npm run dev:http`
- Both servers: `npm run dev:all`
- Figma Plugin: `cd plugin && npm run dev`

### Adding new tools
1. Thêm schema vào `src/tools/schemas.ts`
2. Thêm tool definition vào `src/tools/index.ts`
3. Thêm handler vào `plugin/src/code.ts`
4. Test và rebuild