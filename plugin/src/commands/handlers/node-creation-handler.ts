// Node Creation Handler
// Extract từ node creation operations (lines 577-864)

import { PaintConverter } from '../../utilities/paint-converter';
import { ERROR_MESSAGES } from '../../core/config';

export class NodeCreationHandler {
  /**
   * Handle node creation operations
   * Extract từ handleNodeCreation() (lines 386-418)
   */
  async handle(operation: string, params: any): Promise<any> {
    switch (operation) {
      case 'createFrame':
        return await this.createFrame(params);

      case 'createRectangle':
        return await this.createRectangle(params);

      case 'createEllipse':
        return await this.createEllipse(params);

      case 'createText':
        return await this.createText(params);

      case 'createPolygon':
        return await this.createPolygon(params);

      case 'createStar':
        return await this.createStar(params);

      case 'createLine':
        return await this.createLine(params);

      case 'createComponent':
        return await this.createComponent(params);

      case 'createInstance':
        return await this.createInstance(params);

      default:
        throw new Error(`Unknown node creation operation: ${operation}`);
    }
  }

  /**
   * Tạo Frame
   * Extract từ createFrame() method (lines 579-611)
   */
  private async createFrame(params: any): Promise<any> {
    const {
      name = 'Frame',
      width = 100, height = 100,
      x = 0, y = 0,
      fills
    } = params;

    const frame = figma.createFrame();
    frame.name = name;
    frame.resize(width, height);
    frame.x = x;
    frame.y = y;

    // Áp dụng background màu nếu được cung cấp
    if (fills && fills.length > 0) {
      frame.fills = fills.map((fill: any) => PaintConverter.processFill(fill));
    }

    figma.currentPage.appendChild(frame);

    return {
      id: frame.id,
      name: frame.name,
      type: frame.type,
      x: frame.x,
      y: frame.y,
      width: frame.width,
      height: frame.height,
      fills: frame.fills
    };
  }

  /**
   * Tạo Rectangle
   * Extract từ createRectangle() method (lines 613-645)
   */
  private async createRectangle(params: any): Promise<any> {
    const {
      width, height,
      x = 0, y = 0,
      name = 'Rectangle',
      fills
    } = params;

    const rect = figma.createRectangle();
    rect.name = name;
    rect.resize(width, height);
    rect.x = x;
    rect.y = y;

    // Áp dụng màu nếu được cung cấp
    if (fills && fills.length > 0) {
      rect.fills = fills.map((fill: any) => PaintConverter.processFill(fill));
    }

    figma.currentPage.appendChild(rect);

    return {
      id: rect.id,
      name: rect.name,
      type: rect.type,
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height,
      fills: rect.fills
    };
  }

  /**
   * Tạo Ellipse
   * Extract từ createEllipse() method (lines 647-679)
   */
  private async createEllipse(params: any): Promise<any> {
    const {
      width, height,
      x = 0, y = 0,
      name = 'Ellipse',
      fills
    } = params;

    const ellipse = figma.createEllipse();
    ellipse.name = name;
    ellipse.resize(width, height);
    ellipse.x = x;
    ellipse.y = y;

    // Áp dụng màu nếu được cung cấp
    if (fills && fills.length > 0) {
      ellipse.fills = fills.map((fill: any) => PaintConverter.processFill(fill));
    }

    figma.currentPage.appendChild(ellipse);

    return {
      id: ellipse.id,
      name: ellipse.name,
      type: ellipse.type,
      x: ellipse.x,
      y: ellipse.y,
      width: ellipse.width,
      height: ellipse.height,
      fills: ellipse.fills
    };
  }

  /**
   * Tạo Text
   * Extract từ createText() method (lines 681-726)
   */
  private async createText(params: any): Promise<any> {
    const {
      characters,
      x = 0, y = 0,
      fontSize = 16,
      name = 'Text',
      fills
    } = params;

    // Load font with fallback
    try {
      await figma.loadFontAsync({ family: "Inter", style: "Regular" });
    } catch (error) {
      try {
        await figma.loadFontAsync({ family: "Roboto", style: "Regular" });
      } catch (fallbackError) {
        throw new Error(ERROR_MESSAGES.FONT_LOAD_ERROR);
      }
    }

    const textNode = figma.createText();
    textNode.name = name;
    textNode.characters = characters;
    textNode.fontSize = fontSize;
    textNode.x = x;
    textNode.y = y;

    // Áp dụng màu text nếu được cung cấp
    if (fills && fills.length > 0) {
      textNode.fills = fills.map((fill: any) => PaintConverter.processFill(fill));
    }

    figma.currentPage.appendChild(textNode);

    return {
      id: textNode.id,
      name: textNode.name,
      type: textNode.type,
      characters: textNode.characters,
      fontSize: textNode.fontSize,
      x: textNode.x,
      y: textNode.y,
      fills: textNode.fills
    };
  }

