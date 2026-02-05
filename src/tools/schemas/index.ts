// Export all primitive schemas and types
export * from './primitives.js';

// Export node creation and modification schemas
export * from './node-schemas.js';

// Export style modification schemas
export * from './style-schemas.js';

// Export text operation schemas
export * from './text-schemas.js';

// Re-export commonly used schemas for convenience
export {
  PositionSchema,
  SizeSchema,
  OptionalPositionSchema,
  OptionalSizeSchema,
  NodeIdSchema,
  ColorSchema,
  PaintSchema,
  EffectSchema
} from './primitives.js';

export {
  CreateFrameSchema,
  CreateRectangleSchema,
  CreateEllipseSchema,
  CreateTextSchema,
  SetPositionSchema,
  ResizeSchema,
  SetNameSchema,
  // Batch creation schemas
  CreateMultipleShapesSchema,
  CreateShapeGridSchema,
  CreateDiagramElementsSchema,
  // Batch modification schemas
  BatchPositionUpdateSchema,
  BatchStyleUpdateSchema
} from './node-schemas.js';

export {
  SetFillsSchema,
  SetStrokesSchema,
  SetStrokeWeightSchema,
  SetCornerRadiusSchema,
  SetEffectsSchema,
  SetConstraintsSchema,
  SetBlendModeStyleSchema,
  SetOpacityStyleSchema
} from './style-schemas.js';

export {
  SetCharactersSchema,
  SetFontSizeSchema,
  SetFontNameSchema,
  SetTextAlignHorizontalSchema,
  SetTextCaseSchema,
  SetTextDecorationSchema,
  SetLineHeightSchema,
  SetLetterSpacingSchema,
  SetTextAutoResizeSchema
} from './text-schemas.js';