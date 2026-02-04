// Node Modification Handler
// Extract từ node modification operations (lines 866-1034)

import { ERROR_MESSAGES } from '../../core/config';

export class NodeModificationHandler {
  /**
   * Handle node modification operations
   * Extract từ handleNodeModification() (lines 420-449)
   */
  async handle(operation: string, params: any): Promise<any> {
    switch (operation) {
      case 'setPosition':
        return await this.setPosition(params);

      case 'resize':
        return await this.resize(params);

      case 'setRotation':
        return await this.setRotation(params);

      case 'setOpacity':
        return await this.setOpacity(params);

      case 'setVisible':
        return await this.setVisible(params);

      case 'setLocked':
        return await this.setLocked(params);

      case 'setName':
        return await this.setName(params);

      case 'setBlendMode':
        return await this.setBlendMode(params);

      default:
        throw new Error(`Unknown node modification operation: ${operation}`);
    }
  }

  /**
   * Set node position
   * Extract từ setPosition() method (lines 868-889)
   */
  private async setPosition(params: any): Promise<any> {
    const { nodeId, x, y } = params;

    const node = figma.getNodeById(nodeId);
    if (!node) {
      throw new Error(ERROR_MESSAGES.NODE_NOT_FOUND(nodeId));
    }

    if ('x' in node && 'y' in node) {
      node.x = x;
      node.y = y;

      return {
        id: node.id,
        name: node.name,
        x: node.x,
        y: node.y
      };
    } else {
      throw new Error(ERROR_MESSAGES.INVALID_NODE_TYPE(nodeId, 'positioning'));
    }
  }

  /**
   * Resize node
   * Extract từ resize() method (lines 891-911)
   */
  private async resize(params: any): Promise<any> {
    const { nodeId, width, height } = params;

    const node = figma.getNodeById(nodeId);
    if (!node) {
      throw new Error(ERROR_MESSAGES.NODE_NOT_FOUND(nodeId));
    }

    if ('resize' in node) {
      node.resize(width, height);

      return {
        id: node.id,
        name: node.name,
        width: 'width' in node ? node.width : undefined,
        height: 'height' in node ? node.height : undefined
      };
    } else {
      throw new Error(ERROR_MESSAGES.INVALID_NODE_TYPE(nodeId, 'resizing'));
    }
  }

  /**
   * Set node rotation
   * Extract từ setRotation() method (lines 913-932)
   */
  private async setRotation(params: any): Promise<any> {
    const { nodeId, rotation } = params;

    const node = figma.getNodeById(nodeId);
    if (!node) {
      throw new Error(ERROR_MESSAGES.NODE_NOT_FOUND(nodeId));
    }

    if ('rotation' in node) {
      node.rotation = rotation * (Math.PI / 180); // Convert degrees to radians

      return {
        id: node.id,
        name: node.name,
        rotation: node.rotation * (180 / Math.PI) // Convert back to degrees for response
      };
    } else {
      throw new Error(ERROR_MESSAGES.INVALID_NODE_TYPE(nodeId, 'rotation'));
    }
  }

  /**
   * Set node opacity
   * Extract từ setOpacity() method (lines 934-953)
   */
  private async setOpacity(params: any): Promise<any> {
    const { nodeId, opacity } = params;

    const node = figma.getNodeById(nodeId);
    if (!node) {
      throw new Error(ERROR_MESSAGES.NODE_NOT_FOUND(nodeId));
    }

    if ('opacity' in node) {
      node.opacity = opacity;

      return {
        id: node.id,
        name: node.name,
        opacity: node.opacity
      };
    } else {
      throw new Error(ERROR_MESSAGES.INVALID_NODE_TYPE(nodeId, 'opacity'));
    }
  }

  /**
   * Set node visibility
   * Extract từ setVisible() method (lines 955-975)
   */
  private async setVisible(params: any): Promise<any> {
    const { nodeId, visible } = params;

    const node = figma.getNodeById(nodeId);
    if (!node) {
      throw new Error(ERROR_MESSAGES.NODE_NOT_FOUND(nodeId));
    }

    // Check if node is a SceneNode (has visible property)
    if ('visible' in node) {
      (node as SceneNode).visible = visible;

      return {
        id: node.id,
        name: node.name,
        visible: (node as SceneNode).visible
      };
    } else {
      throw new Error(ERROR_MESSAGES.INVALID_NODE_TYPE(nodeId, 'visibility changes'));
    }
  }

  /**
   * Set node locked state
   * Extract từ setLocked() method (lines 977-997)
   */
  private async setLocked(params: any): Promise<any> {
    const { nodeId, locked } = params;

    const node = figma.getNodeById(nodeId);
    if (!node) {
      throw new Error(ERROR_MESSAGES.NODE_NOT_FOUND(nodeId));
    }

    // Check if node is a SceneNode (has locked property)
    if ('locked' in node) {
      (node as SceneNode).locked = locked;

      return {
        id: node.id,
        name: node.name,
        locked: (node as SceneNode).locked
      };
    } else {
      throw new Error(ERROR_MESSAGES.INVALID_NODE_TYPE(nodeId, 'locking'));
    }
  }

