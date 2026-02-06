// Command Dispatcher
// Extract từ command processing methods (lines 307-382)

import { FigmaCommand, FigmaResponse } from '../types';
import { Logger } from '../utilities/logger';
import { ERROR_MESSAGES } from '../core/config';

// Import handlers
import { NodeCreationHandler } from './handlers/node-creation-handler';
import { NodeModificationHandler } from './handlers/node-modification-handler';
import { StyleModificationHandler } from './handlers/style-modification-handler';
import { TextOperationsHandler } from './handlers/text-operations-handler';
import { LayoutOperationsHandler } from './handlers/layout-operations-handler';

export class CommandDispatcher {
  private nodeCreationHandler: NodeCreationHandler;
  private nodeModificationHandler: NodeModificationHandler;
  private styleModificationHandler: StyleModificationHandler;
  private textOperationsHandler: TextOperationsHandler;
  private layoutOperationsHandler: LayoutOperationsHandler;

  constructor() {
    this.nodeCreationHandler = new NodeCreationHandler();
    this.nodeModificationHandler = new NodeModificationHandler();
    this.styleModificationHandler = new StyleModificationHandler();
    this.textOperationsHandler = new TextOperationsHandler();
    this.layoutOperationsHandler = new LayoutOperationsHandler();
  }

  /**
   * Handle incoming command
   * Extract từ handleCommand() method (lines 307-342)
   */
  async handleCommand(command: FigmaCommand): Promise<FigmaResponse> {
    const commandDescription = Logger.formatCommand(command.category, command.operation);

    Logger.logCommandStart(command.category, command.operation);
    console.log(`[Figma Plugin] Executing command: ${commandDescription}`, command.parameters);

    try {
      // Handle new API commands
      const result = await this.handleNewCommand(command);

      Logger.logCommandSuccess(command.category, command.operation);
      figma.notify(`Hoàn thành: ${commandDescription}`, { timeout: 1000 });

      return {
        id: command.id,
        success: true,
        data: result
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      Logger.logCommandError(command.category, command.operation, errorMessage);
      console.error(`[Figma Plugin] Command ${commandDescription} failed:`, error);

      figma.notify(`Lỗi: ${commandDescription} - ${errorMessage}`, { error: true });

      return {
        id: command.id,
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Route command to appropriate handler
   * Extract từ handleNewCommand() method (lines 345-382)
   */
  private async handleNewCommand(command: FigmaCommand): Promise<any> {
    const { category, operation, parameters } = command;

    switch (category) {
      case 'node-creation':
        return await this.nodeCreationHandler.handle(operation, parameters);

      case 'node-modification':
        return await this.nodeModificationHandler.handle(operation, parameters);

      case 'style-modification':
        return await this.styleModificationHandler.handle(operation, parameters);

      case 'text-operations':
        return await this.textOperationsHandler.handle(operation, parameters);

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
        throw new Error(ERROR_MESSAGES.UNKNOWN_CATEGORY(category));
    }
  }

  /**
   * Handle layout operations
   */
  private async handleLayoutOperations(operation: string, params: any): Promise<any> {
    // Extract action from params (used by layout tools)
    const action = params.action || operation;
    return await this.layoutOperationsHandler.handle(action, params);
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

  /**
   * Process array of commands
   */
  async handleCommands(commands: FigmaCommand[]): Promise<FigmaResponse[]> {
    const responses: FigmaResponse[] = [];

    for (const command of commands) {
      try {
        const response = await this.handleCommand(command);
        responses.push(response);
      } catch (error) {
        const errorResponse: FigmaResponse = {
          id: command.id,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
        responses.push(errorResponse);
      }
    }

    return responses;
  }

  /**
   * Validate command structure
   */
  validateCommand(command: any): boolean {
    if (!command || typeof command !== 'object') {
      return false;
    }

    return (
      typeof command.id === 'string' &&
      typeof command.category === 'string' &&
      typeof command.operation === 'string' &&
      command.parameters !== undefined
    );
  }

  /**
   * Get supported categories
   */
  getSupportedCategories(): string[] {
    return [
      'node-creation',
      'node-modification',
      'style-modification',
      'text-operations',
      'layout-operations',
      'component-operations',
      'boolean-operations',
      'hierarchy-operations',
      'selection-navigation',
      'export-operations'
    ];
  }

  /**
   * Check if category is supported
   */
  isCategorySupported(category: string): boolean {
    return this.getSupportedCategories().includes(category);
  }

  /**
   * Get handler for category (for debugging)
   */
  getHandler(category: string): any {
    switch (category) {
      case 'node-creation':
        return this.nodeCreationHandler;
      case 'node-modification':
        return this.nodeModificationHandler;
      case 'style-modification':
        return this.styleModificationHandler;
      case 'text-operations':
        return this.textOperationsHandler;
      default:
        return null;
    }
  }

  /**
   * Get command statistics
   */
  getStats(): {
    supportedCategories: string[];
    implementedCategories: string[];
    placeholderCategories: string[];
  } {
    const supported = this.getSupportedCategories();
    const implemented = [
      'node-creation',
      'node-modification',
      'style-modification',
      'text-operations'
    ];
    const placeholder = supported.filter(cat => !implemented.includes(cat));

    return {
      supportedCategories: supported,
      implementedCategories: implemented,
      placeholderCategories: placeholder
    };
  }
}