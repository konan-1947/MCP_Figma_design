/**
 * Layout Operations Handler
 * Advanced layout management operations cho professional design workflows
 */

import {
  LayoutCalculator,
  Point,
  Size,
  ElementInfo,
  ViewportInfo
} from '../../utilities/layout-calculator';

export class LayoutOperationsHandler {
  /**
   * Handle layout operations
   */
  async handle(operation: string, params: any): Promise<any> {
    switch (operation) {
      case 'autoArrangeElements':
        return await this.autoArrangeElements(params);

      case 'distributeHorizontally':
        return await this.distributeHorizontally(params);

      case 'distributeVertically':
        return await this.distributeVertically(params);

      case 'alignLeft':
        return await this.alignLeft(params);

      case 'alignCenter':
        return await this.alignCenter(params);

      case 'alignRight':
        return await this.alignRight(params);

      case 'alignTop':
        return await this.alignTop(params);

      case 'alignMiddle':
        return await this.alignMiddle(params);

      case 'alignBottom':
        return await this.alignBottom(params);

      case 'stackHorizontally':
        return await this.stackHorizontally(params);

      case 'stackVertically':
        return await this.stackVertically(params);

      case 'createGrid':
        return await this.createGrid(params);

      case 'snapToGrid':
        return await this.snapToGrid(params);

      case 'equalSpacing':
        return await this.equalSpacing(params);

      case 'groupElements':
        return await this.groupElements(params);

      case 'optimizeLayout':
        return await this.optimizeLayout(params);

      default:
        throw new Error(`Unknown layout operation: ${operation}`);
    }
  }

  /**
   * Auto-arrange elements để prevent overlaps và improve layout
   */
  private async autoArrangeElements(params: any): Promise<any> {
    const {
      nodeIds,
      strategy = 'flow',
      spacing = 16,
      gridSize = 8,
      alignToGrid = true
    } = params;

    console.log(`[LayoutOperations] Auto-arranging ${nodeIds.length} elements with strategy: ${strategy}`);

    const nodes = this.getNodesByIds(nodeIds);
    const results: any[] = [];

    if (nodes.length === 0) {
      throw new Error('No valid nodes found for auto-arrangement');
    }

    // Get viewport information
    const viewport = this.getCurrentViewport();

    // Calculate new positions based on strategy
    let newPositions: Point[] = [];

    switch (strategy) {
      case 'flow':
        newPositions = this.calculateFlowPositions(nodes, viewport, spacing, gridSize);
        break;
      case 'grid':
        newPositions = this.calculateGridPositions(nodes, viewport, spacing);
        break;
      case 'circular':
        newPositions = this.calculateCircularPositions(nodes, viewport, spacing);
        break;
      case 'compact':
        newPositions = this.calculateCompactPositions(nodes, viewport, spacing);
        break;
      default:
        throw new Error(`Unsupported arrangement strategy: ${strategy}`);
    }

    // Apply new positions
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      const newPosition = newPositions[i];

      if (alignToGrid) {
        newPosition.x = this.snapValueToGrid(newPosition.x, gridSize);
        newPosition.y = this.snapValueToGrid(newPosition.y, gridSize);
      }

      node.x = newPosition.x;
      node.y = newPosition.y;

      results.push({
        id: node.id,
        name: node.name,
        oldPosition: { x: node.x, y: node.y },
        newPosition: { x: newPosition.x, y: newPosition.y }
      });
    }

