import { z } from 'zod';

// Schema cho tool lay_selection - không cần parameters
export const LaySelectionSchema = z.object({});

// Schema cho tool them_text
export const ThemTextSchema = z.object({
  noi_dung: z.string().describe('Nội dung text cần thêm'),
  x: z.number().optional().describe('Vị trí X (mặc định: 0)'),
  y: z.number().optional().describe('Vị trí Y (mặc định: 0)'),
  font_size: z.number().optional().describe('Kích thước font (mặc định: 16)'),
  mau_chu: z.string().optional().describe('Màu chữ hex (mặc định: #000000)')
});

// Schema cho tool tao_man_hinh
export const TaoManHinhSchema = z.object({
  ten: z.string().describe('Tên frame/màn hình'),
  tieu_de: z.string().describe('Tiêu đề header'),
  loai: z.enum(['mobile', 'tablet', 'desktop']).describe('Loại màn hình')
});

// Schema cho tool them_button
export const ThemButtonSchema = z.object({
  text: z.string().describe('Text trên button'),
  x: z.number().describe('Vị trí X'),
  y: z.number().describe('Vị trí Y'),
  mau_nen: z.string().optional().describe('Màu nền button (mặc định: #3B82F6)'),
  mau_chu: z.string().optional().describe('Màu chữ (mặc định: #FFFFFF)'),
  width: z.number().optional().describe('Chiều rộng (mặc định: 120)'),
  height: z.number().optional().describe('Chiều cao (mặc định: 44)')
});

// Schema cho tool them_hinh_chu_nhat
export const ThemHinhChuNhatSchema = z.object({
  x: z.number().describe('Vị trí X'),
  y: z.number().describe('Vị trí Y'),
  width: z.number().describe('Chiều rộng'),
  height: z.number().describe('Chiều cao'),
  mau_nen: z.string().describe('Màu nền fill'),
  border_radius: z.number().optional().describe('Bo góc (mặc định: 0)')
});

// Schema cho tool tao_form_login
export const TaoFormLoginSchema = z.object({
  tieu_de: z.string().optional().describe('Tiêu đề form (mặc định: "Đăng nhập")')
});

// Schema cho tool tao_card
export const TaoCardSchema = z.object({
  tieu_de: z.string().describe('Tiêu đề card'),
  mo_ta: z.string().describe('Mô tả nội dung'),
  hinh_anh_url: z.string().optional().describe('URL hình ảnh (tùy chọn)'),
  x: z.number().optional().describe('Vị trí X (mặc định: 0)'),
  y: z.number().optional().describe('Vị trí Y (mặc định: 0)')
});

// Schema cho tool xoa_selection - không cần parameters
export const XoaSelectionSchema = z.object({});

// Export all schemas
export const ToolSchemas = {
  lay_selection: LaySelectionSchema,
  them_text: ThemTextSchema,
  tao_man_hinh: TaoManHinhSchema,
  them_button: ThemButtonSchema,
  them_hinh_chu_nhat: ThemHinhChuNhatSchema,
  tao_form_login: TaoFormLoginSchema,
  tao_card: TaoCardSchema,
  xoa_selection: XoaSelectionSchema
} as const;

export type ToolSchemaTypes = {
  [K in keyof typeof ToolSchemas]: z.infer<typeof ToolSchemas[K]>;
};