// Text Operations Handler
// Extract từ text operations (lines 1302-1732) - Simplified version

import { ERROR_MESSAGES } from '../../core/config';

export class TextOperationsHandler {
  async handle(operation: string, params: any): Promise<any> {
    switch (operation) {
      case 'setCharacters':
        return await this.setCharacters(params);
      case 'setFontSize':
        return await this.setFontSize(params);
      case 'setFontName':
        return await this.setFontName(params);
      case 'setFontWeight':
        return await this.setFontWeight(params);
      case 'setTextAlignHorizontal':
        return await this.setTextAlignHorizontal(params);
      case 'setTextAlignVertical':
        return await this.setTextAlignVertical(params);
      case 'setTextCase':
        return await this.setTextCase(params);
      case 'setTextDecoration':
        return await this.setTextDecoration(params);
      case 'setLineHeight':
        return await this.setLineHeight(params);
      case 'setLetterSpacing':
        return await this.setLetterSpacing(params);
      case 'setParagraphSpacing':
        return await this.setParagraphSpacing(params);
      case 'setParagraphIndent':
        return await this.setParagraphIndent(params);
      case 'setTextAutoResize':
        return await this.setTextAutoResize(params);
      case 'setTextTruncation':
        return await this.setTextTruncation(params);
      case 'insertText':
        return await this.insertText(params);
      case 'deleteText':
        return await this.deleteText(params);
      case 'getTextRange':
        return await this.getTextRange(params);
      default:
        throw new Error(`Unknown text operation: ${operation}`);
    }
  }

  private validateTextNode(nodeId: string): TextNode {
    const node = figma.getNodeById(nodeId);

    if (!node) {
      throw new Error(ERROR_MESSAGES.NODE_NOT_FOUND(nodeId));
    }

    if (node.type !== 'TEXT') {
      throw new Error(`Node ${nodeId} is not a text node`);
    }

    return node as TextNode;
  }

  private async setCharacters(params: any): Promise<any> {
    const { nodeId, characters, range } = params;
    const textNode = this.validateTextNode(nodeId);

    if (range) {
      textNode.deleteCharacters(range.start, range.end);
      textNode.insertCharacters(range.start, characters);
    } else {
      textNode.characters = characters;
    }

    return {
      nodeId,
      characters: textNode.characters,
      length: textNode.characters.length
    };
  }

  private async setFontSize(params: any): Promise<any> {
    const { nodeId, fontSize, range } = params;
    const textNode = this.validateTextNode(nodeId);

    if (range) {
      textNode.setRangeFontSize(range.start, range.end, fontSize);
    } else {
      textNode.fontSize = fontSize;
    }

    return { nodeId, fontSize };
  }

  private async setFontName(params: any): Promise<any> {
    const { nodeId, fontName, range } = params;
    const textNode = this.validateTextNode(nodeId);

    await figma.loadFontAsync(fontName);

    if (range) {
      textNode.setRangeFontName(range.start, range.end, fontName);
    } else {
      textNode.fontName = fontName;
    }

    return { nodeId, fontName };
  }

  private async setFontWeight(params: any): Promise<any> {
    const { nodeId, fontWeight, range } = params;
    const textNode = this.validateTextNode(nodeId);

    let currentFontName: FontName;
    if (range) {
      currentFontName = textNode.getRangeFontName(range.start, range.end) as FontName;
    } else {
      currentFontName = textNode.fontName as FontName;
    }

    const newFontName: FontName = {
      family: currentFontName.family,
      style: fontWeight.toString()
    };

    await figma.loadFontAsync(newFontName);

    if (range) {
      textNode.setRangeFontName(range.start, range.end, newFontName);
    } else {
      textNode.fontName = newFontName;
    }

    return { nodeId, fontWeight, fontName: newFontName };
  }

  private async setTextAlignHorizontal(params: any): Promise<any> {
    const { nodeId, textAlignHorizontal } = params;
    const textNode = this.validateTextNode(nodeId);

    textNode.textAlignHorizontal = textAlignHorizontal;
    return { nodeId, textAlignHorizontal };
  }

  private async setTextAlignVertical(params: any): Promise<any> {
    const { nodeId, textAlignVertical } = params;
    const textNode = this.validateTextNode(nodeId);

    textNode.textAlignVertical = textAlignVertical;
    return { nodeId, textAlignVertical };
  }

