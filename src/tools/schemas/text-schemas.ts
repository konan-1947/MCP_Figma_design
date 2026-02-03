import { z } from 'zod';
import {
  NodeIdSchema,
  FontNameSchema,
  TextAlignHorizontalSchema,
  TextAlignVerticalSchema,
  TextCaseSchema,
  TextDecorationSchema,
  LineHeightSchema
} from './primitives.js';

// Additional text schemas not in primitives
export const FontWeightSchema = z.union([
  z.number().min(100).max(900),
  z.enum(['100', '200', '300', '400', '500', '600', '700', '800', '900'])
]);

export const TextAutoResizeSchema = z.enum(['NONE', 'WIDTH_AND_HEIGHT', 'HEIGHT', 'TRUNCATE_TEXT']);

// Letter spacing
export const LetterSpacingSchema = z.union([
  z.object({
    unit: z.literal('PIXELS'),
    value: z.number()
  }),
  z.object({
    unit: z.literal('PERCENT'),
    value: z.number()
  })
]);

// Paragraph spacing and indentation
export const ParagraphSpacingSchema = z.number().min(0);
export const ParagraphIndentSchema = z.number().min(0);

// Text range for partial text styling
export const TextRangeSchema = z.object({
  start: z.number().min(0),
  end: z.number().min(0)
});

// === B4: Text Operations Schemas ===

export const SetCharactersSchema = z.object({
  nodeId: NodeIdSchema,
  characters: z.string(),
  range: TextRangeSchema.optional()
});

export const SetFontSizeSchema = z.object({
  nodeId: NodeIdSchema,
  fontSize: z.number().min(1).max(512),
  range: TextRangeSchema.optional()
});

export const SetFontNameSchema = z.object({
  nodeId: NodeIdSchema,
  fontName: FontNameSchema,
  range: TextRangeSchema.optional()
});

export const SetFontWeightSchema = z.object({
  nodeId: NodeIdSchema,
  fontWeight: FontWeightSchema,
  range: TextRangeSchema.optional()
});

export const SetTextAlignHorizontalSchema = z.object({
  nodeId: NodeIdSchema,
  textAlignHorizontal: TextAlignHorizontalSchema
});

export const SetTextAlignVerticalSchema = z.object({
  nodeId: NodeIdSchema,
  textAlignVertical: TextAlignVerticalSchema
});

export const SetTextCaseSchema = z.object({
  nodeId: NodeIdSchema,
  textCase: TextCaseSchema,
  range: TextRangeSchema.optional()
});

export const SetTextDecorationSchema = z.object({
  nodeId: NodeIdSchema,
  textDecoration: TextDecorationSchema,
  range: TextRangeSchema.optional()
});

export const SetLineHeightSchema = z.object({
  nodeId: NodeIdSchema,
  lineHeight: LineHeightSchema,
  range: TextRangeSchema.optional()
});

export const SetLetterSpacingSchema = z.object({
  nodeId: NodeIdSchema,
  letterSpacing: LetterSpacingSchema,
  range: TextRangeSchema.optional()
});

export const SetParagraphSpacingSchema = z.object({
  nodeId: NodeIdSchema,
  paragraphSpacing: ParagraphSpacingSchema
});

export const SetParagraphIndentSchema = z.object({
  nodeId: NodeIdSchema,
  paragraphIndent: ParagraphIndentSchema
});

export const SetTextAutoResizeSchema = z.object({
  nodeId: NodeIdSchema,
  textAutoResize: TextAutoResizeSchema
});

export const SetTextTruncationSchema = z.object({
  nodeId: NodeIdSchema,
  maxLines: z.number().min(1).optional()
});

// Advanced text operations
export const InsertTextSchema = z.object({
  nodeId: NodeIdSchema,
  text: z.string(),
  position: z.number().min(0)
});

export const DeleteTextSchema = z.object({
  nodeId: NodeIdSchema,
  range: TextRangeSchema
});

export const GetTextRangeSchema = z.object({
  nodeId: NodeIdSchema,
  range: TextRangeSchema
});