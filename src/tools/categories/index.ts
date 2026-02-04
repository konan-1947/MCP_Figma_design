// Export all tool categories
export { nodeCreationTools } from './node-creation.js';
export { nodeModificationTools } from './node-modification.js';
export { styleModificationTools } from './style-modification.js';
export { textOperationTools } from './text-operations.js';
export { figmaApiTools } from './figma-api.js';

// Re-export individual tools for convenience
export * from './node-creation.js';
export * from './node-modification.js';
export * from './style-modification.js';
export * from './text-operations.js';
export * from './figma-api.js';

// Collect all tools for easy registration
import { nodeCreationTools } from './node-creation.js';
import { nodeModificationTools } from './node-modification.js';
import { styleModificationTools } from './style-modification.js';
import { textOperationTools } from './text-operations.js';
import { figmaApiTools } from './figma-api.js';

export const allTools = [
  ...nodeCreationTools,
  ...nodeModificationTools,
  ...styleModificationTools,
  ...textOperationTools,
  ...figmaApiTools
];

// Export tools by category for organized access
export const toolsByCategory = {
  'node-creation': nodeCreationTools,
  'node-modification': nodeModificationTools,
  'style-modification': styleModificationTools,
  'text-operations': textOperationTools,
  'figma-api': figmaApiTools
};