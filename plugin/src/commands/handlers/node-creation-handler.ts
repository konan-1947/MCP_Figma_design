// Node Creation Handler
// Extract từ node creation operations (lines 577-864)

import { PaintConverter } from '../../utilities/paint-converter';
import { ERROR_MESSAGES } from '../../core/config';
import {
  LayoutCalculator,
  Point,
  Size,
  ViewportInfo,
  ElementInfo,
  PositioningOptions
} from '../../utilities/layout-calculator';

export class NodeCreationHandler {
  /**
   * Handle node creation operations với smart positioning
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

      case 'createVector':
        return await this.createVector(params);

      case 'createSlice':
        return await this.createSlice(params);

      case 'createComponentSet':
        return await this.createComponentSet(params);

      case 'createBooleanOperation':
        return await this.createBooleanOperation(params);

      // Batch operations
      case 'createMultipleShapes':
        return await this.createMultipleShapes(params);

      case 'createShapeGrid':
        return await this.createShapeGrid(params);

      case 'createDiagramElements':
        return await this.createDiagramElements(params);

      default:
        throw new Error(`Unknown node creation operation: ${operation}`);
    }
  }

  /**
   * Tạo Frame với smart positioning
   * Extract từ createFrame() method (lines 579-611)
   */
  private async createFrame(params: any): Promise<any> {
    const {
      name = 'Frame',
      width = 100, height = 100,
      x, y, // Don't default to 0,0 - let smart positioning handle it
      fills
    } = params;

    // Calculate smart position
    const userProvidedPosition = (x !== undefined || y !== undefined) ? { x, y } : undefined;
    const smartPosition = this.calculateSmartPosition(
      'frame',
      { width, height },
      userProvidedPosition,
      { strategy: 'auto-flow', gridSize: 8, minSpacing: 20 }
    );

    const frame = figma.createFrame();
    frame.name = name;
    frame.resize(width, height);
    frame.x = smartPosition.x;
    frame.y = smartPosition.y;

    // Áp dụng background màu nếu được cung cấp
    if (fills && fills.length > 0) {
      frame.fills = fills.map((fill: any) => PaintConverter.processFill(fill));
    }

    figma.currentPage.appendChild(frame);

    this.logPositioningDecision('Frame', smartPosition, !!userProvidedPosition);

    return {
      id: frame.id,
      name: frame.name,
      type: frame.type,
      x: frame.x,
      y: frame.y,
      width: frame.width,
      height: frame.height,
      fills: frame.fills,
      positioning: {
        strategy: userProvidedPosition ? 'user-defined' : 'smart-auto-flow',
        wasSmartPositioned: !userProvidedPosition
      }
    };
  }

  /**
   * Tạo Rectangle với smart positioning
   * Extract từ createRectangle() method (lines 613-645)
   */
  private async createRectangle(params: any): Promise<any> {
    const {
      width, height,
      x, y, // Don't default to 0,0
      name = 'Rectangle',
      fills
    } = params;

    // Calculate smart position
    const userProvidedPosition = (x !== undefined || y !== undefined) ? { x, y } : undefined;
    const smartPosition = this.calculateSmartPosition(
      'rectangle',
      { width, height },
      userProvidedPosition,
      { strategy: 'auto-flow', gridSize: 8, minSpacing: 16 }
    );

    const rect = figma.createRectangle();
    rect.name = name;
    rect.resize(width, height);
    rect.x = smartPosition.x;
    rect.y = smartPosition.y;

    // Áp dụng màu nếu được cung cấp
    if (fills && fills.length > 0) {
      rect.fills = fills.map((fill: any) => PaintConverter.processFill(fill));
    }

    figma.currentPage.appendChild(rect);

    this.logPositioningDecision('Rectangle', smartPosition, !!userProvidedPosition);

    return {
      id: rect.id,
      name: rect.name,
      type: rect.type,
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height,
      fills: rect.fills,
      positioning: {
        strategy: userProvidedPosition ? 'user-defined' : 'smart-auto-flow',
        wasSmartPositioned: !userProvidedPosition
      }
    };
  }

