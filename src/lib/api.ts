/**
 * API Client Module
 * 
 * A type-safe HTTP client for making API requests with advanced features:
 * - TypeScript generics for request/response types
 * - Comprehensive error handling with custom error types
 * - Request/response interceptors
 * - Timeout support
 * - Authentication token handling
 * - Automatic request retry
 */

// Environment configuration
const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
  DEFAULT_TIMEOUT: 10000, // 10 seconds
  RETRY_COUNT: 1,
  RETRY_DELAY: 1000, // 1 second
};

/**
 * HTTP request methods
 */
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/**
 * Request configuration options
 */
interface RequestOptions extends Omit<RequestInit, 'method' | 'body'> {
  /** Request timeout in milliseconds */
  timeout?: number;
  /** Whether to include auth token */
  withAuth?: boolean;
  /** Number of times to retry the request on network failure */
  retryCount?: number;
  /** Delay between retries in milliseconds */
  retryDelay?: number;
}

/**
 * API error types
 */
export enum ApiErrorType {
  NETWORK = 'network_error',
  TIMEOUT = 'timeout_error',
  SERVER = 'server_error',
  UNAUTHORIZED = 'unauthorized',
  FORBIDDEN = 'forbidden',
  NOT_FOUND = 'not_found',
  VALIDATION = 'validation_error',
  UNKNOWN = 'unknown_error',
}

/**
 * Enhanced API Error with additional metadata
 */
export class ApiError extends Error {
  /** HTTP status code */
  public readonly status: number;
  /** Error type for programmatic handling */
  public readonly type: ApiErrorType;
  /** Response data if available */
  public readonly data: any;
  /** Request URL that caused the error */
  public readonly url: string;

  constructor(
    status: number,
    message: string,
    type: ApiErrorType = ApiErrorType.UNKNOWN,
    url: string = '',
    data: any = null
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.type = type;
    this.url = url;
    this.data = data;
  }

  /**
   * Creates appropriate error based on response
   */
  static fromResponse(response: Response, data?: any): ApiError {
    const url = response.url;
    const status = response.status;
    const message = data?.message || `API Error: ${response.statusText}`;

    // Determine error type based on status code
    let type = ApiErrorType.UNKNOWN;
    if (status === 401) type = ApiErrorType.UNAUTHORIZED;
    else if (status === 403) type = ApiErrorType.FORBIDDEN;
    else if (status === 404) type = ApiErrorType.NOT_FOUND;
    else if (status === 422) type = ApiErrorType.VALIDATION;
    else if (status >= 500) type = ApiErrorType.SERVER;

    return new ApiError(status, message, type, url, data);
  }

  /**
   * Creates network error
   */
  static network(message: string, url: string): ApiError {
    return new ApiError(0, message, ApiErrorType.NETWORK, url);
  }

  /**
   * Creates timeout error
   */
  static timeout(url: string, timeoutMs: number): ApiError {
    return new ApiError(
      0,
      `Request timeout after ${timeoutMs}ms`,
      ApiErrorType.TIMEOUT,
      url
    );
  }
}

/**
 * Interceptor functions for modifying requests and responses
 */
type RequestInterceptor = (config: RequestInit) => RequestInit | Promise<RequestInit>;
type ResponseInterceptor<T> = (response: T) => T | Promise<T>;
type ErrorInterceptor = (error: ApiError) => ApiError | Promise<ApiError> | Promise<Response>;

/**
 * API client with interceptors
 */
class ApiClient {
  private requestInterceptors: RequestInterceptor[] = [];
  private responseInterceptors: ResponseInterceptor<any>[] = [];
  private errorInterceptors: ErrorInterceptor[] = [];

  /**
   * Add request interceptor
   */
  public addRequestInterceptor(interceptor: RequestInterceptor): void {
    this.requestInterceptors.push(interceptor);
  }

  /**
   * Add response interceptor
   */
  public addResponseInterceptor<T>(interceptor: ResponseInterceptor<T>): void {
    this.responseInterceptors.push(interceptor);
  }

  /**
   * Add error interceptor
   */
  public addErrorInterceptor(interceptor: ErrorInterceptor): void {
    this.errorInterceptors.push(interceptor);
  }

  /**
   * Process request through all interceptors
   */
  private async applyRequestInterceptors(config: RequestInit): Promise<RequestInit> {
    let updatedConfig = { ...config };
    
    for (const interceptor of this.requestInterceptors) {
      updatedConfig = await interceptor(updatedConfig);
    }
    
    return updatedConfig;
  }

  /**
   * Process response through all interceptors
   */
  private async applyResponseInterceptors<T>(response: T): Promise<T> {
    let processedResponse = response;
    
    for (const interceptor of this.responseInterceptors) {
      processedResponse = await interceptor(processedResponse);
    }
    
    return processedResponse;
  }

  /**
   * Process error through all interceptors
   */
  private async applyErrorInterceptors(error: ApiError): Promise<ApiError | Response> {
    let processedError: ApiError | Response = error;
    
    for (const interceptor of this.errorInterceptors) {
      const result = await interceptor(
        processedError instanceof ApiError ? processedError : ApiError.fromResponse(processedError)
      );
      processedError = result;
      
      // If an interceptor returns a Response, break the chain and proceed with that response
      if (result instanceof Response) {
        return result;
      }
    }
    
    return processedError;
  }

