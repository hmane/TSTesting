/**
 * src/context/logging/logger.ts
 * Enhanced structured logging system with improved error handling
 */

import { LogLevel } from '@pnp/logging';
import type { ContextLogger, LogContext, LogEntry, LogSink, EnvironmentName } from '../utils/types';

/**
 * Enhanced error information extraction
 */
interface ExtractedErrorInfo {
  message: string;
  name: string;
  stack?: string;
  code?: string;
  status?: number;
  statusText?: string;
  url?: string;
  isHttpError?: boolean;
  isPnPError?: boolean;
  isSharePointError?: boolean;
  originalError: any;
}

/**
 * Production-ready logger with enhanced error handling
 */
export class SPFxLogger implements ContextLogger {
  private readonly sinks: LogSink[] = [];
  private readonly baseContext: LogContext;
  private readonly level: LogLevel;
  private readonly samplingRate: number;
  private readonly timers = new Map<string, number>();

  constructor(options: { level: LogLevel; baseContext: LogContext; samplingRate?: number }) {
    this.level = options.level;
    this.baseContext = { ...options.baseContext };
    this.samplingRate = options.samplingRate ?? 1.0;
  }

  // Core logging methods
  verbose(message: string, data?: any, category?: string): void {
    this.log(LogLevel.Verbose, message, data, category);
  }

  info(message: string, data?: any, category?: string): void {
    this.log(LogLevel.Info, message, data, category);
  }

  warn(message: string, data?: any, category?: string): void {
    this.log(LogLevel.Warning, message, data, category);
  }

  /**
   * Enhanced error logging with intelligent error object handling
   * @param errorOrMessage - Error object, error message, or string message
   * @param data - Additional context data
   * @param category - Log category
   */
  error(errorOrMessage: string | Error | any, data?: any, category?: string): void {
    if (typeof errorOrMessage === 'string') {
      // Simple string message
      this.log(LogLevel.Error, errorOrMessage, data, category);
    } else {
      // Error object or complex error - extract detailed information
      const errorInfo = this.extractErrorInfo(errorOrMessage);

      const enrichedData = {
        ...data,
        error: {
          name: errorInfo.name,
          message: errorInfo.message,
          stack: errorInfo.stack,
          code: errorInfo.code,
          status: errorInfo.status,
          statusText: errorInfo.statusText,
          url: errorInfo.url,
          type: this.categorizeError(errorInfo),
          isHttpError: errorInfo.isHttpError,
          isPnPError: errorInfo.isPnPError,
          isSharePointError: errorInfo.isSharePointError,
        },
        originalError: errorInfo.originalError,
      };

      this.log(LogLevel.Error, errorInfo.message, enrichedData, category || 'error');
    }
  }

  // Enhanced convenience methods
  success(message: string, data?: any, category?: string): void {
    this.info(`✅ ${message}`, data, category);
  }

  /**
   * Logs operation failures with enhanced error context
   * @param messageOrError - Failure message or error object
   * @param data - Additional context data
   * @param category - Log category
   */
  failure(messageOrError: string | Error | any, data?: any, category?: string): void {
    if (typeof messageOrError === 'string') {
      this.error(`❌ ${messageOrError}`, data, category);
    } else {
      const errorInfo = this.extractErrorInfo(messageOrError);
      this.error(`❌ ${errorInfo.message}`, data, category);
    }
  }

  /**
   * Logs exceptions with full stack trace and error analysis
   * @param error - Error object
   * @param operation - Operation that failed
   * @param data - Additional context
   */
  exception(error: Error | any, operation?: string, data?: any): void {
    const errorInfo = this.extractErrorInfo(error);
    const message = operation
      ? `Exception in ${operation}: ${errorInfo.message}`
      : `Exception: ${errorInfo.message}`;

    const enrichedData = {
      ...data,
      operation,
      exception: {
        name: errorInfo.name,
        message: errorInfo.message,
        stack: errorInfo.stack,
        code: errorInfo.code,
        status: errorInfo.status,
        type: this.categorizeError(errorInfo),
        analysis: this.analyzeError(errorInfo),
      },
    };

    this.log(LogLevel.Error, message, enrichedData, 'exception');
  }

