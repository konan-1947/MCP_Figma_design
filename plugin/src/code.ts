// Figma Plugin - Main code
/// <reference types="@figma/plugin-typings" />

// New command format
interface FigmaCommand {
  category: string;
  operation: string;
  parameters: Record<string, any>;
  id: string;
}


interface FigmaResponse {
  id: string;
  success: boolean;
  data?: any;
  error?: string | { code: string; message: string; details?: any };
}


class FigmaHttpClient {
  private readonly baseUrl: string = 'http://localhost:8765';
  private clientId: string | null = null;
  private isConnected = false;
  private pollInterval: any = null;
  private keepAliveInterval: any = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;

  constructor() {
    this.logToUI('FigmaHttpClient khởi tạo', 'info');
    this.connect();
  }

  // Helper để log ra UI
  private logToUI(message: string, level: 'info' | 'success' | 'error' | 'warning' = 'info') {
    console.log(`[Figma Plugin] ${message}`);
    try {
      figma.ui.postMessage({
        type: 'log',
        payload: { message, level }
      });
    } catch (error) {
      // UI chưa được tạo hoặc đã đóng
      console.log(`[Figma Plugin] Cannot send to UI: ${message}`);
    }
  }

  private async connect(): Promise<void> {
    try {
      console.log('[Figma Plugin] Connecting to HTTP server...');

      // Health check first
      const healthResponse = await this.makeRequest('/health', 'GET');
      if (!healthResponse.ok) {
        throw new Error('Health check failed');
      }

      // Register as Figma client
      const registerResponse = await this.makeRequest('/figma/register', 'POST', {
        clientType: 'figma-ui',
        clientId: this.clientId
      });

      if (!registerResponse.ok) {
        throw new Error('Registration failed');
      }

      const registerData: any = await registerResponse.json();
      this.clientId = registerData.clientId;
      this.isConnected = true;
      this.reconnectAttempts = 0;

      console.log(`[Figma Plugin] Connected successfully as client: ${this.clientId}`);
      figma.notify('MCP Controller: Kết nối thành công', { timeout: 2000 });

      // Start polling for commands
      this.startPolling();

      // Start keep-alive
      this.startKeepAlive();

    } catch (error) {
      console.error('[Figma Plugin] Failed to connect:', error);
      this.isConnected = false;
      this.scheduleReconnect();
    }
  }

