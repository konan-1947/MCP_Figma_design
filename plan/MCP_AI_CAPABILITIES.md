# MCP AI Plugin - Phân tích Capabilities

## Tổng quan Architecture

Plugin MCP AI sử dụng kiến trúc 3-layer:

1. **MCP Server** (`src/server.ts`) - Interface chính với Claude AI
2. **HTTP Bridge Server** (`src/http-server.ts`) - Cầu nối HTTP giữa MCP và Figma
3. **Figma Plugin** (`plugin/src/code.ts`) - Thực thi commands trong Figma

## Danh sách Tools/Capabilities có sẵn

### 1. **lay_selection**
- **Mô tả**: Lấy thông tin về các element đang được chọn trong Figma
- **Parameters**: Không cần
- **Return**:
  - Danh sách elements với id, name, type, vị trí (x, y), kích thước (width, height)
  - Thông tin parent element

### 2. **them_text**
- **Mô tả**: Thêm text element vào Figma canvas
- **Parameters**:
  - `noi_dung` (string, required): Nội dung text
  - `x` (number, optional): Vị trí X (default: 0)
  - `y` (number, optional): Vị trí Y (default: 0)
  - `font_size` (number, optional): Kích thước font (default: 16)
  - `mau_chu` (string, optional): Màu chữ hex (default: #000000)
- **Features**: Auto load font với fallback (Inter -> Roboto)

### 3. **tao_man_hinh**
- **Mô tả**: Tạo frame/màn hình mới với header
- **Parameters**:
  - `ten` (string, required): Tên frame/màn hình
  - `tieu_de` (string, required): Tiêu đề header
  - `loai` (enum, required): ['mobile', 'tablet', 'desktop']
- **Features**:
  - Preset sizes: mobile (375x812), tablet (768x1024), desktop (1440x900)
  - Auto tạo header text với font Bold

### 4. **them_button**
- **Mô tả**: Thêm button component với auto layout
- **Parameters**:
  - `text` (string, required): Text trên button
  - `x`, `y` (number, required): Vị trí
  - `mau_nen` (string, optional): Màu nền (default: #3B82F6)
  - `mau_chu` (string, optional): Màu chữ (default: #FFFFFF)
  - `width` (number, optional): Chiều rộng (default: 120)
  - `height` (number, optional): Chiều cao (default: 44)
- **Features**: Auto layout horizontal, padding 16/12px, corner radius 8px

### 5. **them_hinh_chu_nhat**
- **Mô tả**: Tạo rectangle shape
- **Parameters**:
  - `x`, `y` (number, required): Vị trí
  - `width`, `height` (number, required): Kích thước
  - `mau_nen` (string, required): Màu nền fill
  - `border_radius` (number, optional): Bo góc (default: 0)

### 6. **tao_form_login** ⚠️
- **Mô tả**: Tạo form login template hoàn chỉnh (CỤTHỂ)
- **Parameters**:
  - `tieu_de` (string, optional): Tiêu đề form (default: "Đăng nhập")
- **Components tạo ra**:
  - Title text (28px, Bold)
  - Username input field (292x48px)
  - Password input field (292x48px)
  - Login button (292x48px, blue #3B82F6)
- **Vấn đề**: Hard-coded layout, không flexible

### 7. **tao_card** ⚠️
- **Mô tả**: Tạo card component (CỤTHỂ)
- **Parameters**:
  - `tieu_de` (string, required): Tiêu đề card
  - `mo_ta` (string, required): Mô tả nội dung
  - `hinh_anh_url` (string, optional): URL hình ảnh (chưa implement)
  - `x`, `y` (number, optional): Vị trí (default: 0)
- **Features**:
  - Fixed size 300x200px
  - Corner radius 12px
  - Drop shadow effect
  - Auto layout vertical với spacing 16px

### 8. **xoa_selection**
- **Mô tả**: Xóa các element đang được chọn
- **Parameters**: Không cần
- **Return**: Danh sách các items đã xóa

## Utility Functions

### 9. **createInputField()** (Helper)
- **Private function** trong tao_form_login
- **Tạo**: Input field với background #F7F7F7, placeholder text

### 10. **hexToRgb()** (Helper)
- **Chuyển đổi**: Hex color sang RGB format của Figma
- **Support**: #FFFFFF format

## HTTP Communication System

### Client Management
- **Registered Clients**: MCP, Figma Plugin
- **Connection Types**: 'mcp' | 'figma' | 'figma-ui'
- **Keep-alive**: 30 second intervals
- **Auto cleanup**: Expired clients (2 minutes timeout)

### Command Flow
1. **MCP Server** nhận tool call từ Claude AI
2. **HTTP Client** gửi command qua POST /figma/command
3. **HTTP Server** queue command cho Figma client
4. **Figma Plugin** poll commands qua GET /figma/commands
5. **Figma Plugin** thực thi và gửi response qua POST /figma/response
6. **HTTP Server** resolve pending command
7. **MCP Server** trả kết quả cho Claude AI

### API Endpoints
```
GET  /health - Health check
GET  /figma/ping - Ping test
POST /figma/register - Register client
GET  /figma/status - Connection status
POST /figma/command - Execute command (from MCP)
GET  /figma/commands - Poll commands (from Figma)
POST /figma/response - Submit response (from Figma)
POST /figma/keepalive - Keep connection alive
```

## Schema Validation

Sử dụng **Zod** để validate parameters:
- Type safety cho tất cả tool inputs
- Auto error handling với descriptive messages
- Runtime parameter validation

## Vấn đề thiết kế hiện tại

### ❌ Không linh hoạt
- `tao_form_login` và `tao_card` quá cụ thể
- Hard-code layout, size, màu sắc
- Khó tái sử dụng cho UI khác

### ❌ Thiếu primitive tools
- Không có tool tạo generic frame
- Không có tool apply styling riêng
- Không có tool tạo auto layout

### ❌ Limited customization
- Font options hạn chế (chỉ Inter/Roboto)
- Color format chỉ support hex
- Không support gradients, effects

## Đề xuất cải tiến

### 1. Tách biệt Primitive Tools
```typescript
- createFrame(config: FrameConfig)
- createText(config: TextConfig)
- createShape(type: ShapeType, config: ShapeConfig)
- applyLayout(target: NodeId, config: LayoutConfig)
- applyStyle(target: NodeId, config: StyleConfig)
```

### 2. Template System
```typescript
- createFromTemplate(templateName: string, customConfig: any)
- saveAsTemplate(selection: NodeId[], templateName: string)
- listTemplates(): Template[]
```

### 3. Enhanced Styling
```typescript
- applyGradient(target: NodeId, gradient: GradientConfig)
- applyEffects(target: NodeId, effects: EffectConfig[])
- setTypography(target: NodeId, typography: TypographyConfig)
```

### 4. Component System
```typescript
- createComponent(config: ComponentConfig): ComponentId
- instantiateComponent(componentId: ComponentId, overrides: any)
- updateComponent(componentId: ComponentId, updates: any)
```

## Kết luận

Plugin hiện tại có **8 tools chính** và **2 helper functions**. Thiết kế tập trung vào các use cases cụ thể (login form, card) thay vì các primitive operations linh hoạt.

**Ưu điểm:**
- Architecture rõ ràng với HTTP bridge
- Error handling tốt
- Schema validation với Zod
- Connection management robust

**Nhược điểm:**
- Tools quá cụ thể, khó mở rộng
- Thiếu tính linh hoạt cho custom UI
- Font và color options hạn chế

**Khuyến nghị:** Refactor theo hướng primitive tools + template system để tăng tính linh hoạt và khả năng tái sử dụng.