import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

interface FigmaApiClientConfig {
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
}

interface FigmaApiError {
  status: number;
  err: string;
  message?: string;
}

interface FigmaApiResponse<T = any> {
  data?: T;
  error?: FigmaApiError;
  status: number;
}

export class FigmaApiClient {
  private client: AxiosInstance;
  private config: FigmaApiClientConfig;
  private accessToken: string | null = null;
  private httpBridgeUrl: string;

  constructor(config: Partial<FigmaApiClientConfig> & { httpBridgeUrl?: string } = {}) {
    this.config = {
      timeout: 30000, // 30 seconds
      retryAttempts: 3,
      retryDelay: 1000, // 1 second
      ...config
    };

    this.httpBridgeUrl = config.httpBridgeUrl || 'http://localhost:8765';

    this.client = axios.create({
      baseURL: 'https://api.figma.com/v1',
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor - add authorization header
    this.client.interceptors.request.use(
      async (config) => {
        const token = await this.getEffectiveToken();
        if (token) {
          config.headers = config.headers || {};
          config.headers['X-Figma-Token'] = token;
        }
        console.error(`[Figma API Client] 📤 ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('[Figma API Client] Request interceptor error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor - log responses and handle errors
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        console.error(`[Figma API Client] 📥 ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`);
        return response;
      },
      (error) => {
        console.error(`[Figma API Client] ❌ ${error.response?.status || 'NETWORK'} ${error.config?.method?.toUpperCase()} ${error.config?.url}:`,
                     error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  public setAccessToken(token: string): void {
    this.accessToken = token;
    console.error('[Figma API Client] 🔑 Access token updated');
  }

  public clearAccessToken(): void {
    this.accessToken = null;
    console.error('[Figma API Client] 🗑️ Access token cleared');
  }

  public hasAccessToken(): boolean {
    return !!this.accessToken;
  }

  // Get token from HTTP bridge if not set locally
  private async getEffectiveToken(): Promise<string | null> {
    if (this.accessToken) {
      return this.accessToken;
    }

    try {
      const response = await axios.get(`${this.httpBridgeUrl}/figma/token/get`);
      return response.data.token || null;
    } catch (error) {
      console.error('[Figma API Client] ❌ Failed to get token from bridge:', error);
      return null;
    }
  }

  // Set token via HTTP bridge
  public async setTokenViaBridge(token: string): Promise<boolean> {
    try {
      const response = await axios.post(`${this.httpBridgeUrl}/figma/token/set`, { token });
      if (response.data.success) {
        this.accessToken = token; // Also cache locally
        console.error('[Figma API Client] 🔑 Token set via bridge');
        return true;
      }
      return false;
    } catch (error) {
      console.error('[Figma API Client] ❌ Failed to set token via bridge:', error);
      return false;
    }
  }

  // Clear token via HTTP bridge
  public async clearTokenViaBridge(): Promise<boolean> {
    try {
      const response = await axios.post(`${this.httpBridgeUrl}/figma/token/clear`);
      if (response.data.success) {
        this.accessToken = null; // Also clear locally
        console.error('[Figma API Client] 🗑️ Token cleared via bridge');
        return true;
      }
      return false;
    } catch (error) {
      console.error('[Figma API Client] ❌ Failed to clear token via bridge:', error);
      return false;
    }
  }

  private async retryRequest<T>(
    requestFunc: () => Promise<AxiosResponse<T>>,
    operation: string,
    retryCount: number = 0
  ): Promise<FigmaApiResponse<T>> {
    try {
      const response = await requestFunc();
      return {
        data: response.data,
        status: response.status
      };
    } catch (error: any) {
      const shouldRetry = retryCount < this.config.retryAttempts &&
                         this.isRetryableError(error);

      if (shouldRetry) {
        const delay = this.config.retryDelay * Math.pow(2, retryCount); // Exponential backoff
        console.error(`[Figma API Client] 🔄 Retrying ${operation} in ${delay}ms (attempt ${retryCount + 1}/${this.config.retryAttempts})`);

        await this.sleep(delay);
        return this.retryRequest(requestFunc, operation, retryCount + 1);
      }

      // Convert error to FigmaApiResponse format
      const status = error.response?.status || 500;
      const errorData = error.response?.data;

      return {
        error: {
          status,
          err: errorData?.err || 'API_ERROR',
          message: errorData?.message || error.message || 'Unknown error'
        },
        status
      };
    }
  }

  private isRetryableError(error: any): boolean {
    // Retry on network errors and rate limiting
    if (!error.response) return true; // Network error
    const status = error.response.status;
    return status === 429 || (status >= 500 && status < 600); // Rate limiting or server errors
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Check if we have any token available
  private async ensureToken(): Promise<FigmaApiResponse | null> {
    const token = await this.getEffectiveToken();
    if (!token) {
      return {
        error: {
          status: 401,
          err: 'MISSING_TOKEN',
          message: 'Access token is required for Figma API calls'
        },
        status: 401
      };
    }
    return null; // No error, token is available
  }

  // File Operations
  public async getFile(fileKey: string, options: {
    version?: string;
    ids?: string[];
    depth?: number;
    geometry?: 'paths' | 'bounds';
    plugin_data?: string;
    branch_data?: boolean;
  } = {}): Promise<FigmaApiResponse> {
    const tokenError = await this.ensureToken();
    if (tokenError) return tokenError;

    const params = new URLSearchParams();
    if (options.version) params.append('version', options.version);
    if (options.ids) params.append('ids', options.ids.join(','));
    if (options.depth) params.append('depth', options.depth.toString());
    if (options.geometry) params.append('geometry', options.geometry);
    if (options.plugin_data) params.append('plugin_data', options.plugin_data);
    if (options.branch_data) params.append('branch_data', options.branch_data.toString());

    const queryString = params.toString();
    const url = `/files/${fileKey}${queryString ? `?${queryString}` : ''}`;

    return this.retryRequest(
      () => this.client.get(url),
      `Get file ${fileKey}`
    );
  }

  public async getFileNodes(fileKey: string, nodeIds: string[], options: {
    version?: string;
    depth?: number;
    geometry?: 'paths' | 'bounds';
    plugin_data?: string;
  } = {}): Promise<FigmaApiResponse> {

    const params = new URLSearchParams();
    params.append('ids', nodeIds.join(','));
    if (options.version) params.append('version', options.version);
    if (options.depth) params.append('depth', options.depth.toString());
    if (options.geometry) params.append('geometry', options.geometry);
    if (options.plugin_data) params.append('plugin_data', options.plugin_data);

    const url = `/files/${fileKey}/nodes?${params.toString()}`;

    return this.retryRequest(
      () => this.client.get(url),
      `Get file nodes ${fileKey}`
    );
  }

  public async getImages(fileKey: string, options: {
    ids: string[];
    scale?: number;
    format?: 'jpg' | 'png' | 'svg' | 'pdf';
    svg_include_id?: boolean;
    svg_simplify_stroke?: boolean;
    use_absolute_bounds?: boolean;
    version?: string;
  }): Promise<FigmaApiResponse> {
    if (!this.accessToken) {
      return {
        error: {
          status: 401,
          err: 'MISSING_TOKEN',
          message: 'Access token is required for Figma API calls'
        },
        status: 401
      };
    }

    const params = new URLSearchParams();
    params.append('ids', options.ids.join(','));
    if (options.scale) params.append('scale', options.scale.toString());
    if (options.format) params.append('format', options.format);
    if (options.svg_include_id) params.append('svg_include_id', options.svg_include_id.toString());
    if (options.svg_simplify_stroke) params.append('svg_simplify_stroke', options.svg_simplify_stroke.toString());
    if (options.use_absolute_bounds) params.append('use_absolute_bounds', options.use_absolute_bounds.toString());
    if (options.version) params.append('version', options.version);

    const url = `/images/${fileKey}?${params.toString()}`;

    return this.retryRequest(
      () => this.client.get(url),
      `Get images ${fileKey}`
    );
  }

  // Component Operations
  public async getTeamComponents(teamId: string, options: {
    page_size?: number;
    after?: string;
  } = {}): Promise<FigmaApiResponse> {
    if (!this.accessToken) {
      return {
        error: {
          status: 401,
          err: 'MISSING_TOKEN',
          message: 'Access token is required for Figma API calls'
        },
        status: 401
      };
    }

    const params = new URLSearchParams();
    if (options.page_size) params.append('page_size', options.page_size.toString());
    if (options.after) params.append('after', options.after);

    const queryString = params.toString();
    const url = `/teams/${teamId}/components${queryString ? `?${queryString}` : ''}`;

    return this.retryRequest(
      () => this.client.get(url),
      `Get team components ${teamId}`
    );
  }

  public async getFileComponents(fileKey: string): Promise<FigmaApiResponse> {
    if (!this.accessToken) {
      return {
        error: {
          status: 401,
          err: 'MISSING_TOKEN',
          message: 'Access token is required for Figma API calls'
        },
        status: 401
      };
    }

    return this.retryRequest(
      () => this.client.get(`/files/${fileKey}/components`),
      `Get file components ${fileKey}`
    );
  }

  public async getComponent(componentKey: string): Promise<FigmaApiResponse> {
    if (!this.accessToken) {
      return {
        error: {
          status: 401,
          err: 'MISSING_TOKEN',
          message: 'Access token is required for Figma API calls'
        },
        status: 401
      };
    }

    return this.retryRequest(
      () => this.client.get(`/components/${componentKey}`),
      `Get component ${componentKey}`
    );
  }

  // Style Operations
  public async getTeamStyles(teamId: string, options: {
    page_size?: number;
    after?: string;
  } = {}): Promise<FigmaApiResponse> {
    if (!this.accessToken) {
      return {
        error: {
          status: 401,
          err: 'MISSING_TOKEN',
          message: 'Access token is required for Figma API calls'
        },
        status: 401
      };
    }

    const params = new URLSearchParams();
    if (options.page_size) params.append('page_size', options.page_size.toString());
    if (options.after) params.append('after', options.after);

    const queryString = params.toString();
    const url = `/teams/${teamId}/styles${queryString ? `?${queryString}` : ''}`;

    return this.retryRequest(
      () => this.client.get(url),
      `Get team styles ${teamId}`
    );
  }

  public async getFileStyles(fileKey: string): Promise<FigmaApiResponse> {
    if (!this.accessToken) {
      return {
        error: {
          status: 401,
          err: 'MISSING_TOKEN',
          message: 'Access token is required for Figma API calls'
        },
        status: 401
      };
    }

    return this.retryRequest(
      () => this.client.get(`/files/${fileKey}/styles`),
      `Get file styles ${fileKey}`
    );
  }

  public async getStyle(styleKey: string): Promise<FigmaApiResponse> {
    if (!this.accessToken) {
      return {
        error: {
          status: 401,
          err: 'MISSING_TOKEN',
          message: 'Access token is required for Figma API calls'
        },
        status: 401
      };
    }

    return this.retryRequest(
      () => this.client.get(`/styles/${styleKey}`),
      `Get style ${styleKey}`
    );
  }

  // Comment Operations
  public async getComments(fileKey: string): Promise<FigmaApiResponse> {
    if (!this.accessToken) {
      return {
        error: {
          status: 401,
          err: 'MISSING_TOKEN',
          message: 'Access token is required for Figma API calls'
        },
        status: 401
      };
    }

    return this.retryRequest(
      () => this.client.get(`/files/${fileKey}/comments`),
      `Get comments ${fileKey}`
    );
  }

  // Dev Resources (2025-2026 features)
  public async getLocalVariables(fileKey: string): Promise<FigmaApiResponse> {
    if (!this.accessToken) {
      return {
        error: {
          status: 401,
          err: 'MISSING_TOKEN',
          message: 'Access token is required for Figma API calls'
        },
        status: 401
      };
    }

    return this.retryRequest(
      () => this.client.get(`/files/${fileKey}/variables/local`),
      `Get local variables ${fileKey}`
    );
  }

  public async getPublishedVariables(fileKey: string): Promise<FigmaApiResponse> {
    if (!this.accessToken) {
      return {
        error: {
          status: 401,
          err: 'MISSING_TOKEN',
          message: 'Access token is required for Figma API calls'
        },
        status: 401
      };
    }

    return this.retryRequest(
      () => this.client.get(`/files/${fileKey}/variables/published`),
      `Get published variables ${fileKey}`
    );
  }

  // User and Team Operations
  public async getMe(): Promise<FigmaApiResponse> {
    if (!this.accessToken) {
      return {
        error: {
          status: 401,
          err: 'MISSING_TOKEN',
          message: 'Access token is required for Figma API calls'
        },
        status: 401
      };
    }

    return this.retryRequest(
      () => this.client.get('/me'),
      'Get user info'
    );
  }

  public async getTeamProjects(teamId: string): Promise<FigmaApiResponse> {
    if (!this.accessToken) {
      return {
        error: {
          status: 401,
          err: 'MISSING_TOKEN',
          message: 'Access token is required for Figma API calls'
        },
        status: 401
      };
    }

    return this.retryRequest(
      () => this.client.get(`/teams/${teamId}/projects`),
      `Get team projects ${teamId}`
    );
  }

  public async getProjectFiles(projectId: string, options: {
    branch_data?: boolean;
  } = {}): Promise<FigmaApiResponse> {
    if (!this.accessToken) {
      return {
        error: {
          status: 401,
          err: 'MISSING_TOKEN',
          message: 'Access token is required for Figma API calls'
        },
        status: 401
      };
    }

    const params = new URLSearchParams();
    if (options.branch_data) params.append('branch_data', options.branch_data.toString());

    const queryString = params.toString();
    const url = `/projects/${projectId}/files${queryString ? `?${queryString}` : ''}`;

    return this.retryRequest(
      () => this.client.get(url),
      `Get project files ${projectId}`
    );
  }

  // Utility methods
  public getConnectionInfo(): {
    hasToken: boolean;
    baseURL: string;
  } {
    return {
      hasToken: this.hasAccessToken(),
      baseURL: this.client.defaults.baseURL || 'https://api.figma.com/v1'
    };
  }

  public updateConfig(newConfig: Partial<FigmaApiClientConfig>): void {
    this.config = { ...this.config, ...newConfig };

    if (newConfig.timeout) {
      this.client.defaults.timeout = newConfig.timeout;
    }
  }
}

export default FigmaApiClient;