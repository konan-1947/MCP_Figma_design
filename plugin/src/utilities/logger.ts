// Logger Utility
// Extract từ FigmaHttpClient.logToUI() method (lines 36-47)

import { LogLevel, UILogMessage } from '../types';

export class Logger {
  /**
   * Log message tới UI và console
   * Extract từ logToUI() method trong code.ts lines 36-47
   */
  static logToUI(message: string, level: LogLevel = 'info'): void {
    const logMessage = `[Figma Plugin] ${message}`;
    console.log(logMessage);

    try {
      const uiMessage: UILogMessage = {
        type: 'log',
        payload: { message, level }
      };
      figma.ui.postMessage(uiMessage);
    } catch (error) {
      // UI chưa được tạo hoặc đã đóng
      console.log(`[Figma Plugin] Cannot send to UI: ${message}`);
    }
  }

  /**
   * Convenience methods cho từng log level
   */
  static info(message: string): void {
    Logger.logToUI(message, 'info');
  }

  static success(message: string): void {
    Logger.logToUI(message, 'success');
  }

  static error(message: string): void {
    Logger.logToUI(message, 'error');
  }

  static warning(message: string): void {
    Logger.logToUI(message, 'warning');
  }

  /**
   * Format command description cho logging
   */
  static formatCommand(category: string, operation: string): string {
    return `${category}.${operation}`;
  }

  /**
   * Log command execution với format chuẩn
   */
  static logCommandStart(category: string, operation: string): void {
    const commandDesc = Logger.formatCommand(category, operation);
    Logger.logToUI(`📥 Nhận command: ${commandDesc}`, 'info');
  }

  static logCommandSuccess(category: string, operation: string): void {
    const commandDesc = Logger.formatCommand(category, operation);
    Logger.logToUI(`✅ Hoàn thành: ${commandDesc}`, 'success');
  }

  static logCommandError(category: string, operation: string, error: string): void {
    const commandDesc = Logger.formatCommand(category, operation);
    Logger.logToUI(`❌ Lỗi ${commandDesc}: ${error}`, 'error');
  }

  /**
   * Log connection events
   */
  static logConnectionEvent(event: string, details?: string): void {
    const message = details ? `${event}: ${details}` : event;
    Logger.logToUI(message, 'info');
  }

  static logConnectionSuccess(clientId: string): void {
    Logger.logToUI(`Kết nối thành công với client ID: ${clientId}`, 'success');
  }

  static logConnectionError(error: string): void {
    Logger.logToUI(`Lỗi kết nối: ${error}`, 'error');
  }

  static logReconnectAttempt(attempt: number, maxAttempts: number, delay: number): void {
    Logger.logToUI(`Thử kết nối lại ${attempt}/${maxAttempts} trong ${delay}ms`, 'warning');
  }
}