// Paint Converter Utility
// Extract từ paint/effect conversion methods (lines 1734-1812)

import { ColorUtils } from './color-utils';
import { RGBA } from '../types';

export class PaintConverter {
  /**
   * Tạo Paint object từ màu
   * Extract từ createSolidPaint() method (lines 125-138)
   */
  static createSolidPaint(color: string | RGBA): Paint {
    let rgba: RGBA;
    if (typeof color === 'string') {
      rgba = ColorUtils.parseColorString(color);
    } else {
      rgba = { ...color, a: color.a ?? 1 };
    }

    return {
      type: 'SOLID',
      color: { r: rgba.r, g: rgba.g, b: rgba.b },
      opacity: rgba.a
    };
  }

  /**
   * Xử lý fill từ parameters
   * Extract từ processFill() method (lines 141-167)
   */
  static processFill(fill: any): Paint {
    if (typeof fill === 'string') {
      // String color (hex, rgb, hsl, etc.)
      return PaintConverter.createSolidPaint(fill);
    } else if (fill && typeof fill === 'object') {
      // Paint object từ schema
      if (fill.type === 'SOLID' && fill.color) {
        if (typeof fill.color === 'string') {
          // Hex color in paint object
          return PaintConverter.createSolidPaint(fill.color);
        } else {
          // RGBA object
          return {
            type: 'SOLID',
            color: { r: fill.color.r, g: fill.color.g, b: fill.color.b },
            opacity: fill.color.a ?? fill.opacity ?? 1
          };
        }
      } else {
        // Other paint types (gradients, images, etc.) - pass through
        return fill as Paint;
      }
    }

    // Fallback to black
    return PaintConverter.createSolidPaint('#000000');
  }

  /**
   * Chuyển đổi paint object thành Figma paint format
   * Extract từ convertPaintToFigma() method (lines 1735-1769)
   */
  static convertPaintToFigma(paint: any): Paint {
    switch (paint.type) {
      case 'SOLID':
        const rgb = ColorUtils.hexToRgb(paint.color) || { r: 0, g: 0, b: 0 };
        return {
          type: 'SOLID',
          color: rgb as RGBA,
          opacity: paint.opacity || 1
        };

      case 'GRADIENT_LINEAR':
      case 'GRADIENT_RADIAL':
      case 'GRADIENT_ANGULAR':
      case 'GRADIENT_DIAMOND':
        return {
          type: paint.type,
          gradientStops: paint.gradientStops.map((stop: any) => ({
            color: ColorUtils.hexToRgb(stop.color) as RGBA || { r: 0, g: 0, b: 0, a: 1 },
            position: stop.position
          })),
          gradientTransform: paint.gradientTransform || [[1, 0, 0], [0, 1, 0]]
        };

      case 'IMAGE':
        return {
          type: 'IMAGE',
          imageHash: paint.imageHash,
          scaleMode: paint.scaleMode || 'FILL',
          opacity: paint.opacity || 1
        };

      default:
        throw new Error(`Unsupported paint type: ${paint.type}`);
    }
  }

  /**
   * Chuyển đổi effect object thành Figma effect format
   * Extract từ convertEffectToFigma() method (lines 1771-1802)
   */
  static convertEffectToFigma(effect: any): Effect {
    switch (effect.type) {
      case 'DROP_SHADOW':
      case 'INNER_SHADOW':
        return {
          type: effect.type,
          color: ColorUtils.hexToRgb(effect.color) as RGBA || { r: 0, g: 0, b: 0, a: 1 },
          offset: effect.offset,
          radius: effect.radius,
          spread: effect.spread || 0,
          visible: effect.visible !== false,
          blendMode: effect.blendMode || 'NORMAL'
        };

      case 'LAYER_BLUR':
        return {
          type: 'LAYER_BLUR',
          radius: effect.radius,
          visible: effect.visible !== false
        } as BlurEffect;

      case 'BACKGROUND_BLUR':
        return {
          type: 'BACKGROUND_BLUR',
          radius: effect.radius,
          visible: effect.visible !== false
        } as BlurEffect;

      default:
        throw new Error(`Unsupported effect type: ${effect.type}`);
    }
  }

  /**
   * Validate paint object structure
   */
  static validatePaintObject(paint: any): boolean {
    if (!paint || typeof paint !== 'object') {
      return false;
    }

    if (!paint.type) {
      return false;
    }

    switch (paint.type) {
      case 'SOLID':
        return paint.color !== undefined;

      case 'GRADIENT_LINEAR':
      case 'GRADIENT_RADIAL':
      case 'GRADIENT_ANGULAR':
      case 'GRADIENT_DIAMOND':
        return Array.isArray(paint.gradientStops);

      case 'IMAGE':
        return typeof paint.imageHash === 'string';

      default:
        return false;
    }
  }

  /**
   * Validate effect object structure
   */
  static validateEffectObject(effect: any): boolean {
    if (!effect || typeof effect !== 'object') {
      return false;
    }

    if (!effect.type) {
      return false;
    }

    switch (effect.type) {
      case 'DROP_SHADOW':
      case 'INNER_SHADOW':
        return effect.color !== undefined &&
               effect.offset !== undefined &&
               typeof effect.radius === 'number';

      case 'LAYER_BLUR':
      case 'BACKGROUND_BLUR':
        return typeof effect.radius === 'number';

      default:
        return false;
    }
  }

  /**
   * Create default solid paint (black)
   */
  static createDefaultPaint(): Paint {
    return PaintConverter.createSolidPaint('#000000');
  }

  /**
   * Process array of fills with validation
   */
  static processFills(fills: any[]): Paint[] {
    if (!Array.isArray(fills)) {
      return [];
    }

    return fills
      .filter(fill => fill != null)
      .map(fill => {
        try {
          return PaintConverter.processFill(fill);
        } catch (error) {
          console.warn('Failed to process fill:', fill, error);
          return PaintConverter.createDefaultPaint();
        }
      });
  }

  /**
   * Process array of effects with validation
   */
  static processEffects(effects: any[]): Effect[] {
    if (!Array.isArray(effects)) {
      return [];
    }

    return effects
      .filter(effect => effect != null && PaintConverter.validateEffectObject(effect))
      .map(effect => {
        try {
          return PaintConverter.convertEffectToFigma(effect);
        } catch (error) {
          console.warn('Failed to process effect:', effect, error);
          return null;
        }
      })
      .filter((effect): effect is Effect => effect !== null);
  }
}