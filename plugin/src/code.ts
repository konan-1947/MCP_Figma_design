// Figma Plugin - Main code
/// <reference types="@figma/plugin-typings" />

interface FigmaCommand {
  type: string;
  data: any;
  id: string;
}

interface FigmaResponse {
  id: string;
  success: boolean;
  data?: any;
  error?: string;
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
    this.connect();
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
    console.log(`[Figma Plugin] Executing command: ${command.type}`, command.data);

    try {
      let result: any = null;

      switch (command.type) {
        case 'lay_selection':
          result = await this.laySelection();
          break;

        case 'them_text':
          result = await this.themText(command.data);
          break;

        case 'tao_man_hinh':
          result = await this.taoManHinh(command.data);
          break;

        case 'them_button':
          result = await this.themButton(command.data);
          break;

        case 'them_hinh_chu_nhat':
          result = await this.themHinhChuNhat(command.data);
          break;

        case 'tao_form_login':
          result = await this.taoFormLogin(command.data);
          break;

        case 'tao_card':
          result = await this.taoCard(command.data);
          break;

        case 'xoa_selection':
          result = await this.xoaSelection();
          break;

        default:
          throw new Error(`Unknown command type: ${command.type}`);
      }

      // Send success response via HTTP
      await this.sendResponse({
        id: command.id,
        success: true,
        data: result
      });

      figma.notify(`Hoàn thành: ${command.type}`, { timeout: 1000 });

    } catch (error) {
      console.error(`[Figma Plugin] Command ${command.type} failed:`, error);

      // Send error response via HTTP
      await this.sendResponse({
        id: command.id,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      figma.notify(`Lỗi: ${command.type} - ${error instanceof Error ? error.message : 'Unknown error'}`, { error: true });
    }
  }

  // Command implementations
  private async laySelection(): Promise<any> {
    const selection = figma.currentPage.selection;

    if (selection.length === 0) {
      return {
        message: 'Không có element nào được chọn',
        count: 0,
        elements: []
      };
    }

    const elements = selection.map(node => ({
      id: node.id,
      name: node.name,
      type: node.type,
      x: 'x' in node ? node.x : undefined,
      y: 'y' in node ? node.y : undefined,
      width: 'width' in node ? node.width : undefined,
      height: 'height' in node ? node.height : undefined,
      visible: node.visible,
      parent: node.parent ? node.parent.name : null
    }));

    return {
      message: `Đã chọn ${selection.length} element(s)`,
      count: selection.length,
      elements
    };
  }

  private async themText(data: any): Promise<any> {
    const textNode = figma.createText();

    // Load font trước khi set text
    await figma.loadFontAsync({ family: "Inter", style: "Regular" });

    textNode.characters = data.noi_dung;
    textNode.x = data.x || 0;
    textNode.y = data.y || 0;
    textNode.fontSize = data.font_size || 16;

    if (data.mau_chu) {
      const color = this.hexToRgb(data.mau_chu);
      if (color) {
        textNode.fills = [{
          type: 'SOLID',
          color: color
        }];
      }
    }

    figma.currentPage.appendChild(textNode);
    figma.currentPage.selection = [textNode];
    figma.viewport.scrollAndZoomIntoView([textNode]);

    return {
      message: 'Đã thêm text thành công',
      nodeId: textNode.id,
      text: data.noi_dung,
      position: { x: textNode.x, y: textNode.y }
    };
  }

  private async taoManHinh(data: any): Promise<any> {
    const frame = figma.createFrame();
    frame.name = data.ten;

    // Set kích thước theo loại màn hình
    const sizes = {
      mobile: { width: 375, height: 812 },
      tablet: { width: 768, height: 1024 },
      desktop: { width: 1440, height: 900 }
    };

    const size = sizes[data.loai as keyof typeof sizes] || sizes.mobile;
    frame.resize(size.width, size.height);

    // Màu nền trắng
    frame.fills = [{
      type: 'SOLID',
      color: { r: 1, g: 1, b: 1 }
    }];

    // Thêm header
    await figma.loadFontAsync({ family: "Inter", style: "Bold" });
    const headerText = figma.createText();
    headerText.characters = data.tieu_de;
    headerText.fontSize = 24;
    headerText.x = 20;
    headerText.y = 20;
    headerText.fills = [{
      type: 'SOLID',
      color: { r: 0.1, g: 0.1, b: 0.1 }
    }];

    frame.appendChild(headerText);
    figma.currentPage.appendChild(frame);
    figma.currentPage.selection = [frame];
    figma.viewport.scrollAndZoomIntoView([frame]);

    return {
      message: `Đã tạo màn hình ${data.loai} thành công`,
      frameId: frame.id,
      name: data.ten,
      size: size,
      header: data.tieu_de
    };
  }

  private async themButton(data: any): Promise<any> {
    const button = figma.createFrame();
    button.name = `Button: ${data.text}`;
    button.x = data.x;
    button.y = data.y;
    button.resize(data.width || 120, data.height || 44);

    // Auto layout
    button.layoutMode = 'HORIZONTAL';
    button.primaryAxisAlignItems = 'CENTER';
    button.counterAxisAlignItems = 'CENTER';
    button.paddingLeft = 16;
    button.paddingRight = 16;
    button.paddingTop = 12;
    button.paddingBottom = 12;

    // Background color
    const bgColor = this.hexToRgb(data.mau_nen || '#3B82F6');
    if (bgColor) {
      button.fills = [{
        type: 'SOLID',
        color: bgColor
      }];
    }

    // Corner radius
    button.cornerRadius = 8;

    // Add text
    await figma.loadFontAsync({ family: "Inter", style: "Medium" });
    const buttonText = figma.createText();
    buttonText.characters = data.text;
    buttonText.fontSize = 14;

    const textColor = this.hexToRgb(data.mau_chu || '#FFFFFF');
    if (textColor) {
      buttonText.fills = [{
        type: 'SOLID',
        color: textColor
      }];
    }

    button.appendChild(buttonText);
    figma.currentPage.appendChild(button);
    figma.currentPage.selection = [button];
    figma.viewport.scrollAndZoomIntoView([button]);

    return {
      message: 'Đã tạo button thành công',
      buttonId: button.id,
      text: data.text,
      position: { x: data.x, y: data.y },
      size: { width: data.width || 120, height: data.height || 44 }
    };
  }

  private async themHinhChuNhat(data: any): Promise<any> {
    const rect = figma.createRectangle();
    rect.x = data.x;
    rect.y = data.y;
    rect.resize(data.width, data.height);

    const color = this.hexToRgb(data.mau_nen);
    if (color) {
      rect.fills = [{
        type: 'SOLID',
        color: color
      }];
    }

    if (data.border_radius) {
      rect.cornerRadius = data.border_radius;
    }

    figma.currentPage.appendChild(rect);
    figma.currentPage.selection = [rect];
    figma.viewport.scrollAndZoomIntoView([rect]);

    return {
      message: 'Đã tạo hình chữ nhật thành công',
      rectId: rect.id,
      position: { x: data.x, y: data.y },
      size: { width: data.width, height: data.height },
      color: data.mau_nen
    };
  }

  private async taoFormLogin(data: any): Promise<any> {
    const form = figma.createFrame();
    form.name = 'Login Form';
    form.resize(340, 400);
    form.x = 100;
    form.y = 100;

    // Background
    form.fills = [{
      type: 'SOLID',
      color: { r: 1, g: 1, b: 1 }
    }];

    form.cornerRadius = 12;
    form.layoutMode = 'VERTICAL';
    form.primaryAxisAlignItems = 'MIN';
    form.counterAxisAlignItems = 'MIN';
    form.paddingLeft = 24;
    form.paddingRight = 24;
    form.paddingTop = 32;
    form.paddingBottom = 32;
    form.itemSpacing = 24;

    await figma.loadFontAsync({ family: "Inter", style: "Bold" });
    await figma.loadFontAsync({ family: "Inter", style: "Regular" });

    // Title
    const title = figma.createText();
    title.characters = data.tieu_de || 'Đăng nhập';
    title.fontSize = 28;
    title.fills = [{ type: 'SOLID', color: { r: 0.1, g: 0.1, b: 0.1 } }];

    // Username field
    const usernameField = this.createInputField('Tên đăng nhập');

    // Password field
    const passwordField = this.createInputField('Mật khẩu');

    // Login button
    const loginBtn = figma.createFrame();
    loginBtn.name = 'Login Button';
    loginBtn.resize(292, 48);
    loginBtn.fills = [{ type: 'SOLID', color: { r: 0.23, g: 0.51, b: 0.96 } }];
    loginBtn.cornerRadius = 8;
    loginBtn.layoutMode = 'HORIZONTAL';
    loginBtn.primaryAxisAlignItems = 'CENTER';
    loginBtn.counterAxisAlignItems = 'CENTER';

    const btnText = figma.createText();
    btnText.characters = 'Đăng nhập';
    btnText.fontSize = 16;
    btnText.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];

    loginBtn.appendChild(btnText);
    form.appendChild(title);
    form.appendChild(usernameField);
    form.appendChild(passwordField);
    form.appendChild(loginBtn);

    figma.currentPage.appendChild(form);
    figma.currentPage.selection = [form];
    figma.viewport.scrollAndZoomIntoView([form]);

    return {
      message: 'Đã tạo form login thành công',
      formId: form.id,
      title: data.tieu_de || 'Đăng nhập',
      components: ['title', 'username_field', 'password_field', 'login_button']
    };
  }

