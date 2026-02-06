/**
 * Layout Calculator Utility
 * Smart positioning algorithms để prevent elements clustering và provide professional layouts
 */

export interface Point {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ElementInfo {
  id: string;
  name: string;
  bounds: Bounds;
  type: string;
}

export interface ViewportInfo {
  x: number;
  y: number;
  width: number;
  height: number;
  zoom: number;
}

export interface PositioningOptions {
  strategy?: 'auto-flow' | 'grid' | 'centered' | 'relative';
  gridSize?: number;
  minSpacing?: number;
  maxDistance?: number;
  avoidCollisions?: boolean;
}

/**
 * Advanced layout calculator với smart positioning algorithms
 */
export class LayoutCalculator {
  private static readonly DEFAULT_GRID_SIZE = 8;
  private static readonly DEFAULT_MIN_SPACING = 16;
  private static readonly DEFAULT_MAX_DISTANCE = 1000;

  /**
   * Calculate next optimal position cho một element mới
   */
  public static calculateNextPosition(
    elementType: string,
    size: Size,
    existingElements: ElementInfo[],
    viewport: ViewportInfo,
    options: PositioningOptions = {}
  ): Point {
    const {
      strategy = 'auto-flow',
      gridSize = this.DEFAULT_GRID_SIZE,
      minSpacing = this.DEFAULT_MIN_SPACING,
      maxDistance = this.DEFAULT_MAX_DISTANCE,
      avoidCollisions = true
    } = options;

    console.log(`[LayoutCalculator] Calculating position for ${elementType}, strategy: ${strategy}`);

    switch (strategy) {
      case 'grid':
        return this.calculateGridPosition(size, existingElements, viewport, { gridSize, minSpacing, avoidCollisions });

      case 'centered':
        return this.calculateCenteredPosition(size, existingElements, viewport, { minSpacing, avoidCollisions });

      case 'relative':
        return this.calculateRelativePosition(size, existingElements, viewport, { minSpacing, maxDistance, avoidCollisions });

      case 'auto-flow':
      default:
        return this.calculateAutoFlowPosition(size, existingElements, viewport, { gridSize, minSpacing, maxDistance, avoidCollisions });
    }
  }

  /**
   * Auto-flow positioning: Elements flow left-to-right, top-to-bottom
   */
  private static calculateAutoFlowPosition(
    size: Size,
    existingElements: ElementInfo[],
    viewport: ViewportInfo,
    options: { gridSize: number; minSpacing: number; maxDistance: number; avoidCollisions: boolean }
  ): Point {
    const { gridSize, minSpacing, maxDistance, avoidCollisions } = options;

    // Start positioning trong viewport
    const startX = this.snapToGrid(viewport.x + 40, gridSize);
    const startY = this.snapToGrid(viewport.y + 40, gridSize);

    // Nếu không có elements existing, đặt ở start position
    if (existingElements.length === 0) {
      return { x: startX, y: startY };
    }

    // Calculate bounding box của all existing elements
    const bounds = this.calculateContentBounds(existingElements);

    // Try positions trong flow pattern
    const candidates: Point[] = [];

    // Try next to last element (right side)
    const lastElement = this.findBottomRightElement(existingElements);
    if (lastElement) {
      candidates.push({
        x: this.snapToGrid(lastElement.bounds.x + lastElement.bounds.width + minSpacing, gridSize),
        y: this.snapToGrid(lastElement.bounds.y, gridSize)
      });
    }

    // Try below content area (new row)
    candidates.push({
      x: startX,
      y: this.snapToGrid(bounds.y + bounds.height + minSpacing, gridSize)
    });

    // Try inside viewport bounds
    for (let y = startY; y < viewport.y + viewport.height - size.height; y += minSpacing + gridSize) {
      for (let x = startX; x < viewport.x + viewport.width - size.width; x += minSpacing + gridSize) {
        const gridX = this.snapToGrid(x, gridSize);
        const gridY = this.snapToGrid(y, gridSize);
        candidates.push({ x: gridX, y: gridY });

        if (candidates.length > 50) break; // Prevent infinite loop
      }
      if (candidates.length > 50) break;
    }

    // Find best candidate
    return this.findBestPosition(candidates, size, existingElements, viewport, { avoidCollisions, maxDistance });
  }

