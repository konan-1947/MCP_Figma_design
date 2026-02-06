import { z } from 'zod';
import { NodeIdSchema } from './primitives.js';

// === BASIC API PRIMITIVES ===

export const FileKeySchema = z.string()
  .min(1)
  .describe('Figma file key (extracted from Figma URL)');

export const ComponentKeySchema = z.string()
  .min(1)
  .describe('Figma component key');

export const StyleKeySchema = z.string()
  .min(1)
  .describe('Figma style key');

export const TeamIdSchema = z.string()
  .min(1)
  .describe('Figma team ID');

export const ProjectIdSchema = z.string()
  .min(1)
  .describe('Figma project ID');

export const VersionIdSchema = z.string()
  .min(1)
  .describe('Figma file version ID');

export const AccessTokenSchema = z.string()
  .min(1)
  .describe('Figma personal access token');

// === FILE OPERATIONS SCHEMAS ===

export const GetFileSchema = z.object({
  fileKey: FileKeySchema,
  version: VersionIdSchema.optional().describe('Optional specific version ID'),
  ids: z.array(NodeIdSchema).optional().describe('Array of specific node IDs to fetch'),
  depth: z.number().min(1).max(5).optional().describe('Tree depth for node children (1-5)'),
  geometry: z.enum(['paths', 'bounds']).optional().describe('Include geometry data'),
  plugin_data: z.string().optional().describe('Plugin ID to include plugin data'),
  branch_data: z.boolean().optional().describe('Include branch metadata')
}).describe('Get file data from Figma REST API');

export const GetFileNodesSchema = z.object({
  fileKey: FileKeySchema,
  nodeIds: z.array(NodeIdSchema).min(1).describe('Array of node IDs to fetch'),
  version: VersionIdSchema.optional().describe('Optional specific version ID'),
  depth: z.number().min(1).max(5).optional().describe('Tree depth for node children (1-5)'),
  geometry: z.enum(['paths', 'bounds']).optional().describe('Include geometry data'),
  plugin_data: z.string().optional().describe('Plugin ID to include plugin data')
}).describe('Get specific nodes from Figma file');

export const GetImagesSchema = z.object({
  fileKey: FileKeySchema,
  ids: z.array(NodeIdSchema).min(1).describe('Array of node IDs to export'),
  scale: z.number().min(0.01).max(4).optional().describe('Export scale (0.01 to 4)'),
  format: z.enum(['jpg', 'png', 'svg', 'pdf']).optional().default('png').describe('Export format'),
  svg_include_id: z.boolean().optional().describe('Include node IDs in SVG output'),
  svg_simplify_stroke: z.boolean().optional().describe('Simplify strokes in SVG'),
  use_absolute_bounds: z.boolean().optional().describe('Use absolute bounds for export'),
  version: VersionIdSchema.optional().describe('Optional specific version ID')
}).describe('Export images from Figma file nodes');

// === COMPONENT OPERATIONS SCHEMAS ===

export const GetTeamComponentsSchema = z.object({
  teamId: TeamIdSchema,
  page_size: z.number().min(1).max(100).optional().describe('Number of components per page (1-100)'),
  after: z.string().optional().describe('Pagination cursor for next page')
}).describe('Get components from team library');

export const GetFileComponentsSchema = z.object({
  fileKey: FileKeySchema
}).describe('Get components from specific file');

export const GetComponentSchema = z.object({
  componentKey: ComponentKeySchema
}).describe('Get detailed component information');

// === STYLE OPERATIONS SCHEMAS ===

export const GetTeamStylesSchema = z.object({
  teamId: TeamIdSchema,
  page_size: z.number().min(1).max(100).optional().describe('Number of styles per page (1-100)'),
  after: z.string().optional().describe('Pagination cursor for next page')
}).describe('Get styles from team library');

export const GetFileStylesSchema = z.object({
  fileKey: FileKeySchema
}).describe('Get styles from specific file');

export const GetStyleSchema = z.object({
  styleKey: StyleKeySchema
}).describe('Get detailed style information');

// === COMMENT OPERATIONS SCHEMAS ===

export const GetCommentsSchema = z.object({
  fileKey: FileKeySchema
}).describe('Get comments from Figma file');

// === DEV RESOURCES SCHEMAS (2025-2026 features) ===

export const GetLocalVariablesSchema = z.object({
  fileKey: FileKeySchema
}).describe('Get local variables from Figma file');

export const GetPublishedVariablesSchema = z.object({
  fileKey: FileKeySchema
}).describe('Get published variables from Figma file');

// === USER AND TEAM SCHEMAS ===

export const GetMeSchema = z.object({}).describe('Get current user information');

export const GetTeamProjectsSchema = z.object({
  teamId: TeamIdSchema
}).describe('Get projects from team');

export const GetProjectFilesSchema = z.object({
  projectId: ProjectIdSchema,
  branch_data: z.boolean().optional().describe('Include branch metadata for files')
}).describe('Get files from project');

// === TOKEN MANAGEMENT SCHEMAS ===

export const SetTokenSchema = z.object({
  token: AccessTokenSchema
}).describe('Set Figma personal access token');

