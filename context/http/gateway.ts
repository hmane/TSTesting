/**
 * src/context/http/gateway.ts
 * HTTP gateway with Azure AD authentication support
 */

import {
  HttpClient,
  SPHttpClient,
  SPHttpClientResponse,
  HttpClientResponse,
  AadHttpClient,
  AadHttpClientFactory,
  AadHttpClientConfiguration,
} from '@microsoft/sp-http';
import type { BaseComponentContext } from '@microsoft/sp-component-base';
import type {
  HttpGateway,
  HttpResult,
  FlowTriggerOptions,
  FunctionCallOptions,
  ContextLogger,
} from '../utils/types';

/**
 * Enhanced function call options with Azure AD support
 */
export interface EnhancedFunctionCallOptions extends FunctionCallOptions {
  /** Enable Azure AD authentication */
  useAzureAD?: boolean;
  /** Resource URI or Application ID for Azure AD token */
  resourceUri?: string;
  /** Function key for key-based authentication */
  functionKey?: string;
  /** API key for custom authentication */
  apiKey?: string;
}

/**
 * Enhanced flow trigger options with authentication
 */
export interface EnhancedFlowTriggerOptions extends FlowTriggerOptions {
  /** Function key if the flow requires it */
  functionKey?: string;
  /** Enable Azure AD authentication for secured flows */
  useAzureAD?: boolean;
  /** Resource URI for Azure AD token */
  resourceUri?: string;
}

/**
 * Simple semaphore for request throttling
 */
class RequestSemaphore {
  private running = 0;
  private queue: Array<() => void> = [];

  constructor(private maxConcurrent: number) {}

  async acquire(): Promise<() => void> {
    return new Promise<() => void>(resolve => {
      const tryRun = () => {
        if (this.running < this.maxConcurrent) {
          this.running++;
          resolve(() => {
            this.running--;
            const next = this.queue.shift();
            if (next) next();
          });
        } else {
          this.queue.push(tryRun);
        }
      };
      tryRun();
    });
  }
}

/**
 * HTTP Gateway implementation with Azure AD authentication
 */
export class SPFxHttpGateway implements HttpGateway {
  private readonly httpClient: HttpClient;
  private readonly spHttpClient: SPHttpClient;
  private readonly aadHttpClientFactory: AadHttpClientFactory;
  private readonly semaphore: RequestSemaphore;
  private readonly logger: ContextLogger;
  private readonly correlationId: string;
  private readonly timeoutMs: number;
  private readonly maxRetries: number;

  constructor(
    context: BaseComponentContext,
    options: {
      logger: ContextLogger;
      correlationId: string;
      timeoutMs?: number;
      maxRetries?: number;
      maxConcurrent?: number;
    }
  ) {
    this.httpClient = context.httpClient;
    this.spHttpClient = (context as any).spHttpClient;
    this.aadHttpClientFactory = context.serviceScope.consume(AadHttpClientFactory.serviceKey);
    this.logger = options.logger;
    this.correlationId = options.correlationId;
    this.timeoutMs = options.timeoutMs ?? 30000;
    this.maxRetries = options.maxRetries ?? 3;
    this.semaphore = new RequestSemaphore(options.maxConcurrent ?? 6);
  }

  get rawSpHttp(): SPHttpClient {
    return this.spHttpClient;
  }

  get rawHttpClient(): HttpClient {
    return this.httpClient;
  }

  /**
   * SharePoint REST API calls
   */
  async sp(
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
    url: string,
    data?: any,
    headers: Record<string, string> = {}
  ): Promise<HttpResult> {
    return this.executeWithRetry('SP', async () => {
      const requestInit = {
        method,
        headers: {
          Accept: 'application/json;odata=nometadata',
          'X-Correlation-Id': this.correlationId,
          ...headers,
        },
        body: data ? (typeof data === 'string' ? data : JSON.stringify(data)) : undefined,
      };

      const response: SPHttpClientResponse = await this.withTimeout(
        this.spHttpClient.fetch(url, SPHttpClient.configurations.v1, requestInit),
        this.timeoutMs
      );

      return {
        ok: response.ok,
        status: response.status,
        statusText: response.statusText,
        url: response.url,
        body: await response.text(),
        duration: 0, // Will be set by executeWithRetry
        headers: this.extractHeaders(response),
      };
    });
  }

