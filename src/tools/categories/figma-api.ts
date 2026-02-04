import { McpTool, ApiToolResult } from '../types.js';
import {
  GetFileSchema,
  GetFileNodesSchema,
  GetImagesSchema,
  GetTeamComponentsSchema,
  GetFileComponentsSchema,
  GetComponentSchema,
  GetTeamStylesSchema,
  GetFileStylesSchema,
  GetStyleSchema,
  GetCommentsSchema,
  GetLocalVariablesSchema,
  GetPublishedVariablesSchema,
  GetMeSchema,
  GetTeamProjectsSchema,
  GetProjectFilesSchema,
  SetTokenSchema,
  ClearTokenSchema,
  ValidateTokenSchema,
  ExtractFileKeySchema,
  extractFileKey
} from '../schemas/figma-api-schemas.js';

// Global API client instance (will be injected)
let figmaApiClient: any = null;

export function setFigmaApiClient(client: any): void {
  figmaApiClient = client;
}

// === FILE OPERATIONS ===

export const getFile: McpTool = {
  name: 'getFile',
  description: 'Get file data from Figma REST API including document structure, nodes, and metadata',
  inputSchema: GetFileSchema,
  handler: async (params): Promise<ApiToolResult> => {
    if (!figmaApiClient) {
      return { error: 'Figma API client not initialized' };
    }

    const response = await figmaApiClient.getFile(params.fileKey, {
      version: params.version,
      ids: params.ids,
      depth: params.depth,
      geometry: params.geometry,
      plugin_data: params.plugin_data,
      branch_data: params.branch_data
    });

    if (response.error) {
      return {
        error: `Figma API Error: ${response.error.message || response.error.err}`,
        details: response.error
      };
    }

    return { data: response.data };
  }
};

export const getFileNodes: McpTool = {
  name: 'getFileNodes',
  description: 'Get specific nodes from a Figma file by their IDs',
  inputSchema: GetFileNodesSchema,
  handler: async (params): Promise<ApiToolResult> => {
    if (!figmaApiClient) {
      return { error: 'Figma API client not initialized' };
    }

    const response = await figmaApiClient.getFileNodes(params.fileKey, params.nodeIds, {
      version: params.version,
      depth: params.depth,
      geometry: params.geometry,
      plugin_data: params.plugin_data
    });

    if (response.error) {
      return {
        error: `Figma API Error: ${response.error.message || response.error.err}`,
        details: response.error
      };
    }

    return { data: response.data };
  }
};

export const getImages: McpTool = {
  name: 'getImages',
  description: 'Export images from Figma file nodes in various formats (PNG, JPG, SVG, PDF)',
  inputSchema: GetImagesSchema,
  handler: async (params): Promise<ApiToolResult> => {
    if (!figmaApiClient) {
      return { error: 'Figma API client not initialized' };
    }

    const response = await figmaApiClient.getImages(params.fileKey, {
      ids: params.ids,
      scale: params.scale,
      format: params.format,
      svg_include_id: params.svg_include_id,
      svg_simplify_stroke: params.svg_simplify_stroke,
      use_absolute_bounds: params.use_absolute_bounds,
      version: params.version
    });

    if (response.error) {
      return {
        error: `Figma API Error: ${response.error.message || response.error.err}`,
        details: response.error
      };
    }

    return { data: response.data };
  }
};

// === COMPONENT OPERATIONS ===

export const getTeamComponents: McpTool = {
  name: 'getTeamComponents',
  description: 'Get components from team library with pagination support',
  inputSchema: GetTeamComponentsSchema,
  handler: async (params): Promise<ApiToolResult> => {
    if (!figmaApiClient) {
      return { error: 'Figma API client not initialized' };
    }

    const response = await figmaApiClient.getTeamComponents(params.teamId, {
      page_size: params.page_size,
      after: params.after
    });

    if (response.error) {
      return {
        error: `Figma API Error: ${response.error.message || response.error.err}`,
        details: response.error
      };
    }

    return { data: response.data };
  }
};

export const getFileComponents: McpTool = {
  name: 'getFileComponents',
  description: 'Get all components from a specific Figma file',
  inputSchema: GetFileComponentsSchema,
  handler: async (params): Promise<ApiToolResult> => {
    if (!figmaApiClient) {
      return { error: 'Figma API client not initialized' };
    }

    const response = await figmaApiClient.getFileComponents(params.fileKey);

    if (response.error) {
      return {
        error: `Figma API Error: ${response.error.message || response.error.err}`,
        details: response.error
      };
    }

    return { data: response.data };
  }
};

