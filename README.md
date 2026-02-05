# Figma MCP Controller

Hệ thống MCP Server cho phép Claude điều khiển Figma Desktop để tạo và chỉnh sửa UI components trực tiếp trên canvas.

## Chức năng

- Tự động tạo UI components thông qua Claude (text, buttons, cards, forms)
- Điều khiển Figma Desktop qua HTTP REST API
- Hỗ trợ tạo màn hình responsive (mobile, tablet, desktop)
- Tích hợp với Claude Desktop để thực hiện lệnh tự nhiên

**Luồng hoạt động:**
```
Claude → MCP Server → HTTP API → Figma Plugin → Figma Canvas
```

## Cách hoạt động

1. **MCP Server** nhận lệnh từ Claude và chuyển đổi thành HTTP requests
2. **HTTP Server** làm cầu nối giữa MCP và Figma Plugin
3. **Figma Plugin** thực thi commands trực tiếp trên Figma Canvas
4. Kết quả được trả về theo chiều ngược lại

## Cài đặt

### 1. Cài đặt dependencies
```bash
npm install
cd plugin && npm install && cd ..
```

### 2. Build dự án
```bash
npm run build
npm run build:plugin
```

### 3. Chạy hệ thống
```bash
# Chạy cả HTTP và MCP server
npm run dev:all
```

### 4. Cài đặt Figma Plugin
1. Mở Figma Desktop
2. Vào Plugins → Development → Import plugin from manifest
3. Chọn `plugin/manifest.json`
4. Chạy plugin

### 5. Cấu hình Claude Desktop
Copy `config/claude_desktop_config.json` vào:
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`
- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`

### Sử dụng
Sau khi cài đặt, bạn có thể ra lệnh cho Claude:
```
Tạo màn hình mobile tên "Login Screen"
Thêm button "Đăng nhập" màu xanh
Tạo form đăng ký với email và password
```