  /**
   * Logs HTTP-specific errors with request/response context
   * @param error - HTTP error object
   * @param request - Request details
   * @param data - Additional context
   */
  httpError(error: any, request?: { method?: string; url?: string; data?: any }, data?: any): void {
    const errorInfo = this.extractErrorInfo(error);
    const message = `HTTP ${errorInfo.status || 'Error'}: ${errorInfo.message}`;

    const enrichedData = {
      ...data,
      http: {
        status: errorInfo.status,
        statusText: errorInfo.statusText,
        url: errorInfo.url,
        method: request?.method,
        requestData: request?.data,
        isTimeout: this.isTimeoutError(errorInfo),
        isNetworkError: this.isNetworkError(errorInfo),
        isServerError: this.isServerError(errorInfo),
        isClientError: this.isClientError(errorInfo),
      },
      request,
    };

    this.log(LogLevel.Error, message, enrichedData, 'http-error');
  }

  /**
   * Logs SharePoint-specific errors with SP context
   * @param error - SharePoint error object
   * @param operation - SP operation that failed
   * @param data - Additional context
   */
  sharePointError(error: any, operation?: string, data?: any): void {
    const errorInfo = this.extractErrorInfo(error);
    const message = operation
      ? `SharePoint ${operation} failed: ${errorInfo.message}`
      : `SharePoint error: ${errorInfo.message}`;

    const enrichedData = {
      ...data,
      sharepoint: {
        operation,
        errorCode: errorInfo.code,
        correlationId: this.extractSpCorrelationId(errorInfo),
        isPermissionError: this.isPermissionError(errorInfo),
        isNotFoundError: this.isNotFoundError(errorInfo),
        isThrottlingError: this.isThrottlingError(errorInfo),
      },
    };

    this.log(LogLevel.Error, message, enrichedData, 'sharepoint-error');
  }

  // Structured logging
  event(name: string, properties?: Record<string, any>, metrics?: Record<string, number>): void {
    this.info(
      `Event: ${name}`,
      {
        eventName: name,
        properties: properties || {},
        metrics: metrics || {},
        eventType: 'custom',
      },
      'events'
    );
  }