  /**
   * Grid-based positioning: Snap to grid với optimal spacing
   */
  private static calculateGridPosition(
    size: Size,
    existingElements: ElementInfo[],
    viewport: ViewportInfo,
    options: { gridSize: number; minSpacing: number; avoidCollisions: boolean }
  ): Point {
    const { gridSize, minSpacing, avoidCollisions } = options;

    const startX = this.snapToGrid(viewport.x + gridSize, gridSize);
    const startY = this.snapToGrid(viewport.y + gridSize, gridSize);

    if (existingElements.length === 0) {
      return { x: startX, y: startY };
    }

    // Generate grid candidates
    const candidates: Point[] = [];
    const stepSize = Math.max(minSpacing, gridSize * 2);

    for (let y = startY; y < viewport.y + viewport.height - size.height; y += stepSize) {
      for (let x = startX; x < viewport.x + viewport.width - size.width; x += stepSize) {
        candidates.push({ x, y });
      }
    }

    return this.findBestPosition(candidates, size, existingElements, viewport, { avoidCollisions, maxDistance: this.DEFAULT_MAX_DISTANCE });
  }

  /**
   * Centered positioning: Center trong available space
   */
  private static calculateCenteredPosition(
    size: Size,
    existingElements: ElementInfo[],
    viewport: ViewportInfo,
    options: { minSpacing: number; avoidCollisions: boolean }
  ): Point {
    const { minSpacing, avoidCollisions } = options;

    // Calculate center của viewport
    let centerX = viewport.x + (viewport.width - size.width) / 2;
    let centerY = viewport.y + (viewport.height - size.height) / 2;

    // Snap to grid
    centerX = this.snapToGrid(centerX, this.DEFAULT_GRID_SIZE);
    centerY = this.snapToGrid(centerY, this.DEFAULT_GRID_SIZE);

    const basePosition = { x: centerX, y: centerY };

    if (!avoidCollisions || !this.hasCollision(basePosition, size, existingElements)) {
      return basePosition;
    }

    // If collision, try offset positions around center
    const candidates: Point[] = [];
    for (let offset = minSpacing; offset <= 200; offset += minSpacing) {
      candidates.push(
        { x: centerX + offset, y: centerY },
        { x: centerX - offset, y: centerY },
        { x: centerX, y: centerY + offset },
        { x: centerX, y: centerY - offset },
        { x: centerX + offset, y: centerY + offset },
        { x: centerX - offset, y: centerY - offset }
      );
    }

    return this.findBestPosition(candidates, size, existingElements, viewport, { avoidCollisions, maxDistance: this.DEFAULT_MAX_DISTANCE });
  }

  /**
   * Relative positioning: Position relative to existing elements
   */
  private static calculateRelativePosition(
    size: Size,
    existingElements: ElementInfo[],
    viewport: ViewportInfo,
    options: { minSpacing: number; maxDistance: number; avoidCollisions: boolean }
  ): Point {
    const { minSpacing, maxDistance, avoidCollisions } = options;

    if (existingElements.length === 0) {
      return this.calculateCenteredPosition(size, existingElements, viewport, { minSpacing, avoidCollisions });
    }

    // Find most recent hoặc largest element to position relative to
    const referenceElement = existingElements[existingElements.length - 1];
    const refBounds = referenceElement.bounds;

    const candidates: Point[] = [
      // Right of reference
      { x: refBounds.x + refBounds.width + minSpacing, y: refBounds.y },
      // Below reference
      { x: refBounds.x, y: refBounds.y + refBounds.height + minSpacing },
      // Above reference
      { x: refBounds.x, y: refBounds.y - size.height - minSpacing },
      // Left of reference (if space available)
      { x: refBounds.x - size.width - minSpacing, y: refBounds.y }
    ];

    // Snap to grid
    const gridCandidates = candidates.map(pos => ({
      x: this.snapToGrid(pos.x, this.DEFAULT_GRID_SIZE),
      y: this.snapToGrid(pos.y, this.DEFAULT_GRID_SIZE)
    }));

    return this.findBestPosition(gridCandidates, size, existingElements, viewport, { avoidCollisions, maxDistance });
  }