export const ClearTokenSchema = z.object({}).describe('Clear stored Figma access token');

export const ValidateTokenSchema = z.object({}).describe('Validate current Figma access token');

// === UTILITY SCHEMAS ===

export const ExtractFileKeySchema = z.object({
  url: z.string().url().describe('Figma file URL to extract key from')
}).describe('Extract file key from Figma URL');

// === DESIGN QUALITY DIAGNOSTIC SCHEMAS ===

export const AnalyzeLayoutQualitySchema = z.object({
  fileKey: FileKeySchema,
  includeDetails: z.boolean().optional().default(true).describe('Include detailed analysis và recommendations')
}).describe('Analyze overall layout quality của Figma design với positioning, spacing, và grid compliance metrics');

export const DetectPositioningIssuesSchema = z.object({
  fileKey: FileKeySchema,
  focusArea: z.enum(['origin_clustering', 'overlaps', 'spacing', 'all']).optional().default('all').describe('Focus vào specific positioning issues'),
  severityThreshold: z.enum(['low', 'medium', 'high', 'critical']).optional().default('medium').describe('Minimum severity level để include trong results')
}).describe('Detect specific positioning issues như overlapping elements, origin clustering, poor spacing');

export const GenerateSpacingReportSchema = z.object({
  fileKey: FileKeySchema,
  gridSize: z.number().min(1).max(32).optional().default(8).describe('Design grid size (px) để check compliance'),
  minSpacing: z.number().min(1).max(100).optional().default(16).describe('Minimum recommended spacing (px)')
}).describe('Generate detailed spacing analysis report với distribution metrics và grid compliance');

export const CheckDesignSystemComplianceSchema = z.object({
  fileKey: FileKeySchema,
  gridSize: z.number().min(1).max(32).optional().default(8).describe('Design system grid size (px)'),
  checkSpacing: z.boolean().optional().default(true).describe('Check spacing consistency'),
  checkAlignment: z.boolean().optional().default(true).describe('Check element alignment'),
  generateReport: z.boolean().optional().default(true).describe('Generate comprehensive compliance report')
}).describe('Check design system compliance với grid, spacing, và alignment standards');

// Utility function to extract file key from Figma URL
export function extractFileKey(url: string): string | null {
  const patterns = [
    /\/file\/([a-zA-Z0-9]+)/,  // Standard file URL
    /\/proto\/([a-zA-Z0-9]+)/, // Prototype URL
    /\/design\/([a-zA-Z0-9]+)/ // Design URL
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }

  return null;
}

// === TYPE EXPORTS ===

export type FileKey = z.infer<typeof FileKeySchema>;
export type ComponentKey = z.infer<typeof ComponentKeySchema>;
export type StyleKey = z.infer<typeof StyleKeySchema>;
export type TeamId = z.infer<typeof TeamIdSchema>;
export type ProjectId = z.infer<typeof ProjectIdSchema>;
export type VersionId = z.infer<typeof VersionIdSchema>;
export type AccessToken = z.infer<typeof AccessTokenSchema>;

export type GetFileInput = z.infer<typeof GetFileSchema>;
export type GetFileNodesInput = z.infer<typeof GetFileNodesSchema>;
export type GetImagesInput = z.infer<typeof GetImagesSchema>;
export type GetTeamComponentsInput = z.infer<typeof GetTeamComponentsSchema>;
export type GetFileComponentsInput = z.infer<typeof GetFileComponentsSchema>;
export type GetComponentInput = z.infer<typeof GetComponentSchema>;
export type GetTeamStylesInput = z.infer<typeof GetTeamStylesSchema>;
export type GetFileStylesInput = z.infer<typeof GetFileStylesSchema>;
export type GetStyleInput = z.infer<typeof GetStyleSchema>;
export type GetCommentsInput = z.infer<typeof GetCommentsSchema>;
export type GetLocalVariablesInput = z.infer<typeof GetLocalVariablesSchema>;
export type GetPublishedVariablesInput = z.infer<typeof GetPublishedVariablesSchema>;
export type GetMeInput = z.infer<typeof GetMeSchema>;
export type GetTeamProjectsInput = z.infer<typeof GetTeamProjectsSchema>;
export type GetProjectFilesInput = z.infer<typeof GetProjectFilesSchema>;
export type SetTokenInput = z.infer<typeof SetTokenSchema>;
export type ClearTokenInput = z.infer<typeof ClearTokenSchema>;
export type ValidateTokenInput = z.infer<typeof ValidateTokenSchema>;
export type ExtractFileKeyInput = z.infer<typeof ExtractFileKeySchema>;

// Design Quality Diagnostic Types
export type AnalyzeLayoutQualityInput = z.infer<typeof AnalyzeLayoutQualitySchema>;
export type DetectPositioningIssuesInput = z.infer<typeof DetectPositioningIssuesSchema>;
export type GenerateSpacingReportInput = z.infer<typeof GenerateSpacingReportSchema>;
export type CheckDesignSystemComplianceInput = z.infer<typeof CheckDesignSystemComplianceSchema>;