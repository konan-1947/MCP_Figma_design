import { z } from 'zod';
import {
  PositionSchema,
  SizeSchema,
  OptionalPositionSchema,
  OptionalSizeSchema,
  NodeIdSchema,
  ColorSchema,
  PaintSchema,
  EffectSchema,
  FontNameSchema,
  TextAlignHorizontalSchema,
  LayoutModeSchema,
  LayoutAlignSchema,
  ConstraintsSchema,
  BlendModeSchema
} from './primitives.js';

// === B1: NODE CREATION SCHEMAS ===

export const CreateFrameSchema = z.object({
  name: z.string().optional().describe('Frame name'),
  ...OptionalSizeSchema.shape,
  ...OptionalPositionSchema.shape
}).describe('Create a frame node');

export const CreateRectangleSchema = z.object({
  ...SizeSchema.shape,
  ...OptionalPositionSchema.shape,
  name: z.string().optional().describe('Rectangle name')
}).describe('Create a rectangle node');

export const CreateEllipseSchema = z.object({
  ...SizeSchema.shape,
  ...OptionalPositionSchema.shape,
  name: z.string().optional().describe('Ellipse name')
}).describe('Create an ellipse node');

export const CreatePolygonSchema = z.object({
  pointCount: z.number().int().min(3).max(50).describe('Number of polygon points'),
  ...OptionalSizeSchema.shape,
  ...OptionalPositionSchema.shape,
  name: z.string().optional().describe('Polygon name')
}).describe('Create a polygon node');

export const CreateStarSchema = z.object({
  pointCount: z.number().int().min(3).max(50).describe('Number of star points'),
  innerRadius: z.number().min(0).max(1).describe('Inner radius ratio (0-1)'),
  ...OptionalSizeSchema.shape,
  ...OptionalPositionSchema.shape,
  name: z.string().optional().describe('Star name')
}).describe('Create a star node');

export const CreateLineSchema = z.object({
  endX: z.number().describe('End X coordinate relative to start'),
  endY: z.number().describe('End Y coordinate relative to start'),
  ...OptionalPositionSchema.shape,
  name: z.string().optional().describe('Line name')
}).describe('Create a line node');

export const CreateTextSchema = z.object({
  characters: z.string().describe('Text content'),
  ...OptionalPositionSchema.shape,
  fontSize: z.number().positive().optional().default(16).describe('Font size in pixels'),
  fontName: FontNameSchema.optional().describe('Font family and style'),
  fills: z.array(PaintSchema).optional().describe('Text fills'),
  name: z.string().optional().describe('Text node name')
}).describe('Create a text node');

export const CreateComponentSchema = z.object({
  name: z.string().describe('Component name'),
  description: z.string().optional().describe('Component description'),
  nodeIds: z.array(NodeIdSchema).optional().describe('Node IDs to include in component'),
  ...OptionalPositionSchema.shape
}).describe('Create a component from existing nodes or empty');

export const CreateComponentSetSchema = z.object({
  name: z.string().describe('Component set name'),
  variants: z.array(z.object({
    name: z.string().describe('Variant name'),
    properties: z.record(z.string(), z.string()).describe('Variant properties')
  })).describe('Component variants'),
  ...OptionalPositionSchema.shape
}).describe('Create a component set with variants');

export const CreateInstanceSchema = z.object({
  componentId: NodeIdSchema.describe('ID of the component to instantiate'),
  ...OptionalPositionSchema.shape,
  name: z.string().optional().describe('Instance name')
}).describe('Create an instance of a component');

export const CreateSliceSchema = z.object({
  ...SizeSchema.shape,
  ...OptionalPositionSchema.shape,
  name: z.string().optional().describe('Slice name')
}).describe('Create a slice node');

export const CreateVectorSchema = z.object({
  vectorPaths: z.array(z.object({
    windingRule: z.enum(['EVENODD', 'NONZERO']),
    data: z.string().describe('SVG path data')
  })).describe('Vector path data'),
  ...OptionalPositionSchema.shape,
  name: z.string().optional().describe('Vector name')
}).describe('Create a vector node');

export const CreateBooleanOperationSchema = z.object({
  booleanOperation: z.enum(['UNION', 'INTERSECT', 'SUBTRACT', 'EXCLUDE']),
  children: z.array(NodeIdSchema).min(2).describe('Node IDs to perform boolean operation on'),
  ...OptionalPositionSchema.shape,
  name: z.string().optional().describe('Boolean operation result name')
}).describe('Create a boolean operation from existing nodes');

// === B2: NODE MODIFICATION SCHEMAS ===

export const SetPositionSchema = z.object({
  nodeId: NodeIdSchema,
  ...PositionSchema.shape
}).describe('Set node position');

export const ResizeSchema = z.object({
  nodeId: NodeIdSchema,
  ...SizeSchema.shape
}).describe('Resize node');

export const SetRotationSchema = z.object({
  nodeId: NodeIdSchema,
  rotation: z.number().describe('Rotation in degrees')
}).describe('Set node rotation');

export const SetOpacitySchema = z.object({
  nodeId: NodeIdSchema,
  opacity: z.number().min(0).max(1).describe('Opacity value (0-1)')
}).describe('Set node opacity');

export const SetVisibleSchema = z.object({
  nodeId: NodeIdSchema,
  visible: z.boolean().describe('Node visibility')
}).describe('Set node visibility');

export const SetLockedSchema = z.object({
  nodeId: NodeIdSchema,
  locked: z.boolean().describe('Node locked state')
}).describe('Set node locked state');

export const SetNameSchema = z.object({
  nodeId: NodeIdSchema,
  name: z.string().describe('New node name')
}).describe('Set node name');

export const SetBlendModeSchema = z.object({
  nodeId: NodeIdSchema,
  blendMode: BlendModeSchema
}).describe('Set node blend mode');

// === TYPE EXPORTS ===

export type CreateFrameParams = z.infer<typeof CreateFrameSchema>;
export type CreateRectangleParams = z.infer<typeof CreateRectangleSchema>;
export type CreateEllipseParams = z.infer<typeof CreateEllipseSchema>;
export type CreatePolygonParams = z.infer<typeof CreatePolygonSchema>;
export type CreateStarParams = z.infer<typeof CreateStarSchema>;
export type CreateLineParams = z.infer<typeof CreateLineSchema>;
export type CreateTextParams = z.infer<typeof CreateTextSchema>;
export type CreateComponentParams = z.infer<typeof CreateComponentSchema>;
export type CreateComponentSetParams = z.infer<typeof CreateComponentSetSchema>;
export type CreateInstanceParams = z.infer<typeof CreateInstanceSchema>;
export type CreateSliceParams = z.infer<typeof CreateSliceSchema>;
export type CreateVectorParams = z.infer<typeof CreateVectorSchema>;
export type CreateBooleanOperationParams = z.infer<typeof CreateBooleanOperationSchema>;

export type SetPositionParams = z.infer<typeof SetPositionSchema>;
export type ResizeParams = z.infer<typeof ResizeSchema>;
export type SetRotationParams = z.infer<typeof SetRotationSchema>;
export type SetOpacityParams = z.infer<typeof SetOpacitySchema>;
export type SetVisibleParams = z.infer<typeof SetVisibleSchema>;
export type SetLockedParams = z.infer<typeof SetLockedSchema>;
export type SetNameParams = z.infer<typeof SetNameSchema>;
export type SetBlendModeParams = z.infer<typeof SetBlendModeSchema>;