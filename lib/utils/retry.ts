export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number; // in milliseconds
  maxDelay: number; // in milliseconds
  backoffMultiplier: number;
  jitter: boolean;
  retryCondition?: (error: any) => boolean;
}

export interface RetryResult<T> {
  success: boolean;
  data?: T;
  error?: any;
  attempts: number;
  totalTime: number;
}

export class RetryManager {
  private static instance: RetryManager;
  private defaultConfig: RetryConfig = {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2,
    jitter: true,
  };

  private constructor() {}

  static getInstance(): RetryManager {
    if (!RetryManager.instance) {
      RetryManager.instance = new RetryManager();
    }
    return RetryManager.instance;
  }

  /**
   * Execute a function with retry logic
   */
  async execute<T>(
    operation: () => Promise<T>,
    config?: Partial<RetryConfig>
  ): Promise<RetryResult<T>> {
    const finalConfig = { ...this.defaultConfig, ...config };
    const startTime = Date.now();
    let lastError: any;
    let attempt = 0;

    while (attempt < finalConfig.maxAttempts) {
      try {
        attempt++;
        const result = await operation();
        
        return {
          success: true,
          data: result,
          attempts: attempt,
          totalTime: Date.now() - startTime,
        };
      } catch (error) {
        lastError = error;
        
        // Check if we should retry
        if (attempt >= finalConfig.maxAttempts || 
            (finalConfig.retryCondition && !finalConfig.retryCondition(error))) {
          break;
        }

        // Calculate delay for next attempt
        const delay = this.calculateDelay(attempt, finalConfig);
        
        // Wait before retrying
        await this.sleep(delay);
      }
    }

    return {
      success: false,
      error: lastError,
      attempts: attempt,
      totalTime: Date.now() - startTime,
    };
  }

  /**
   * Execute with exponential backoff
   */
  async executeWithBackoff<T>(
    operation: () => Promise<T>,
    config?: Partial<RetryConfig>
  ): Promise<RetryResult<T>> {
    const backoffConfig: RetryConfig = {
      ...this.defaultConfig,
      backoffMultiplier: 2,
      ...config,
    };

    return this.execute(operation, backoffConfig);
  }

  /**
   * Execute with linear backoff
   */
  async executeWithLinearBackoff<T>(
    operation: () => Promise<T>,
    config?: Partial<RetryConfig>
  ): Promise<RetryResult<T>> {
    const linearConfig: RetryConfig = {
      ...this.defaultConfig,
      backoffMultiplier: 1,
      ...config,
    };

    return this.execute(operation, linearConfig);
  }

  /**
   * Execute with custom retry condition
   */
  async executeWithCondition<T>(
    operation: () => Promise<T>,
    retryCondition: (error: any) => boolean,
    config?: Partial<RetryConfig>
  ): Promise<RetryResult<T>> {
    const conditionalConfig: RetryConfig = {
      ...this.defaultConfig,
      retryCondition,
      ...config,
    };

    return this.execute(operation, conditionalConfig);
  }

  /**
   * Calculate delay for next retry attempt
   */
  private calculateDelay(attempt: number, config: RetryConfig): number {
    // Calculate base delay with exponential backoff
    let delay = config.baseDelay * Math.pow(config.backoffMultiplier, attempt - 1);
    
    // Apply maximum delay cap
    delay = Math.min(delay, config.maxDelay);
    
    // Add jitter to prevent thundering herd
    if (config.jitter) {
      const jitterRange = delay * 0.1; // 10% jitter
      delay += (Math.random() - 0.5) * jitterRange;
    }
    
    return Math.max(delay, 0);
  }

  /**
   * Sleep utility function
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Set default retry configuration
   */
  setDefaultConfig(config: Partial<RetryConfig>): void {
    this.defaultConfig = { ...this.defaultConfig, ...config };
  }

  /**
   * Get default retry configuration
   */
  getDefaultConfig(): RetryConfig {
    return { ...this.defaultConfig };
  }
}

// Export singleton instance
export const retryManager = RetryManager.getInstance();

// Predefined retry configurations
export const RETRY_CONFIGS = {
  NETWORK: {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 5000,
    backoffMultiplier: 2,
    jitter: true,
  },
  AUTH: {
    maxAttempts: 2,
    baseDelay: 500,
    maxDelay: 2000,
    backoffMultiplier: 1.5,
    jitter: false,
  },
  CONTENT: {
    maxAttempts: 2,
    baseDelay: 2000,
    maxDelay: 8000,
    backoffMultiplier: 2,
    jitter: true,
  },
  CRITICAL: {
    maxAttempts: 5,
    baseDelay: 500,
    maxDelay: 15000,
    backoffMultiplier: 2,
    jitter: true,
  },
} as const;

// Utility functions for common retry scenarios
export const retryUtils = {
  /**
   * Retry network operations
   */
  async retryNetwork<T>(operation: () => Promise<T>): Promise<RetryResult<T>> {
    return retryManager.execute(operation, RETRY_CONFIGS.NETWORK);
  },

  /**
   * Retry authentication operations
   */
  async retryAuth<T>(operation: () => Promise<T>): Promise<RetryResult<T>> {
    return retryManager.execute(operation, RETRY_CONFIGS.AUTH);
  },

  /**
   * Retry content operations
   */
  async retryContent<T>(operation: () => Promise<T>): Promise<RetryResult<T>> {
    return retryManager.execute(operation, RETRY_CONFIGS.CONTENT);
  },

  /**
   * Retry critical operations
   */
  async retryCritical<T>(operation: () => Promise<T>): Promise<RetryResult<T>> {
    return retryManager.execute(operation, RETRY_CONFIGS.CRITICAL);
  },

  /**
   * Retry with custom condition for network errors
   */
  async retryOnNetworkError<T>(operation: () => Promise<T>): Promise<RetryResult<T>> {
    const isNetworkError = (error: any) => {
      return error.code === 'NETWORK_ERROR' || 
             error.message?.includes('network') ||
             error.message?.includes('timeout') ||
             error.message?.includes('connection');
    };

    return retryManager.executeWithCondition(operation, isNetworkError, RETRY_CONFIGS.NETWORK);
  },

  /**
   * Retry with custom condition for rate limiting
   */
  async retryOnRateLimit<T>(operation: () => Promise<T>): Promise<RetryResult<T>> {
    const isRateLimitError = (error: any) => {
      return error.code === 'RATE_LIMIT_EXCEEDED' || 
             error.status === 429 ||
             error.message?.includes('rate limit') ||
             error.message?.includes('too many requests');
    };

    return retryManager.executeWithCondition(operation, isRateLimitError, RETRY_CONFIGS.AUTH);
  },
};

