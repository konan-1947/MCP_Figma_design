import { z } from 'zod';
import { NodeIdSchema } from './primitives.js';

// === LAYOUT ARRANGEMENT SCHEMAS ===

export const AutoArrangeElementsSchema = z.object({
  nodeIds: z.array(NodeIdSchema).min(1).describe('Array of node IDs to arrange'),
  strategy: z.enum(['flow', 'grid', 'circular', 'compact']).optional().default('flow').describe('Arrangement strategy'),
  spacing: z.number().min(0).max(200).optional().default(16).describe('Spacing between elements in pixels'),
  gridSize: z.number().min(1).max(32).optional().default(8).describe('Grid size for snapping'),
  alignToGrid: z.boolean().optional().default(true).describe('Snap positions to grid')
}).describe('Auto-arrange elements với smart positioning để prevent overlaps và improve layout');

export const DistributeHorizontallySchema = z.object({
  nodeIds: z.array(NodeIdSchema).min(2).describe('Array of node IDs to distribute (minimum 2)'),
  spacing: z.number().min(0).max(500).describe('Spacing between elements in pixels')
}).describe('Distribute elements horizontally với equal spacing');

export const DistributeVerticallySchema = z.object({
  nodeIds: z.array(NodeIdSchema).min(2).describe('Array of node IDs to distribute (minimum 2)'),
  spacing: z.number().min(0).max(500).describe('Spacing between elements in pixels')
}).describe('Distribute elements vertically với equal spacing');

// === ALIGNMENT SCHEMAS ===

export const AlignLeftSchema = z.object({
  nodeIds: z.array(NodeIdSchema).min(1).describe('Array of node IDs to align'),
  alignTo: z.enum(['selection', 'page', 'artboard']).optional().default('selection').describe('Alignment reference')
}).describe('Align elements to left edge');

export const AlignCenterSchema = z.object({
  nodeIds: z.array(NodeIdSchema).min(1).describe('Array of node IDs to align')
}).describe('Align elements center horizontally');

export const AlignRightSchema = z.object({
  nodeIds: z.array(NodeIdSchema).min(1).describe('Array of node IDs to align')
}).describe('Align elements to right edge');

export const AlignTopSchema = z.object({
  nodeIds: z.array(NodeIdSchema).min(1).describe('Array of node IDs to align')
}).describe('Align elements to top edge');

export const AlignMiddleSchema = z.object({
  nodeIds: z.array(NodeIdSchema).min(1).describe('Array of node IDs to align')
}).describe('Align elements center vertically');

export const AlignBottomSchema = z.object({
  nodeIds: z.array(NodeIdSchema).min(1).describe('Array of node IDs to align')
}).describe('Align elements to bottom edge');

// === STACKING SCHEMAS ===

export const StackHorizontallySchema = z.object({
  nodeIds: z.array(NodeIdSchema).min(2).describe('Array of node IDs to stack (minimum 2)'),
  spacing: z.number().min(0).max(200).optional().default(8).describe('Spacing between stacked elements'),
  alignVertical: z.enum(['top', 'middle', 'bottom', 'none']).optional().default('top').describe('Vertical alignment of stacked elements')
}).describe('Stack elements horizontally với specified spacing và vertical alignment');

export const StackVerticallySchema = z.object({
  nodeIds: z.array(NodeIdSchema).min(2).describe('Array of node IDs to stack (minimum 2)'),
  spacing: z.number().min(0).max(200).optional().default(8).describe('Spacing between stacked elements'),
  alignHorizontal: z.enum(['left', 'center', 'right', 'none']).optional().default('left').describe('Horizontal alignment of stacked elements')
}).describe('Stack elements vertically với specified spacing và horizontal alignment');

// === GRID AND SNAP SCHEMAS ===

