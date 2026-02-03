import { McpTool } from '../types.js';
import {
  SetPositionSchema,
  ResizeSchema,
  SetRotationSchema,
  SetOpacitySchema,
  SetVisibleSchema,
  SetLockedSchema,
  SetNameSchema,
  SetBlendModeSchema
} from '../schemas/index.js';

// === B2: NODE MODIFICATION TOOLS ===

export const setPosition: McpTool = {
  name: 'setPosition',
  description: 'Set the position (x, y coordinates) of a node',
  inputSchema: SetPositionSchema,
  handler: async (params) => {
    return {
      category: 'node-modification',
      operation: 'setPosition',
      parameters: params
    };
  }
};

export const resize: McpTool = {
  name: 'resize',
  description: 'Resize a node by setting its width and height',
  inputSchema: ResizeSchema,
  handler: async (params) => {
    return {
      category: 'node-modification',
      operation: 'resize',
      parameters: params
    };
  }
};

export const setRotation: McpTool = {
  name: 'setRotation',
  description: 'Set the rotation of a node in degrees',
  inputSchema: SetRotationSchema,
  handler: async (params) => {
    return {
      category: 'node-modification',
      operation: 'setRotation',
      parameters: params
    };
  }
};

export const setOpacity: McpTool = {
  name: 'setOpacity',
  description: 'Set the opacity of a node (0-1)',
  inputSchema: SetOpacitySchema,
  handler: async (params) => {
    return {
      category: 'node-modification',
      operation: 'setOpacity',
      parameters: params
    };
  }
};

export const setVisible: McpTool = {
  name: 'setVisible',
  description: 'Set the visibility of a node',
  inputSchema: SetVisibleSchema,
  handler: async (params) => {
    return {
      category: 'node-modification',
      operation: 'setVisible',
      parameters: params
    };
  }
};

export const setLocked: McpTool = {
  name: 'setLocked',
  description: 'Set the locked state of a node',
  inputSchema: SetLockedSchema,
  handler: async (params) => {
    return {
      category: 'node-modification',
      operation: 'setLocked',
      parameters: params
    };
  }
};

export const setName: McpTool = {
  name: 'setName',
  description: 'Set the name of a node',
  inputSchema: SetNameSchema,
  handler: async (params) => {
    return {
      category: 'node-modification',
      operation: 'setName',
      parameters: params
    };
  }
};

export const setBlendMode: McpTool = {
  name: 'setBlendMode',
  description: 'Set the blend mode of a node',
  inputSchema: SetBlendModeSchema,
  handler: async (params) => {
    return {
      category: 'node-modification',
      operation: 'setBlendMode',
      parameters: params
    };
  }
};

// Export all node modification tools
export const nodeModificationTools = [
  setPosition,
  resize,
  setRotation,
  setOpacity,
  setVisible,
  setLocked,
  setName,
  setBlendMode
];