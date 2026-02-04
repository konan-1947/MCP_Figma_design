// Style Modification Handler
// Extract từ style modification operations (lines 1046-1300)

import { PaintConverter } from '../../utilities/paint-converter';
import { ERROR_MESSAGES } from '../../core/config';

export class StyleModificationHandler {
  async handle(operation: string, params: any): Promise<any> {
    switch (operation) {
      case 'setFills':
        return await this.setFills(params);
      case 'setStrokes':
        return await this.setStrokes(params);
      case 'setStrokeWeight':
        return await this.setStrokeWeight(params);
      case 'setStrokeCap':
        return await this.setStrokeCap(params);
      case 'setStrokeJoin':
        return await this.setStrokeJoin(params);
      case 'setStrokeAlign':
        return await this.setStrokeAlign(params);
      case 'setStrokeDashPattern':
        return await this.setStrokeDashPattern(params);
      case 'setCornerRadius':
        return await this.setCornerRadius(params);
      case 'setEffects':
        return await this.setEffects(params);
      case 'setConstraints':
        return await this.setConstraints(params);
      case 'setBlendMode':
        return await this.setBlendModeStyle(params);
      case 'setOpacity':
        return await this.setOpacityStyle(params);
      default:
        throw new Error(`Unknown style modification operation: ${operation}`);
    }
  }

  private async setFills(params: any): Promise<any> {
    const { nodeId, fills } = params;
    const node = figma.getNodeById(nodeId);

    if (!node) {
      throw new Error(ERROR_MESSAGES.NODE_NOT_FOUND(nodeId));
    }

    if (!('fills' in node)) {
      throw new Error(ERROR_MESSAGES.INVALID_NODE_TYPE(nodeId, 'fills'));
    }

    const figmaFills = fills.map((fill: any) => PaintConverter.convertPaintToFigma(fill));
    (node as any).fills = figmaFills;

    return {
      nodeId,
      fillsCount: figmaFills.length
    };
  }

  private async setStrokes(params: any): Promise<any> {
    const { nodeId, strokes } = params;
    const node = figma.getNodeById(nodeId);

    if (!node) {
      throw new Error(ERROR_MESSAGES.NODE_NOT_FOUND(nodeId));
    }

    if (!('strokes' in node)) {
      throw new Error(ERROR_MESSAGES.INVALID_NODE_TYPE(nodeId, 'strokes'));
    }

    const figmaStrokes = strokes.map((stroke: any) => PaintConverter.convertPaintToFigma(stroke));
    (node as any).strokes = figmaStrokes;

    return {
      nodeId,
      strokesCount: figmaStrokes.length
    };
  }

  private async setStrokeWeight(params: any): Promise<any> {
    const { nodeId, weight } = params;
    const node = figma.getNodeById(nodeId);

    if (!node) {
      throw new Error(ERROR_MESSAGES.NODE_NOT_FOUND(nodeId));
    }

    if (!('strokeWeight' in node)) {
      throw new Error(ERROR_MESSAGES.INVALID_NODE_TYPE(nodeId, 'stroke weight'));
    }

    (node as any).strokeWeight = weight;

    return { nodeId, strokeWeight: weight };
  }

  private async setStrokeCap(params: any): Promise<any> {
    const { nodeId, strokeCap } = params;
    const node = figma.getNodeById(nodeId);

    if (!node) {
      throw new Error(ERROR_MESSAGES.NODE_NOT_FOUND(nodeId));
    }

    if (!('strokeCap' in node)) {
      throw new Error(ERROR_MESSAGES.INVALID_NODE_TYPE(nodeId, 'stroke cap'));
    }

    (node as any).strokeCap = strokeCap;
    return { nodeId, strokeCap };
  }

  private async setStrokeJoin(params: any): Promise<any> {
    const { nodeId, strokeJoin } = params;
    const node = figma.getNodeById(nodeId);

    if (!node) {
      throw new Error(ERROR_MESSAGES.NODE_NOT_FOUND(nodeId));
    }

    if (!('strokeJoin' in node)) {
      throw new Error(ERROR_MESSAGES.INVALID_NODE_TYPE(nodeId, 'stroke join'));
    }

    (node as any).strokeJoin = strokeJoin;
    return { nodeId, strokeJoin };
  }