  /**
   * Tạo Ellipse với smart positioning
   * Extract từ createEllipse() method (lines 647-679)
   */
  private async createEllipse(params: any): Promise<any> {
    const {
      width, height,
      x, y, // Don't default to 0,0
      name = 'Ellipse',
      fills
    } = params;

    // Calculate smart position
    const userProvidedPosition = (x !== undefined || y !== undefined) ? { x, y } : undefined;
    const smartPosition = this.calculateSmartPosition(
      'ellipse',
      { width, height },
      userProvidedPosition,
      { strategy: 'auto-flow', gridSize: 8, minSpacing: 16 }
    );

    const ellipse = figma.createEllipse();
    ellipse.name = name;
    ellipse.resize(width, height);
    ellipse.x = smartPosition.x;
    ellipse.y = smartPosition.y;

    // Áp dụng màu nếu được cung cấp
    if (fills && fills.length > 0) {
      ellipse.fills = fills.map((fill: any) => PaintConverter.processFill(fill));
    }

    figma.currentPage.appendChild(ellipse);

    this.logPositioningDecision('Ellipse', smartPosition, !!userProvidedPosition);

    return {
      id: ellipse.id,
      name: ellipse.name,
      type: ellipse.type,
      x: ellipse.x,
      y: ellipse.y,
      width: ellipse.width,
      height: ellipse.height,
      fills: ellipse.fills,
      positioning: {
        strategy: userProvidedPosition ? 'user-defined' : 'smart-auto-flow',
        wasSmartPositioned: !userProvidedPosition
      }
    };
  }