    return {
      success: true,
      strategy,
      arrangedElements: results,
      count: results.length,
      summary: `Auto-arranged ${results.length} elements using ${strategy} strategy`
    };
  }

  /**
   * Distribute elements horizontally với equal spacing
   */
  private async distributeHorizontally(params: any): Promise<any> {
    const { nodeIds, spacing } = params;
    const nodes = this.getNodesByIds(nodeIds);

    if (nodes.length < 2) {
      throw new Error('Need at least 2 nodes for horizontal distribution');
    }

    // Sort nodes by current x position
    const sortedNodes = nodes.sort((a, b) => a.x - b.x);
    const results: any[] = [];

    // Calculate total width needed
    let currentX = sortedNodes[0].x;

    for (let i = 0; i < sortedNodes.length; i++) {
      const node = sortedNodes[i];
      const oldX = node.x;

      if (i > 0) {
        currentX += spacing;
      }

      node.x = currentX;
      currentX += node.width;

      results.push({
        id: node.id,
        name: node.name,
        oldPosition: { x: oldX, y: node.y },
        newPosition: { x: node.x, y: node.y },
        moved: oldX !== node.x
      });
    }

    return {
      success: true,
      distributedElements: results,
      count: results.length,
      spacing,
      totalWidth: currentX - sortedNodes[0].x
    };
  }

  /**
   * Distribute elements vertically với equal spacing
   */
  private async distributeVertically(params: any): Promise<any> {
    const { nodeIds, spacing } = params;
    const nodes = this.getNodesByIds(nodeIds);

    if (nodes.length < 2) {
      throw new Error('Need at least 2 nodes for vertical distribution');
    }

    // Sort nodes by current y position
    const sortedNodes = nodes.sort((a, b) => a.y - b.y);
    const results: any[] = [];

    // Calculate total height needed
    let currentY = sortedNodes[0].y;

    for (let i = 0; i < sortedNodes.length; i++) {
      const node = sortedNodes[i];
      const oldY = node.y;

      if (i > 0) {
        currentY += spacing;
      }

      node.y = currentY;
      currentY += node.height;

      results.push({
        id: node.id,
        name: node.name,
        oldPosition: { x: node.x, y: oldY },
        newPosition: { x: node.x, y: node.y },
        moved: oldY !== node.y
      });
    }

    return {
      success: true,
      distributedElements: results,
      count: results.length,
      spacing,
      totalHeight: currentY - sortedNodes[0].y
    };
  }

  /**
   * Align elements to left edge
   */
  private async alignLeft(params: any): Promise<any> {
    const { nodeIds, alignTo = 'selection' } = params;
    const nodes = this.getNodesByIds(nodeIds);

    if (nodes.length === 0) {
      throw new Error('No valid nodes found for alignment');
    }

    const leftmostX = Math.min(...nodes.map(node => node.x));
    const results: any[] = [];

    for (const node of nodes) {
      const oldX = node.x;
      node.x = leftmostX;

      results.push({
        id: node.id,
        name: node.name,
        oldPosition: { x: oldX, y: node.y },
        newPosition: { x: node.x, y: node.y },
        moved: oldX !== node.x
      });
    }

    return {
      success: true,
      alignedElements: results,
      alignmentX: leftmostX,
      count: results.length
    };
  }

  /**
   * Align elements center horizontally
   */
  private async alignCenter(params: any): Promise<any> {
    const { nodeIds } = params;
    const nodes = this.getNodesByIds(nodeIds);

    if (nodes.length === 0) {
      throw new Error('No valid nodes found for alignment');
    }

    // Calculate center of selection
    const leftmost = Math.min(...nodes.map(node => node.x));
    const rightmost = Math.max(...nodes.map(node => node.x + node.width));
    const centerX = (leftmost + rightmost) / 2;

    const results: any[] = [];

    for (const node of nodes) {
      const oldX = node.x;
      node.x = centerX - (node.width / 2);

      results.push({
        id: node.id,
        name: node.name,
        oldPosition: { x: oldX, y: node.y },
        newPosition: { x: node.x, y: node.y },
        moved: oldX !== node.x
      });
    }

    return {
      success: true,
      alignedElements: results,
      alignmentX: centerX,
      count: results.length
    };
  }

  /**
   * Align elements to right edge
   */
  private async alignRight(params: any): Promise<any> {
    const { nodeIds } = params;
    const nodes = this.getNodesByIds(nodeIds);

    if (nodes.length === 0) {
      throw new Error('No valid nodes found for alignment');
    }

    const rightmostX = Math.max(...nodes.map(node => node.x + node.width));
    const results: any[] = [];

    for (const node of nodes) {
      const oldX = node.x;
      node.x = rightmostX - node.width;

      results.push({
        id: node.id,
        name: node.name,
        oldPosition: { x: oldX, y: node.y },
        newPosition: { x: node.x, y: node.y },
        moved: oldX !== node.x
      });
    }

    return {
      success: true,
      alignedElements: results,
      alignmentX: rightmostX,
      count: results.length
    };
  }

  /**
   * Align elements to top edge
   */
  private async alignTop(params: any): Promise<any> {
    const { nodeIds } = params;
    const nodes = this.getNodesByIds(nodeIds);

    if (nodes.length === 0) {
      throw new Error('No valid nodes found for alignment');
    }

    const topmostY = Math.min(...nodes.map(node => node.y));
    const results: any[] = [];

    for (const node of nodes) {
      const oldY = node.y;
      node.y = topmostY;

      results.push({
        id: node.id,
        name: node.name,
        oldPosition: { x: node.x, y: oldY },
        newPosition: { x: node.x, y: node.y },
        moved: oldY !== node.y
      });
    }

    return {
      success: true,
      alignedElements: results,
      alignmentY: topmostY,
      count: results.length
    };
  }

  /**
   * Align elements center vertically
   */
  private async alignMiddle(params: any): Promise<any> {
    const { nodeIds } = params;
    const nodes = this.getNodesByIds(nodeIds);

    if (nodes.length === 0) {
      throw new Error('No valid nodes found for alignment');
    }

    // Calculate center of selection
    const topmost = Math.min(...nodes.map(node => node.y));
    const bottommost = Math.max(...nodes.map(node => node.y + node.height));
    const centerY = (topmost + bottommost) / 2;

    const results: any[] = [];

    for (const node of nodes) {
      const oldY = node.y;
      node.y = centerY - (node.height / 2);

      results.push({
        id: node.id,
        name: node.name,
        oldPosition: { x: node.x, y: oldY },
        newPosition: { x: node.x, y: node.y },
        moved: oldY !== node.y
      });
    }

    return {
      success: true,
      alignedElements: results,
      alignmentY: centerY,
      count: results.length
    };
  }

  /**
   * Align elements to bottom edge
   */
  private async alignBottom(params: any): Promise<any> {
    const { nodeIds } = params;
    const nodes = this.getNodesByIds(nodeIds);

    if (nodes.length === 0) {
      throw new Error('No valid nodes found for alignment');
    }

    const bottommostY = Math.max(...nodes.map(node => node.y + node.height));
    const results: any[] = [];

    for (const node of nodes) {
      const oldY = node.y;
      node.y = bottommostY - node.height;

      results.push({
        id: node.id,
        name: node.name,
        oldPosition: { x: node.x, y: oldY },
        newPosition: { x: node.x, y: node.y },
        moved: oldY !== node.y
      });
    }

    return {
      success: true,
      alignedElements: results,
      alignmentY: bottommostY,
      count: results.length
    };
  }

  /**
   * Stack elements horizontally với specified spacing
   */
  private async stackHorizontally(params: any): Promise<any> {
    const { nodeIds, spacing = 8, alignVertical = 'top' } = params;
    const nodes = this.getNodesByIds(nodeIds);

    if (nodes.length < 2) {
      throw new Error('Need at least 2 nodes for horizontal stacking');
    }

    // Sort by original x position to maintain order
    const sortedNodes = nodes.sort((a, b) => a.x - b.x);
    const results: any[] = [];

    let currentX = sortedNodes[0].x;

    // Calculate alignment Y position
    let alignY: number;
    switch (alignVertical) {
      case 'top':
        alignY = Math.min(...sortedNodes.map(node => node.y));
        break;
      case 'middle':
        const topmost = Math.min(...sortedNodes.map(node => node.y));
        const bottommost = Math.max(...sortedNodes.map(node => node.y + node.height));
        alignY = (topmost + bottommost) / 2;
        break;
      case 'bottom':
        alignY = Math.max(...sortedNodes.map(node => node.y + node.height));
        break;
      default:
        alignY = sortedNodes[0].y; // Keep original position
    }

    for (let i = 0; i < sortedNodes.length; i++) {
      const node = sortedNodes[i];
      const oldPosition = { x: node.x, y: node.y };

      if (i > 0) {
        currentX += spacing;
      }

      node.x = currentX;

      // Apply vertical alignment
      if (alignVertical === 'middle') {
        node.y = alignY - (node.height / 2);
      } else if (alignVertical === 'bottom') {
        node.y = alignY - node.height;
      } else if (alignVertical === 'top') {
        node.y = alignY;
      }

      currentX += node.width;

      results.push({
        id: node.id,
        name: node.name,
        oldPosition,
        newPosition: { x: node.x, y: node.y },
        stackOrder: i + 1
      });
    }

    return {
      success: true,
      stackedElements: results,
      direction: 'horizontal',
      spacing,
      alignment: alignVertical,
      count: results.length,
      totalWidth: currentX - sortedNodes[0].x
    };
  }

  /**
   * Stack elements vertically với specified spacing
   */
  private async stackVertically(params: any): Promise<any> {
    const { nodeIds, spacing = 8, alignHorizontal = 'left' } = params;
    const nodes = this.getNodesByIds(nodeIds);

    if (nodes.length < 2) {
      throw new Error('Need at least 2 nodes for vertical stacking');
    }

    // Sort by original y position to maintain order
    const sortedNodes = nodes.sort((a, b) => a.y - b.y);
    const results: any[] = [];

    let currentY = sortedNodes[0].y;

    // Calculate alignment X position
    let alignX: number;
    switch (alignHorizontal) {
      case 'left':
        alignX = Math.min(...sortedNodes.map(node => node.x));
        break;
      case 'center':
        const leftmost = Math.min(...sortedNodes.map(node => node.x));
        const rightmost = Math.max(...sortedNodes.map(node => node.x + node.width));
        alignX = (leftmost + rightmost) / 2;
        break;
      case 'right':
        alignX = Math.max(...sortedNodes.map(node => node.x + node.width));
        break;
      default:
        alignX = sortedNodes[0].x; // Keep original position
    }

    for (let i = 0; i < sortedNodes.length; i++) {
      const node = sortedNodes[i];
      const oldPosition = { x: node.x, y: node.y };

      if (i > 0) {
        currentY += spacing;
      }

      node.y = currentY;

      // Apply horizontal alignment
      if (alignHorizontal === 'center') {
        node.x = alignX - (node.width / 2);
      } else if (alignHorizontal === 'right') {
        node.x = alignX - node.width;
      } else if (alignHorizontal === 'left') {
        node.x = alignX;
      }

      currentY += node.height;

      results.push({
        id: node.id,
        name: node.name,
        oldPosition,
        newPosition: { x: node.x, y: node.y },
        stackOrder: i + 1
      });
    }

    return {
      success: true,
      stackedElements: results,
      direction: 'vertical',
      spacing,
      alignment: alignHorizontal,
      count: results.length,
      totalHeight: currentY - sortedNodes[0].y
    };
  }

  /**
   * Arrange elements in grid pattern
   */
  private async createGrid(params: any): Promise<any> {
    const {
      nodeIds,
      cols,
      rows,
      cellWidth,
      cellHeight,
      spacingX = 8,
      spacingY = 8,
      startX,
      startY
    } = params;

    const nodes = this.getNodesByIds(nodeIds);

    if (nodes.length === 0) {
      throw new Error('No valid nodes found for grid creation');
    }

    const gridCols = cols || Math.ceil(Math.sqrt(nodes.length));
    const gridRows = rows || Math.ceil(nodes.length / gridCols);

    // Calculate starting position
    const baseX = startX !== undefined ? startX : Math.min(...nodes.map(n => n.x));
    const baseY = startY !== undefined ? startY : Math.min(...nodes.map(n => n.y));

    const results: any[] = [];

    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      const col = i % gridCols;
      const row = Math.floor(i / gridCols);

      const oldPosition = { x: node.x, y: node.y };

      // Calculate new position
      const newX = baseX + col * ((cellWidth || node.width) + spacingX);
      const newY = baseY + row * ((cellHeight || node.height) + spacingY);

      node.x = newX;
      node.y = newY;

      // Resize if cell size specified và node supports resizing
      if (cellWidth && cellHeight && 'resize' in node) {
        (node as any).resize(cellWidth, cellHeight);
      }

      results.push({
        id: node.id,
        name: node.name,
        oldPosition,
        newPosition: { x: newX, y: newY },
        gridPosition: { row, col },
        resized: !!(cellWidth && cellHeight)
      });
    }

    return {
      success: true,
      gridElements: results,
      gridInfo: {
        cols: gridCols,
        rows: gridRows,
        spacingX,
        spacingY,
        cellSize: cellWidth && cellHeight ? { width: cellWidth, height: cellHeight } : 'original'
      },
      count: results.length
    };
  }

  /**
   * Snap elements to grid
   */
  private async snapToGrid(params: any): Promise<any> {
    const { nodeIds, gridSize = 8 } = params;
    const nodes = this.getNodesByIds(nodeIds);

    const results: any[] = [];

    for (const node of nodes) {
      const oldPosition = { x: node.x, y: node.y };
      const newX = this.snapValueToGrid(node.x, gridSize);
      const newY = this.snapValueToGrid(node.y, gridSize);

      node.x = newX;
      node.y = newY;

      results.push({
        id: node.id,
        name: node.name,
        oldPosition,
        newPosition: { x: newX, y: newY },
        moved: oldPosition.x !== newX || oldPosition.y !== newY
      });
    }

    return {
      success: true,
      snappedElements: results,
      gridSize,
      count: results.length
    };
  }

  /**
   * Apply equal spacing between elements
   */
  private async equalSpacing(params: any): Promise<any> {
    const { nodeIds, direction = 'horizontal', spacing } = params;

    if (direction === 'horizontal') {
      return this.distributeHorizontally({ nodeIds, spacing });
    } else {
      return this.distributeVertically({ nodeIds, spacing });
    }
  }

  /**
   * Group elements into a frame
   */
  private async groupElements(params: any): Promise<any> {
    const { nodeIds, groupName = 'Group', padding = 16 } = params;
    const nodes = this.getNodesByIds(nodeIds);

    if (nodes.length === 0) {
      throw new Error('No valid nodes found for grouping');
    }

    // Calculate bounding box
    const bounds = this.calculateBounds(nodes);

    // Create group frame
    const group = figma.createFrame();
    group.name = groupName;
    group.x = bounds.x - padding;
    group.y = bounds.y - padding;
    group.resize(bounds.width + (padding * 2), bounds.height + (padding * 2));

    // Move nodes into group
    for (const node of nodes) {
      group.appendChild(node);
    }

    figma.currentPage.appendChild(group);

    return {
      success: true,
      groupId: group.id,
      groupName: group.name,
      groupedElements: nodes.map(n => ({ id: n.id, name: n.name })),
      bounds: {
        x: group.x,
        y: group.y,
        width: group.width,
        height: group.height
      },
      count: nodes.length
    };
  }

  /**
   * Optimize layout by removing overlaps và improving spacing
   */
  private async optimizeLayout(params: any): Promise<any> {
    const { nodeIds, strategy = 'auto' } = params;

    // First detect overlaps
    const nodes = this.getNodesByIds(nodeIds);
    const overlaps = this.detectOverlaps(nodes);

    if (overlaps.length === 0) {
      return {
        success: true,
        message: 'Layout already optimized - no overlaps detected',
        overlapsFixed: 0,
        optimizedElements: []
      };
    }

    // Apply auto-arrangement to fix overlaps
    const arrangeResult = await this.autoArrangeElements({
      nodeIds,
      strategy: 'flow',
      spacing: 16,
      alignToGrid: true
    });

    return {
      success: true,
      message: `Layout optimized - fixed ${overlaps.length} overlaps`,
      overlapsFixed: overlaps.length,
      optimizedElements: arrangeResult.arrangedElements,
      strategy
    };
  }

  // === HELPER METHODS ===

  /**
   * Get nodes by their IDs
   */
  private getNodesByIds(nodeIds: string[]): SceneNode[] {
    return nodeIds
      .map(id => figma.getNodeById(id))
      .filter((node): node is SceneNode =>
        node !== null && 'x' in node && 'y' in node && 'width' in node && 'height' in node
      );
  }

  /**
   * Get current viewport info
   */
  private getCurrentViewport(): ViewportInfo {
    const viewport = figma.viewport;
    return {
      x: viewport.bounds.x,
      y: viewport.bounds.y,
      width: viewport.bounds.width,
      height: viewport.bounds.height,
      zoom: viewport.zoom
    };
  }

  /**
   * Calculate flow positions cho elements
   */
  private calculateFlowPositions(
    nodes: SceneNode[],
    viewport: ViewportInfo,
    spacing: number,
    gridSize: number
  ): Point[] {
    const positions: Point[] = [];
    let currentX = viewport.x + 40;
    let currentY = viewport.y + 40;
    let maxHeightInRow = 0;

    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];

      // Check if we need to wrap to next row
      if (currentX + node.width > viewport.x + viewport.width - 40) {
        currentX = viewport.x + 40;
        currentY += maxHeightInRow + spacing;
        maxHeightInRow = 0;
      }

      positions.push({
        x: this.snapValueToGrid(currentX, gridSize),
        y: this.snapValueToGrid(currentY, gridSize)
      });

      currentX += node.width + spacing;
      maxHeightInRow = Math.max(maxHeightInRow, node.height);
    }

    return positions;
  }

  /**
   * Calculate grid positions
   */
  private calculateGridPositions(
    nodes: SceneNode[],
    viewport: ViewportInfo,
    spacing: number
  ): Point[] {
    const cols = Math.ceil(Math.sqrt(nodes.length));
    const positions: Point[] = [];

    const startX = viewport.x + 40;
    const startY = viewport.y + 40;

    for (let i = 0; i < nodes.length; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const node = nodes[i];

      positions.push({
        x: startX + col * (node.width + spacing),
        y: startY + row * (node.height + spacing)
      });
    }

    return positions;
  }

  /**
   * Calculate circular positions
   */
  private calculateCircularPositions(
    nodes: SceneNode[],
    viewport: ViewportInfo,
    spacing: number
  ): Point[] {
    const positions: Point[] = [];
    const centerX = viewport.x + viewport.width / 2;
    const centerY = viewport.y + viewport.height / 2;
    const radius = Math.min(viewport.width, viewport.height) / 4;

    for (let i = 0; i < nodes.length; i++) {
      const angle = (2 * Math.PI * i) / nodes.length;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);

      positions.push({ x, y });
    }

    return positions;
  }

  /**
   * Calculate compact positions
   */
  private calculateCompactPositions(
    nodes: SceneNode[],
    viewport: ViewportInfo,
    spacing: number
  ): Point[] {
    // Simple compact algorithm - pack từ top-left
    const positions: Point[] = [];
    const placed: Array<{x: number, y: number, width: number, height: number}> = [];

    for (const node of nodes) {
      let bestPosition = { x: viewport.x + 20, y: viewport.y + 20 };
      let found = false;

      // Try to find position without overlaps
      for (let y = viewport.y + 20; y < viewport.y + viewport.height - node.height; y += 20) {
        for (let x = viewport.x + 20; x < viewport.x + viewport.width - node.width; x += 20) {
          const testBounds = { x, y, width: node.width, height: node.height };

          const hasOverlap = placed.some(p =>
            this.boundsOverlap(testBounds, p)
          );

          if (!hasOverlap) {
            bestPosition = { x, y };
            found = true;
            break;
          }
        }
        if (found) break;
      }

      positions.push(bestPosition);
      placed.push({
        x: bestPosition.x,
        y: bestPosition.y,
        width: node.width,
        height: node.height
      });
    }

    return positions;
  }

  /**
   * Check if two bounds overlap
   */
  private boundsOverlap(bounds1: any, bounds2: any): boolean {
    return !(
      bounds1.x + bounds1.width <= bounds2.x ||
      bounds2.x + bounds2.width <= bounds1.x ||
      bounds1.y + bounds1.height <= bounds2.y ||
      bounds2.y + bounds2.height <= bounds1.y
    );
  }

  /**
   * Snap value to grid
   */
  private snapValueToGrid(value: number, gridSize: number): number {
    return Math.round(value / gridSize) * gridSize;
  }

  /**
   * Calculate bounding box cho multiple nodes
   */
  private calculateBounds(nodes: SceneNode[]): { x: number; y: number; width: number; height: number } {
    const xs = nodes.map(n => n.x);
    const ys = nodes.map(n => n.y);
    const rights = nodes.map(n => n.x + n.width);
    const bottoms = nodes.map(n => n.y + n.height);

    const minX = Math.min(...xs);
    const minY = Math.min(...ys);
    const maxX = Math.max(...rights);
    const maxY = Math.max(...bottoms);

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    };
  }

  /**
   * Detect overlapping elements
   */
  private detectOverlaps(nodes: SceneNode[]): Array<{ node1: string; node2: string }> {
    const overlaps: Array<{ node1: string; node2: string }> = [];

    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const node1 = nodes[i];
        const node2 = nodes[j];

        if (this.boundsOverlap(node1, node2)) {
          overlaps.push({
            node1: node1.id,
            node2: node2.id
          });
        }
      }
    }

    return overlaps;
  }

  /**
   * Get supported operations
   */
  getSupportedOperations(): string[] {
    return [
      'autoArrangeElements',
      'distributeHorizontally',
      'distributeVertically',
      'alignLeft',
      'alignCenter',
      'alignRight',
      'alignTop',
      'alignMiddle',
      'alignBottom',
      'stackHorizontally',
      'stackVertically',
      'createGrid',
      'snapToGrid',
      'equalSpacing',
      'groupElements',
      'optimizeLayout'
    ];
  }

  /**
   * Check if operation is supported
   */
  isOperationSupported(operation: string): boolean {
    return this.getSupportedOperations().includes(operation);
  }
}