  private async setStrokeAlign(params: any): Promise<any> {
    const { nodeId, strokeAlign } = params;
    const node = figma.getNodeById(nodeId);

    if (!node) {
      throw new Error(ERROR_MESSAGES.NODE_NOT_FOUND(nodeId));
    }

    if (!('strokeAlign' in node)) {
      throw new Error(ERROR_MESSAGES.INVALID_NODE_TYPE(nodeId, 'stroke align'));
    }

    (node as any).strokeAlign = strokeAlign;
    return { nodeId, strokeAlign };
  }

  private async setStrokeDashPattern(params: any): Promise<any> {
    const { nodeId, dashPattern } = params;
    const node = figma.getNodeById(nodeId);

    if (!node) {
      throw new Error(ERROR_MESSAGES.NODE_NOT_FOUND(nodeId));
    }

    if (!('dashPattern' in node)) {
      throw new Error(ERROR_MESSAGES.INVALID_NODE_TYPE(nodeId, 'dash pattern'));
    }

    (node as any).dashPattern = dashPattern;
    return { nodeId, dashPattern };
  }

  private async setCornerRadius(params: any): Promise<any> {
    const { nodeId, radius } = params;
    const node = figma.getNodeById(nodeId);

    if (!node) {
      throw new Error(ERROR_MESSAGES.NODE_NOT_FOUND(nodeId));
    }

    if (!('cornerRadius' in node)) {
      throw new Error(ERROR_MESSAGES.INVALID_NODE_TYPE(nodeId, 'corner radius'));
    }

    if (typeof radius === 'number') {
      (node as any).cornerRadius = radius;
    } else {
      (node as any).topLeftRadius = radius.topLeft;
      (node as any).topRightRadius = radius.topRight;
      (node as any).bottomLeftRadius = radius.bottomLeft;
      (node as any).bottomRightRadius = radius.bottomRight;
    }

    return { nodeId, radius };
  }

  private async setEffects(params: any): Promise<any> {
    const { nodeId, effects } = params;
    const node = figma.getNodeById(nodeId);

    if (!node) {
      throw new Error(ERROR_MESSAGES.NODE_NOT_FOUND(nodeId));
    }

    if (!('effects' in node)) {
      throw new Error(ERROR_MESSAGES.INVALID_NODE_TYPE(nodeId, 'effects'));
    }

    const figmaEffects = effects.map((effect: any) => PaintConverter.convertEffectToFigma(effect));
    (node as any).effects = figmaEffects;

    return { nodeId, effectsCount: figmaEffects.length };
  }

  private async setConstraints(params: any): Promise<any> {
    const { nodeId, constraints } = params;
    const node = figma.getNodeById(nodeId);

    if (!node) {
      throw new Error(ERROR_MESSAGES.NODE_NOT_FOUND(nodeId));
    }

    if (!('constraints' in node)) {
      throw new Error(ERROR_MESSAGES.INVALID_NODE_TYPE(nodeId, 'constraints'));
    }

    (node as any).constraints = {
      horizontal: constraints.horizontal,
      vertical: constraints.vertical
    };

    return { nodeId, constraints };
  }

  private async setBlendModeStyle(params: any): Promise<any> {
    const { nodeId, blendMode } = params;
    const node = figma.getNodeById(nodeId);

    if (!node) {
      throw new Error(ERROR_MESSAGES.NODE_NOT_FOUND(nodeId));
    }

    if (!('blendMode' in node)) {
      throw new Error(ERROR_MESSAGES.INVALID_NODE_TYPE(nodeId, 'blend mode'));
    }

    (node as any).blendMode = blendMode;
    return { nodeId, blendMode };
  }

  private async setOpacityStyle(params: any): Promise<any> {
    const { nodeId, opacity } = params;
    const node = figma.getNodeById(nodeId);

    if (!node) {
      throw new Error(ERROR_MESSAGES.NODE_NOT_FOUND(nodeId));
    }

    if (!('opacity' in node)) {
      throw new Error(ERROR_MESSAGES.INVALID_NODE_TYPE(nodeId, 'opacity'));
    }

    (node as any).opacity = opacity;
    return { nodeId, opacity };
  }

  getSupportedOperations(): string[] {
    return [
      'setFills',
      'setStrokes',
      'setStrokeWeight',
      'setStrokeCap',
      'setStrokeJoin',
      'setStrokeAlign',
      'setStrokeDashPattern',
      'setCornerRadius',
      'setEffects',
      'setConstraints',
      'setBlendMode',
      'setOpacity'
    ];
  }

  isOperationSupported(operation: string): boolean {
    return this.getSupportedOperations().includes(operation);
  }
}