export const getComponent: McpTool = {
  name: 'getComponent',
  description: 'Get detailed information about a specific component',
  inputSchema: GetComponentSchema,
  handler: async (params): Promise<ApiToolResult> => {
    if (!figmaApiClient) {
      return { error: 'Figma API client not initialized' };
    }

    const response = await figmaApiClient.getComponent(params.componentKey);

    if (response.error) {
      return {
        error: `Figma API Error: ${response.error.message || response.error.err}`,
        details: response.error
      };
    }

    return { data: response.data };
  }
};

// === STYLE OPERATIONS ===

export const getTeamStyles: McpTool = {
  name: 'getTeamStyles',
  description: 'Get styles from team library with pagination support',
  inputSchema: GetTeamStylesSchema,
  handler: async (params): Promise<ApiToolResult> => {
    if (!figmaApiClient) {
      return { error: 'Figma API client not initialized' };
    }

    const response = await figmaApiClient.getTeamStyles(params.teamId, {
      page_size: params.page_size,
      after: params.after
    });

    if (response.error) {
      return {
        error: `Figma API Error: ${response.error.message || response.error.err}`,
        details: response.error
      };
    }

    return { data: response.data };
  }
};

export const getFileStyles: McpTool = {
  name: 'getFileStyles',
  description: 'Get all styles from a specific Figma file',
  inputSchema: GetFileStylesSchema,
  handler: async (params): Promise<ApiToolResult> => {
    if (!figmaApiClient) {
      return { error: 'Figma API client not initialized' };
    }

    const response = await figmaApiClient.getFileStyles(params.fileKey);

    if (response.error) {
      return {
        error: `Figma API Error: ${response.error.message || response.error.err}`,
        details: response.error
      };
    }

    return { data: response.data };
  }
};

export const getStyle: McpTool = {
  name: 'getStyle',
  description: 'Get detailed information about a specific style',
  inputSchema: GetStyleSchema,
  handler: async (params): Promise<ApiToolResult> => {
    if (!figmaApiClient) {
      return { error: 'Figma API client not initialized' };
    }

    const response = await figmaApiClient.getStyle(params.styleKey);

    if (response.error) {
      return {
        error: `Figma API Error: ${response.error.message || response.error.err}`,
        details: response.error
      };
    }

    return { data: response.data };
  }
};

// === COMMENT OPERATIONS ===

export const getComments: McpTool = {
  name: 'getComments',
  description: 'Get all comments from a Figma file',
  inputSchema: GetCommentsSchema,
  handler: async (params): Promise<ApiToolResult> => {
    if (!figmaApiClient) {
      return { error: 'Figma API client not initialized' };
    }

    const response = await figmaApiClient.getComments(params.fileKey);

    if (response.error) {
      return {
        error: `Figma API Error: ${response.error.message || response.error.err}`,
        details: response.error
      };
    }

    return { data: response.data };
  }
};

// === DEV RESOURCES (2025-2026 features) ===

export const getLocalVariables: McpTool = {
  name: 'getLocalVariables',
  description: 'Get local variables from a Figma file',
  inputSchema: GetLocalVariablesSchema,
  handler: async (params): Promise<ApiToolResult> => {
    if (!figmaApiClient) {
      return { error: 'Figma API client not initialized' };
    }

    const response = await figmaApiClient.getLocalVariables(params.fileKey);

    if (response.error) {
      return {
        error: `Figma API Error: ${response.error.message || response.error.err}`,
        details: response.error
      };
    }

    return { data: response.data };
  }
};

export const getPublishedVariables: McpTool = {
  name: 'getPublishedVariables',
  description: 'Get published variables from a Figma file',
  inputSchema: GetPublishedVariablesSchema,
  handler: async (params): Promise<ApiToolResult> => {
    if (!figmaApiClient) {
      return { error: 'Figma API client not initialized' };
    }

    const response = await figmaApiClient.getPublishedVariables(params.fileKey);

    if (response.error) {
      return {
        error: `Figma API Error: ${response.error.message || response.error.err}`,
        details: response.error
      };
    }

    return { data: response.data };
  }
};

// === USER AND TEAM OPERATIONS ===

export const getMe: McpTool = {
  name: 'getMe',
  description: 'Get current user information and available teams',
  inputSchema: GetMeSchema,
  handler: async (params): Promise<ApiToolResult> => {
    if (!figmaApiClient) {
      return { error: 'Figma API client not initialized' };
    }

    const response = await figmaApiClient.getMe();

    if (response.error) {
      return {
        error: `Figma API Error: ${response.error.message || response.error.err}`,
        details: response.error
      };
    }

    return { data: response.data };
  }
};

