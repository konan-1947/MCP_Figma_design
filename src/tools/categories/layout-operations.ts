import { McpTool, FigmaCommandTemplate } from '../types.js';
import {
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
} from '../schemas/layout-operations-schemas.js';

// === LAYOUT ARRANGEMENT TOOLS ===

export const autoArrangeElements: McpTool = {
  name: 'autoArrangeElements',
  description: 'Auto-arrange multiple elements với smart positioning để prevent overlaps và create professional layouts',
  inputSchema: AutoArrangeElementsSchema,
  handler: async (params): Promise<FigmaCommandTemplate> => ({
    operation: 'layoutOperations',
    category: 'layout-operations',
    parameters: {
      ...params,
      action: 'autoArrangeElements'
    }
  })
};

export const distributeHorizontally: McpTool = {
  name: 'distributeHorizontally',
  description: 'Distribute elements horizontally với equal spacing for consistent layouts',
  inputSchema: DistributeHorizontallySchema,
  handler: async (params): Promise<FigmaCommandTemplate> => ({
    operation: 'layoutOperations',
    category: 'layout-operations',
    parameters: {
      ...params,
      action: 'distributeHorizontally'
    }
  })
};

export const distributeVertically: McpTool = {
  name: 'distributeVertically',
  description: 'Distribute elements vertically với equal spacing for consistent layouts',
  inputSchema: DistributeVerticallySchema,
  handler: async (params): Promise<FigmaCommandTemplate> => ({
    operation: 'layoutOperations',
    category: 'layout-operations',
    parameters: {
      ...params,
      action: 'distributeVertically'
    }
  })
};

// === ALIGNMENT TOOLS ===

export const alignLeft: McpTool = {
  name: 'alignLeft',
  description: 'Align multiple elements to their left edge for consistent left alignment',
  inputSchema: AlignLeftSchema,
  handler: async (params): Promise<FigmaCommandTemplate> => ({
    operation: 'layoutOperations',
    category: 'layout-operations',
    parameters: {
      ...params,
      action: 'alignLeft'
    }
  })
};

export const alignCenter: McpTool = {
  name: 'alignCenter',
  description: 'Align multiple elements to their horizontal center for centered layouts',
  inputSchema: AlignCenterSchema,
  handler: async (params): Promise<FigmaCommandTemplate> => ({
    operation: 'layoutOperations',
    category: 'layout-operations',
    parameters: {
      ...params,
      action: 'alignCenter'
    }
  })
};

export const alignRight: McpTool = {
  name: 'alignRight',
  description: 'Align multiple elements to their right edge for consistent right alignment',
  inputSchema: AlignRightSchema,
  handler: async (params): Promise<FigmaCommandTemplate> => ({
    operation: 'layoutOperations',
    category: 'layout-operations',
    parameters: {
      ...params,
      action: 'alignRight'
    }
  })
};

export const alignTop: McpTool = {
  name: 'alignTop',
  description: 'Align multiple elements to their top edge for consistent top alignment',
  inputSchema: AlignTopSchema,
  handler: async (params): Promise<FigmaCommandTemplate> => ({
    operation: 'layoutOperations',
    category: 'layout-operations',
    parameters: {
      ...params,
      action: 'alignTop'
    }
  })
};

export const alignMiddle: McpTool = {
  name: 'alignMiddle',
  description: 'Align multiple elements to their vertical center for centered layouts',
  inputSchema: AlignMiddleSchema,
  handler: async (params): Promise<FigmaCommandTemplate> => ({
    operation: 'layoutOperations',
    category: 'layout-operations',
    parameters: {
      ...params,
      action: 'alignMiddle'
    }
  })
};

export const alignBottom: McpTool = {
  name: 'alignBottom',
  description: 'Align multiple elements to their bottom edge for consistent bottom alignment',
  inputSchema: AlignBottomSchema,
  handler: async (params): Promise<FigmaCommandTemplate> => ({
    operation: 'layoutOperations',
    category: 'layout-operations',
    parameters: {
      ...params,
      action: 'alignBottom'
    }
  })
};

// === STACKING TOOLS ===

export const stackHorizontally: McpTool = {
  name: 'stackHorizontally',
  description: 'Stack elements horizontally với consistent spacing và optional vertical alignment',
  inputSchema: StackHorizontallySchema,
  handler: async (params): Promise<FigmaCommandTemplate> => ({
    operation: 'layoutOperations',
    category: 'layout-operations',
    parameters: {
      ...params,
      action: 'stackHorizontally'
    }
  })
};

export const stackVertically: McpTool = {
  name: 'stackVertically',
  description: 'Stack elements vertically với consistent spacing và optional horizontal alignment',
  inputSchema: StackVerticallySchema,
  handler: async (params): Promise<FigmaCommandTemplate> => ({
    operation: 'layoutOperations',
    category: 'layout-operations',
    parameters: {
      ...params,
      action: 'stackVertically'
    }
  })
};

// === GRID AND SNAP TOOLS ===

export const createGrid: McpTool = {
  name: 'createGrid',
  description: 'Arrange elements in a grid pattern với specified columns, rows và spacing',
  inputSchema: CreateGridSchema,
  handler: async (params): Promise<FigmaCommandTemplate> => ({
    operation: 'layoutOperations',
    category: 'layout-operations',
    parameters: {
      ...params,
      action: 'createGrid'
    }
  })
};

export const snapToGrid: McpTool = {
  name: 'snapToGrid',
  description: 'Snap element positions to grid để ensure consistent alignment và spacing',
  inputSchema: SnapToGridSchema,
  handler: async (params): Promise<FigmaCommandTemplate> => ({
    operation: 'layoutOperations',
    category: 'layout-operations',
    parameters: {
      ...params,
      action: 'snapToGrid'
    }
  })
};

// === SPACING AND GROUPING TOOLS ===

export const equalSpacing: McpTool = {
  name: 'equalSpacing',
  description: 'Apply equal spacing between elements trong specified direction for uniform layouts',
  inputSchema: EqualSpacingSchema,
  handler: async (params): Promise<FigmaCommandTemplate> => ({
    operation: 'layoutOperations',
    category: 'layout-operations',
    parameters: {
      ...params,
      action: 'equalSpacing'
    }
  })
};

export const groupElements: McpTool = {
  name: 'groupElements',
  description: 'Group multiple elements into a frame với specified padding for organization',
  inputSchema: GroupElementsSchema,
  handler: async (params): Promise<FigmaCommandTemplate> => ({
    operation: 'layoutOperations',
    category: 'layout-operations',
    parameters: {
      ...params,
      action: 'groupElements'
    }
  })
};

// === OPTIMIZATION TOOLS ===

export const optimizeLayout: McpTool = {
  name: 'optimizeLayout',
  description: 'Automatically optimize layout bằng cách remove overlaps và improve spacing for professional appearance',
  inputSchema: OptimizeLayoutSchema,
  handler: async (params): Promise<FigmaCommandTemplate> => ({
    operation: 'layoutOperations',
    category: 'layout-operations',
    parameters: {
      ...params,
      action: 'optimizeLayout'
    }
  })
};

// Export all layout operation tools
export const layoutOperationTools = [
  // Arrangement
  autoArrangeElements,
  distributeHorizontally,
  distributeVertically,

  // Alignment
  alignLeft,
  alignCenter,
  alignRight,
  alignTop,
  alignMiddle,
  alignBottom,

  // Stacking
  stackHorizontally,
  stackVertically,

  // Grid and Snap
  createGrid,
  snapToGrid,

  // Spacing and Grouping
  equalSpacing,
  groupElements,

  // Optimization
  optimizeLayout
];