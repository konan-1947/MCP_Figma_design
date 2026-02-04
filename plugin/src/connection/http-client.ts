// HTTP Client
// Extract từ makeRequest() method (lines 210-231)

import { HTTPRequestOptions } from '../types';
import { PLUGIN_CONFIG, HTTP_DEFAULTS } from '../core/config';
import { Logger } from '../utilities/logger';

export class HTTPClient {
  private clientId: string | null = null;

  constructor(clientId?: string) {
    this.clientId = clientId || null;
  }

  /**
   * Set client ID for subsequent requests
   */
  setClientId(clientId: string): void {
    this.clientId = clientId;
  }

  /**
   * Make HTTP request tới server
   * Extract từ makeRequest() method (lines 210-231)
   */
  async makeRequest(endpoint: string, method: string = 'GET', body?: any): Promise<any> {
    const options: any = {
      method,
      headers: {
        ...HTTP_DEFAULTS.headers
      }
    };

    // Add client ID header nếu có
    if (this.clientId) {
      options.headers['X-Client-ID'] = this.clientId;
    }

    // Add body cho non-GET requests
    if (body && method !== 'GET') {
      options.body = JSON.stringify(body);
    }

    const url = `${PLUGIN_CONFIG.baseUrl}${endpoint}`;

    try {
      const response = await fetch(url, options);
      return response;
    } catch (error) {
      Logger.error(`HTTP request failed: ${method} ${endpoint} - ${error}`);
      throw error;
    }
  }

  /**
   * Health check endpoint
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.makeRequest('/health', 'GET');
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  /**
   * Register client với server
   */
  async registerClient(clientType: string = 'figma-ui'): Promise<string> {
    const response = await this.makeRequest('/figma/register', 'POST', {
      clientType,
      clientId: this.clientId
    });

    if (!response.ok) {
      throw new Error(`Registration failed: ${response.statusText}`);
    }

    const data: any = await response.json();
    const newClientId = data.clientId;

    this.setClientId(newClientId);
    return newClientId;
  }

  /**
   * Poll for commands từ server
   */
  async pollForCommands(): Promise<any[]> {
    const response = await this.makeRequest('/figma/commands', 'GET');

    if (!response.ok) {
      throw new Error(`Polling failed: ${response.statusText}`);
    }

    const data: any = await response.json();
    return data.commands || [];
  }

  /**
   * Send keep-alive signal
   */
  async sendKeepAlive(): Promise<boolean> {
    try {
      const response = await this.makeRequest('/figma/keepalive', 'POST');
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  /**
   * Send response back to server
   */
  async sendResponse(response: any): Promise<boolean> {
    try {
      const httpResponse = await this.makeRequest('/figma/response', 'POST', response);
      return httpResponse.ok;
    } catch (error) {
      Logger.error(`Failed to send response: ${error}`);
      return false;
    }
  }

  /**
   * Generic GET request helper
   */
  async get(endpoint: string): Promise<any> {
    const response = await this.makeRequest(endpoint, 'GET');
    if (!response.ok) {
      throw new Error(`GET ${endpoint} failed: ${response.statusText}`);
    }
    return response.json();
  }

  /**
   * Generic POST request helper
   */
  async post(endpoint: string, data?: any): Promise<any> {
    const response = await this.makeRequest(endpoint, 'POST', data);
    if (!response.ok) {
      throw new Error(`POST ${endpoint} failed: ${response.statusText}`);
    }
    return response.json();
  }

  /**
   * Request với timeout support
   */
  async makeRequestWithTimeout(
    endpoint: string,
    method: string = 'GET',
    body?: any,
    timeoutMs: number = HTTP_DEFAULTS.timeout
  ): Promise<any> {
    // Figma Plugin API doesn't support AbortController, use simple timeout
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`Request timeout after ${timeoutMs}ms`)), timeoutMs);
    });

    const requestPromise = this.makeRequest(endpoint, method, body);

    try {
      const response = await Promise.race([requestPromise, timeoutPromise]);
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get current client ID
   */
  getClientId(): string | null {
    return this.clientId;
  }

  /**
   * Check if client is registered
   */
  isRegistered(): boolean {
    return this.clientId !== null;
  }
}