  /**
   * Tạo Polygon
   * Extract từ createPolygon() method (lines 728-750)
   */
  private async createPolygon(params: any): Promise<any> {
    const { pointCount, width = 100, height = 100, x = 0, y = 0, name = 'Polygon' } = params;

    const polygon = figma.createPolygon();
    polygon.name = name;
    polygon.pointCount = pointCount;
    polygon.resize(width, height);
    polygon.x = x;
    polygon.y = y;

    figma.currentPage.appendChild(polygon);

    return {
      id: polygon.id,
      name: polygon.name,
      type: polygon.type,
      pointCount: polygon.pointCount,
      x: polygon.x,
      y: polygon.y,
      width: polygon.width,
      height: polygon.height
    };
  }

  /**
   * Tạo Star
   * Extract từ createStar() method (lines 752-776)
   */
  private async createStar(params: any): Promise<any> {
    const { pointCount, innerRadius, width = 100, height = 100, x = 0, y = 0, name = 'Star' } = params;

    const star = figma.createStar();
    star.name = name;
    star.pointCount = pointCount;
    star.innerRadius = innerRadius;
    star.resize(width, height);
    star.x = x;
    star.y = y;

    figma.currentPage.appendChild(star);

    return {
      id: star.id,
      name: star.name,
      type: star.type,
      pointCount: star.pointCount,
      innerRadius: star.innerRadius,
      x: star.x,
      y: star.y,
      width: star.width,
      height: star.height
    };
  }

  /**
   * Tạo Line
   * Extract từ createLine() method (lines 778-797)
   */
  private async createLine(params: any): Promise<any> {
    const { endX, endY, x = 0, y = 0, name = 'Line' } = params;

    const line = figma.createLine();
    line.name = name;
    line.x = x;
    line.y = y;
    // Set line end point
    line.resize(endX, endY);

    figma.currentPage.appendChild(line);

    return {
      id: line.id,
      name: line.name,
      type: line.type,
      x: line.x,
      y: line.y
    };
  }

  /**
   * Tạo Component
   * Extract từ createComponent() method (lines 799-836)
   */
  private async createComponent(params: any): Promise<any> {
    const { name, description, nodeIds, x = 0, y = 0 } = params;

    let nodes: SceneNode[] = [];

    if (nodeIds && nodeIds.length > 0) {
      // Get existing nodes to include in component
      nodes = nodeIds.map((id: string) => figma.getNodeById(id))
        .filter((node: any): node is SceneNode => node && 'parent' in node);
    }

    const component = figma.createComponent();
    component.name = name;
    if (description) {
      component.description = description;
    }
    component.x = x;
    component.y = y;

    // Add nodes to component if provided
    for (const node of nodes) {
      if (node.parent) {
        node.parent.appendChild(component);
        component.appendChild(node);
      }
    }

    figma.currentPage.appendChild(component);

    return {
      id: component.id,
      name: component.name,
      type: component.type,
      description: component.description,
      x: component.x,
      y: component.y
    };
  }

  /**
   * Tạo Instance
   * Extract từ createInstance() method (lines 838-864)
   */
  private async createInstance(params: any): Promise<any> {
    const { componentId, x = 0, y = 0, name = 'Instance' } = params;

    const component = figma.getNodeById(componentId);
    if (!component || component.type !== 'COMPONENT') {
      throw new Error(`Component not found or invalid: ${componentId}`);
    }

    const instance = (component as ComponentNode).createInstance();
    instance.name = name;
    instance.x = x;
    instance.y = y;

    figma.currentPage.appendChild(instance);

    return {
      id: instance.id,
      name: instance.name,
      type: instance.type,
      mainComponent: {
        id: component.id,
        name: component.name
      },
      x: instance.x,
      y: instance.y
    };
  }

  /**
   * Get supported operations
   */
  getSupportedOperations(): string[] {
    return [
      'createFrame',
      'createRectangle',
      'createEllipse',
      'createText',
      'createPolygon',
      'createStar',
      'createLine',
      'createComponent',
      'createInstance'
    ];
  }

  /**
   * Validate operation
   */
  isOperationSupported(operation: string): boolean {
    return this.getSupportedOperations().includes(operation);
  }
}