  // Performance tracking
  startTimer(name: string): () => void {
    const startTime = performance.now();
    this.timers.set(name, startTime);

    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      this.timers.delete(name);

      this.info(
        `Timer: ${name}`,
        {
          duration,
          durationFormatted: `${duration.toFixed(2)}ms`,
        },
        'performance'
      );

      return duration;
    };
  }

  // Banner/formatting
  banner(title: string, details?: any): void {
    const line = '─'.repeat(Math.min(60, Math.max(20, title.length + 10)));
    this.info(line, undefined, 'banner');
    this.info(`★ ${title}`, details, 'banner');
    this.info(line, undefined, 'banner');
  }

  // Context management
  withContext(additionalContext: Partial<LogContext>): ContextLogger {
    const newContext = { ...this.baseContext, ...additionalContext };
    return new SPFxLogger({
      level: this.level,
      baseContext: newContext,
      samplingRate: this.samplingRate,
    });
  }

  // Sink management
  addSink(sink: LogSink): void {
    this.sinks.push(sink);
  }

  removeSink(sink: LogSink): void {
    const index = this.sinks.indexOf(sink);
    if (index >= 0) {
      this.sinks.splice(index, 1);
    }
  }

  // Private methods for error analysis

  private extractErrorInfo(error: any): ExtractedErrorInfo {
    const info: ExtractedErrorInfo = {
      message: 'Unknown error',
      name: 'Error',
      originalError: error,
    };

    if (!error) {
      return info;
    }

    // Handle different error types
    if (error instanceof Error) {
      info.message = error.message;
      info.name = error.name;
      info.stack = error.stack;
    } else if (typeof error === 'string') {
      info.message = error;
    } else if (typeof error === 'object') {
      // Extract common error properties
      info.message = error.message || error.Message || error.errorMessage || String(error);
      info.name = error.name || error.Name || 'UnknownError';
      info.stack = error.stack || error.Stack;
      info.code = error.code || error.Code || error.errorCode;
      info.status = error.status || error.Status || error.statusCode;
      info.statusText = error.statusText || error.StatusText;
      info.url = error.url || error.Url || error.requestUrl;
    }

    // Detect error types
    info.isHttpError = !!(info.status || error.isHttpRequestError);
    info.isPnPError = !!(error.isHttpRequestError || error.data);
    info.isSharePointError = !!(
      error.code?.startsWith?.('Microsoft.SharePoint') ||
      error.data?.responseBody?.includes?.('Microsoft.SharePoint') ||
      info.message.includes('SharePoint')
    );

    return info;
  }

  private categorizeError(errorInfo: ExtractedErrorInfo): string {
    if (errorInfo.isSharePointError) return 'SharePoint';
    if (errorInfo.isPnPError) return 'PnP';
    if (errorInfo.isHttpError) return 'HTTP';
    if (errorInfo.name === 'TypeError') return 'Type';
    if (errorInfo.name === 'ReferenceError') return 'Reference';
    if (errorInfo.name === 'SyntaxError') return 'Syntax';
    return 'Unknown';
  }

  private analyzeError(errorInfo: ExtractedErrorInfo): string[] {
    const analysis: string[] = [];

    if (this.isPermissionError(errorInfo)) {
      analysis.push('Permission denied - check user access rights');
    }
    if (this.isNotFoundError(errorInfo)) {
      analysis.push('Resource not found - verify URL or item exists');
    }
    if (this.isThrottlingError(errorInfo)) {
      analysis.push('Request throttled - implement retry with backoff');
    }
    if (this.isTimeoutError(errorInfo)) {
      analysis.push('Request timeout - check network or increase timeout');
    }
    if (this.isNetworkError(errorInfo)) {
      analysis.push('Network connectivity issue');
    }

    return analysis;
  }

  private isPermissionError(errorInfo: ExtractedErrorInfo): boolean {
    return !!(
      errorInfo.status === 403 ||
      errorInfo.status === 401 ||
      errorInfo.message.toLowerCase().includes('access') ||
      errorInfo.message.toLowerCase().includes('permission') ||
      errorInfo.message.toLowerCase().includes('unauthorized')
    );
  }

  private isNotFoundError(errorInfo: ExtractedErrorInfo): boolean {
    return !!(
      errorInfo.status === 404 ||
      errorInfo.message.toLowerCase().includes('not found') ||
      errorInfo.message.toLowerCase().includes('does not exist')
    );
  }

  private isThrottlingError(errorInfo: ExtractedErrorInfo): boolean {
    return !!(
      errorInfo.status === 429 ||
      errorInfo.status === 503 ||
      errorInfo.message.toLowerCase().includes('throttle') ||
      errorInfo.message.toLowerCase().includes('rate limit')
    );
  }

  private isTimeoutError(errorInfo: ExtractedErrorInfo): boolean {
    return !!(
      errorInfo.message.toLowerCase().includes('timeout') ||
      errorInfo.message.toLowerCase().includes('timed out') ||
      errorInfo.name === 'TimeoutError'
    );
  }

  private isNetworkError(errorInfo: ExtractedErrorInfo): boolean {
    return !!(
      errorInfo.message.toLowerCase().includes('network') ||
      errorInfo.message.toLowerCase().includes('connection') ||
      errorInfo.message.toLowerCase().includes('fetch')
    );
  }

  private isServerError(errorInfo: ExtractedErrorInfo): boolean {
    return !!(errorInfo.status && errorInfo.status >= 500);
  }

  private isClientError(errorInfo: ExtractedErrorInfo): boolean {
    return !!(errorInfo.status && errorInfo.status >= 400 && errorInfo.status < 500);
  }

  private extractSpCorrelationId(errorInfo: ExtractedErrorInfo): string | undefined {
    const error = errorInfo.originalError;
    return (
      error?.data?.responseHeaders?.['sprequestguid'] ||
      error?.headers?.['sprequestguid'] ||
      error?.correlationId
    );
  }

  // Internal logging implementation
  private log(level: LogLevel, message: string, data?: any, category?: string): void {
    if (level < this.level) {
      return;
    }

    if (level < LogLevel.Error && Math.random() > this.samplingRate) {
      return;
    }

    const entry: LogEntry = {
      level,
      message,
      category: category || 'general',
      timestamp: Date.now(),
      context: { ...this.baseContext },
      data: this.sanitizeData(data),
    };

    this.sinks.forEach(sink => {
      try {
        sink.log(entry);
      } catch (sinkError) {
        console.warn('Logging sink error:', sinkError);
      }
    });
  }

  private sanitizeData(data: any): any {
    if (data === null || data === undefined) {
      return data;
    }

    try {
      return this.redactSensitiveData(data);
    } catch {
      return '[Logging Error: Could not serialize data]';
    }
  }

  private redactSensitiveData(obj: any): any {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.redactSensitiveData(item));
    }

    const sensitiveKeys = [
      'password',
      'token',
      'authorization',
      'cookie',
      'secret',
      'apikey',
      'bearer',
      'clientsecret',
      'accesstoken',
    ];

    const result: any = {};
    for (const [key, value] of Object.entries(obj)) {
      const keyLower = key.toLowerCase();
      if (sensitiveKeys.some(sensitive => keyLower.includes(sensitive))) {
        result[key] = '[REDACTED]';
      } else {
        result[key] = this.redactSensitiveData(value);
      }
    }
    return result;
  }
}

