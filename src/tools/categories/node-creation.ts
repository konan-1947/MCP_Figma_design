import { McpTool } from '../types.js';
import {
  CreateFrameSchema,
  CreateRectangleSchema,
  CreateEllipseSchema,
  CreatePolygonSchema,
  CreateStarSchema,
  CreateLineSchema,
  CreateTextSchema,
  CreateComponentSchema,
  CreateComponentSetSchema,
  CreateInstanceSchema,
  CreateSliceSchema,
  CreateVectorSchema,
  CreateBooleanOperationSchema,
  // Batch operation schemas
  CreateMultipleShapesSchema,
  CreateShapeGridSchema,
  CreateDiagramElementsSchema
} from '../schemas/index.js';

// === B1: NODE CREATION TOOLS ===

export const createFrame: McpTool = {
  name: 'createFrame',
  description: 'Create a new frame node on the Figma canvas',
  inputSchema: CreateFrameSchema,
  handler: async (params) => {
    return {
      category: 'node-creation',
      operation: 'createFrame',
      parameters: params
    };
  }
};

export const createRectangle: McpTool = {
  name: 'createRectangle',
  description: 'Create a new rectangle node on the Figma canvas',
  inputSchema: CreateRectangleSchema,
  handler: async (params) => {
    return {
      category: 'node-creation',
      operation: 'createRectangle',
      parameters: params
    };
  }
};

export const createEllipse: McpTool = {
  name: 'createEllipse',
  description: 'Create a new ellipse node on the Figma canvas',
  inputSchema: CreateEllipseSchema,
  handler: async (params) => {
    return {
      category: 'node-creation',
      operation: 'createEllipse',
      parameters: params
    };
  }
};

export const createPolygon: McpTool = {
  name: 'createPolygon',
  description: 'Create a new polygon node on the Figma canvas',
  inputSchema: CreatePolygonSchema,
  handler: async (params) => {
    return {
      category: 'node-creation',
      operation: 'createPolygon',
      parameters: params
    };
  }
};

export const createStar: McpTool = {
  name: 'createStar',
  description: 'Create a new star node on the Figma canvas',
  inputSchema: CreateStarSchema,
  handler: async (params) => {
    return {
      category: 'node-creation',
      operation: 'createStar',
      parameters: params
    };
  }
};

export const createLine: McpTool = {
  name: 'createLine',
  description: 'Create a new line node on the Figma canvas',
  inputSchema: CreateLineSchema,
  handler: async (params) => {
    return {
      category: 'node-creation',
      operation: 'createLine',
      parameters: params
    };
  }
};

export const createText: McpTool = {
  name: 'createText',
  description: 'Create a new text node on the Figma canvas',
  inputSchema: CreateTextSchema,
  handler: async (params) => {
    return {
      category: 'node-creation',
      operation: 'createText',
      parameters: params
    };
  }
};

export const createComponent: McpTool = {
  name: 'createComponent',
  description: 'Create a new component from existing nodes or empty',
  inputSchema: CreateComponentSchema,
  handler: async (params) => {
    return {
      category: 'node-creation',
      operation: 'createComponent',
      parameters: params
    };
  }
};

export const createComponentSet: McpTool = {
  name: 'createComponentSet',
  description: 'Create a new component set with variants',
  inputSchema: CreateComponentSetSchema,
  handler: async (params) => {
    return {
      category: 'node-creation',
      operation: 'createComponentSet',
      parameters: params
    };
  }
};

export const createInstance: McpTool = {
  name: 'createInstance',
  description: 'Create an instance of an existing component',
  inputSchema: CreateInstanceSchema,
  handler: async (params) => {
    return {
      category: 'node-creation',
      operation: 'createInstance',
      parameters: params
    };
  }
};

export const createSlice: McpTool = {
  name: 'createSlice',
  description: 'Create a new slice node for exporting',
  inputSchema: CreateSliceSchema,
  handler: async (params) => {
    return {
      category: 'node-creation',
      operation: 'createSlice',
      parameters: params
    };
  }
};

export const createVector: McpTool = {
  name: 'createVector',
  description: 'Create a new vector node with custom paths',
  inputSchema: CreateVectorSchema,
  handler: async (params) => {
    return {
      category: 'node-creation',
      operation: 'createVector',
      parameters: params
    };
  }
};

export const createBooleanOperation: McpTool = {
  name: 'createBooleanOperation',
  description: 'Create a boolean operation from existing nodes',
  inputSchema: CreateBooleanOperationSchema,
  handler: async (params) => {
    return {
      category: 'node-creation',
      operation: 'createBooleanOperation',
      parameters: params
    };
  }
};

// === BATCH CREATION TOOLS ===

export const createMultipleShapes: McpTool = {
  name: 'createMultipleShapes',
  description: 'Create multiple shapes (rectangles, ellipses, text) in a single operation for faster drawing',
  inputSchema: CreateMultipleShapesSchema,
  handler: async (params) => {
    return {
      category: 'node-creation',
      operation: 'createMultipleShapes',
      parameters: params
    };
  }
};

export const createShapeGrid: McpTool = {
  name: 'createShapeGrid',
  description: 'Create a grid of shapes with specified rows, columns, and spacing for rapid prototyping',
  inputSchema: CreateShapeGridSchema,
  handler: async (params) => {
    return {
      category: 'node-creation',
      operation: 'createShapeGrid',
      parameters: params
    };
  }
};

export const createDiagramElements: McpTool = {
  name: 'createDiagramElements',
  description: 'Create complex diagram elements like forms, UI layouts, or button groups efficiently',
  inputSchema: CreateDiagramElementsSchema,
  handler: async (params) => {
    return {
      category: 'node-creation',
      operation: 'createDiagramElements',
      parameters: params
    };
  }
};

// Export all node creation tools
export const nodeCreationTools = [
  createFrame,
  createRectangle,
  createEllipse,
  createPolygon,
  createStar,
  createLine,
  createText,
  createComponent,
  createComponentSet,
  createInstance,
  createSlice,
  createVector,
  createBooleanOperation,
  // Batch creation tools
  createMultipleShapes,
  createShapeGrid,
  createDiagramElements
];