  /**
   * Tạo Text với smart positioning
   * Extract từ createText() method (lines 681-726)
   */
  private async createText(params: any): Promise<any> {
    const {
      characters,
      x, y, // Don't default to 0,0
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

    // Calculate approximate size for text (rough estimation)
    const estimatedWidth = characters.length * fontSize * 0.6; // Approximate character width
    const estimatedHeight = fontSize * 1.2; // Line height

    // Calculate smart position
    const userProvidedPosition = (x !== undefined || y !== undefined) ? { x, y } : undefined;
    const smartPosition = this.calculateSmartPosition(
      'text',
      { width: estimatedWidth, height: estimatedHeight },
      userProvidedPosition,
      { strategy: 'auto-flow', gridSize: 8, minSpacing: 12 }
    );

    textNode.x = smartPosition.x;
    textNode.y = smartPosition.y;

    // Áp dụng màu text nếu được cung cấp
    if (fills && fills.length > 0) {
      textNode.fills = fills.map((fill: any) => PaintConverter.processFill(fill));
    }

    figma.currentPage.appendChild(textNode);

    this.logPositioningDecision('Text', smartPosition, !!userProvidedPosition);

    return {
      id: textNode.id,
      name: textNode.name,
      type: textNode.type,
      characters: textNode.characters,
      fontSize: textNode.fontSize,
      x: textNode.x,
      y: textNode.y,
      width: textNode.width, // Actual width after creation
      height: textNode.height, // Actual height after creation
      fills: textNode.fills,
      positioning: {
        strategy: userProvidedPosition ? 'user-defined' : 'smart-auto-flow',
        wasSmartPositioned: !userProvidedPosition,
        estimatedSize: { width: estimatedWidth, height: estimatedHeight }
      }
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
   * Tạo Vector
   */
  private async createVector(params: any): Promise<any> {
    const { vectorPaths, x = 0, y = 0, name = 'Vector' } = params;

    if (!vectorPaths || !Array.isArray(vectorPaths) || vectorPaths.length === 0) {
      throw new Error('Vector paths are required and must be a non-empty array');
    }

    try {
      // Create vector node
      const vector = figma.createVector();
      vector.name = name;
      vector.x = x;
      vector.y = y;

      // Process vector paths
      const figmaVectorPaths: VectorPath[] = vectorPaths.map((path: any) => {
        if (!path.data || typeof path.data !== 'string') {
          throw new Error('Vector path data must be a valid SVG path string');
        }

        // Validate winding rule
        const windingRule = path.windingRule || 'NONZERO';
        if (!['EVENODD', 'NONZERO'].includes(windingRule)) {
          throw new Error(`Invalid winding rule: ${windingRule}`);
        }

        // Basic SVG path validation
        if (!path.data.trim().match(/^[MmLlHhVvCcSsQqTtAaZz0-9\s,.-]+$/)) {
          throw new Error('Invalid SVG path data format');
        }

        return {
          windingRule: windingRule as 'EVENODD' | 'NONZERO',
          data: path.data.trim()
        };
      });

      // Set vector paths
      vector.vectorPaths = figmaVectorPaths;

      figma.currentPage.appendChild(vector);

      return {
        id: vector.id,
        name: vector.name,
        type: vector.type,
        x: vector.x,
        y: vector.y,
        vectorPaths: figmaVectorPaths,
        success: true
      };
    } catch (error) {
      throw new Error(`Failed to create vector: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Tạo Slice
   */
  private async createSlice(params: any): Promise<any> {
    const { width, height, x = 0, y = 0, name = 'Slice' } = params;

    const slice = figma.createSlice();
    slice.name = name;
    slice.resize(width, height);
    slice.x = x;
    slice.y = y;

    figma.currentPage.appendChild(slice);

    return {
      id: slice.id,
      name: slice.name,
      type: slice.type,
      x: slice.x,
      y: slice.y,
      width: slice.width,
      height: slice.height
    };
  }

  /**
   * Tạo Component Set
   */
  private async createComponentSet(params: any): Promise<any> {
    const { name, variants, x = 0, y = 0 } = params;

    // Component set creation requires creating individual components first
    // This is a simplified implementation
    const component = figma.createComponent();
    component.name = name;
    component.x = x;
    component.y = y;

    figma.currentPage.appendChild(component);

    return {
      id: component.id,
      name: component.name,
      type: component.type,
      x: component.x,
      y: component.y,
      note: 'Component Set creation simplified to Component for API compatibility'
    };
  }

  /**
   * Tạo Boolean Operation
   */
  private async createBooleanOperation(params: any): Promise<any> {
    const { booleanOperation, children, x = 0, y = 0, name = 'Boolean Operation' } = params;

    if (!children || children.length < 2) {
      throw new Error('Boolean operation requires at least 2 child nodes');
    }

    const nodes: SceneNode[] = children.map((id: string) => {
      const node = figma.getNodeById(id);
      if (!node || !('parent' in node)) {
        throw new Error(`Invalid node ID for boolean operation: ${id}`);
      }
      return node as SceneNode;
    });

    const booleanNode = figma.createBooleanOperation();
    booleanNode.name = name;
    booleanNode.booleanOperation = booleanOperation;
    booleanNode.x = x;
    booleanNode.y = y;

    // Add children to boolean operation
    for (const node of nodes) {
      if (node.parent) {
        booleanNode.appendChild(node);
      }
    }

    figma.currentPage.appendChild(booleanNode);

    return {
      id: booleanNode.id,
      name: booleanNode.name,
      type: booleanNode.type,
      booleanOperation: booleanNode.booleanOperation,
      x: booleanNode.x,
      y: booleanNode.y,
      children: booleanNode.children.map(child => ({
        id: child.id,
        name: child.name,
        type: child.type
      }))
    };
  }

  // === BATCH OPERATIONS ===

  /**
   * Tạo multiple shapes trong một lần
   * Batch operation cho hiệu suất tối ưu
   */
  private async createMultipleShapes(params: any): Promise<any> {
    const { shapes, parentId } = params;
    const results: any[] = [];

    console.log(`[Batch] Creating ${shapes.length} shapes...`);

    // Use Figma transaction for better performance
    figma.skipInvisibleInstanceChildren = true;

    try {
      for (const shapeConfig of shapes) {
        const {
          type, x, y, width, height, name, fills,
          characters, fontSize = 16
        } = shapeConfig;

        let node: SceneNode;

        switch (type) {
          case 'rectangle':
            node = figma.createRectangle();
            node.resize(width, height);
            break;

          case 'ellipse':
            node = figma.createEllipse();
            node.resize(width, height);
            break;

          case 'text':
            if (!characters) {
              throw new Error('Text shapes require characters property');
            }
            // Load font once for all text elements
            try {
              await figma.loadFontAsync({ family: "Inter", style: "Regular" });
            } catch {
              await figma.loadFontAsync({ family: "Roboto", style: "Regular" });
            }
            node = figma.createText();
            (node as TextNode).characters = characters;
            (node as TextNode).fontSize = fontSize;
            node.resize(width, height);
            break;

          default:
            throw new Error(`Unsupported shape type: ${type}`);
        }

        // Set common properties
        node.name = name || `${type.charAt(0).toUpperCase() + type.slice(1)} ${results.length + 1}`;
        node.x = x;
        node.y = y;

        // Apply fills
        if (fills && fills.length > 0) {
          node.fills = fills.map((fill: any) => PaintConverter.processFill(fill));
        }

        // Add to parent or current page
        if (parentId) {
          const parent = figma.getNodeById(parentId);
          if (parent && 'appendChild' in parent) {
            (parent as ChildrenMixin).appendChild(node);
          } else {
            figma.currentPage.appendChild(node);
          }
        } else {
          figma.currentPage.appendChild(node);
        }

        results.push({
          id: node.id,
          name: node.name,
          type: node.type,
          x: node.x,
          y: node.y,
          width: node.width,
          height: node.height
        });
      }

      figma.notify(`Created ${results.length} shapes successfully`, { timeout: 2000 });

      return {
        success: true,
        createdShapes: results,
        count: results.length
      };

    } catch (error) {
      throw new Error(`Batch shape creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      figma.skipInvisibleInstanceChildren = false;
    }
  }

  /**
   * Tạo grid of shapes
   * Tối ưu cho việc tạo nhiều shapes theo pattern
   */
  private async createShapeGrid(params: any): Promise<any> {
    const {
      rows, cols, shapeType, cellWidth, cellHeight, spacing,
      startX = 0, startY = 0, fills, parentId
    } = params;

    const results: any[] = [];
    const totalShapes = rows * cols;

    console.log(`[Batch] Creating ${totalShapes} shapes in ${rows}x${cols} grid...`);

    figma.skipInvisibleInstanceChildren = true;

    try {
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const x = startX + col * (cellWidth + spacing);
          const y = startY + row * (cellHeight + spacing);

          let node: SceneNode;

          switch (shapeType) {
            case 'rectangle':
              node = figma.createRectangle();
              break;
            case 'ellipse':
              node = figma.createEllipse();
              break;
            default:
              throw new Error(`Unsupported grid shape type: ${shapeType}`);
          }

          node.name = `${shapeType} ${row + 1}-${col + 1}`;
          node.resize(cellWidth, cellHeight);
          node.x = x;
          node.y = y;

          if (fills && fills.length > 0) {
            node.fills = fills.map((fill: any) => PaintConverter.processFill(fill));
          }

          // Add to parent or current page
          if (parentId) {
            const parent = figma.getNodeById(parentId);
            if (parent && 'appendChild' in parent) {
              (parent as ChildrenMixin).appendChild(node);
            } else {
              figma.currentPage.appendChild(node);
            }
          } else {
            figma.currentPage.appendChild(node);
          }

          results.push({
            id: node.id,
            name: node.name,
            type: node.type,
            x: node.x,
            y: node.y,
            width: node.width,
            height: node.height,
            gridPosition: { row, col }
          });
        }
      }

      figma.notify(`Created ${rows}x${cols} grid (${totalShapes} shapes)`, { timeout: 2000 });

      return {
        success: true,
        gridShapes: results,
        gridInfo: { rows, cols, totalShapes },
        count: results.length
      };

    } catch (error) {
      throw new Error(`Grid creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      figma.skipInvisibleInstanceChildren = false;
    }
  }

  /**
   * Tạo diagram elements (complex layouts)
   * Hỗ trợ forms, UI components, etc.
   */
  private async createDiagramElements(params: any): Promise<any> {
    const { elements, title, parentId } = params;
    const results: any[] = [];

    console.log(`[Batch] Creating diagram with ${elements.length} elements...`);

    figma.skipInvisibleInstanceChildren = true;

    try {
      // Load fonts once for all text elements
      try {
        await figma.loadFontAsync({ family: "Inter", style: "Regular" });
      } catch {
        await figma.loadFontAsync({ family: "Roboto", style: "Regular" });
      }

      for (const elementConfig of elements) {
        const {
          type, x, y, width, height, name, fills,
          characters, fontSize = 16, buttonText, borderRadius
        } = elementConfig;

        let node: SceneNode;

        switch (type) {
          case 'frame':
            node = figma.createFrame();
            node.resize(width, height);
            break;

          case 'rectangle':
            node = figma.createRectangle();
            node.resize(width, height);
            if (borderRadius) {
              (node as RectangleNode).cornerRadius = borderRadius;
            }
            break;

          case 'ellipse':
            node = figma.createEllipse();
            node.resize(width, height);
            break;

          case 'text':
            if (!characters) {
              throw new Error('Text elements require characters property');
            }
            node = figma.createText();
            (node as TextNode).characters = characters;
            (node as TextNode).fontSize = fontSize;
            node.resize(width, height);
            break;

          case 'button':
            // Create button as frame with text
            node = figma.createFrame();
            node.resize(width, height);
            if (borderRadius) {
              (node as FrameNode).cornerRadius = borderRadius;
            }

            // Add button text if provided
            if (buttonText) {
              const textNode = figma.createText();
              textNode.characters = buttonText;
              textNode.fontSize = fontSize;
              textNode.textAlignHorizontal = 'CENTER';
              textNode.textAlignVertical = 'CENTER';
              textNode.resize(width - 20, height - 10); // Padding
              textNode.x = 10;
              textNode.y = 5;
              (node as FrameNode).appendChild(textNode);

              results.push({
                id: textNode.id,
                name: `${name || 'Button'} Text`,
                type: textNode.type,
                characters: textNode.characters
              });
            }
            break;

          default:
            throw new Error(`Unsupported element type: ${type}`);
        }

        // Set common properties
        node.name = name || `${type.charAt(0).toUpperCase() + type.slice(1)} ${results.length + 1}`;
        node.x = x;
        node.y = y;

        // Apply fills
        if (fills && fills.length > 0) {
          node.fills = fills.map((fill: any) => PaintConverter.processFill(fill));
        }

        // Add to parent or current page
        if (parentId) {
          const parent = figma.getNodeById(parentId);
          if (parent && 'appendChild' in parent) {
            (parent as ChildrenMixin).appendChild(node);
          } else {
            figma.currentPage.appendChild(node);
          }
        } else {
          figma.currentPage.appendChild(node);
        }

        results.push({
          id: node.id,
          name: node.name,
          type: node.type,
          x: node.x,
          y: node.y,
          width: node.width,
          height: node.height
        });
      }

      // Create title if provided
      if (title) {
        const titleNode = figma.createText();
        titleNode.characters = title;
        titleNode.fontSize = 24;
        titleNode.name = 'Diagram Title';
        titleNode.x = elements[0]?.x || 0;
        titleNode.y = (elements[0]?.y || 0) - 40;

        figma.currentPage.appendChild(titleNode);

        results.unshift({
          id: titleNode.id,
          name: titleNode.name,
          type: titleNode.type,
          characters: titleNode.characters,
          x: titleNode.x,
          y: titleNode.y
        });
      }

      figma.notify(`Created diagram with ${results.length} elements`, { timeout: 2000 });

      return {
        success: true,
        diagramElements: results,
        title: title,
        count: results.length
      };

    } catch (error) {
      throw new Error(`Diagram creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      figma.skipInvisibleInstanceChildren = false;
    }
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
      'createInstance',
      'createVector',
      'createSlice',
      'createComponentSet',
      'createBooleanOperation',
      // Batch operations
      'createMultipleShapes',
      'createShapeGrid',
      'createDiagramElements'
    ];
  }

  /**
   * Validate operation
   */
  isOperationSupported(operation: string): boolean {
    return this.getSupportedOperations().includes(operation);
  }

  // === SMART POSITIONING HELPERS ===

  /**
   * Get current viewport information
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
   * Get existing elements on current page
   */
  private getExistingElements(): ElementInfo[] {
    const elements: ElementInfo[] = [];

    const processNode = (node: SceneNode) => {
      // Skip invisible nodes và nodes without bounding box
      if (!node.visible || !('absoluteBoundingBox' in node) || !node.absoluteBoundingBox) {
        return;
      }

      const bounds = node.absoluteBoundingBox;
      elements.push({
        id: node.id,
        name: node.name,
        type: node.type,
        bounds: {
          x: bounds.x,
          y: bounds.y,
          width: bounds.width,
          height: bounds.height
        }
      });
    };

    // Process all children của current page
    figma.currentPage.children.forEach(processNode);

    console.log(`[NodeCreationHandler] Found ${elements.length} existing elements on canvas`);
    return elements;
  }

  /**
   * Calculate smart position for new element
   */
  private calculateSmartPosition(
    elementType: string,
    size: Size,
    userProvidedPosition?: { x?: number; y?: number },
    options: PositioningOptions = {}
  ): Point {
    // If user explicitly provided position, use it (but still snap to grid)
    if (userProvidedPosition?.x !== undefined && userProvidedPosition?.y !== undefined) {
      console.log(`[NodeCreationHandler] Using user-provided position: (${userProvidedPosition.x}, ${userProvidedPosition.y})`);
      return {
        x: this.snapToGrid(userProvidedPosition.x, options.gridSize || 8),
        y: this.snapToGrid(userProvidedPosition.y, options.gridSize || 8)
      };
    }

    // Get current canvas state
    const viewport = this.getCurrentViewport();
    const existingElements = this.getExistingElements();

    // Use smart positioning if no explicit position provided
    const smartPosition = LayoutCalculator.calculateNextPosition(
      elementType,
      size,
      existingElements,
      viewport,
      {
        strategy: 'auto-flow',
        gridSize: 8,
        minSpacing: 16,
        avoidCollisions: true,
        ...options
      }
    );

    console.log(`[NodeCreationHandler] Smart position calculated: (${smartPosition.x}, ${smartPosition.y}) for ${elementType}`);
    return smartPosition;
  }

  /**
   * Snap value to grid
   */
  private snapToGrid(value: number, gridSize: number): number {
    return Math.round(value / gridSize) * gridSize;
  }

  /**
   * Log positioning decision for debugging
   */
  private logPositioningDecision(elementType: string, finalPosition: Point, wasUserProvided: boolean): void {
    const decision = wasUserProvided ? 'user-provided' : 'smart-calculated';
    console.log(`[NodeCreationHandler] ${elementType} positioned at (${finalPosition.x}, ${finalPosition.y}) - ${decision}`);
  }
}