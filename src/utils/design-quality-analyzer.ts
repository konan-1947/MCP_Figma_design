/**
 * Design Quality Analyzer
 * Phân tích chất lượng layout trong Figma designs
 * Phát hiện positioning issues, overlapping elements, và spacing problems
 */

export interface Position {
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

export interface FigmaNode {
  id: string;
  name: string;
  type: string;
  absoluteBoundingBox?: Bounds;
  relativeTransform?: number[][];
  children?: FigmaNode[];
  visible?: boolean;
}

export interface LayoutIssue {
  type: 'overlap' | 'origin_cluster' | 'poor_spacing' | 'grid_violation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  affectedNodes: string[];
  recommendedFix?: string;
}

export interface QualityMetrics {
  totalElements: number;
  elementsAtOrigin: number;
  overlappingElements: number;
  averageSpacing: number;
  gridCompliance: number; // Percentage của elements tuân thủ 8px grid
  layoutScore: number; // Overall score 0-100
}

export interface QualityReport {
  fileKey: string;
  fileName?: string;
  metrics: QualityMetrics;
  issues: LayoutIssue[];
  recommendations: string[];
  canvasUtilization: {
    usedArea: number;
    totalArea: number;
    utilization: number; // Percentage
  };
}

/**
 * Phân tích chất lượng layout của Figma design
 */
export class DesignQualityAnalyzer {
  private static readonly ORIGIN_THRESHOLD = 5; // Threshold để coi là "at origin"
  private static readonly GRID_SIZE = 8; // Standard 8px design grid
  private static readonly MIN_SPACING = 16; // Minimum recommended spacing

  /**
   * Analyze một Figma file và return quality report
   */
  public static analyzeFile(fileData: any): QualityReport {
    const allNodes = this.extractAllNodes(fileData);
    const visibleNodes = allNodes.filter(node => node.visible !== false);

    const metrics = this.calculateMetrics(visibleNodes);
    const issues = this.detectIssues(visibleNodes);
    const recommendations = this.generateRecommendations(metrics, issues);
    const canvasUtilization = this.calculateCanvasUtilization(visibleNodes);

    return {
      fileKey: fileData.fileKey || 'unknown',
      fileName: fileData.name,
      metrics,
      issues,
      recommendations,
      canvasUtilization
    };
  }

  /**
   * Extract tất cả nodes từ Figma file structure
   */
  private static extractAllNodes(fileData: any): FigmaNode[] {
    const nodes: FigmaNode[] = [];

    const traverse = (node: any) => {
      if (node && node.id) {
        nodes.push({
          id: node.id,
          name: node.name || 'Unnamed',
          type: node.type || 'Unknown',
          absoluteBoundingBox: node.absoluteBoundingBox,
          relativeTransform: node.relativeTransform,
          children: node.children,
          visible: node.visible
        });

        if (node.children) {
          node.children.forEach(traverse);
        }
      }
    };

    // Traverse document structure
    if (fileData.document) {
      traverse(fileData.document);
    } else if (fileData.nodes) {
      // Handle getFileNodes response
      Object.values(fileData.nodes).forEach(traverse);
    }

    return nodes;
  }

  /**
   * Calculate layout quality metrics
   */
  private static calculateMetrics(nodes: FigmaNode[]): QualityMetrics {
    const nodesWithBounds = nodes.filter(node => node.absoluteBoundingBox);
    const totalElements = nodesWithBounds.length;

    const elementsAtOrigin = nodesWithBounds.filter(node =>
      this.isAtOrigin(node.absoluteBoundingBox!)
    ).length;

    const overlappingPairs = this.findOverlappingElements(nodesWithBounds);
    const overlappingElements = new Set(overlappingPairs.flat()).size;

    const spacings = this.calculateSpacings(nodesWithBounds);
    const averageSpacing = spacings.length > 0
      ? spacings.reduce((sum, spacing) => sum + spacing, 0) / spacings.length
      : 0;

    const gridCompliantElements = nodesWithBounds.filter(node =>
      this.isGridCompliant(node.absoluteBoundingBox!)
    ).length;
    const gridCompliance = totalElements > 0 ? (gridCompliantElements / totalElements) * 100 : 100;

    const layoutScore = this.calculateLayoutScore({
      totalElements,
      elementsAtOrigin,
      overlappingElements,
      averageSpacing,
      gridCompliance
    });

    return {
      totalElements,
      elementsAtOrigin,
      overlappingElements,
      averageSpacing: Math.round(averageSpacing * 100) / 100,
      gridCompliance: Math.round(gridCompliance * 100) / 100,
      layoutScore: Math.round(layoutScore * 100) / 100
    };
  }

