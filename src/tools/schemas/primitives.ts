import { z } from 'zod';

// === BASIC PRIMITIVES ===

export const PositionSchema = z.object({
  x: z.number().describe('X coordinate'),
  y: z.number().describe('Y coordinate')
});

export const SizeSchema = z.object({
  width: z.number().positive().describe('Width in pixels'),
  height: z.number().positive().describe('Height in pixels')
});

export const OptionalPositionSchema = z.object({
  x: z.number().optional().describe('X coordinate (optional)'),
  y: z.number().optional().describe('Y coordinate (optional)')
});

export const OptionalSizeSchema = z.object({
  width: z.number().positive().optional().describe('Width in pixels (optional)'),
  height: z.number().positive().optional().describe('Height in pixels (optional)')
});

// === COLOR PRIMITIVES ===

export const ColorSchema = z.string()
  .regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color (#RRGGBB)')
  .describe('Hex color value');

export const RGBSchema = z.object({
  r: z.number().min(0).max(1).describe('Red component (0-1)'),
  g: z.number().min(0).max(1).describe('Green component (0-1)'),
  b: z.number().min(0).max(1).describe('Blue component (0-1)')
});

export const RGBASchema = RGBSchema.extend({
  a: z.number().min(0).max(1).describe('Alpha component (0-1)')
});

// === FIGMA SPECIFIC PRIMITIVES ===

export const NodeIdSchema = z.string().describe('Figma node ID');

export const BlendModeSchema = z.enum([
  'NORMAL',
  'DARKEN',
  'MULTIPLY',
  'LINEAR_BURN',
  'COLOR_BURN',
  'LIGHTEN',
  'SCREEN',
  'LINEAR_DODGE',
  'COLOR_DODGE',
  'OVERLAY',
  'SOFT_LIGHT',
  'HARD_LIGHT',
  'DIFFERENCE',
  'EXCLUSION',
  'HUE',
  'SATURATION',
  'COLOR',
  'LUMINOSITY'
]).describe('Figma blend mode');

// === STYLE PRIMITIVES ===

export const PaintSchema = z.object({
  type: z.enum(['SOLID', 'GRADIENT_LINEAR', 'GRADIENT_RADIAL', 'GRADIENT_ANGULAR', 'GRADIENT_DIAMOND', 'IMAGE']),
  visible: z.boolean().optional().default(true),
  opacity: z.number().min(0).max(1).optional().default(1),
  color: RGBASchema.optional(),
  gradientStops: z.array(z.object({
    color: RGBASchema,
    position: z.number().min(0).max(1)
  })).optional(),
  imageHash: z.string().optional(),
  scaleMode: z.enum(['FILL', 'TILE', 'FIT', 'CROP']).optional()
});

export const EffectSchema = z.object({
  type: z.enum(['DROP_SHADOW', 'INNER_SHADOW', 'LAYER_BLUR', 'BACKGROUND_BLUR']),
  visible: z.boolean().optional().default(true),
  color: RGBASchema.optional(),
  offset: z.object({
    x: z.number(),
    y: z.number()
  }).optional(),
  radius: z.number().min(0).optional(),
  spread: z.number().optional()
});

// === TEXT PRIMITIVES ===

export const FontNameSchema = z.object({
  family: z.string().describe('Font family name'),
  style: z.string().describe('Font style (Regular, Bold, Italic, etc.)')
});

export const TextAlignHorizontalSchema = z.enum(['LEFT', 'CENTER', 'RIGHT', 'JUSTIFIED'])
  .describe('Horizontal text alignment');

export const TextAlignVerticalSchema = z.enum(['TOP', 'CENTER', 'BOTTOM'])
  .describe('Vertical text alignment');

export const TextCaseSchema = z.enum(['ORIGINAL', 'UPPER', 'LOWER', 'TITLE'])
  .describe('Text case transformation');

export const TextDecorationSchema = z.enum(['NONE', 'UNDERLINE', 'STRIKETHROUGH'])
  .describe('Text decoration');

export const LineHeightSchema = z.union([
  z.object({
    unit: z.literal('PIXELS'),
    value: z.number().positive()
  }),
  z.object({
    unit: z.literal('PERCENT'),
    value: z.number().positive()
  }),
  z.object({
    unit: z.literal('AUTO')
  })
]).describe('Line height specification');

// === LAYOUT PRIMITIVES ===

export const LayoutModeSchema = z.enum(['NONE', 'HORIZONTAL', 'VERTICAL'])
  .describe('Auto layout mode');

export const LayoutAlignSchema = z.enum(['MIN', 'CENTER', 'MAX', 'STRETCH'])
  .describe('Layout alignment');

export const ConstraintsSchema = z.object({
  horizontal: z.enum(['LEFT', 'RIGHT', 'CENTER', 'LEFT_RIGHT', 'SCALE']),
  vertical: z.enum(['TOP', 'BOTTOM', 'CENTER', 'TOP_BOTTOM', 'SCALE'])
});

// === EXPORT PRIMITIVES ===

export const ExportFormatSchema = z.enum(['PNG', 'JPG', 'SVG', 'PDF'])
  .describe('Export format');

export const ExportSettingsSchema = z.object({
  format: ExportFormatSchema,
  constraint: z.object({
    type: z.enum(['SCALE', 'WIDTH', 'HEIGHT']),
    value: z.number().positive()
  }).optional(),
  suffix: z.string().optional(),
  useAbsoluteBounds: z.boolean().optional().default(false)
});

// === TYPE EXPORTS ===

export type Position = z.infer<typeof PositionSchema>;
export type Size = z.infer<typeof SizeSchema>;
export type Color = z.infer<typeof ColorSchema>;
export type RGB = z.infer<typeof RGBSchema>;
export type RGBA = z.infer<typeof RGBASchema>;
export type NodeId = z.infer<typeof NodeIdSchema>;
export type BlendMode = z.infer<typeof BlendModeSchema>;
export type Paint = z.infer<typeof PaintSchema>;
export type Effect = z.infer<typeof EffectSchema>;
export type FontName = z.infer<typeof FontNameSchema>;
export type TextAlignHorizontal = z.infer<typeof TextAlignHorizontalSchema>;
export type TextAlignVertical = z.infer<typeof TextAlignVerticalSchema>;
export type TextCase = z.infer<typeof TextCaseSchema>;
export type TextDecoration = z.infer<typeof TextDecorationSchema>;
export type LineHeight = z.infer<typeof LineHeightSchema>;
export type LayoutMode = z.infer<typeof LayoutModeSchema>;
export type LayoutAlign = z.infer<typeof LayoutAlignSchema>;
export type Constraints = z.infer<typeof ConstraintsSchema>;
export type ExportFormat = z.infer<typeof ExportFormatSchema>;
export type ExportSettings = z.infer<typeof ExportSettingsSchema>;