  /**
   * Find best position từ candidates dựa trên multiple criteria
   */
  private static findBestPosition(
    candidates: Point[],
    size: Size,
    existingElements: ElementInfo[],
    viewport: ViewportInfo,
    options: { avoidCollisions: boolean; maxDistance: number }
  ): Point {
    const { avoidCollisions, maxDistance } = options;

    // Score các candidates
    const scoredCandidates = candidates.map(pos => ({
      position: pos,
      score: this.scorePosition(pos, size, existingElements, viewport, { avoidCollisions, maxDistance })
    }));

    // Sort by score (higher is better)
    scoredCandidates.sort((a, b) => b.score - a.score);

    // Return best candidate, fallback to first if all scores are negative
    return scoredCandidates[0]?.position || candidates[0] || { x: 100, y: 100 };
  }

  /**
   * Score a position based on various criteria
   */
  private static scorePosition(
    position: Point,
    size: Size,
    existingElements: ElementInfo[],
    viewport: ViewportInfo,
    options: { avoidCollisions: boolean; maxDistance: number }
  ): number {
    let score = 100; // Base score

    const bounds: Bounds = { ...position, ...size };

    // Collision penalty
    if (options.avoidCollisions && this.hasCollision(position, size, existingElements)) {
      score -= 1000; // Major penalty for collision
    }

    // Viewport containment bonus
    if (this.isWithinViewport(bounds, viewport)) {
      score += 50;
    } else {
      score -= 200; // Penalty for being outside viewport
    }

    // Distance từ origin penalty (favor positions not at 0,0)
    const distanceFromOrigin = Math.sqrt(position.x ** 2 + position.y ** 2);
    if (distanceFromOrigin < 10) {
      score -= 500; // Heavy penalty for positions too close to origin
    }

    // Distance từ other elements (moderate spacing preferred)
    const minDistanceToOthers = this.getMinimumDistanceToElements(position, size, existingElements);
    if (minDistanceToOthers > 0) {
      score += Math.min(50, minDistanceToOthers); // Bonus for good spacing, capped
    }

    // Grid alignment bonus
    if (this.isGridAligned(position, this.DEFAULT_GRID_SIZE)) {
      score += 20;
    }

    // Content flow bonus (prefer positions that follow reading order)
    const contentBounds = this.calculateContentBounds(existingElements);
    if (existingElements.length > 0) {
      const isInFlow = this.isInContentFlow(position, size, contentBounds);
      if (isInFlow) {
        score += 30;
      }
    }

    return score;
  }

  /**
   * Detect collisions giữa new position và existing elements
   */
  public static hasCollision(position: Point, size: Size, existingElements: ElementInfo[]): boolean {
    const newBounds: Bounds = { ...position, ...size };

    return existingElements.some(element => this.boundsOverlap(newBounds, element.bounds));
  }

  /**
   * Check if two bounds overlap
   */
  private static boundsOverlap(bounds1: Bounds, bounds2: Bounds): boolean {
    return !(
      bounds1.x + bounds1.width <= bounds2.x ||
      bounds2.x + bounds2.width <= bounds1.x ||
      bounds1.y + bounds1.height <= bounds2.y ||
      bounds2.y + bounds2.height <= bounds1.y
    );
  }

  /**
   * Get available space trong viewport
   */
  public static getAvailableSpace(viewport: ViewportInfo, existingElements: ElementInfo[]): Bounds[] {
    // Simplified implementation - return viewport corners
    const padding = 40;
    return [
      {
        x: viewport.x + padding,
        y: viewport.y + padding,
        width: viewport.width - padding * 2,
        height: viewport.height - padding * 2
      }
    ];
  }

  /**
   * Calculate bounding box cho all existing elements
   */
  private static calculateContentBounds(elements: ElementInfo[]): Bounds {
    if (elements.length === 0) {
      return { x: 0, y: 0, width: 0, height: 0 };
    }

    const bounds = elements.map(el => el.bounds);
    const minX = Math.min(...bounds.map(b => b.x));
    const minY = Math.min(...bounds.map(b => b.y));
    const maxX = Math.max(...bounds.map(b => b.x + b.width));
    const maxY = Math.max(...bounds.map(b => b.y + b.height));

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    };
  }

