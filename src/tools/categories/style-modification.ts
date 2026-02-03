import { McpTool, ToolCategory } from '../types.js';
import {
  SetFillsSchema,
  SetStrokesSchema,
  SetStrokeWeightSchema,
  SetStrokeCapSchema,
  SetStrokeJoinSchema,
  SetStrokeAlignSchema,
  SetStrokeDashPatternSchema,
  SetCornerRadiusSchema,
  SetEffectsSchema,
  SetConstraintsSchema,
  SetBlendModeStyleSchema,
  SetOpacityStyleSchema
} from '../schemas/index.js';

// === B3: Style Modification Tools ===

export const setFills: McpTool = {
  name: 'setFills',
  description: 'Set fill paints for a node (solid colors, gradients, or images)',
  inputSchema: SetFillsSchema,
  handler: async (params) => ({
    category: ToolCategory.STYLE_MODIFICATION,
    operation: 'setFills',
    parameters: params
  })
};

export const setStrokes: McpTool = {
  name: 'setStrokes',
  description: 'Set stroke paints for a node (solid colors, gradients, or images)',
  inputSchema: SetStrokesSchema,
  handler: async (params) => ({
    category: ToolCategory.STYLE_MODIFICATION,
    operation: 'setStrokes',
    parameters: params
  })
};

export const setStrokeWeight: McpTool = {
  name: 'setStrokeWeight',
  description: 'Set the stroke weight (thickness) for a node',
  inputSchema: SetStrokeWeightSchema,
  handler: async (params) => ({
    category: ToolCategory.STYLE_MODIFICATION,
    operation: 'setStrokeWeight',
    parameters: params
  })
};

export const setStrokeCap: McpTool = {
  name: 'setStrokeCap',
  description: 'Set the stroke cap style (how line ends are drawn)',
  inputSchema: SetStrokeCapSchema,
  handler: async (params) => ({
    category: ToolCategory.STYLE_MODIFICATION,
    operation: 'setStrokeCap',
    parameters: params
  })
};

export const setStrokeJoin: McpTool = {
  name: 'setStrokeJoin',
  description: 'Set the stroke join style (how line corners are drawn)',
  inputSchema: SetStrokeJoinSchema,
  handler: async (params) => ({
    category: ToolCategory.STYLE_MODIFICATION,
    operation: 'setStrokeJoin',
    parameters: params
  })
};

export const setStrokeAlign: McpTool = {
  name: 'setStrokeAlign',
  description: 'Set stroke alignment (center, inside, or outside)',
  inputSchema: SetStrokeAlignSchema,
  handler: async (params) => ({
    category: ToolCategory.STYLE_MODIFICATION,
    operation: 'setStrokeAlign',
    parameters: params
  })
};

export const setStrokeDashPattern: McpTool = {
  name: 'setStrokeDashPattern',
  description: 'Set stroke dash pattern for dashed/dotted lines',
  inputSchema: SetStrokeDashPatternSchema,
  handler: async (params) => ({
    category: ToolCategory.STYLE_MODIFICATION,
    operation: 'setStrokeDashPattern',
    parameters: params
  })
};

export const setCornerRadius: McpTool = {
  name: 'setCornerRadius',
  description: 'Set corner radius for rectangles and other shapes (single value or per-corner)',
  inputSchema: SetCornerRadiusSchema,
  handler: async (params) => ({
    category: ToolCategory.STYLE_MODIFICATION,
    operation: 'setCornerRadius',
    parameters: params
  })
};

export const setEffects: McpTool = {
  name: 'setEffects',
  description: 'Set visual effects like drop shadows, inner shadows, and blur',
  inputSchema: SetEffectsSchema,
  handler: async (params) => ({
    category: ToolCategory.STYLE_MODIFICATION,
    operation: 'setEffects',
    parameters: params
  })
};

export const setConstraints: McpTool = {
  name: 'setConstraints',
  description: 'Set layout constraints for responsive resizing behavior',
  inputSchema: SetConstraintsSchema,
  handler: async (params) => ({
    category: ToolCategory.STYLE_MODIFICATION,
    operation: 'setConstraints',
    parameters: params
  })
};

export const setBlendModeStyle: McpTool = {
  name: 'setBlendModeStyle',
  description: 'Set blend mode for how node colors interact with layers below',
  inputSchema: SetBlendModeStyleSchema,
  handler: async (params) => ({
    category: ToolCategory.STYLE_MODIFICATION,
    operation: 'setBlendMode',
    parameters: params
  })
};

export const setOpacityStyle: McpTool = {
  name: 'setOpacityStyle',
  description: 'Set node opacity (0.0 = transparent, 1.0 = opaque)',
  inputSchema: SetOpacityStyleSchema,
  handler: async (params) => ({
    category: ToolCategory.STYLE_MODIFICATION,
    operation: 'setOpacity',
    parameters: params
  })
};

// Export all style modification tools
export const styleModificationTools: McpTool[] = [
  setFills,
  setStrokes,
  setStrokeWeight,
  setStrokeCap,
  setStrokeJoin,
  setStrokeAlign,
  setStrokeDashPattern,
  setCornerRadius,
  setEffects,
  setConstraints,
  setBlendModeStyle,
  setOpacityStyle
];