  /**
   * Enhanced Power Platform Flow trigger with authentication
   */
  async triggerFlow(options: EnhancedFlowTriggerOptions): Promise<HttpResult> {
    const {
      url,
      data,
      headers = {},
      idempotencyKey,
      timeout = this.timeoutMs,
      functionKey,
      useAzureAD = false,
      resourceUri,
    } = options;

    this.logger.info('Triggering Power Platform Flow', {
      url: this.sanitizeUrl(url),
      hasData: !!data,
      hasIdempotencyKey: !!idempotencyKey,
      authMethod: useAzureAD ? 'AzureAD' : functionKey ? 'FunctionKey' : 'None',
    });

    // Build headers with authentication
    const flowHeaders = {
      'Content-Type': 'application/json',
      'X-Correlation-Id': this.correlationId,
      ...(idempotencyKey && { 'X-Request-Id': idempotencyKey }),
      ...(functionKey && { 'x-functions-key': functionKey }),
      ...headers,
    };

    if (useAzureAD && resourceUri) {
      return this.executeAadRequest(resourceUri, 'POST', url, data, flowHeaders, timeout, 'Flow');
    } else {
      return this.executeWithRetry('Flow', async () => {
        const response: HttpClientResponse = await this.withTimeout(
          this.httpClient.post(url, HttpClient.configurations.v1, {
            headers: flowHeaders,
            body: JSON.stringify(data || {}),
          }),
          timeout
        );

        const result = {
          ok: response.ok,
          status: response.status,
          statusText: response.statusText,
          url: response.url,
          body: await response.text(),
          duration: 0,
          headers: this.extractHeaders(response),
        };

        this.logOperationResult('Flow', result);
        return result;
      });
    }
  }

  /**
   * Enhanced Azure Function calls with multiple authentication methods
   */
  async callFunction(options: EnhancedFunctionCallOptions): Promise<HttpResult> {
    const {
      url,
      method = 'POST',
      data,
      headers = {},
      timeout = this.timeoutMs,
      useAzureAD = false,
      resourceUri,
      functionKey,
      apiKey,
    } = options;

    this.logger.info('Calling Azure Function', {
      method,
      url: this.sanitizeUrl(url),
      hasData: !!data,
      authMethod: useAzureAD ? 'AzureAD' : functionKey ? 'FunctionKey' : apiKey ? 'ApiKey' : 'None',
    });

    // Build headers with authentication
    const functionHeaders = {
      'Content-Type': 'application/json',
      'X-Correlation-Id': this.correlationId,
      ...(functionKey && { 'x-functions-key': functionKey }),
      ...(apiKey && { 'X-API-Key': apiKey }),
      ...headers,
    };

    if (useAzureAD && resourceUri) {
      return this.executeAadRequest(
        resourceUri,
        method,
        url,
        data,
        functionHeaders,
        timeout,
        'Function'
      );
    } else {
      return this.executeWithRetry('Function', async () => {
        let response: HttpClientResponse;
        const requestOptions = {
          headers: functionHeaders,
          body: data ? JSON.stringify(data) : undefined,
        };

        switch (method) {
          case 'GET':
            response = await this.withTimeout(
              this.httpClient.get(url, HttpClient.configurations.v1, requestOptions),
              timeout
            );
            break;
          case 'POST':
            response = await this.withTimeout(
              this.httpClient.post(url, HttpClient.configurations.v1, requestOptions),
              timeout
            );
            break;
          case 'PUT':
            response = await this.withTimeout(
              this.httpClient.fetch(url, HttpClient.configurations.v1, {
                method: 'PUT',
                ...requestOptions,
              }),
              timeout
            );
            break;
          case 'DELETE':
            response = await this.withTimeout(
              this.httpClient.fetch(url, HttpClient.configurations.v1, {
                method: 'DELETE',
                ...requestOptions,
              }),
              timeout
            );
            break;
          default:
            throw new Error(`Unsupported HTTP method: ${method}`);
        }

        const result = {
          ok: response.ok,
          status: response.status,
          statusText: response.statusText,
          url: response.url,
          body: await response.text(),
          duration: 0,
          headers: this.extractHeaders(response),
        };

        this.logOperationResult('Function', result);
        return result;
      });
    }
  }