  /**
   * Detect các layout issues
   */
  private static detectIssues(nodes: FigmaNode[]): LayoutIssue[] {
    const issues: LayoutIssue[] = [];
    const nodesWithBounds = nodes.filter(node => node.absoluteBoundingBox);

    // Detect elements clustered at origin
    const originNodes = nodesWithBounds.filter(node =>
      this.isAtOrigin(node.absoluteBoundingBox!)
    );

    if (originNodes.length > 1) {
      issues.push({
        type: 'origin_cluster',
        severity: 'critical',
        message: `${originNodes.length} elements đang clustered tại gốc tọa độ (0,0)`,
        affectedNodes: originNodes.map(n => n.id),
        recommendedFix: 'Distribute elements với proper spacing sử dụng auto-layout hoặc manual positioning'
      });
    }

    // Detect overlapping elements
    const overlappingPairs = this.findOverlappingElements(nodesWithBounds);
    for (const pair of overlappingPairs) {
      const [node1, node2] = pair.map(id => nodesWithBounds.find(n => n.id === id)!);
      issues.push({
        type: 'overlap',
        severity: 'high',
        message: `Elements "${node1.name}" và "${node2.name}" đang overlap`,
        affectedNodes: pair,
        recommendedFix: 'Reposition elements để avoid overlap và maintain proper spacing'
      });
    }

    // Detect poor spacing
    const poorSpacingNodes = this.findPoorSpacingElements(nodesWithBounds);
    if (poorSpacingNodes.length > 0) {
      issues.push({
        type: 'poor_spacing',
        severity: 'medium',
        message: `${poorSpacingNodes.length} elements có insufficient spacing (< ${this.MIN_SPACING}px)`,
        affectedNodes: poorSpacingNodes.map(n => n.id),
        recommendedFix: `Increase spacing giữa elements tới minimum ${this.MIN_SPACING}px cho better visual hierarchy`
      });
    }

    // Detect grid violations
    const nonGridCompliantNodes = nodesWithBounds.filter(node =>
      !this.isGridCompliant(node.absoluteBoundingBox!)
    );

    if (nonGridCompliantNodes.length > nodesWithBounds.length * 0.3) { // More than 30% violation
      issues.push({
        type: 'grid_violation',
        severity: 'medium',
        message: `${nonGridCompliantNodes.length} elements không tuân thủ ${this.GRID_SIZE}px design grid`,
        affectedNodes: nonGridCompliantNodes.map(n => n.id),
        recommendedFix: `Align elements tới ${this.GRID_SIZE}px grid để maintain consistency`
      });
    }

    return issues;
  }

  /**
   * Generate recommendations based on metrics và issues
   */
  private static generateRecommendations(metrics: QualityMetrics, issues: LayoutIssue[]): string[] {
    const recommendations: string[] = [];

    if (metrics.elementsAtOrigin > 0) {
      recommendations.push('Implement smart auto-positioning để prevent elements clustering ở origin');
    }

    if (metrics.overlappingElements > 0) {
      recommendations.push('Add collision detection và auto-spacing algorithms');
    }

    if (metrics.averageSpacing < this.MIN_SPACING) {
      recommendations.push(`Increase default spacing tới minimum ${this.MIN_SPACING}px between elements`);
    }

    if (metrics.gridCompliance < 80) {
      recommendations.push(`Improve grid compliance bằng cách snap elements tới ${this.GRID_SIZE}px grid`);
    }

    if (metrics.layoutScore < 60) {
      recommendations.push('Consider implementing layout templates và positioning guidelines');
    }

    // Critical issue recommendations
    const criticalIssues = issues.filter(issue => issue.severity === 'critical');
    if (criticalIssues.length > 0) {
      recommendations.unshift('URGENT: Fix critical positioning issues trước khi continue với design');
    }

    return recommendations;
  }

  /**
   * Calculate canvas utilization metrics
   */
  private static calculateCanvasUtilization(nodes: FigmaNode[]): {
    usedArea: number;
    totalArea: number;
    utilization: number;
  } {
    const nodesWithBounds = nodes.filter(node => node.absoluteBoundingBox);

    if (nodesWithBounds.length === 0) {
      return { usedArea: 0, totalArea: 0, utilization: 0 };
    }

    // Calculate bounding box của all elements
    const bounds = nodesWithBounds.map(n => n.absoluteBoundingBox!);
    const minX = Math.min(...bounds.map(b => b.x));
    const minY = Math.min(...bounds.map(b => b.y));
    const maxX = Math.max(...bounds.map(b => b.x + b.width));
    const maxY = Math.max(...bounds.map(b => b.y + b.height));

    const totalArea = (maxX - minX) * (maxY - minY);
    const usedArea = bounds.reduce((sum, bound) => sum + (bound.width * bound.height), 0);
    const utilization = totalArea > 0 ? (usedArea / totalArea) * 100 : 0;

    return {
      usedArea: Math.round(usedArea),
      totalArea: Math.round(totalArea),
      utilization: Math.round(utilization * 100) / 100
    };
  }

  /**
   * Check if element is positioned at origin
   */
  private static isAtOrigin(bounds: Bounds): boolean {
    return Math.abs(bounds.x) <= this.ORIGIN_THRESHOLD &&
           Math.abs(bounds.y) <= this.ORIGIN_THRESHOLD;
  }

