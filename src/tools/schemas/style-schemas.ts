import { z } from 'zod';
import {
  ColorSchema,
  PositionSchema,
  NodeIdSchema,
  PaintSchema,
  EffectSchema,
  BlendModeSchema,
  ConstraintsSchema
} from './primitives.js';

// Additional stroke-specific schemas (not in primitives)
export const StrokeCapSchema = z.enum(['NONE', 'ROUND', 'SQUARE', 'LINE_ARROW', 'TRIANGLE_ARROW']);
export const StrokeJoinSchema = z.enum(['MITER', 'BEVEL', 'ROUND']);
export const StrokeAlignSchema = z.enum(['CENTER', 'INSIDE', 'OUTSIDE']);

// Corner radius schemas (specific implementation for style modification)
export const CornerRadiusSchema = z.union([
  z.number().min(0), // Single radius for all corners
  z.object({
    topLeft: z.number().min(0),
    topRight: z.number().min(0),
    bottomLeft: z.number().min(0),
    bottomRight: z.number().min(0)
  })
]);

// === B3: Style Modification Schemas ===

export const SetFillsSchema = z.object({
  nodeId: NodeIdSchema,
  fills: z.array(PaintSchema)
});

export const SetStrokesSchema = z.object({
  nodeId: NodeIdSchema,
  strokes: z.array(PaintSchema)
});

export const SetStrokeWeightSchema = z.object({
  nodeId: NodeIdSchema,
  weight: z.number().min(0)
});

export const SetStrokeCapSchema = z.object({
  nodeId: NodeIdSchema,
  strokeCap: StrokeCapSchema
});

export const SetStrokeJoinSchema = z.object({
  nodeId: NodeIdSchema,
  strokeJoin: StrokeJoinSchema
});

export const SetStrokeAlignSchema = z.object({
  nodeId: NodeIdSchema,
  strokeAlign: StrokeAlignSchema
});

export const SetStrokeDashPatternSchema = z.object({
  nodeId: NodeIdSchema,
  dashPattern: z.array(z.number().min(0))
});

export const SetCornerRadiusSchema = z.object({
  nodeId: NodeIdSchema,
  radius: CornerRadiusSchema
});

export const SetEffectsSchema = z.object({
  nodeId: NodeIdSchema,
  effects: z.array(EffectSchema)
});

export const SetConstraintsSchema = z.object({
  nodeId: NodeIdSchema,
  constraints: ConstraintsSchema
});

export const SetBlendModeStyleSchema = z.object({
  nodeId: NodeIdSchema,
  blendMode: BlendModeSchema
});

export const SetOpacityStyleSchema = z.object({
  nodeId: NodeIdSchema,
  opacity: z.number().min(0).max(1)
});