export const CreateGridSchema = z.object({
  nodeIds: z.array(NodeIdSchema).min(1).describe('Array of node IDs to arrange in grid'),
  cols: z.number().min(1).max(20).optional().describe('Number of columns (auto-calculated if not provided)'),
  rows: z.number().min(1).max(20).optional().describe('Number of rows (auto-calculated if not provided)'),
  cellWidth: z.number().min(10).max(2000).optional().describe('Width of each grid cell (uses element width if not provided)'),
  cellHeight: z.number().min(10).max(2000).optional().describe('Height of each grid cell (uses element height if not provided)'),
  spacingX: z.number().min(0).max(200).optional().default(8).describe('Horizontal spacing between grid cells'),
  spacingY: z.number().min(0).max(200).optional().default(8).describe('Vertical spacing between grid cells'),
  startX: z.number().optional().describe('Starting X position (uses leftmost element if not provided)'),
  startY: z.number().optional().describe('Starting Y position (uses topmost element if not provided)')
}).describe('Arrange elements in a grid pattern với specified columns, rows và spacing');

export const SnapToGridSchema = z.object({
  nodeIds: z.array(NodeIdSchema).min(1).describe('Array of node IDs to snap to grid'),
  gridSize: z.number().min(1).max(32).optional().default(8).describe('Grid size in pixels (8px recommended for design systems)')
}).describe('Snap element positions to grid để ensure consistent alignment');

// === SPACING AND GROUPING SCHEMAS ===

export const EqualSpacingSchema = z.object({
  nodeIds: z.array(NodeIdSchema).min(2).describe('Array of node IDs to space equally'),
  direction: z.enum(['horizontal', 'vertical']).optional().default('horizontal').describe('Direction for equal spacing'),
  spacing: z.number().min(0).max(500).describe('Spacing between elements in pixels')
}).describe('Apply equal spacing between elements trong specified direction');

export const GroupElementsSchema = z.object({
  nodeIds: z.array(NodeIdSchema).min(1).describe('Array of node IDs to group together'),
  groupName: z.string().optional().default('Group').describe('Name for the group frame'),
  padding: z.number().min(0).max(100).optional().default(16).describe('Padding inside group frame')
}).describe('Group elements into a frame với specified padding');

// === OPTIMIZATION SCHEMAS ===

export const OptimizeLayoutSchema = z.object({
  nodeIds: z.array(NodeIdSchema).min(1).describe('Array of node IDs to optimize'),
  strategy: z.enum(['auto', 'compact', 'flow', 'grid']).optional().default('auto').describe('Optimization strategy')
}).describe('Optimize layout bằng cách remove overlaps và improve spacing automatically');

// Export all layout operation schemas
export const layoutOperationSchemas = {
  AutoArrangeElementsSchema,
  DistributeHorizontallySchema,
  DistributeVerticallySchema,
  AlignLeftSchema,
  AlignCenterSchema,
  AlignRightSchema,
  AlignTopSchema,
  AlignMiddleSchema,
  AlignBottomSchema,
  StackHorizontallySchema,
  StackVerticallySchema,
  CreateGridSchema,
  SnapToGridSchema,
  EqualSpacingSchema,
  GroupElementsSchema,
  OptimizeLayoutSchema
};

// Type exports
export type AutoArrangeElementsInput = z.infer<typeof AutoArrangeElementsSchema>;
export type DistributeHorizontallyInput = z.infer<typeof DistributeHorizontallySchema>;
export type DistributeVerticallyInput = z.infer<typeof DistributeVerticallySchema>;
export type AlignLeftInput = z.infer<typeof AlignLeftSchema>;
export type AlignCenterInput = z.infer<typeof AlignCenterSchema>;
export type AlignRightInput = z.infer<typeof AlignRightSchema>;
export type AlignTopInput = z.infer<typeof AlignTopSchema>;
export type AlignMiddleInput = z.infer<typeof AlignMiddleSchema>;
export type AlignBottomInput = z.infer<typeof AlignBottomSchema>;
export type StackHorizontallyInput = z.infer<typeof StackHorizontallySchema>;
export type StackVerticallyInput = z.infer<typeof StackVerticallySchema>;
export type CreateGridInput = z.infer<typeof CreateGridSchema>;
export type SnapToGridInput = z.infer<typeof SnapToGridSchema>;
export type EqualSpacingInput = z.infer<typeof EqualSpacingSchema>;
export type GroupElementsInput = z.infer<typeof GroupElementsSchema>;
export type OptimizeLayoutInput = z.infer<typeof OptimizeLayoutSchema>;