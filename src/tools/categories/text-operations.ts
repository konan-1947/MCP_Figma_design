import { McpTool, ToolCategory } from '../types.js';
import {
  SetCharactersSchema,
  SetFontSizeSchema,
  SetFontNameSchema,
  SetFontWeightSchema,
  SetTextAlignHorizontalSchema,
  SetTextAlignVerticalSchema,
  SetTextCaseSchema,
  SetTextDecorationSchema,
  SetLineHeightSchema,
  SetLetterSpacingSchema,
  SetParagraphSpacingSchema,
  SetParagraphIndentSchema,
  SetTextAutoResizeSchema,
  SetTextTruncationSchema,
  InsertTextSchema,
  DeleteTextSchema,
  GetTextRangeSchema
} from '../schemas/index.js';

// === B4: Text Operations Tools ===

export const setCharacters: McpTool = {
  name: 'setCharacters',
  description: 'Set the text content of a text node (full text or specific range)',
  inputSchema: SetCharactersSchema,
  handler: async (params) => ({
    category: ToolCategory.TEXT_OPERATIONS,
    operation: 'setCharacters',
    parameters: params
  })
};

export const setFontSize: McpTool = {
  name: 'setFontSize',
  description: 'Set the font size for text (full text or specific range)',
  inputSchema: SetFontSizeSchema,
  handler: async (params) => ({
    category: ToolCategory.TEXT_OPERATIONS,
    operation: 'setFontSize',
    parameters: params
  })
};

export const setFontName: McpTool = {
  name: 'setFontName',
  description: 'Set the font family and style for text (full text or specific range)',
  inputSchema: SetFontNameSchema,
  handler: async (params) => ({
    category: ToolCategory.TEXT_OPERATIONS,
    operation: 'setFontName',
    parameters: params
  })
};

export const setFontWeight: McpTool = {
  name: 'setFontWeight',
  description: 'Set the font weight (100-900) for text (full text or specific range)',
  inputSchema: SetFontWeightSchema,
  handler: async (params) => ({
    category: ToolCategory.TEXT_OPERATIONS,
    operation: 'setFontWeight',
    parameters: params
  })
};

export const setTextAlignHorizontal: McpTool = {
  name: 'setTextAlignHorizontal',
  description: 'Set horizontal text alignment (left, center, right, justified)',
  inputSchema: SetTextAlignHorizontalSchema,
  handler: async (params) => ({
    category: ToolCategory.TEXT_OPERATIONS,
    operation: 'setTextAlignHorizontal',
    parameters: params
  })
};

export const setTextAlignVertical: McpTool = {
  name: 'setTextAlignVertical',
  description: 'Set vertical text alignment (top, center, bottom)',
  inputSchema: SetTextAlignVerticalSchema,
  handler: async (params) => ({
    category: ToolCategory.TEXT_OPERATIONS,
    operation: 'setTextAlignVertical',
    parameters: params
  })
};

export const setTextCase: McpTool = {
  name: 'setTextCase',
  description: 'Set text case transformation (original, upper, lower, title)',
  inputSchema: SetTextCaseSchema,
  handler: async (params) => ({
    category: ToolCategory.TEXT_OPERATIONS,
    operation: 'setTextCase',
    parameters: params
  })
};

export const setTextDecoration: McpTool = {
  name: 'setTextDecoration',
  description: 'Set text decoration (none, underline, strikethrough)',
  inputSchema: SetTextDecorationSchema,
  handler: async (params) => ({
    category: ToolCategory.TEXT_OPERATIONS,
    operation: 'setTextDecoration',
    parameters: params
  })
};

export const setLineHeight: McpTool = {
  name: 'setLineHeight',
  description: 'Set line height for text (auto, pixels, or percentage)',
  inputSchema: SetLineHeightSchema,
  handler: async (params) => ({
    category: ToolCategory.TEXT_OPERATIONS,
    operation: 'setLineHeight',
    parameters: params
  })
};

export const setLetterSpacing: McpTool = {
  name: 'setLetterSpacing',
  description: 'Set letter spacing for text (pixels or percentage)',
  inputSchema: SetLetterSpacingSchema,
  handler: async (params) => ({
    category: ToolCategory.TEXT_OPERATIONS,
    operation: 'setLetterSpacing',
    parameters: params
  })
};

export const setParagraphSpacing: McpTool = {
  name: 'setParagraphSpacing',
  description: 'Set spacing between paragraphs',
  inputSchema: SetParagraphSpacingSchema,
  handler: async (params) => ({
    category: ToolCategory.TEXT_OPERATIONS,
    operation: 'setParagraphSpacing',
    parameters: params
  })
};

export const setParagraphIndent: McpTool = {
  name: 'setParagraphIndent',
  description: 'Set first line indentation for paragraphs',
  inputSchema: SetParagraphIndentSchema,
  handler: async (params) => ({
    category: ToolCategory.TEXT_OPERATIONS,
    operation: 'setParagraphIndent',
    parameters: params
  })
};

export const setTextAutoResize: McpTool = {
  name: 'setTextAutoResize',
  description: 'Set text auto-resize behavior (none, width and height, height only, truncate)',
  inputSchema: SetTextAutoResizeSchema,
  handler: async (params) => ({
    category: ToolCategory.TEXT_OPERATIONS,
    operation: 'setTextAutoResize',
    parameters: params
  })
};

export const setTextTruncation: McpTool = {
  name: 'setTextTruncation',
  description: 'Set text truncation with maximum number of lines',
  inputSchema: SetTextTruncationSchema,
  handler: async (params) => ({
    category: ToolCategory.TEXT_OPERATIONS,
    operation: 'setTextTruncation',
    parameters: params
  })
};

export const insertText: McpTool = {
  name: 'insertText',
  description: 'Insert text at a specific position in a text node',
  inputSchema: InsertTextSchema,
  handler: async (params) => ({
    category: ToolCategory.TEXT_OPERATIONS,
    operation: 'insertText',
    parameters: params
  })
};

export const deleteText: McpTool = {
  name: 'deleteText',
  description: 'Delete text in a specific range from a text node',
  inputSchema: DeleteTextSchema,
  handler: async (params) => ({
    category: ToolCategory.TEXT_OPERATIONS,
    operation: 'deleteText',
    parameters: params
  })
};

export const getTextRange: McpTool = {
  name: 'getTextRange',
  description: 'Get text content and formatting for a specific range',
  inputSchema: GetTextRangeSchema,
  handler: async (params) => ({
    category: ToolCategory.TEXT_OPERATIONS,
    operation: 'getTextRange',
    parameters: params
  })
};

// Export all text operation tools
export const textOperationTools: McpTool[] = [
  setCharacters,
  setFontSize,
  setFontName,
  setFontWeight,
  setTextAlignHorizontal,
  setTextAlignVertical,
  setTextCase,
  setTextDecoration,
  setLineHeight,
  setLetterSpacing,
  setParagraphSpacing,
  setParagraphIndent,
  setTextAutoResize,
  setTextTruncation,
  insertText,
  deleteText,
  getTextRange
];