  /**
   * Check if element is compliant with design grid
   */
  private static isGridCompliant(bounds: Bounds): boolean {
    return (bounds.x % this.GRID_SIZE === 0) && (bounds.y % this.GRID_SIZE === 0);
  }

  /**
   * Find overlapping elements
   */
  private static findOverlappingElements(nodes: FigmaNode[]): string[][] {
    const overlaps: string[][] = [];

    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const node1 = nodes[i];
        const node2 = nodes[j];

        if (node1.absoluteBoundingBox && node2.absoluteBoundingBox) {
          if (this.boundsOverlap(node1.absoluteBoundingBox, node2.absoluteBoundingBox)) {
            overlaps.push([node1.id, node2.id]);
          }
        }
      }
    }

    return overlaps;
  }

  /**
   * Check if two bounding boxes overlap
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
   * Calculate spacings between adjacent elements
   */
  private static calculateSpacings(nodes: FigmaNode[]): number[] {
    const spacings: number[] = [];
    const bounds = nodes.map(n => n.absoluteBoundingBox!);

    // Calculate horizontal và vertical spacings
    for (let i = 0; i < bounds.length; i++) {
      for (let j = i + 1; j < bounds.length; j++) {
        const bound1 = bounds[i];
        const bound2 = bounds[j];

        // Horizontal spacing
        const horizontalSpacing = Math.min(
          Math.abs(bound1.x - (bound2.x + bound2.width)),
          Math.abs(bound2.x - (bound1.x + bound1.width))
        );

        // Vertical spacing
        const verticalSpacing = Math.min(
          Math.abs(bound1.y - (bound2.y + bound2.height)),
          Math.abs(bound2.y - (bound1.y + bound1.height))
        );

        // Use minimum spacing (closest distance)
        const minSpacing = Math.min(horizontalSpacing, verticalSpacing);
        if (minSpacing > 0 && minSpacing < 200) { // Reasonable spacing threshold
          spacings.push(minSpacing);
        }
      }
    }

    return spacings;
  }

  /**
   * Find elements với poor spacing
   */
  private static findPoorSpacingElements(nodes: FigmaNode[]): FigmaNode[] {
    const poorSpacingNodes: FigmaNode[] = [];

    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const node1 = nodes[i];
        const node2 = nodes[j];

        if (node1.absoluteBoundingBox && node2.absoluteBoundingBox) {
          const spacing = this.calculateMinSpacing(node1.absoluteBoundingBox, node2.absoluteBoundingBox);

          if (spacing > 0 && spacing < this.MIN_SPACING) {
            if (!poorSpacingNodes.includes(node1)) {
              poorSpacingNodes.push(node1);
            }
            if (!poorSpacingNodes.includes(node2)) {
              poorSpacingNodes.push(node2);
            }
          }
        }
      }
    }

    return poorSpacingNodes;
  }

  /**
   * Calculate minimum spacing between two bounds
   */
  private static calculateMinSpacing(bounds1: Bounds, bounds2: Bounds): number {
    // Check if overlapping
    if (this.boundsOverlap(bounds1, bounds2)) {
      return 0;
    }

    const horizontalSpacing = Math.min(
      Math.abs(bounds1.x - (bounds2.x + bounds2.width)),
      Math.abs(bounds2.x - (bounds1.x + bounds1.width))
    );

    const verticalSpacing = Math.min(
      Math.abs(bounds1.y - (bounds2.y + bounds2.height)),
      Math.abs(bounds2.y - (bounds1.y + bounds1.height))
    );

    return Math.min(horizontalSpacing, verticalSpacing);
  }

  /**
   * Calculate overall layout score (0-100)
   */
  private static calculateLayoutScore(metrics: Partial<QualityMetrics>): number {
    const {
      totalElements = 0,
      elementsAtOrigin = 0,
      overlappingElements = 0,
      averageSpacing = 0,
      gridCompliance = 100
    } = metrics;

    if (totalElements === 0) return 100; // Empty design is technically perfect

    // Score components
    const originScore = totalElements > 0 ? Math.max(0, 100 - (elementsAtOrigin / totalElements) * 100) : 100;
    const overlapScore = totalElements > 0 ? Math.max(0, 100 - (overlappingElements / totalElements) * 50) : 100;
    const spacingScore = Math.min(100, (averageSpacing / this.MIN_SPACING) * 100);
    const gridScore = gridCompliance;

    // Weighted average
    const totalScore = (
      originScore * 0.3 +      // 30% weight - origin clustering is critical
      overlapScore * 0.3 +     // 30% weight - overlaps are critical
      spacingScore * 0.25 +    // 25% weight - spacing is important
      gridScore * 0.15         // 15% weight - grid compliance is nice-to-have
    );

    return Math.max(0, Math.min(100, totalScore));
  }
}