/**
 * Console sink for development logging
 */
export class ConsoleSink implements LogSink {
  log(entry: LogEntry): void {
    const { level, message, category, data, context } = entry;
    const prefix = `[${category}]`;
    const contextStr = this.formatContext(context);
    const fullMessage = `${prefix} ${message}${contextStr}`;

    switch (level) {
      case LogLevel.Error:
        console.error(fullMessage, data || '');
        break;
      case LogLevel.Warning:
        console.warn(fullMessage, data || '');
        break;
      case LogLevel.Info:
        console.info(fullMessage, data || '');
        break;
      case LogLevel.Verbose:
      default:
        console.debug(fullMessage, data || '');
        break;
    }
  }

  private formatContext(context: LogContext): string {
    const important = [];
    if (context.correlationId) {
      important.push(`cid:${context.correlationId.slice(-8)}`);
    }
    if (context.user) {
      important.push(`user:${context.user.split('@')[0]}`);
    }
    if (context.environment && context.environment !== 'prod') {
      important.push(`env:${context.environment}`);
    }

    return important.length > 0 ? ` (${important.join('|')})` : '';
  }
}

/**
 * Logger factory for creating configured logger instances
 */
export class LoggerFactory {
  static create(options: {
    componentName: string;
    environment: EnvironmentName;
    correlationId: string;
    level?: LogLevel;
    userLoginName?: string;
    siteUrl?: string;
    webUrl?: string;
    productionSamplingRate?: number;
  }): ContextLogger {
    const {
      componentName,
      environment,
      correlationId,
      level = LogLevel.Info,
      userLoginName,
      siteUrl,
      webUrl,
      productionSamplingRate = 0.1,
    } = options;

    const samplingRate = environment === 'prod' ? productionSamplingRate : 1.0;

    const baseContext: LogContext = {
      correlationId,
      environment,
      component: componentName,
      user: userLoginName,
      siteUrl,
      webUrl,
    };

    const logger = new SPFxLogger({
      level,
      baseContext,
      samplingRate,
    });

    logger.addSink(new ConsoleSink());

    return logger;
  }
}
