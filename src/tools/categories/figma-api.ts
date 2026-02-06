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
  extractFileKey,
  // New diagnostic schemas
  AnalyzeLayoutQualitySchema,
  DetectPositioningIssuesSchema,
  GenerateSpacingReportSchema,
  CheckDesignSystemComplianceSchema
} from '../schemas/figma-api-schemas.js';
import { DesignQualityAnalyzer } from '../../utils/design-quality-analyzer.js';

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

    if (!(await figmaApiClient.hasAccessToken())) {
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

// === DESIGN QUALITY DIAGNOSTIC TOOLS ===

export const analyzeLayoutQuality: McpTool = {
  name: 'analyzeLayoutQuality',
  description: 'Analyze overall layout quality của Figma design với comprehensive metrics cho positioning, spacing, overlaps, và grid compliance',
  inputSchema: AnalyzeLayoutQualitySchema,
  handler: async (params): Promise<ApiToolResult> => {
    if (!figmaApiClient) {
      return { error: 'Figma API client not initialized' };
    }

    try {
      // Get file data với full node hierarchy
      const response = await figmaApiClient.getFile(params.fileKey, {
        depth: 2, // Get reasonable depth for analysis
        geometry: 'bounds' // Include bounding box data
      });

      if (response.error) {
        return {
          error: `Figma API Error: ${response.error.message || response.error.err}`,
          details: response.error
        };
      }

      // Analyze design quality
      const qualityReport = DesignQualityAnalyzer.analyzeFile({
        ...response.data,
        fileKey: params.fileKey
      });

      const result: any = {
        fileKey: params.fileKey,
        fileName: response.data.name,
        overallScore: qualityReport.metrics.layoutScore,
        metrics: qualityReport.metrics,
        summary: {
          status: qualityReport.metrics.layoutScore >= 80 ? 'excellent' :
                  qualityReport.metrics.layoutScore >= 60 ? 'good' :
                  qualityReport.metrics.layoutScore >= 40 ? 'needs_improvement' : 'poor',
          criticalIssues: qualityReport.issues.filter(i => i.severity === 'critical').length,
          totalIssues: qualityReport.issues.length
        }
      };

      if (params.includeDetails) {
        result.detailedAnalysis = {
          issues: qualityReport.issues,
          recommendations: qualityReport.recommendations,
          canvasUtilization: qualityReport.canvasUtilization
        };
      }

      return { data: result };

    } catch (error) {
      return {
        error: `Failed to analyze layout quality: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
};

export const detectPositioningIssues: McpTool = {
  name: 'detectPositioningIssues',
  description: 'Detect specific positioning problems như overlapping elements, origin clustering, poor spacing với detailed issue reports',
  inputSchema: DetectPositioningIssuesSchema,
  handler: async (params): Promise<ApiToolResult> => {
    if (!figmaApiClient) {
      return { error: 'Figma API client not initialized' };
    }

    try {
      const response = await figmaApiClient.getFile(params.fileKey, {
        depth: 2,
        geometry: 'bounds'
      });

      if (response.error) {
        return {
          error: `Figma API Error: ${response.error.message || response.error.err}`,
          details: response.error
        };
      }

      const qualityReport = DesignQualityAnalyzer.analyzeFile({
        ...response.data,
        fileKey: params.fileKey
      });

      // Filter issues based on focus area và severity
      let filteredIssues = qualityReport.issues;

      if (params.focusArea && params.focusArea !== 'all') {
        const focusMap = {
          'origin_clustering': 'origin_cluster',
          'overlaps': 'overlap',
          'spacing': 'poor_spacing'
        };
        filteredIssues = filteredIssues.filter(issue => issue.type === focusMap[params.focusArea as keyof typeof focusMap]);
      }

      // Filter by severity
      const severityLevels = ['low', 'medium', 'high', 'critical'];
      const minSeverityIndex = severityLevels.indexOf(params.severityThreshold || 'medium');
      filteredIssues = filteredIssues.filter(issue => {
        const issueSeverityIndex = severityLevels.indexOf(issue.severity);
        return issueSeverityIndex >= minSeverityIndex;
      });

      return {
        data: {
          fileKey: params.fileKey,
          focusArea: params.focusArea || 'all',
          severityThreshold: params.severityThreshold || 'medium',
          totalIssuesFound: filteredIssues.length,
          issueBreakdown: {
            critical: filteredIssues.filter(i => i.severity === 'critical').length,
            high: filteredIssues.filter(i => i.severity === 'high').length,
            medium: filteredIssues.filter(i => i.severity === 'medium').length,
            low: filteredIssues.filter(i => i.severity === 'low').length
          },
          issues: filteredIssues,
          quickFixes: filteredIssues
            .filter(issue => issue.recommendedFix)
            .map(issue => ({
              type: issue.type,
              fix: issue.recommendedFix
            }))
        }
      };

    } catch (error) {
      return {
        error: `Failed to detect positioning issues: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
};

export const generateSpacingReport: McpTool = {
  name: 'generateSpacingReport',
  description: 'Generate detailed spacing analysis với distribution metrics, grid compliance, và visual hierarchy assessment',
  inputSchema: GenerateSpacingReportSchema,
  handler: async (params): Promise<ApiToolResult> => {
    if (!figmaApiClient) {
      return { error: 'Figma API client not initialized' };
    }

    try {
      const response = await figmaApiClient.getFile(params.fileKey, {
        depth: 2,
        geometry: 'bounds'
      });

      if (response.error) {
        return {
          error: `Figma API Error: ${response.error.message || response.error.err}`,
          details: response.error
        };
      }

      const qualityReport = DesignQualityAnalyzer.analyzeFile({
        ...response.data,
        fileKey: params.fileKey
      });

      // Extract spacing-specific data
      const spacingIssues = qualityReport.issues.filter(issue =>
        issue.type === 'poor_spacing' || issue.type === 'grid_violation'
      );

      return {
        data: {
          fileKey: params.fileKey,
          gridSize: params.gridSize || 8,
          minSpacing: params.minSpacing || 16,
          metrics: {
            averageSpacing: qualityReport.metrics.averageSpacing,
            gridCompliance: qualityReport.metrics.gridCompliance,
            totalElements: qualityReport.metrics.totalElements
          },
          analysis: {
            spacingDistribution: {
              belowMinimum: qualityReport.issues.filter(i => i.type === 'poor_spacing').length,
              gridCompliant: Math.round((qualityReport.metrics.gridCompliance / 100) * qualityReport.metrics.totalElements),
              needsImprovement: spacingIssues.length
            },
            recommendations: qualityReport.recommendations.filter(rec =>
              rec.includes('spacing') || rec.includes('grid')
            )
          },
          spacingIssues,
          designSystemSuggestions: [
            `Set minimum spacing tới ${params.minSpacing || 16}px for consistency`,
            `Use ${params.gridSize || 8}px grid system cho alignment`,
            'Implement auto-layout containers cho consistent spacing',
            'Define spacing tokens (xs: 4px, sm: 8px, md: 16px, lg: 24px, xl: 32px)'
          ]
        }
      };

    } catch (error) {
      return {
        error: `Failed to generate spacing report: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
};

export const checkDesignSystemCompliance: McpTool = {
  name: 'checkDesignSystemCompliance',
  description: 'Check design system compliance với grid standards, spacing consistency, và alignment principles',
  inputSchema: CheckDesignSystemComplianceSchema,
  handler: async (params): Promise<ApiToolResult> => {
    if (!figmaApiClient) {
      return { error: 'Figma API client not initialized' };
    }

    try {
      const response = await figmaApiClient.getFile(params.fileKey, {
        depth: 2,
        geometry: 'bounds'
      });

      if (response.error) {
        return {
          error: `Figma API Error: ${response.error.message || response.error.err}`,
          details: response.error
        };
      }

      const qualityReport = DesignQualityAnalyzer.analyzeFile({
        ...response.data,
        fileKey: params.fileKey
      });

      const compliance = {
        overall: qualityReport.metrics.layoutScore,
        grid: qualityReport.metrics.gridCompliance,
        spacing: params.checkSpacing ?
          100 - ((qualityReport.issues.filter(i => i.type === 'poor_spacing').length / Math.max(1, qualityReport.metrics.totalElements)) * 100) :
          null,
        positioning: 100 - ((qualityReport.metrics.elementsAtOrigin / Math.max(1, qualityReport.metrics.totalElements)) * 100),
        overlap: 100 - ((qualityReport.metrics.overlappingElements / Math.max(1, qualityReport.metrics.totalElements)) * 100)
      };

      const result: any = {
        fileKey: params.fileKey,
        gridSize: params.gridSize || 8,
        complianceScore: {
          overall: Math.round(compliance.overall),
          breakdown: {
            gridCompliance: Math.round(compliance.grid),
            positioningQuality: Math.round(compliance.positioning),
            overlapFree: Math.round(compliance.overlap)
          }
        },
        violations: {
          gridViolations: qualityReport.issues.filter(i => i.type === 'grid_violation'),
          spacingViolations: params.checkSpacing ? qualityReport.issues.filter(i => i.type === 'poor_spacing') : [],
          positioningViolations: qualityReport.issues.filter(i => i.type === 'origin_cluster' || i.type === 'overlap')
        }
      };

      if (params.checkSpacing) {
        result.complianceScore.breakdown.spacingConsistency = Math.round(compliance.spacing!);
      }

      if (params.generateReport) {
        result.detailedReport = {
          summary: `Design system compliance: ${
            compliance.overall >= 90 ? 'Excellent' :
            compliance.overall >= 75 ? 'Good' :
            compliance.overall >= 60 ? 'Fair' : 'Needs Improvement'
          }`,
          recommendations: qualityReport.recommendations,
          nextSteps: [
            'Fix critical positioning issues first',
            'Implement consistent spacing system',
            'Align elements to grid',
            'Use design tokens for consistency'
          ],
          metrics: qualityReport.metrics
        };
      }

      return { data: result };

    } catch (error) {
      return {
        error: `Failed to check design system compliance: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
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

  // Design Quality Diagnostics
  analyzeLayoutQuality,
  detectPositioningIssues,
  generateSpacingReport,
  checkDesignSystemCompliance,

  // Utilities
  extractFileKeyFromUrl
];