export const getTeamProjects: McpTool = {
  name: 'getTeamProjects',
  description: 'Get all projects from a team',
  inputSchema: GetTeamProjectsSchema,
  handler: async (params): Promise<ApiToolResult> => {
    if (!figmaApiClient) {
      return { error: 'Figma API client not initialized' };
    }

    const response = await figmaApiClient.getTeamProjects(params.teamId);

    if (response.error) {
      return {
        error: `Figma API Error: ${response.error.message || response.error.err}`,
        details: response.error
      };
    }

    return { data: response.data };
  }
};

export const getProjectFiles: McpTool = {
  name: 'getProjectFiles',
  description: 'Get all files from a project',
  inputSchema: GetProjectFilesSchema,
  handler: async (params): Promise<ApiToolResult> => {
    if (!figmaApiClient) {
      return { error: 'Figma API client not initialized' };
    }

    const response = await figmaApiClient.getProjectFiles(params.projectId, {
      branch_data: params.branch_data
    });

    if (response.error) {
      return {
        error: `Figma API Error: ${response.error.message || response.error.err}`,
        details: response.error
      };
    }

    return { data: response.data };
  }
};

// === TOKEN MANAGEMENT ===

export const setToken: McpTool = {
  name: 'setToken',
  description: 'Set Figma personal access token for API authentication',
  inputSchema: SetTokenSchema,
  handler: async (params): Promise<ApiToolResult> => {
    if (!figmaApiClient) {
      return { error: 'Figma API client not initialized' };
    }

    try {
      // Set token via HTTP bridge
      const success = await figmaApiClient.setTokenViaBridge(params.token);

      if (!success) {
        return {
          error: 'Failed to set token via HTTP bridge'
        };
      }

      // Test the token by calling /me endpoint
      const response = await figmaApiClient.getMe();

      if (response.error) {
        await figmaApiClient.clearTokenViaBridge();
        return {
          error: `Invalid token: ${response.error.message || response.error.err}`,
          details: response.error
        };
      }

      return {
        data: {
          success: true,
          message: 'Access token set successfully',
          user: response.data
        }
      };
    } catch (error) {
      await figmaApiClient.clearTokenViaBridge();
      return {
        error: `Failed to set token: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
};

export const clearToken: McpTool = {
  name: 'clearToken',
  description: 'Clear stored Figma access token',
  inputSchema: ClearTokenSchema,
  handler: async (params): Promise<ApiToolResult> => {
    if (!figmaApiClient) {
      return { error: 'Figma API client not initialized' };
    }

    const success = await figmaApiClient.clearTokenViaBridge();

    if (!success) {
      return {
        error: 'Failed to clear token via HTTP bridge'
      };
    }

    return {
      data: {
        success: true,
        message: 'Access token cleared successfully'
      }
    };
  }
};

export const validateToken: McpTool = {
  name: 'validateToken',
  description: 'Validate current Figma access token',
  inputSchema: ValidateTokenSchema,
  handler: async (params): Promise<ApiToolResult> => {
    if (!figmaApiClient) {
      return { error: 'Figma API client not initialized' };
    }

    if (!figmaApiClient.hasAccessToken()) {
      return {
        data: {
          valid: false,
          message: 'No access token set'
        }
      };
    }

    const response = await figmaApiClient.getMe();

    if (response.error) {
      return {
        data: {
          valid: false,
          message: `Token validation failed: ${response.error.message || response.error.err}`,
          error: response.error
        }
      };
    }

    return {
      data: {
        valid: true,
        message: 'Access token is valid',
        user: response.data
      }
    };
  }
};

// === UTILITY TOOLS ===

export const extractFileKeyFromUrl: McpTool = {
  name: 'extractFileKeyFromUrl',
  description: 'Extract file key from Figma URL for use with API calls',
  inputSchema: ExtractFileKeySchema,
  handler: async (params): Promise<ApiToolResult> => {
    try {
      const fileKey = extractFileKey(params.url);

      if (!fileKey) {
        return {
          error: 'Could not extract file key from URL. Please provide a valid Figma file URL.'
        };
      }

      return {
        data: {
          fileKey,
          url: params.url,
          message: `Extracted file key: ${fileKey}`
        }
      };
    } catch (error) {
      return {
        error: `Failed to extract file key: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
};

// Export all REST API tools
export const figmaApiTools = [
  // File Operations
  getFile,
  getFileNodes,
  getImages,

  // Component Operations
  getTeamComponents,
  getFileComponents,
  getComponent,

  // Style Operations
  getTeamStyles,
  getFileStyles,
  getStyle,

  // Comment Operations
  getComments,

  // Dev Resources
  getLocalVariables,
  getPublishedVariables,

  // User and Team Operations
  getMe,
  getTeamProjects,
  getProjectFiles,

  // Token Management
  setToken,
  clearToken,
  validateToken,

  // Utilities
  extractFileKeyFromUrl
];