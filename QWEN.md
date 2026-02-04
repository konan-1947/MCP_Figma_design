# Figma MCP Controller - Hướng Dẫn Dự Án

## Tổng Quan Dự Án

Figma MCP Controller là một hệ thống điều khiển Figma Desktop thông qua MCP (Model Context Protocol) Server, cho phép Claude (hoặc các ứng dụng khác hỗ trợ MCP) tạo và chỉnh sửa UI components trực tiếp trên Figma. Dự án sử dụng HTTP REST API để giao tiếp giữa các thành phần thay vì WebSocket như trước đây.

## Kiến Trúc Hệ Thống

```
Claude → MCP Server → HTTP API → HTTP Server → Figma Plugin → Figma Canvas
```

Dự án bao gồm ba thành phần chính:
1. **MCP Server** (`src/`): Máy chủ MCP nhận yêu cầu từ Claude và chuyển tiếp đến Figma
2. **HTTP Server** (`src/http-server.ts`): Cầu nối HTTP giữa MCP Server và Figma Plugin
3. **Figma Plugin** (`plugin/`): Plugin Figma thực hiện các lệnh được gửi từ MCP Server

## Cấu Trúc Dự Án

```
MCP_Figma_design/
├── src/                    # MCP Server và HTTP Server
│   ├── index.ts           # Entry point cho MCP Server
│   ├── server.ts          # Triển khai MCP Server chính
│   ├── http-server.ts     # HTTP server làm cầu nối
│   ├── start-http.ts      # Entry point cho HTTP server
│   ├── tools/             # Triển khai các công cụ MCP
│   │   ├── categories/    # Các danh mục công cụ
│   │   ├── schemas/       # Schema cho các công cụ
│   │   └── types.ts       # Định nghĩa kiểu cho công cụ
│   ├── types/             # Định nghĩa kiểu chung
│   └── utils/             # HTTP client
│       └── http-client.ts # Triển khai HTTP client
├── plugin/                # Figma Plugin
│   ├── src/
│   │   ├── code.ts        # Logic chính của plugin (HTTP polling)
│   │   └── ui.html        # Giao diện người dùng của plugin
│   ├── manifest.json      # Cấu hình plugin
│   └── package.json       # Dependencies của plugin
├── config/                # Cấu hình cho Claude Desktop
│   └── claude_desktop_config.json
├── dist/                  # Đầu ra build
└── plan/                  # Tài liệu kế hoạch
```

## Công Nghệ Sử Dụng

- **Ngôn ngữ**: TypeScript
- **Framework**: Node.js
- **Thư viện**: @modelcontextprotocol/sdk, express, axios, zod
- **Giao tiếp**: HTTP REST API
- **Plugin Framework**: Figma Plugin API

## Các Công Cụ MCP Có Sẵn

Dự án hỗ trợ nhiều loại công cụ được tổ chức theo danh mục:

### 1. Node Creation (Tạo node)
- `createFrame`: Tạo frame mới
- `createRectangle`: Tạo hình chữ nhật
- `createEllipse`: Tạo hình elip
- `createText`: Tạo văn bản
- `createPolygon`: Tạo đa giác
- `createStar`: Tạo hình sao
- `createLine`: Tạo đường thẳng
- `createComponent`: Tạo component
- `createInstance`: Tạo instance của component

### 2. Node Modification (Chỉnh sửa node)
- `setPosition`: Đặt vị trí
- `resize`: Thay đổi kích thước
- `setRotation`: Đặt góc xoay
- `setOpacity`: Đặt độ trong suốt
- `setVisible`: Đặt hiển thị/ẩn
- `setLocked`: Đặt khóa/mở khóa
- `setName`: Đặt tên
- `setBlendMode`: Đặt chế độ trộn

### 3. Style Modification (Chỉnh sửa kiểu dáng)
- `setFills`: Đặt fill
- `setStrokes`: Đặt stroke
- `setStrokeWeight`: Đặt độ dày stroke
- `setCornerRadius`: Đặt bo góc
- `setEffects`: Đặt hiệu ứng
- `setConstraints`: Đặt ràng buộc

### 4. Text Operations (Thao tác văn bản)
- `setCharacters`: Đặt nội dung văn bản
- `setFontSize`: Đặt kích thước font
- `setFontName`: Đặt tên font
- `setTextAlignHorizontal`: Đặt căn lề ngang
- `setTextCase`: Đặt kiểu chữ hoa/thường
- `setLineHeight`: Đặt khoảng cách dòng
- Nhiều công cụ khác cho văn bản

## Cài Đặt và Chạy

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

## Các Endpoint HTTP

- `GET /health` - Kiểm tra sức khỏe
- `GET /figma/ping` - Kiểm tra ping
- `POST /figma/register` - Đăng ký client
- `GET /figma/status` - Trạng thái kết nối
- `POST /figma/command` - Thực thi lệnh
- `GET /figma/commands` - Lấy lệnh (Figma)
- `POST /figma/response` - Gửi phản hồi (Figma)
- `POST /figma/keepalive` - Giữ kết nối sống

## Phát Triển

### Hot reload
- MCP Server: `npm run dev:mcp`
- HTTP Server: `npm run dev:http`
- Cả hai server: `npm run dev:all`
- Figma Plugin: `cd plugin && npm run dev`

### Thêm công cụ mới
1. Thêm schema vào `src/tools/schemas/`
2. Thêm định nghĩa công cụ vào `src/tools/categories/`
3. Thêm trình xử lý vào `plugin/src/code.ts`
4. Kiểm tra và build lại

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

## Giao Tiếp HTTP

Hệ thống sử dụng HTTP REST API để giao tiếp giữa các thành phần:
- MCP Server gửi lệnh đến HTTP Server qua POST `/figma/command`
- Figma Plugin lấy lệnh từ HTTP Server qua GET `/figma/commands`
- Figma Plugin gửi phản hồi đến HTTP Server qua POST `/figma/response`
- HTTP Server quản lý hàng đợi lệnh và kết nối giữa các thành phần

## Cơ Chế Quản Lý Kết Nối

- HTTP Server duy trì danh sách client đã đăng ký
- Các client phải đăng ký qua POST `/figma/register`
- Hệ thống có cơ chế keep-alive và cleanup client hết hạn
- Có cơ chế chờ phản hồi lệnh với timeout

## Cơ Chế Xử Lý Lệnh

1. MCP Server gửi lệnh đến HTTP Server
2. HTTP Server lưu lệnh vào hàng đợi cho Figma Plugin
3. Figma Plugin định kỳ lấy lệnh từ hàng đợi
4. Figma Plugin thực hiện lệnh trên canvas
5. Figma Plugin gửi phản hồi trở lại HTTP Server
6. HTTP Server chuyển phản hồi đến MCP Server