  /**
   * Fetch with timeout
   */
  private fetchWithTimeout(
    url: string,
    options: RequestInit,
    timeoutMs: number
  ): Promise<Response> {
    return new Promise((resolve, reject) => {
      // Set up timeout
      const timeoutId = setTimeout(() => {
        reject(ApiError.timeout(url, timeoutMs));
      }, timeoutMs);

      // Execute fetch
      fetch(url, options)
        .then(resolve)
        .catch((error) => {
          reject(ApiError.network(error.message, url));
        })
        .finally(() => {
          clearTimeout(timeoutId);
        });
    });
  }

  /**
   * Retry a failed request
   */
  private async retryRequest<T>(
    url: string,
    options: RequestInit,
    retryCount: number,
    retryDelay: number,
    timeoutMs: number,
    parseResponse: (response: Response) => Promise<T>
  ): Promise<T> {
    try {
      const response = await this.fetchWithTimeout(url, options, timeoutMs);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw ApiError.fromResponse(response, errorData);
      }
      
      return await parseResponse(response);
    } catch (error) {
      // Only retry on network errors or 5xx server errors
      const shouldRetry = 
        retryCount > 0 && 
        (error instanceof ApiError && 
          (error.type === ApiErrorType.NETWORK || 
           error.type === ApiErrorType.SERVER || 
           error.type === ApiErrorType.TIMEOUT));

      if (shouldRetry) {
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        return this.retryRequest(
          url, 
          options,
          retryCount - 1, 
          retryDelay, 
          timeoutMs,
          parseResponse
        );
      }

      // Process through error interceptors
      const result = await this.applyErrorInterceptors(error instanceof ApiError 
        ? error 
        : ApiError.network((error as Error).message, url));

      // If an interceptor returned a Response, parse it
      if (result instanceof Response) {
        return await parseResponse(result);
      }

      // Otherwise, propagate the error
      throw result;
    }
  }

  /**
   * Make an HTTP request
   */
  public async request<TResponse, TRequest = unknown>(
    method: HttpMethod,
    endpoint: string,
    data?: TRequest,
    options: RequestOptions = {}
  ): Promise<TResponse> {
    const {
      timeout = API_CONFIG.DEFAULT_TIMEOUT,
      retryCount = API_CONFIG.RETRY_COUNT,
      retryDelay = API_CONFIG.RETRY_DELAY,
      withAuth = false,
      ...fetchOptions
    } = options;

    // Prepare URL
    const url = endpoint.startsWith('http')
      ? endpoint
      : `${API_CONFIG.BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

    // Prepare request config
    let config: RequestInit = {
      method,
      ...fetchOptions,
      headers: {
        'Content-Type': 'application/json',
        ...fetchOptions.headers,
      },
    };

    // Add body if applicable
    if (data && method !== 'GET') {
      config.body = JSON.stringify(data);
    }

    // Apply request interceptors
    config = await this.applyRequestInterceptors(config);

    // Make the request with retry support
    const response = await this.retryRequest<TResponse>(
      url,
      config,
      retryCount,
      retryDelay,
      timeout,
      async (res: Response) => {
        // Handle empty responses (204 No Content)
        if (res.status === 204) {
          return {} as TResponse;
        }
        
        const data = await res.json();
        return this.applyResponseInterceptors(data);
      }
    );

    return response;
  }

  /**
   * HTTP GET request
   */
  public get<TResponse>(endpoint: string, options?: RequestOptions): Promise<TResponse> {
    return this.request<TResponse>('GET', endpoint, undefined, options);
  }

  /**
   * HTTP POST request
   */
  public post<TResponse, TRequest = unknown>(
    endpoint: string,
    data?: TRequest,
    options?: RequestOptions
  ): Promise<TResponse> {
    return this.request<TResponse, TRequest>('POST', endpoint, data, options);
  }

  /**
   * HTTP PUT request
   */
  public put<TResponse, TRequest = unknown>(
    endpoint: string,
    data?: TRequest,
    options?: RequestOptions
  ): Promise<TResponse> {
    return this.request<TResponse, TRequest>('PUT', endpoint, data, options);
  }

  /**
   * HTTP PATCH request
   */
  public patch<TResponse, TRequest = unknown>(
    endpoint: string,
    data?: TRequest,
    options?: RequestOptions
  ): Promise<TResponse> {
    return this.request<TResponse, TRequest>('PATCH', endpoint, data, options);
  }

  /**
   * HTTP DELETE request
   */
  public delete<TResponse>(endpoint: string, options?: RequestOptions): Promise<TResponse> {
    return this.request<TResponse>('DELETE', endpoint, undefined, options);
  }
}

// Create and configure the API client
const apiClient = new ApiClient();

// Add auth token interceptor
apiClient.addRequestInterceptor((config) => {
  const token = typeof window !== 'undefined' 
    ? localStorage.getItem('auth_token') 
    : null;
  
  if (token) {
    return {
      ...config,
      headers: {
        ...config.headers,
        Authorization: `Bearer ${JSON.parse(token).value}`,
      },
    };
  }
  
  return config;
});

// Add response logger in development
if (process.env.NODE_ENV === 'development') {
  apiClient.addResponseInterceptor((response) => {
    console.debug('[API Response]', response);
    return response;
  });
}

// Export the configured API client
export const api = apiClient; 