  /**
   * Set node name
   * Extract từ setName() method (lines 999-1013)
   */
  private async setName(params: any): Promise<any> {
    const { nodeId, name } = params;

    const node = figma.getNodeById(nodeId);
    if (!node) {
      throw new Error(ERROR_MESSAGES.NODE_NOT_FOUND(nodeId));
    }

    node.name = name;

    return {
      id: node.id,
      name: node.name
    };
  }

  /**
   * Set node blend mode
   * Extract từ setBlendMode() method (lines 1015-1034)
   */
  private async setBlendMode(params: any): Promise<any> {
    const { nodeId, blendMode } = params;

    const node = figma.getNodeById(nodeId);
    if (!node) {
      throw new Error(ERROR_MESSAGES.NODE_NOT_FOUND(nodeId));
    }

    if ('blendMode' in node) {
      node.blendMode = blendMode;

      return {
        id: node.id,
        name: node.name,
        blendMode: node.blendMode
      };
    } else {
      throw new Error(ERROR_MESSAGES.INVALID_NODE_TYPE(nodeId, 'blend modes'));
    }
  }

  /**
   * Get supported operations
   */
  getSupportedOperations(): string[] {
    return [
      'setPosition',
      'resize',
      'setRotation',
      'setOpacity',
      'setVisible',
      'setLocked',
      'setName',
      'setBlendMode'
    ];
  }

  /**
   * Validate operation
   */
  isOperationSupported(operation: string): boolean {
    return this.getSupportedOperations().includes(operation);
  }

  /**
   * Helper method để validate node có tồn tại
   */
  private validateNodeExists(nodeId: string): BaseNode {
    const node = figma.getNodeById(nodeId);
    if (!node) {
      throw new Error(ERROR_MESSAGES.NODE_NOT_FOUND(nodeId));
    }
    return node;
  }

  /**
   * Helper method để validate node có property cần thiết
   */
  private validateNodeProperty(node: BaseNode, property: string, operation: string): boolean {
    if (!(property in node)) {
      throw new Error(ERROR_MESSAGES.INVALID_NODE_TYPE(node.id, operation));
    }
    return true;
  }

  /**
   * Validate position parameters
   */
  private validatePositionParams(params: any): void {
    const { nodeId, x, y } = params;
    if (!nodeId || x === undefined || y === undefined) {
      throw new Error('Missing required parameters: nodeId, x, y');
    }
    if (typeof x !== 'number' || typeof y !== 'number') {
      throw new Error('Invalid parameter types: x and y must be numbers');
    }
  }

  /**
   * Validate resize parameters
   */
  private validateResizeParams(params: any): void {
    const { nodeId, width, height } = params;
    if (!nodeId || width === undefined || height === undefined) {
      throw new Error('Missing required parameters: nodeId, width, height');
    }
    if (typeof width !== 'number' || typeof height !== 'number') {
      throw new Error('Invalid parameter types: width and height must be numbers');
    }
    if (width <= 0 || height <= 0) {
      throw new Error('Width and height must be positive numbers');
    }
  }

  /**
   * Validate rotation parameters
   */
  private validateRotationParams(params: any): void {
    const { nodeId, rotation } = params;
    if (!nodeId || rotation === undefined) {
      throw new Error('Missing required parameters: nodeId, rotation');
    }
    if (typeof rotation !== 'number') {
      throw new Error('Invalid parameter type: rotation must be a number');
    }
  }

  /**
   * Validate opacity parameters
   */
  private validateOpacityParams(params: any): void {
    const { nodeId, opacity } = params;
    if (!nodeId || opacity === undefined) {
      throw new Error('Missing required parameters: nodeId, opacity');
    }
    if (typeof opacity !== 'number') {
      throw new Error('Invalid parameter type: opacity must be a number');
    }
    if (opacity < 0 || opacity > 1) {
      throw new Error('Opacity must be between 0 and 1');
    }
  }

  /**
   * Get node info for debugging
   */
  getNodeInfo(nodeId: string): any {
    const node = figma.getNodeById(nodeId);
    if (!node) {
      return null;
    }

    const info: any = {
      id: node.id,
      name: node.name,
      type: node.type,
      properties: []
    };

    // Check available properties
    const properties = ['x', 'y', 'width', 'height', 'rotation', 'opacity', 'visible', 'locked', 'blendMode'];

    for (const prop of properties) {
      if (prop in node) {
        info.properties.push(prop);
        info[prop] = (node as any)[prop];
      }
    }

    return info;
  }
}