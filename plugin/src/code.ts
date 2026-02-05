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
  private figmaApiToken: string | null = null;

  constructor() {
    this.logToUI('FigmaHttpClient khởi tạo', 'info');
    this.setupUIMessageHandler();
    this.loadStoredToken();
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

  // Setup UI message handler
  private setupUIMessageHandler() {
    figma.ui.onmessage = async (msg) => {
      try {
        if (msg.type === 'figma-token') {
          this.figmaApiToken = msg.token;
          this.logToUI('Đã nhận Figma API token từ UI', 'info');
          console.log('[Figma Plugin] Received Figma API token');

          // Store in clientStorage for persistence
          await figma.clientStorage.setAsync('figmaApiToken', msg.token);

          // Send token to HTTP bridge for MCP server access
          await this.setTokenOnBridge(msg.token);

        } else if (msg.type === 'clear-token') {
          this.figmaApiToken = null;
          await figma.clientStorage.deleteAsync('figmaApiToken');
          this.logToUI('Đã xóa token khỏi storage', 'info');

          // Clear token from HTTP bridge
          await this.clearTokenOnBridge();

        } else if (msg.type === 'test-api') {
          await this.handleAPITest(msg.operation);
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        this.logToUI(`Lỗi xử lý message: ${errorMsg}`, 'error');
      }
    };
  }

  // Load stored token on startup
  private async loadStoredToken() {
    try {
      const storedToken = await figma.clientStorage.getAsync('figmaApiToken');
      if (storedToken) {
        this.figmaApiToken = storedToken;
        this.logToUI('Đã tải token từ storage', 'info');

        // Send token to UI for display
        figma.ui.postMessage({
          type: 'token-loaded',
          payload: { hasToken: true }
        });

        // Send token to HTTP bridge for MCP server access
        await this.setTokenOnBridge(storedToken);
      }
    } catch (error) {
      console.log('[Figma Plugin] No stored token found');
    }
  }

  // === COLOR UTILITY METHODS ===

  // Chuyển đổi hex color sang RGBA format (0-1 range)
  private hexToRgba(hex: string, alpha: number = 1): { r: number, g: number, b: number, a: number } {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    return { r, g, b, a: alpha };
  }

  // Chuyển đổi RGB sang RGBA format (0-1 range)
  private rgbToRgba(r: number, g: number, b: number, a: number = 1): { r: number, g: number, b: number, a: number } {
    return {
      r: r / 255,
      g: g / 255,
      b: b / 255,
      a
    };
  }

  // Chuyển đổi HSL sang RGBA format (0-1 range)
  private hslToRgba(h: number, s: number, l: number, a: number = 1): { r: number, g: number, b: number, a: number } {
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

  // Phân tích chuỗi màu từ nhiều định dạng
  private parseColorString(color: string): { r: number, g: number, b: number, a: number } {
    // Handle hex colors
    if (color.startsWith('#')) {
      return this.hexToRgba(color);
    }

    // Handle rgb() format: rgb(255, 0, 0)
    const rgbMatch = color.match(/rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/);
    if (rgbMatch) {
      return this.rgbToRgba(parseInt(rgbMatch[1]), parseInt(rgbMatch[2]), parseInt(rgbMatch[3]));
    }

    // Handle rgba() format: rgba(255, 0, 0, 0.5)
    const rgbaMatch = color.match(/rgba\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([0-9.]+)\s*\)/);
    if (rgbaMatch) {
      return this.rgbToRgba(parseInt(rgbaMatch[1]), parseInt(rgbaMatch[2]), parseInt(rgbaMatch[3]), parseFloat(rgbaMatch[4]));
    }

    // Handle hsl() format: hsl(0, 100%, 50%)
    const hslMatch = color.match(/hsl\s*\(\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%\s*\)/);
    if (hslMatch) {
      return this.hslToRgba(parseInt(hslMatch[1]), parseInt(hslMatch[2]), parseInt(hslMatch[3]));
    }

    // Fallback to black for invalid format
    return { r: 0, g: 0, b: 0, a: 1 };
  }

  // Tạo Paint object từ màu
  private createSolidPaint(color: string | {r: number, g: number, b: number, a?: number}): Paint {
    let rgba;
    if (typeof color === 'string') {
      rgba = this.parseColorString(color);
    } else {
      rgba = { ...color, a: color.a ?? 1 };
    }

    return {
      type: 'SOLID',
      color: { r: rgba.r, g: rgba.g, b: rgba.b },
      opacity: rgba.a
    };
  }

  // Xử lý fill từ parameters
  private processFill(fill: any): Paint {
    if (typeof fill === 'string') {
      // String color (hex, rgb, hsl, etc.)
      return this.createSolidPaint(fill);
    } else if (fill && typeof fill === 'object') {
      // Paint object từ schema
      if (fill.type === 'SOLID' && fill.color) {
        if (typeof fill.color === 'string') {
          // Hex color in paint object
          return this.createSolidPaint(fill.color);
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
    return this.createSolidPaint('#000000');
  }

  private async connect(): Promise<void> {
    try {
      console.log('[Figma Plugin] Connecting to HTTP server...');

      // Load stored token first
      await this.loadStoredToken();

      // Health check first
      const healthResponse = await this.makeRequest('/health', 'GET');
      if (!healthResponse.ok) {
        throw new Error('Health check failed');
      }

      // Register as Figma client
      const registerResponse = await this.makeRequest('/figma/register', 'POST', {
        clientType: 'figma-ui',
        clientId: this.clientId,
        figmaApiToken: this.figmaApiToken // Send token if available
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

      case 'createVector':
        return await this.createVector(params);

      case 'createBooleanOperation':
        return await this.createBooleanOperation(params);

      case 'createSlice':
        return await this.createSlice(params);

      case 'createComponentSet':
        return await this.createComponentSet(params);

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
    const {
      name = 'Frame',
      width = 100, height = 100,
      x = 0, y = 0,
      fills // Thêm parameter fills từ schema cho background frame
    } = params;

    const frame = figma.createFrame();
    frame.name = name;
    frame.resize(width, height);
    frame.x = x;
    frame.y = y;

    // Áp dụng background màu nếu được cung cấp
    if (fills && fills.length > 0) {
      frame.fills = fills.map((fill: any) => this.processFill(fill));
    }
    // Không có else clause - giữ nguyên default Figma khi không có màu

    figma.currentPage.appendChild(frame);

    return {
      id: frame.id,
      name: frame.name,
      type: frame.type,
      x: frame.x,
      y: frame.y,
      width: frame.width,
      height: frame.height,
      fills: frame.fills // Bao gồm thông tin fills trong response
    };
  }

  private async createRectangle(params: any): Promise<any> {
    const {
      width, height,
      x = 0, y = 0,
      name = 'Rectangle',
      fills // Thêm parameter fills từ schema
    } = params;

    const rect = figma.createRectangle();
    rect.name = name;
    rect.resize(width, height);
    rect.x = x;
    rect.y = y;

    // Áp dụng màu nếu được cung cấp
    if (fills && fills.length > 0) {
      rect.fills = fills.map((fill: any) => this.processFill(fill));
    }
    // Không có else clause - giữ nguyên default Figma (đen) khi không có màu

    figma.currentPage.appendChild(rect);

    return {
      id: rect.id,
      name: rect.name,
      type: rect.type,
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height,
      fills: rect.fills // Bao gồm thông tin fills trong response
    };
  }

  private async createEllipse(params: any): Promise<any> {
    const {
      width, height,
      x = 0, y = 0,
      name = 'Ellipse',
      fills // Thêm parameter fills từ schema
    } = params;

    const ellipse = figma.createEllipse();
    ellipse.name = name;
    ellipse.resize(width, height);
    ellipse.x = x;
    ellipse.y = y;

    // Áp dụng màu nếu được cung cấp
    if (fills && fills.length > 0) {
      ellipse.fills = fills.map((fill: any) => this.processFill(fill));
    }
    // Không có else clause - giữ nguyên default Figma (đen) khi không có màu

    figma.currentPage.appendChild(ellipse);

    return {
      id: ellipse.id,
      name: ellipse.name,
      type: ellipse.type,
      x: ellipse.x,
      y: ellipse.y,
      width: ellipse.width,
      height: ellipse.height,
      fills: ellipse.fills // Bao gồm thông tin fills trong response
    };
  }

  private async createText(params: any): Promise<any> {
    const {
      characters,
      x = 0, y = 0,
      fontSize = 16,
      name = 'Text',
      fills // Thêm parameter fills từ schema cho màu text
    } = params;

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

    // Áp dụng màu text nếu được cung cấp
    if (fills && fills.length > 0) {
      textNode.fills = fills.map((fill: any) => this.processFill(fill));
    }
    // Không có else clause - giữ nguyên default Figma (đen) khi không có màu

    figma.currentPage.appendChild(textNode);

    return {
      id: textNode.id,
      name: textNode.name,
      type: textNode.type,
      characters: textNode.characters,
      fontSize: textNode.fontSize,
      x: textNode.x,
      y: textNode.y,
      fills: textNode.fills // Bao gồm thông tin fills trong response
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

    try {
      if (typeof radius === 'number') {
        // Uniform corner radius for all corners
        if (radius < 0) {
          throw new Error('Corner radius must be non-negative');
        }
        (node as any).cornerRadius = radius;
      } else if (typeof radius === 'object' && radius !== null) {
        // Individual corner radii
        if (typeof radius.topLeft !== 'number' || radius.topLeft < 0 ||
            typeof radius.topRight !== 'number' || radius.topRight < 0 ||
            typeof radius.bottomLeft !== 'number' || radius.bottomLeft < 0 ||
            typeof radius.bottomRight !== 'number' || radius.bottomRight < 0) {
          throw new Error('All corner radius values must be non-negative numbers');
        }

        // Set individual corner properties
        if ('topLeftRadius' in node) (node as any).topLeftRadius = radius.topLeft;
        if ('topRightRadius' in node) (node as any).topRightRadius = radius.topRight;
        if ('bottomLeftRadius' in node) (node as any).bottomLeftRadius = radius.bottomLeft;
        if ('bottomRightRadius' in node) (node as any).bottomRightRadius = radius.bottomRight;
      } else {
        throw new Error('Invalid corner radius format: expected number or object with corner properties');
      }

      return {
        nodeId,
        radius,
        success: true
      };
    } catch (error) {
      throw new Error(`Failed to set corner radius: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
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

    // Validate constraint values
    const validHorizontalConstraints = ['LEFT', 'RIGHT', 'CENTER', 'LEFT_RIGHT', 'SCALE'];
    const validVerticalConstraints = ['TOP', 'BOTTOM', 'CENTER', 'TOP_BOTTOM', 'SCALE'];

    if (!validHorizontalConstraints.includes(constraints.horizontal)) {
      throw new Error(`Invalid horizontal constraint: ${constraints.horizontal}. Must be one of: ${validHorizontalConstraints.join(', ')}`);
    }

    if (!validVerticalConstraints.includes(constraints.vertical)) {
      throw new Error(`Invalid vertical constraint: ${constraints.vertical}. Must be one of: ${validVerticalConstraints.join(', ')}`);
    }

    try {
      (node as any).constraints = {
        horizontal: constraints.horizontal,
        vertical: constraints.vertical
      };

      return {
        nodeId,
        constraints: {
          horizontal: constraints.horizontal,
          vertical: constraints.vertical
        },
        success: true
      };
    } catch (error) {
      throw new Error(`Failed to set constraints: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
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

  // Helper function to map font weight to style name with multiple fallbacks
  private mapFontWeightToStyle(fontWeight: number | string, currentStyle?: string, fontFamily?: string): string {
    const weight = typeof fontWeight === 'string' ? parseInt(fontWeight) : fontWeight;

    // Expanded weight to style mappings with more variations
    const weightToStyle: Record<number, string[]> = {
      100: ['Thin', 'Hairline', 'Ultra Light', 'UltraLight', '100', 'W100'],
      200: ['Extra Light', 'ExtraLight', 'Ultra Light', 'UltraLight', '200', 'W200'],
      300: ['Light', '300', 'W300'],
      400: ['Regular', 'Normal', 'Book', '400', 'W400', 'Roman'],
      500: ['Medium', '500', 'W500'],
      600: ['Semi Bold', 'SemiBold', 'Demi Bold', 'DemiBold', '600', 'W600'],
      700: ['Bold', '700', 'W700'],
      800: ['Extra Bold', 'ExtraBold', 'Ultra Bold', 'UltraBold', '800', 'W800'],
      900: ['Black', 'Heavy', 'Ultra', 'Fat', '900', 'W900']
    };

    // Check if current style contains italic/oblique
    const isItalic = currentStyle && /italic|oblique/i.test(currentStyle);

    // Get possible styles for this weight
    const possibleStyles = weightToStyle[weight] || [];

    // Try each possible style in order
    for (const baseStyle of possibleStyles) {
      const targetStyle = isItalic ? `${baseStyle} Italic` : baseStyle;
      // This would be used to check font availability in real implementation
      // For now, return the first option
      return targetStyle;
    }

    // Enhanced fallback logic based on font family
    if (fontFamily) {
      // Special handling for common system fonts
      if (fontFamily.toLowerCase().includes('inter')) {
        if (weight <= 300) return isItalic ? 'Light Italic' : 'Light';
        if (weight <= 500) return isItalic ? 'Italic' : 'Regular';
        if (weight <= 600) return isItalic ? 'Medium Italic' : 'Medium';
        if (weight <= 700) return isItalic ? 'Semi Bold Italic' : 'Semi Bold';
        return isItalic ? 'Bold Italic' : 'Bold';
      }

      if (fontFamily.toLowerCase().includes('roboto')) {
        if (weight <= 300) return isItalic ? 'Light Italic' : 'Light';
        if (weight <= 500) return isItalic ? 'Italic' : 'Regular';
        if (weight <= 600) return isItalic ? 'Medium Italic' : 'Medium';
        return isItalic ? 'Bold Italic' : 'Bold';
      }
    }

    // Generic fallback
    if (weight < 400) return isItalic ? 'Light Italic' : 'Light';
    if (weight === 400) return isItalic ? 'Italic' : 'Regular';
    if (weight < 700) return isItalic ? 'Medium Italic' : 'Medium';
    if (weight === 700) return isItalic ? 'Bold Italic' : 'Bold';
    return isItalic ? 'Bold Italic' : 'Bold'; // Changed to Bold instead of Black for better compatibility
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

    // Map font weight to appropriate style name with enhanced fallback
    const mappedStyle = this.mapFontWeightToStyle(fontWeight, currentFontName.style, currentFontName.family);

    // Try multiple font style variations
    const styleVariations = [
      mappedStyle,
      // Remove spaces and try different formats
      mappedStyle.replace(/\s+/g, ''),
      // Try with different casing
      mappedStyle.toLowerCase(),
      mappedStyle.toUpperCase(),
      // Basic fallbacks
      fontWeight >= 700 ? 'Bold' : 'Regular',
      fontWeight >= 600 ? 'SemiBold' : 'Regular',
      'Regular' // Ultimate fallback
    ];

    let successfulFont: FontName | null = null;
    let usedStyle = '';

    // Try each style variation until one works
    for (const styleToTry of styleVariations) {
      const testFontName: FontName = {
        family: currentFontName.family,
        style: styleToTry
      };

      try {
        await figma.loadFontAsync(testFontName);
        successfulFont = testFontName;
        usedStyle = styleToTry;
        break;
      } catch (error) {
        // Continue to next style variation
        continue;
      }
    }

    if (!successfulFont) {
      throw new Error(`Could not load any font style for family "${currentFontName.family}" with weight ${fontWeight}. Font family may not support the requested weight.`);
    }

    // Apply the successful font
    try {
      if (range) {
        textNode.setRangeFontName(range.start, range.end, successfulFont);
      } else {
        textNode.fontName = successfulFont;
      }

      return {
        nodeId,
        fontWeight,
        fontName: successfulFont,
        mappedStyle: usedStyle,
        success: true,
        warning: usedStyle !== mappedStyle ? `Used "${usedStyle}" instead of "${mappedStyle}" for weight ${fontWeight}` : undefined
      };
    } catch (error) {
      throw new Error(`Failed to apply font weight: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
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

    // Convert MCP schema format to Figma API format
    let figmaLineHeight: LineHeight;

    if (typeof lineHeight === 'number') {
      // Direct number input - use as pixels
      figmaLineHeight = { unit: 'PIXELS', value: lineHeight };
    } else if (typeof lineHeight === 'object' && lineHeight !== null) {
      if (lineHeight.unit === 'AUTO') {
        // AUTO unit format for Figma API
        figmaLineHeight = { unit: 'AUTO' } as LineHeight;
      } else if (lineHeight.unit === 'PIXELS' && typeof lineHeight.value === 'number') {
        figmaLineHeight = { unit: 'PIXELS', value: lineHeight.value };
      } else if (lineHeight.unit === 'PERCENT' && typeof lineHeight.value === 'number') {
        figmaLineHeight = { unit: 'PERCENT', value: lineHeight.value };
      } else {
        throw new Error(`Invalid line height format: ${JSON.stringify(lineHeight)}`);
      }
    } else {
      throw new Error(`Invalid line height format: expected number or object with unit/value`);
    }

    try {
      if (range) {
        textNode.setRangeLineHeight(range.start, range.end, figmaLineHeight);
      } else {
        textNode.lineHeight = figmaLineHeight;
      }

      return {
        nodeId,
        lineHeight: figmaLineHeight,
        success: true
      };
    } catch (error) {
      throw new Error(`Failed to set line height: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
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

    // Convert MCP schema format to Figma API format
    let figmaLetterSpacing: LetterSpacing;

    if (typeof letterSpacing === 'number') {
      // Direct number input - use as pixels
      figmaLetterSpacing = { unit: 'PIXELS', value: letterSpacing };
    } else if (typeof letterSpacing === 'object' && letterSpacing !== null) {
      if (letterSpacing.unit === 'PIXELS' && typeof letterSpacing.value === 'number') {
        figmaLetterSpacing = { unit: 'PIXELS', value: letterSpacing.value };
      } else if (letterSpacing.unit === 'PERCENT' && typeof letterSpacing.value === 'number') {
        figmaLetterSpacing = { unit: 'PERCENT', value: letterSpacing.value };
      } else {
        throw new Error(`Invalid letter spacing format: ${JSON.stringify(letterSpacing)}`);
      }
    } else {
      throw new Error(`Invalid letter spacing format: expected number or object with unit/value`);
    }

    try {
      if (range) {
        textNode.setRangeLetterSpacing(range.start, range.end, figmaLetterSpacing);
      } else {
        textNode.letterSpacing = figmaLetterSpacing;
      }

      return {
        nodeId,
        letterSpacing: figmaLetterSpacing,
        success: true
      };
    } catch (error) {
      throw new Error(`Failed to set letter spacing: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
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

  private async createBooleanOperation(params: any): Promise<any> {
    const { booleanOperation, children, x = 0, y = 0, name = 'Boolean Operation' } = params;

    if (!booleanOperation || !['UNION', 'INTERSECT', 'SUBTRACT', 'EXCLUDE'].includes(booleanOperation)) {
      throw new Error(`Invalid boolean operation: ${booleanOperation}`);
    }

    if (!children || !Array.isArray(children) || children.length < 2) {
      throw new Error('Boolean operation requires at least 2 child nodes');
    }

    try {
      // Get child nodes and validate they exist
      const childNodes: SceneNode[] = [];
      for (const childId of children) {
        const childNode = figma.getNodeById(childId);
        if (!childNode) {
          throw new Error(`Child node not found: ${childId}`);
        }
        if (!('parent' in childNode)) {
          throw new Error(`Node ${childId} is not a valid scene node for boolean operations`);
        }
        childNodes.push(childNode as SceneNode);
      }

      // Create boolean operation
      const booleanOp = figma.createBooleanOperation();
      booleanOp.name = name;
      booleanOp.x = x;
      booleanOp.y = y;
      booleanOp.booleanOperation = booleanOperation as 'UNION' | 'INTERSECT' | 'SUBTRACT' | 'EXCLUDE';

      // Add child nodes to boolean operation
      for (const childNode of childNodes) {
        // Remove from current parent and add to boolean operation
        if (childNode.parent) {
          childNode.remove();
        }
        booleanOp.appendChild(childNode);
      }

      figma.currentPage.appendChild(booleanOp);

      return {
        id: booleanOp.id,
        name: booleanOp.name,
        type: booleanOp.type,
        booleanOperation: booleanOp.booleanOperation,
        x: booleanOp.x,
        y: booleanOp.y,
        childrenCount: booleanOp.children.length,
        success: true
      };
    } catch (error) {
      throw new Error(`Failed to create boolean operation: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async createSlice(params: any): Promise<any> {
    const { width = 100, height = 100, x = 0, y = 0, name = 'Slice' } = params;

    try {
      const slice = figma.createSlice();
      slice.name = name;
      slice.x = x;
      slice.y = y;
      slice.resize(width, height);

      figma.currentPage.appendChild(slice);

      return {
        id: slice.id,
        name: slice.name,
        type: slice.type,
        x: slice.x,
        y: slice.y,
        width: slice.width,
        height: slice.height,
        success: true
      };
    } catch (error) {
      throw new Error(`Failed to create slice: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async createComponentSet(params: any): Promise<any> {
    const { name = 'Component Set', description, components = [], x = 0, y = 0 } = params;

    if (!components || components.length < 2) {
      throw new Error('Component set requires at least 2 existing components to combine as variants');
    }

    try {
      // Get component nodes and validate they exist
      const componentNodes: ComponentNode[] = [];
      for (const componentId of components) {
        const component = figma.getNodeById(componentId);
        if (!component) {
          throw new Error(`Component not found: ${componentId}`);
        }
        if (component.type !== 'COMPONENT') {
          throw new Error(`Node ${componentId} is not a component`);
        }
        componentNodes.push(component as ComponentNode);
      }

      // Use combineAsVariants to create component set
      const componentSet = figma.combineAsVariants(componentNodes, figma.currentPage);

      // Apply custom properties
      componentSet.name = name;
      componentSet.x = x;
      componentSet.y = y;

      if (description) {
        componentSet.description = description;
      }

      return {
        id: componentSet.id,
        name: componentSet.name,
        type: componentSet.type,
        description: componentSet.description,
        x: componentSet.x,
        y: componentSet.y,
        variantsCount: componentSet.children.length,
        success: true
      };
    } catch (error) {
      throw new Error(`Failed to create component set: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
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

  // === FIGMA API METHODS ===

  // Make calls to Figma REST API
  private async makeFigmaApiRequest(endpoint: string, method: string = 'GET', body?: any): Promise<any> {
    if (!this.figmaApiToken) {
      throw new Error('Figma API token không có. Vui lòng cấu hình token trong UI');
    }

    const options: any = {
      method,
      headers: {
        'X-Figma-Token': this.figmaApiToken,
        'Content-Type': 'application/json'
      }
    };

    if (body && method !== 'GET') {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`https://api.figma.com/v1${endpoint}`, options);

    if (!response.ok) {
      throw new Error(`Figma API error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }

  // Get file info from Figma API
  private async getFigmaFile(fileKey: string): Promise<any> {
    this.logToUI(`Đang lấy thông tin file: ${fileKey}`, 'info');
    const result = await this.makeFigmaApiRequest(`/files/${fileKey}`);
    this.logToUI(`Đã lấy file: ${result.name}`, 'success');
    return result;
  }

  // Get specific nodes from file
  private async getFigmaNodes(fileKey: string, nodeIds: string[]): Promise<any> {
    const idsParam = nodeIds.join(',');
    this.logToUI(`Đang lấy nodes: ${idsParam}`, 'info');
    const result = await this.makeFigmaApiRequest(`/files/${fileKey}/nodes?ids=${idsParam}`);
    this.logToUI(`Đã lấy ${Object.keys(result.nodes).length} nodes`, 'success');
    return result;
  }

  // Export nodes as images
  private async exportFigmaNodes(fileKey: string, nodeIds: string[], format: string = 'png', scale: number = 1): Promise<any> {
    const idsParam = nodeIds.join(',');
    this.logToUI(`Đang export ${nodeIds.length} nodes`, 'info');
    const result = await this.makeFigmaApiRequest(`/images/${fileKey}?ids=${idsParam}&format=${format}&scale=${scale}`);
    this.logToUI('Export thành công', 'success');
    return result;
  }

  // Get project files
  private async getProjectFiles(projectId: string): Promise<any> {
    this.logToUI(`Đang lấy files trong project: ${projectId}`, 'info');
    const result = await this.makeFigmaApiRequest(`/projects/${projectId}/files`);
    this.logToUI(`Tìm thấy ${result.files.length} files`, 'success');
    return result;
  }

  // Get current user teams and projects
  private async getUserTeams(): Promise<any> {
    this.logToUI('Đang lấy danh sách teams...', 'info');
    const result = await this.makeFigmaApiRequest('/teams');
    this.logToUI(`Tìm thấy ${result.teams.length} teams`, 'success');
    return result;
  }

  // Handle API tests from UI
  private async handleAPITest(operation: string): Promise<void> {
    try {
      if (!this.figmaApiToken) {
        this.logToUI('Không có token để test API', 'warning');
        return;
      }

      let result: any;
      switch (operation) {
        case 'getUserTeams':
          result = await this.getUserTeams();
          figma.ui.postMessage({
            type: 'api-test-result',
            payload: {
              operation: 'getUserTeams',
              success: true,
              data: result
            }
          });
          break;

        default:
          this.logToUI(`API test không được hỗ trợ: ${operation}`, 'warning');
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      this.logToUI(`Lỗi API test: ${errorMsg}`, 'error');
      figma.ui.postMessage({
        type: 'api-test-result',
        payload: {
          operation: operation,
          success: false,
          error: errorMsg
        }
      });
    }
  }

  // === TOKEN BRIDGE MANAGEMENT ===

  private async setTokenOnBridge(token: string): Promise<void> {
    try {
      this.logToUI('Đang gửi token đến HTTP bridge...', 'info');

      const response = await fetch(`${this.baseUrl}/figma/token/set`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          this.logToUI('Đã đồng bộ token với MCP server', 'success');
        } else {
          this.logToUI('Lỗi đồng bộ token với MCP server', 'warning');
        }
      } else {
        this.logToUI('Không thể kết nối HTTP bridge để set token', 'warning');
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      this.logToUI(`Lỗi đồng bộ token: ${errorMsg}`, 'warning');
    }
  }

  private async clearTokenOnBridge(): Promise<void> {
    try {
      this.logToUI('Đang xóa token khỏi HTTP bridge...', 'info');

      const response = await fetch(`${this.baseUrl}/figma/token/clear`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          this.logToUI('Đã xóa token khỏi MCP server', 'success');
        } else {
          this.logToUI('Lỗi xóa token khỏi MCP server', 'warning');
        }
      } else {
        this.logToUI('Không thể kết nối HTTP bridge để clear token', 'warning');
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      this.logToUI(`Lỗi clear token: ${errorMsg}`, 'warning');
    }
  }
}

// Initialize plugin
console.log('[Figma Plugin] Starting MCP Controller Plugin...');

// Show UI first before creating client
figma.showUI(__html__, { width: 400, height: 600, title: 'MCP Controller' });

// Then create client (this will allow logToUI to work)
new FigmaHttpClient();