  private async makeRequest(endpoint: string, method: string = 'GET', body?: any): Promise<any> {
    const options: any = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-Client-Type': 'figma-ui'
      }
    };

    if (this.clientId) {
      options.headers = {
        ...options.headers,
        'X-Client-ID': this.clientId
      };
    }

    if (body && method !== 'GET') {
      options.body = JSON.stringify(body);
    }

    return fetch(`${this.baseUrl}${endpoint}`, options);
  }

  private startPolling(): void {
    if (this.pollInterval) return;

    this.pollInterval = setInterval(async () => {
      try {
        if (!this.isConnected) return;

        const response = await this.makeRequest('/figma/commands', 'GET');
        if (!response.ok) {
          console.error('[Figma Plugin] Polling error:', response.statusText);
          return;
        }

        const data: any = await response.json();
        if (data.commands && data.commands.length > 0) {
          console.log(`[Figma Plugin] Received ${data.commands.length} commands`);
          for (const command of data.commands) {
            await this.handleCommand(command);
          }
        }
      } catch (error) {
        console.error('[Figma Plugin] Polling error:', error);
        this.isConnected = false;
        this.scheduleReconnect();
      }
    }, 1000); // Poll every second
  }

  private startKeepAlive(): void {
    if (this.keepAliveInterval) return;

    this.keepAliveInterval = setInterval(async () => {
      try {
        if (!this.isConnected) return;

        const response = await this.makeRequest('/figma/keepalive', 'POST');
        if (!response.ok) {
          console.error('[Figma Plugin] Keep-alive failed');
        }
      } catch (error) {
        console.error('[Figma Plugin] Keep-alive error:', error);
      }
    }, 30000); // Every 30 seconds
  }

  private scheduleReconnect(): void {
    // Stop polling and keep-alive
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    if (this.keepAliveInterval) {
      clearInterval(this.keepAliveInterval);
      this.keepAliveInterval = null;
    }

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      figma.notify('MCP Controller: Không thể kết nối sau nhiều lần thử', { error: true });
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts - 1), 30000);

    console.log(`[Figma Plugin] Reconnecting attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`);

    setTimeout(() => {
      this.connect();
    }, delay);
  }

  // This method is now called directly from polling
  // private handleMessage method is no longer needed

  private async handleCommand(command: FigmaCommand): Promise<void> {
    const commandDescription = `${command.category}.${command.operation}`;
    const commandData = command.parameters;

    this.logToUI(`📥 Nhận command: ${commandDescription}`, 'info');
    console.log(`[Figma Plugin] Executing command: ${commandDescription}`, commandData);

    try {
      // Handle new API commands
      const result = await this.handleNewCommand(command);

      // Send success response via HTTP
      await this.sendResponse({
        id: command.id,
        success: true,
        data: result
      });

      this.logToUI(`✅ Hoàn thành: ${commandDescription}`, 'success');
      figma.notify(`Hoàn thành: ${commandDescription}`, { timeout: 1000 });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logToUI(`❌ Lỗi ${commandDescription}: ${errorMessage}`, 'error');
      console.error(`[Figma Plugin] Command ${commandDescription} failed:`, error);

      // Send error response via HTTP
      await this.sendResponse({
        id: command.id,
        success: false,
        error: errorMessage
      });

      figma.notify(`Lỗi: ${commandDescription} - ${errorMessage}`, { error: true });
    }
  }


  private async handleNewCommand(command: FigmaCommand): Promise<any> {
    const { category, operation, parameters } = command;

    switch (category) {
      case 'node-creation':
        return await this.handleNodeCreation(operation, parameters);

      case 'node-modification':
        return await this.handleNodeModification(operation, parameters);

      case 'style-modification':
        return await this.handleStyleModification(operation, parameters);

      case 'text-operations':
        return await this.handleTextOperations(operation, parameters);

      case 'layout-operations':
        return await this.handleLayoutOperations(operation, parameters);

      case 'component-operations':
        return await this.handleComponentOperations(operation, parameters);

      case 'boolean-operations':
        return await this.handleBooleanOperations(operation, parameters);

      case 'hierarchy-operations':
        return await this.handleHierarchyOperations(operation, parameters);

      case 'selection-navigation':
        return await this.handleSelectionNavigation(operation, parameters);

      case 'export-operations':
        return await this.handleExportOperations(operation, parameters);

      default:
        throw new Error(`Unknown command category: ${category}`);
    }
  }

  // === NEW API CATEGORY HANDLERS ===

  private async handleNodeCreation(operation: string, params: any): Promise<any> {
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

  private async handleNodeModification(operation: string, params: any): Promise<any> {
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

  // Placeholder handlers for other categories (to be implemented)
  private async handleStyleModification(operation: string, params: any): Promise<any> {
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

  private async handleTextOperations(operation: string, params: any): Promise<any> {
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

  private async handleLayoutOperations(operation: string, params: any): Promise<any> {
    throw new Error(`Layout operations not implemented yet: ${operation}`);
  }

  private async handleComponentOperations(operation: string, params: any): Promise<any> {
    throw new Error(`Component operations not implemented yet: ${operation}`);
  }

  private async handleBooleanOperations(operation: string, params: any): Promise<any> {
    throw new Error(`Boolean operations not implemented yet: ${operation}`);
  }

  private async handleHierarchyOperations(operation: string, params: any): Promise<any> {
    throw new Error(`Hierarchy operations not implemented yet: ${operation}`);
  }

  private async handleSelectionNavigation(operation: string, params: any): Promise<any> {
    throw new Error(`Selection navigation not implemented yet: ${operation}`);
  }

  private async handleExportOperations(operation: string, params: any): Promise<any> {
    throw new Error(`Export operations not implemented yet: ${operation}`);
  }

  // === NEW API NODE CREATION IMPLEMENTATIONS ===

  private async createFrame(params: any): Promise<any> {
    const { name = 'Frame', width = 100, height = 100, x = 0, y = 0 } = params;

    const frame = figma.createFrame();
    frame.name = name;
    frame.resize(width, height);
    frame.x = x;
    frame.y = y;

    figma.currentPage.appendChild(frame);

    return {
      id: frame.id,
      name: frame.name,
      type: frame.type,
      x: frame.x,
      y: frame.y,
      width: frame.width,
      height: frame.height
    };
  }

  private async createRectangle(params: any): Promise<any> {
    const { width, height, x = 0, y = 0, name = 'Rectangle' } = params;

    const rect = figma.createRectangle();
    rect.name = name;
    rect.resize(width, height);
    rect.x = x;
    rect.y = y;

    figma.currentPage.appendChild(rect);

    return {
      id: rect.id,
      name: rect.name,
      type: rect.type,
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height
    };
  }

  private async createEllipse(params: any): Promise<any> {
    const { width, height, x = 0, y = 0, name = 'Ellipse' } = params;

    const ellipse = figma.createEllipse();
    ellipse.name = name;
    ellipse.resize(width, height);
    ellipse.x = x;
    ellipse.y = y;

    figma.currentPage.appendChild(ellipse);

    return {
      id: ellipse.id,
      name: ellipse.name,
      type: ellipse.type,
      x: ellipse.x,
      y: ellipse.y,
      width: ellipse.width,
      height: ellipse.height
    };
  }

  private async createText(params: any): Promise<any> {
    const { characters, x = 0, y = 0, fontSize = 16, name = 'Text' } = params;

    // Load font with fallback
    try {
      await figma.loadFontAsync({ family: "Inter", style: "Regular" });
    } catch (error) {
      try {
        await figma.loadFontAsync({ family: "Roboto", style: "Regular" });
      } catch (fallbackError) {
        throw new Error('Cannot load any font');
      }
    }

    const textNode = figma.createText();
    textNode.name = name;
    textNode.characters = characters;
    textNode.fontSize = fontSize;
    textNode.x = x;
    textNode.y = y;

    figma.currentPage.appendChild(textNode);

    return {
      id: textNode.id,
      name: textNode.name,
      type: textNode.type,
      characters: textNode.characters,
      fontSize: textNode.fontSize,
      x: textNode.x,
      y: textNode.y
    };
  }

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

  // === NEW API NODE MODIFICATION IMPLEMENTATIONS ===

  private async setPosition(params: any): Promise<any> {
    const { nodeId, x, y } = params;

    const node = figma.getNodeById(nodeId);
    if (!node) {
      throw new Error(`Node not found: ${nodeId}`);
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
      throw new Error(`Node ${nodeId} does not support positioning`);
    }
  }

  private async resize(params: any): Promise<any> {
    const { nodeId, width, height } = params;

    const node = figma.getNodeById(nodeId);
    if (!node) {
      throw new Error(`Node not found: ${nodeId}`);
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
      throw new Error(`Node ${nodeId} does not support resizing`);
    }
  }

  private async setRotation(params: any): Promise<any> {
    const { nodeId, rotation } = params;

    const node = figma.getNodeById(nodeId);
    if (!node) {
      throw new Error(`Node not found: ${nodeId}`);
    }

    if ('rotation' in node) {
      node.rotation = rotation * (Math.PI / 180); // Convert degrees to radians

      return {
        id: node.id,
        name: node.name,
        rotation: node.rotation * (180 / Math.PI) // Convert back to degrees for response
      };
    } else {
      throw new Error(`Node ${nodeId} does not support rotation`);
    }
  }

  private async setOpacity(params: any): Promise<any> {
    const { nodeId, opacity } = params;

    const node = figma.getNodeById(nodeId);
    if (!node) {
      throw new Error(`Node not found: ${nodeId}`);
    }

    if ('opacity' in node) {
      node.opacity = opacity;

      return {
        id: node.id,
        name: node.name,
        opacity: node.opacity
      };
    } else {
      throw new Error(`Node ${nodeId} does not support opacity`);
    }
  }

  private async setVisible(params: any): Promise<any> {
    const { nodeId, visible } = params;

    const node = figma.getNodeById(nodeId);
    if (!node) {
      throw new Error(`Node not found: ${nodeId}`);
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
      throw new Error(`Node ${nodeId} does not support visibility changes`);
    }
  }

  private async setLocked(params: any): Promise<any> {
    const { nodeId, locked } = params;

    const node = figma.getNodeById(nodeId);
    if (!node) {
      throw new Error(`Node not found: ${nodeId}`);
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
      throw new Error(`Node ${nodeId} does not support locking`);
    }
  }

  private async setName(params: any): Promise<any> {
    const { nodeId, name } = params;

    const node = figma.getNodeById(nodeId);
    if (!node) {
      throw new Error(`Node not found: ${nodeId}`);
    }

    node.name = name;

    return {
      id: node.id,
      name: node.name
    };
  }

  private async setBlendMode(params: any): Promise<any> {
    const { nodeId, blendMode } = params;

    const node = figma.getNodeById(nodeId);
    if (!node) {
      throw new Error(`Node not found: ${nodeId}`);
    }

    if ('blendMode' in node) {
      node.blendMode = blendMode;

      return {
        id: node.id,
        name: node.name,
        blendMode: node.blendMode
      };
    } else {
      throw new Error(`Node ${nodeId} does not support blend modes`);
    }
  }

  // Command implementations









  // === B3: STYLE MODIFICATION IMPLEMENTATIONS ===

  private async setFills(params: any): Promise<any> {
    const { nodeId, fills } = params;
    const node = figma.getNodeById(nodeId);

    if (!node) {
      throw new Error(`Node with id ${nodeId} not found`);
    }

    if (!('fills' in node)) {
      throw new Error(`Node ${nodeId} does not support fills`);
    }

    const figmaFills = fills.map((fill: any) => this.convertPaintToFigma(fill));
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
      throw new Error(`Node with id ${nodeId} not found`);
    }

    if (!('strokes' in node)) {
      throw new Error(`Node ${nodeId} does not support strokes`);
    }

    const figmaStrokes = strokes.map((stroke: any) => this.convertPaintToFigma(stroke));
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
      throw new Error(`Node with id ${nodeId} not found`);
    }

    if (!('strokeWeight' in node)) {
      throw new Error(`Node ${nodeId} does not support stroke weight`);
    }

    (node as any).strokeWeight = weight;

    return {
      nodeId,
      strokeWeight: weight
    };
  }

  private async setStrokeCap(params: any): Promise<any> {
    const { nodeId, strokeCap } = params;
    const node = figma.getNodeById(nodeId);

    if (!node) {
      throw new Error(`Node with id ${nodeId} not found`);
    }

    if (!('strokeCap' in node)) {
      throw new Error(`Node ${nodeId} does not support stroke cap`);
    }

    (node as any).strokeCap = strokeCap;

    return {
      nodeId,
      strokeCap
    };
  }

  private async setStrokeJoin(params: any): Promise<any> {
    const { nodeId, strokeJoin } = params;
    const node = figma.getNodeById(nodeId);

    if (!node) {
      throw new Error(`Node with id ${nodeId} not found`);
    }

    if (!('strokeJoin' in node)) {
      throw new Error(`Node ${nodeId} does not support stroke join`);
    }

    (node as any).strokeJoin = strokeJoin;

    return {
      nodeId,
      strokeJoin
    };
  }

  private async setStrokeAlign(params: any): Promise<any> {
    const { nodeId, strokeAlign } = params;
    const node = figma.getNodeById(nodeId);

    if (!node) {
      throw new Error(`Node with id ${nodeId} not found`);
    }

    if (!('strokeAlign' in node)) {
      throw new Error(`Node ${nodeId} does not support stroke align`);
    }

    (node as any).strokeAlign = strokeAlign;

    return {
      nodeId,
      strokeAlign
    };
  }

  private async setStrokeDashPattern(params: any): Promise<any> {
    const { nodeId, dashPattern } = params;
    const node = figma.getNodeById(nodeId);

    if (!node) {
      throw new Error(`Node with id ${nodeId} not found`);
    }

    if (!('dashPattern' in node)) {
      throw new Error(`Node ${nodeId} does not support dash pattern`);
    }

    (node as any).dashPattern = dashPattern;

    return {
      nodeId,
      dashPattern
    };
  }

  private async setCornerRadius(params: any): Promise<any> {
    const { nodeId, radius } = params;
    const node = figma.getNodeById(nodeId);

    if (!node) {
      throw new Error(`Node with id ${nodeId} not found`);
    }

    if (!('cornerRadius' in node)) {
      throw new Error(`Node ${nodeId} does not support corner radius`);
    }

    if (typeof radius === 'number') {
      (node as any).cornerRadius = radius;
    } else {
      // Individual corner radii
      (node as any).topLeftRadius = radius.topLeft;
      (node as any).topRightRadius = radius.topRight;
      (node as any).bottomLeftRadius = radius.bottomLeft;
      (node as any).bottomRightRadius = radius.bottomRight;
    }

    return {
      nodeId,
      radius
    };
  }

  private async setEffects(params: any): Promise<any> {
    const { nodeId, effects } = params;
    const node = figma.getNodeById(nodeId);

    if (!node) {
      throw new Error(`Node with id ${nodeId} not found`);
    }

    if (!('effects' in node)) {
      throw new Error(`Node ${nodeId} does not support effects`);
    }

    const figmaEffects = effects.map((effect: any) => this.convertEffectToFigma(effect));
    (node as any).effects = figmaEffects;

    return {
      nodeId,
      effectsCount: figmaEffects.length
    };
  }

  private async setConstraints(params: any): Promise<any> {
    const { nodeId, constraints } = params;
    const node = figma.getNodeById(nodeId);

    if (!node) {
      throw new Error(`Node with id ${nodeId} not found`);
    }

    if (!('constraints' in node)) {
      throw new Error(`Node ${nodeId} does not support constraints`);
    }

    (node as any).constraints = {
      horizontal: constraints.horizontal,
      vertical: constraints.vertical
    };

    return {
      nodeId,
      constraints
    };
  }

  private async setBlendModeStyle(params: any): Promise<any> {
    const { nodeId, blendMode } = params;
    const node = figma.getNodeById(nodeId);

    if (!node) {
      throw new Error(`Node with id ${nodeId} not found`);
    }

    if (!('blendMode' in node)) {
      throw new Error(`Node ${nodeId} does not support blend mode`);
    }

    (node as any).blendMode = blendMode;

    return {
      nodeId,
      blendMode
    };
  }

  private async setOpacityStyle(params: any): Promise<any> {
    const { nodeId, opacity } = params;
    const node = figma.getNodeById(nodeId);

    if (!node) {
      throw new Error(`Node with id ${nodeId} not found`);
    }

    if (!('opacity' in node)) {
      throw new Error(`Node ${nodeId} does not support opacity`);
    }

    (node as any).opacity = opacity;

    return {
      nodeId,
      opacity
    };
  }

  // === B4: TEXT OPERATIONS IMPLEMENTATIONS ===

  private async setCharacters(params: any): Promise<any> {
    const { nodeId, characters, range } = params;
    const node = figma.getNodeById(nodeId);

    if (!node) {
      throw new Error(`Node with id ${nodeId} not found`);
    }

    if (node.type !== 'TEXT') {
      throw new Error(`Node ${nodeId} is not a text node`);
    }

    const textNode = node as TextNode;

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
    const node = figma.getNodeById(nodeId);

    if (!node) {
      throw new Error(`Node with id ${nodeId} not found`);
    }

    if (node.type !== 'TEXT') {
      throw new Error(`Node ${nodeId} is not a text node`);
    }

    const textNode = node as TextNode;

    if (range) {
      textNode.setRangeFontSize(range.start, range.end, fontSize);
    } else {
      textNode.fontSize = fontSize;
    }

    return {
      nodeId,
      fontSize
    };
  }

  private async setFontName(params: any): Promise<any> {
    const { nodeId, fontName, range } = params;
    const node = figma.getNodeById(nodeId);

    if (!node) {
      throw new Error(`Node with id ${nodeId} not found`);
    }

    if (node.type !== 'TEXT') {
      throw new Error(`Node ${nodeId} is not a text node`);
    }

    const textNode = node as TextNode;

    // Load font first
    await figma.loadFontAsync(fontName);

    if (range) {
      textNode.setRangeFontName(range.start, range.end, fontName);
    } else {
      textNode.fontName = fontName;
    }

    return {
      nodeId,
      fontName
    };
  }

  private async setFontWeight(params: any): Promise<any> {
    const { nodeId, fontWeight, range } = params;
    const node = figma.getNodeById(nodeId);

    if (!node) {
      throw new Error(`Node with id ${nodeId} not found`);
    }

    if (node.type !== 'TEXT') {
      throw new Error(`Node ${nodeId} is not a text node`);
    }

    const textNode = node as TextNode;

    // Get current font family to create font name with new weight
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

    // Load font first
    await figma.loadFontAsync(newFontName);

    if (range) {
      textNode.setRangeFontName(range.start, range.end, newFontName);
    } else {
      textNode.fontName = newFontName;
    }

    return {
      nodeId,
      fontWeight,
      fontName: newFontName
    };
  }

  private async setTextAlignHorizontal(params: any): Promise<any> {
    const { nodeId, textAlignHorizontal } = params;
    const node = figma.getNodeById(nodeId);

    if (!node) {
      throw new Error(`Node with id ${nodeId} not found`);
    }

    if (node.type !== 'TEXT') {
      throw new Error(`Node ${nodeId} is not a text node`);
    }

    const textNode = node as TextNode;
    textNode.textAlignHorizontal = textAlignHorizontal;

    return {
      nodeId,
      textAlignHorizontal
    };
  }

  private async setTextAlignVertical(params: any): Promise<any> {
    const { nodeId, textAlignVertical } = params;
    const node = figma.getNodeById(nodeId);

    if (!node) {
      throw new Error(`Node with id ${nodeId} not found`);
    }

    if (node.type !== 'TEXT') {
      throw new Error(`Node ${nodeId} is not a text node`);
    }

    const textNode = node as TextNode;
    textNode.textAlignVertical = textAlignVertical;

    return {
      nodeId,
      textAlignVertical
    };
  }

  private async setTextCase(params: any): Promise<any> {
    const { nodeId, textCase, range } = params;
    const node = figma.getNodeById(nodeId);

    if (!node) {
      throw new Error(`Node with id ${nodeId} not found`);
    }

    if (node.type !== 'TEXT') {
      throw new Error(`Node ${nodeId} is not a text node`);
    }

    const textNode = node as TextNode;

    if (range) {
      textNode.setRangeTextCase(range.start, range.end, textCase);
    } else {
      textNode.textCase = textCase;
    }

    return {
      nodeId,
      textCase
    };
  }

  private async setTextDecoration(params: any): Promise<any> {
    const { nodeId, textDecoration, range } = params;
    const node = figma.getNodeById(nodeId);

    if (!node) {
      throw new Error(`Node with id ${nodeId} not found`);
    }

    if (node.type !== 'TEXT') {
      throw new Error(`Node ${nodeId} is not a text node`);
    }

    const textNode = node as TextNode;

    if (range) {
      textNode.setRangeTextDecoration(range.start, range.end, textDecoration);
    } else {
      textNode.textDecoration = textDecoration;
    }

    return {
      nodeId,
      textDecoration
    };
  }

  private async setLineHeight(params: any): Promise<any> {
    const { nodeId, lineHeight, range } = params;
    const node = figma.getNodeById(nodeId);

    if (!node) {
      throw new Error(`Node with id ${nodeId} not found`);
    }

    if (node.type !== 'TEXT') {
      throw new Error(`Node ${nodeId} is not a text node`);
    }

    const textNode = node as TextNode;

    if (range) {
      textNode.setRangeLineHeight(range.start, range.end, lineHeight);
    } else {
      textNode.lineHeight = lineHeight;
    }

    return {
      nodeId,
      lineHeight
    };
  }

  private async setLetterSpacing(params: any): Promise<any> {
    const { nodeId, letterSpacing, range } = params;
    const node = figma.getNodeById(nodeId);

    if (!node) {
      throw new Error(`Node with id ${nodeId} not found`);
    }

    if (node.type !== 'TEXT') {
      throw new Error(`Node ${nodeId} is not a text node`);
    }

    const textNode = node as TextNode;

    if (range) {
      textNode.setRangeLetterSpacing(range.start, range.end, letterSpacing);
    } else {
      textNode.letterSpacing = letterSpacing;
    }

    return {
      nodeId,
      letterSpacing
    };
  }

  private async setParagraphSpacing(params: any): Promise<any> {
    const { nodeId, paragraphSpacing } = params;
    const node = figma.getNodeById(nodeId);

    if (!node) {
      throw new Error(`Node with id ${nodeId} not found`);
    }

    if (node.type !== 'TEXT') {
      throw new Error(`Node ${nodeId} is not a text node`);
    }

    const textNode = node as TextNode;
    textNode.paragraphSpacing = paragraphSpacing;

    return {
      nodeId,
      paragraphSpacing
    };
  }

  private async setParagraphIndent(params: any): Promise<any> {
    const { nodeId, paragraphIndent } = params;
    const node = figma.getNodeById(nodeId);

    if (!node) {
      throw new Error(`Node with id ${nodeId} not found`);
    }

    if (node.type !== 'TEXT') {
      throw new Error(`Node ${nodeId} is not a text node`);
    }

    const textNode = node as TextNode;
    textNode.paragraphIndent = paragraphIndent;

    return {
      nodeId,
      paragraphIndent
    };
  }

  private async setTextAutoResize(params: any): Promise<any> {
    const { nodeId, textAutoResize } = params;
    const node = figma.getNodeById(nodeId);

    if (!node) {
      throw new Error(`Node with id ${nodeId} not found`);
    }

    if (node.type !== 'TEXT') {
      throw new Error(`Node ${nodeId} is not a text node`);
    }

    const textNode = node as TextNode;
    textNode.textAutoResize = textAutoResize;

    return {
      nodeId,
      textAutoResize
    };
  }

  private async setTextTruncation(params: any): Promise<any> {
    const { nodeId, maxLines } = params;
    const node = figma.getNodeById(nodeId);

    if (!node) {
      throw new Error(`Node with id ${nodeId} not found`);
    }

    if (node.type !== 'TEXT') {
      throw new Error(`Node ${nodeId} is not a text node`);
    }

    const textNode = node as TextNode;

    if (maxLines !== undefined) {
      textNode.maxLines = maxLines;
    }

    return {
      nodeId,
      maxLines
    };
  }

  private async insertText(params: any): Promise<any> {
    const { nodeId, text, position } = params;
    const node = figma.getNodeById(nodeId);

    if (!node) {
      throw new Error(`Node with id ${nodeId} not found`);
    }

    if (node.type !== 'TEXT') {
      throw new Error(`Node ${nodeId} is not a text node`);
    }

    const textNode = node as TextNode;
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
    const node = figma.getNodeById(nodeId);

    if (!node) {
      throw new Error(`Node with id ${nodeId} not found`);
    }

    if (node.type !== 'TEXT') {
      throw new Error(`Node ${nodeId} is not a text node`);
    }

    const textNode = node as TextNode;
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
    const node = figma.getNodeById(nodeId);

    if (!node) {
      throw new Error(`Node with id ${nodeId} not found`);
    }

    if (node.type !== 'TEXT') {
      throw new Error(`Node ${nodeId} is not a text node`);
    }

    const textNode = node as TextNode;
    const text = textNode.characters.substring(range.start, range.end);

    return {
      nodeId,
      range,
      text,
      fontSize: textNode.getRangeFontSize(range.start, range.end),
      fontName: textNode.getRangeFontName(range.start, range.end)
    };
  }

  // Helper methods for style conversion
  private convertPaintToFigma(paint: any): Paint {
    switch (paint.type) {
      case 'SOLID':
        const rgb = this.hexToRgb(paint.color) || { r: 0, g: 0, b: 0 };
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
            color: this.hexToRgb(stop.color) as RGBA || { r: 0, g: 0, b: 0, a: 1 },
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

  private convertEffectToFigma(effect: any): Effect {
    switch (effect.type) {
      case 'DROP_SHADOW':
      case 'INNER_SHADOW':
        return {
          type: effect.type,
          color: this.hexToRgb(effect.color) as RGBA || { r: 0, g: 0, b: 0, a: 1 },
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

  // Utility methods
  private hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16) / 255,
      g: parseInt(result[2], 16) / 255,
      b: parseInt(result[3], 16) / 255
    } : null;
  }

  private async sendResponse(response: FigmaResponse): Promise<void> {
    try {
      const httpResponse = await this.makeRequest('/figma/response', 'POST', response);
      if (!httpResponse.ok) {
        console.error('[Figma Plugin] Failed to send response:', httpResponse.statusText);
      }
    } catch (error) {
      console.error('[Figma Plugin] Error sending response:', error);
    }
  }
}

// Initialize plugin
console.log('[Figma Plugin] Starting MCP Controller Plugin...');

// Show UI first before creating client
figma.showUI(__html__, { width: 400, height: 600, title: 'MCP Controller' });

// Then create client (this will allow logToUI to work)
new FigmaHttpClient();