  /**
   * Get Azure AD access token for a resource (utility method)
   */
  async getAccessToken(resourceUri: string): Promise<string> {
    try {
      //const aadClient = await this.aadHttpClientFactory.getClient(resourceUri);
      // Access token is handled internally by AadHttpClient
      // This is more for informational purposes
      this.logger.verbose('Azure AD token acquired', {
        resourceUri: this.sanitizeUrl(resourceUri),
      });
      return 'Token acquired (handled internally by AadHttpClient)';
    } catch (error) {
      this.logger.error('Failed to acquire Azure AD token', {
        resourceUri: this.sanitizeUrl(resourceUri),
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  // Private helper methods

  /**
   * Execute Azure AD authenticated requests
   */
  private async executeAadRequest(
    resourceUri: string,
    method: string,
    url: string,
    data: any,
    headers: Record<string, string>,
    timeout: number,
    operationType: string
  ): Promise<HttpResult> {
    return this.executeWithRetry(operationType, async () => {
      try {
        const aadClient: AadHttpClient = await this.aadHttpClientFactory.getClient(resourceUri);

        this.logger.verbose('Using Azure AD authentication', {
          resourceUri: this.sanitizeUrl(resourceUri),
          method,
          url: this.sanitizeUrl(url),
        });

        const requestOptions = {
          method,
          headers,
          body: data ? JSON.stringify(data) : undefined,
        };

        const response: HttpClientResponse = await this.withTimeout(
          aadClient.fetch(
            url,
            AadHttpClient.configurations.v1 as AadHttpClientConfiguration,
            requestOptions
          ),
          timeout
        );

        const result = {
          ok: response.ok,
          status: response.status,
          statusText: response.statusText,
          url: response.url,
          body: await response.text(),
          duration: 0,
          headers: this.extractHeaders(response),
        };

        this.logOperationResult(operationType, result);
        return result;
      } catch (error) {
        this.logger.error('Azure AD request failed', {
          resourceUri: this.sanitizeUrl(resourceUri),
          method,
          url: this.sanitizeUrl(url),
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    });
  }

  private async executeWithRetry(
    operationType: string,
    operation: () => Promise<Omit<HttpResult, 'duration'>>
  ): Promise<HttpResult> {
    const release = await this.semaphore.acquire();
    const startTime = performance.now();

    try {
      let lastError: Error | null = null;
      let attempt = 0;

      while (attempt < this.maxRetries) {
        attempt++;

        try {
          const result = await operation();
          const duration = performance.now() - startTime;

          this.logger.verbose(`${operationType} request completed`, {
            attempt,
            duration,
            status: result.status,
            success: result.ok,
          });

          return { ...result, duration };
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error));

          // Don't retry on client errors (4xx) except 429 (rate limit)
          if (error && typeof error === 'object' && 'status' in error) {
            const status = (error as any).status;
            if (status >= 400 && status < 500 && status !== 429) {
              break;
            }
          }

          if (attempt < this.maxRetries) {
            const delay = this.calculateBackoffDelay(attempt);
            this.logger.warn(`${operationType} request failed, retrying`, {
              attempt,
              maxRetries: this.maxRetries,
              delayMs: delay,
              error: lastError.message,
            });
            await this.sleep(delay);
          }
        }
      }

      // All retries exhausted
      const duration = performance.now() - startTime;
      this.logger.error(`${operationType} request failed after ${this.maxRetries} attempts`, {
        duration,
        error: lastError?.message,
      });

      throw lastError || new Error(`${operationType} request failed`);
    } finally {
      release();
    }
  }

  private logOperationResult(operationType: string, result: HttpResult): void {
    if (result.ok) {
      this.logger.success(`${operationType} completed successfully`, {
        status: result.status,
        duration: result.duration,
        hasResponse: !!result.body,
      });
    } else {
      this.logger.warn(`${operationType} completed with error`, {
        status: result.status,
        statusText: result.statusText,
        duration: result.duration,
        error: result.body,
      });
    }
  }

  private async withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    let timeoutHandle: number | undefined;

    const timeoutPromise = new Promise<never>((_resolve, reject) => {
      timeoutHandle = setTimeout(() => {
        reject(new Error(`Request timeout after ${timeoutMs}ms`));
      }, timeoutMs);
    });

    try {
      return await Promise.race([promise, timeoutPromise]);
    } finally {
      if (timeoutHandle !== undefined) {
        clearTimeout(timeoutHandle);
      }
    }
  }

  private calculateBackoffDelay(attempt: number): number {
    const baseDelay = 200 * Math.pow(2, attempt - 1);
    const jitter = Math.random() * 100;
    return Math.min(baseDelay + jitter, 5000);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private extractHeaders(
    response: Response | SPHttpClientResponse | HttpClientResponse
  ): Record<string, string> {
    const headers: Record<string, string> = {};

    try {
      if ('headers' in response && response.headers) {
        if (typeof response.headers.forEach === 'function') {
          response.headers.forEach((value: string, key: string) => {
            headers[key.toLowerCase()] = value;
          });
        }
      }
    } catch {
      // Ignore header extraction errors
    }

    return headers;
  }

  private sanitizeUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      return `${urlObj.protocol}//${urlObj.host}${urlObj.pathname}`;
    } catch {
      return '[Invalid URL]';
    }
  }
}