  private createInputField(placeholder: string): FrameNode {
    const field = figma.createFrame();
    field.name = `Input: ${placeholder}`;
    field.resize(292, 48);
    field.fills = [{ type: 'SOLID', color: { r: 0.97, g: 0.97, b: 0.97 } }];
    field.cornerRadius = 8;
    field.layoutMode = 'HORIZONTAL';
    field.primaryAxisAlignItems = 'CENTER';
    field.counterAxisAlignItems = 'CENTER';
    field.paddingLeft = 16;
    field.paddingRight = 16;

    const text = figma.createText();
    text.characters = placeholder;
    text.fontSize = 14;
    text.fills = [{ type: 'SOLID', color: { r: 0.6, g: 0.6, b: 0.6 } }];

    field.appendChild(text);
    return field;
  }

  private async taoCard(data: any): Promise<any> {
    const card = figma.createFrame();
    card.name = `Card: ${data.tieu_de}`;
    card.x = data.x || 0;
    card.y = data.y || 0;
    card.resize(300, 200);

    // Card styling
    card.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
    card.cornerRadius = 12;
    card.layoutMode = 'VERTICAL';
    card.primaryAxisAlignItems = 'MIN';
    card.itemSpacing = 16;
    card.paddingLeft = 20;
    card.paddingRight = 20;
    card.paddingTop = 20;
    card.paddingBottom = 20;

    // Shadow effect
    card.effects = [{
      type: 'DROP_SHADOW',
      color: { r: 0, g: 0, b: 0, a: 0.1 },
      offset: { x: 0, y: 2 },
      radius: 8,
      visible: true,
      blendMode: 'NORMAL'
    }];

    await figma.loadFontAsync({ family: "Inter", style: "Bold" });
    await figma.loadFontAsync({ family: "Inter", style: "Regular" });

    // Title
    const title = figma.createText();
    title.characters = data.tieu_de;
    title.fontSize = 18;
    title.fills = [{ type: 'SOLID', color: { r: 0.1, g: 0.1, b: 0.1 } }];

    // Description
    const description = figma.createText();
    description.characters = data.mo_ta;
    description.fontSize = 14;
    description.fills = [{ type: 'SOLID', color: { r: 0.4, g: 0.4, b: 0.4 } }];

    card.appendChild(title);
    card.appendChild(description);

    figma.currentPage.appendChild(card);
    figma.currentPage.selection = [card];
    figma.viewport.scrollAndZoomIntoView([card]);

    return {
      message: 'Đã tạo card thành công',
      cardId: card.id,
      title: data.tieu_de,
      description: data.mo_ta,
      position: { x: data.x || 0, y: data.y || 0 }
    };
  }

  private async xoaSelection(): Promise<any> {
    const selection = figma.currentPage.selection;

    if (selection.length === 0) {
      return {
        message: 'Không có element nào được chọn để xóa',
        deleted: 0
      };
    }

    const deletedItems = selection.map(node => ({
      id: node.id,
      name: node.name,
      type: node.type
    }));

    selection.forEach(node => node.remove());
    figma.currentPage.selection = [];

    return {
      message: `Đã xóa ${deletedItems.length} element(s)`,
      deleted: deletedItems.length,
      items: deletedItems
    };
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
new FigmaHttpClient();

// Show UI
figma.showUI(__html__, { width: 300, height: 200, title: 'MCP Controller' });