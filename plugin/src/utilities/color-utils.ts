// Color Utilities
// Extract từ FigmaHttpClient color methods (lines 52-167)

import { RGBA, RGB } from '../types';

export class ColorUtils {
  /**
   * Chuyển đổi hex color sang RGBA format (0-1 range)
   * Extract từ hexToRgba() method (lines 52-57)
   */
  static hexToRgba(hex: string, alpha: number = 1): RGBA {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    return { r, g, b, a: alpha };
  }

  /**
   * Chuyển đổi RGB sang RGBA format (0-1 range)
   * Extract từ rgbToRgba() method (lines 60-67)
   */
  static rgbToRgba(r: number, g: number, b: number, a: number = 1): RGBA {
    return {
      r: r / 255,
      g: g / 255,
      b: b / 255,
      a
    };
  }

  /**
   * Chuyển đổi HSL sang RGBA format (0-1 range)
   * Extract từ hslToRgba() method (lines 70-93)
   */
  static hslToRgba(h: number, s: number, l: number, a: number = 1): RGBA {
    h = h / 360;
    s = s / 100;
    l = l / 100;

    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;

    return {
      r: hue2rgb(p, q, h + 1/3),
      g: hue2rgb(p, q, h),
      b: hue2rgb(p, q, h - 1/3),
      a
    };
  }

  /**
   * Phân tích chuỗi màu từ nhiều định dạng
   * Extract từ parseColorString() method (lines 96-122)
   */
  static parseColorString(color: string): RGBA {
    // Handle hex colors
    if (color.startsWith('#')) {
      return ColorUtils.hexToRgba(color);
    }

    // Handle rgb() format: rgb(255, 0, 0)
    const rgbMatch = color.match(/rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/);
    if (rgbMatch) {
      return ColorUtils.rgbToRgba(parseInt(rgbMatch[1]), parseInt(rgbMatch[2]), parseInt(rgbMatch[3]));
    }

    // Handle rgba() format: rgba(255, 0, 0, 0.5)
    const rgbaMatch = color.match(/rgba\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([0-9.]+)\s*\)/);
    if (rgbaMatch) {
      return ColorUtils.rgbToRgba(parseInt(rgbaMatch[1]), parseInt(rgbaMatch[2]), parseInt(rgbaMatch[3]), parseFloat(rgbaMatch[4]));
    }

    // Handle hsl() format: hsl(0, 100%, 50%)
    const hslMatch = color.match(/hsl\s*\(\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%\s*\)/);
    if (hslMatch) {
      return ColorUtils.hslToRgba(parseInt(hslMatch[1]), parseInt(hslMatch[2]), parseInt(hslMatch[3]));
    }

    // Fallback to black for invalid format
    return { r: 0, g: 0, b: 0, a: 1 };
  }

  /**
   * Chuyển đổi hex sang RGB (0-1 range)
   * Extract từ hexToRgb() method (lines 1805-1812)
   */
  static hexToRgb(hex: string): RGB | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16) / 255,
      g: parseInt(result[2], 16) / 255,
      b: parseInt(result[3], 16) / 255
    } : null;
  }

  /**
   * Validate hex color format
   */
  static isValidHex(hex: string): boolean {
    return /^#[0-9A-F]{6}$/i.test(hex);
  }

  /**
   * Convert RGBA to RGB (ignoring alpha)
   */
  static rgbaToRgb(rgba: RGBA): RGB {
    return {
      r: rgba.r,
      g: rgba.g,
      b: rgba.b
    };
  }

  /**
   * Clamp color values to valid range (0-1)
   */
  static clampColorValue(value: number): number {
    return Math.max(0, Math.min(1, value));
  }

  /**
   * Clamp RGBA values
   */
  static clampRGBA(rgba: RGBA): RGBA {
    return {
      r: ColorUtils.clampColorValue(rgba.r),
      g: ColorUtils.clampColorValue(rgba.g),
      b: ColorUtils.clampColorValue(rgba.b),
      a: ColorUtils.clampColorValue(rgba.a)
    };
  }
}