  private async setTextCase(params: any): Promise<any> {
    const { nodeId, textCase, range } = params;
    const textNode = this.validateTextNode(nodeId);

    if (range) {
      textNode.setRangeTextCase(range.start, range.end, textCase);
    } else {
      textNode.textCase = textCase;
    }

    return { nodeId, textCase };
  }

  private async setTextDecoration(params: any): Promise<any> {
    const { nodeId, textDecoration, range } = params;
    const textNode = this.validateTextNode(nodeId);

    if (range) {
      textNode.setRangeTextDecoration(range.start, range.end, textDecoration);
    } else {
      textNode.textDecoration = textDecoration;
    }

    return { nodeId, textDecoration };
  }

  private async setLineHeight(params: any): Promise<any> {
    const { nodeId, lineHeight, range } = params;
    const textNode = this.validateTextNode(nodeId);

    if (range) {
      textNode.setRangeLineHeight(range.start, range.end, lineHeight);
    } else {
      textNode.lineHeight = lineHeight;
    }

    return { nodeId, lineHeight };
  }

  private async setLetterSpacing(params: any): Promise<any> {
    const { nodeId, letterSpacing, range } = params;
    const textNode = this.validateTextNode(nodeId);

    if (range) {
      textNode.setRangeLetterSpacing(range.start, range.end, letterSpacing);
    } else {
      textNode.letterSpacing = letterSpacing;
    }

    return { nodeId, letterSpacing };
  }

  private async setParagraphSpacing(params: any): Promise<any> {
    const { nodeId, paragraphSpacing } = params;
    const textNode = this.validateTextNode(nodeId);

    textNode.paragraphSpacing = paragraphSpacing;
    return { nodeId, paragraphSpacing };
  }

  private async setParagraphIndent(params: any): Promise<any> {
    const { nodeId, paragraphIndent } = params;
    const textNode = this.validateTextNode(nodeId);

    textNode.paragraphIndent = paragraphIndent;
    return { nodeId, paragraphIndent };
  }

  private async setTextAutoResize(params: any): Promise<any> {
    const { nodeId, textAutoResize } = params;
    const textNode = this.validateTextNode(nodeId);

    textNode.textAutoResize = textAutoResize;
    return { nodeId, textAutoResize };
  }

  private async setTextTruncation(params: any): Promise<any> {
    const { nodeId, maxLines } = params;
    const textNode = this.validateTextNode(nodeId);

    if (maxLines !== undefined) {
      textNode.maxLines = maxLines;
    }

    return { nodeId, maxLines };
  }

  private async insertText(params: any): Promise<any> {
    const { nodeId, text, position } = params;
    const textNode = this.validateTextNode(nodeId);

    textNode.insertCharacters(position, text);

    return {
      nodeId,
      insertedText: text,
      position,
      newLength: textNode.characters.length
    };
  }

  private async deleteText(params: any): Promise<any> {
    const { nodeId, range } = params;
    const textNode = this.validateTextNode(nodeId);

    const deletedText = textNode.characters.substring(range.start, range.end);
    textNode.deleteCharacters(range.start, range.end);

    return {
      nodeId,
      deletedText,
      range,
      newLength: textNode.characters.length
    };
  }

  private async getTextRange(params: any): Promise<any> {
    const { nodeId, range } = params;
    const textNode = this.validateTextNode(nodeId);

    const text = textNode.characters.substring(range.start, range.end);

    return {
      nodeId,
      range,
      text,
      fontSize: textNode.getRangeFontSize(range.start, range.end),
      fontName: textNode.getRangeFontName(range.start, range.end)
    };
  }

  getSupportedOperations(): string[] {
    return [
      'setCharacters',
      'setFontSize',
      'setFontName',
      'setFontWeight',
      'setTextAlignHorizontal',
      'setTextAlignVertical',
      'setTextCase',
      'setTextDecoration',
      'setLineHeight',
      'setLetterSpacing',
      'setParagraphSpacing',
      'setParagraphIndent',
      'setTextAutoResize',
      'setTextTruncation',
      'insertText',
      'deleteText',
      'getTextRange'
    ];
  }

  isOperationSupported(operation: string): boolean {
    return this.getSupportedOperations().includes(operation);
  }
}