  /**
   * Find element ở bottom-right corner (for flow positioning)
   */
  private static findBottomRightElement(elements: ElementInfo[]): ElementInfo | null {
    if (elements.length === 0) return null;

    return elements.reduce((bottomRight, current) => {
      const currentBottom = current.bounds.y + current.bounds.height;
      const currentRight = current.bounds.x + current.bounds.width;
      const brBottom = bottomRight.bounds.y + bottomRight.bounds.height;
      const brRight = bottomRight.bounds.x + bottomRight.bounds.width;

      // Prefer lower elements, then rightmost
      if (currentBottom > brBottom || (currentBottom === brBottom && currentRight > brRight)) {
        return current;
      }
      return bottomRight;
    });
  }

  /**
   * Snap coordinate to grid
   */
  private static snapToGrid(value: number, gridSize: number): number {
    return Math.round(value / gridSize) * gridSize;
  }

  /**
   * Check if position is within viewport
   */
  private static isWithinViewport(bounds: Bounds, viewport: ViewportInfo): boolean {
    return bounds.x >= viewport.x &&
           bounds.y >= viewport.y &&
           bounds.x + bounds.width <= viewport.x + viewport.width &&
           bounds.y + bounds.height <= viewport.y + viewport.height;
  }

  /**
   * Check if position is grid-aligned
   */
  private static isGridAligned(position: Point, gridSize: number): boolean {
    return position.x % gridSize === 0 && position.y % gridSize === 0;
  }

  /**
   * Get minimum distance to existing elements
   */
  private static getMinimumDistanceToElements(position: Point, size: Size, elements: ElementInfo[]): number {
    if (elements.length === 0) return Infinity;

    const newBounds: Bounds = { ...position, ...size };

    let minDistance = Infinity;
    for (const element of elements) {
      const distance = this.calculateDistanceBetweenBounds(newBounds, element.bounds);
      minDistance = Math.min(minDistance, distance);
    }

    return minDistance;
  }

  /**
   * Calculate distance between two bounds
   */
  private static calculateDistanceBetweenBounds(bounds1: Bounds, bounds2: Bounds): number {
    // Calculate closest edges
    const horizontalDistance = Math.max(0,
      Math.max(bounds1.x - (bounds2.x + bounds2.width), bounds2.x - (bounds1.x + bounds1.width))
    );

    const verticalDistance = Math.max(0,
      Math.max(bounds1.y - (bounds2.y + bounds2.height), bounds2.y - (bounds1.y + bounds1.height))
    );

    return Math.sqrt(horizontalDistance ** 2 + verticalDistance ** 2);
  }

  /**
   * Check if position follows content flow pattern
   */
  private static isInContentFlow(position: Point, size: Size, contentBounds: Bounds): boolean {
    const bounds: Bounds = { ...position, ...size };

    // Consider in-flow if positioned to the right hoặc below existing content
    return bounds.x >= contentBounds.x &&
           (bounds.y >= contentBounds.y || bounds.x >= contentBounds.x + contentBounds.width);
  }

  /**
   * Generate smart positioning suggestions
   */
  public static generatePositioningSuggestions(
    elementType: string,
    size: Size,
    existingElements: ElementInfo[],
    viewport: ViewportInfo
  ): Array<{ strategy: string; position: Point; description: string }> {
    const suggestions = [];

    // Auto-flow suggestion
    const autoFlow = this.calculateNextPosition(elementType, size, existingElements, viewport, { strategy: 'auto-flow' });
    suggestions.push({
      strategy: 'auto-flow',
      position: autoFlow,
      description: 'Elements flow naturally left-to-right, top-to-bottom'
    });

    // Grid suggestion
    const grid = this.calculateNextPosition(elementType, size, existingElements, viewport, { strategy: 'grid' });
    suggestions.push({
      strategy: 'grid',
      position: grid,
      description: 'Aligned to 8px design grid for consistency'
    });

    // Centered suggestion
    const centered = this.calculateNextPosition(elementType, size, existingElements, viewport, { strategy: 'centered' });
    suggestions.push({
      strategy: 'centered',
      position: centered,
      description: 'Centered trong available viewport space'
    });

    if (existingElements.length > 0) {
      // Relative suggestion
      const relative = this.calculateNextPosition(elementType, size, existingElements, viewport, { strategy: 'relative' });
      suggestions.push({
        strategy: 'relative',
        position: relative,
        description: 'Positioned relative to existing elements'
      });
    }

    return suggestions;
  }
}