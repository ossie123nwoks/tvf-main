export interface AppError {
  code: string;
  message: string;
  userMessage: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'network' | 'auth' | 'content' | 'validation' | 'system' | 'unknown';
  retryable: boolean;
  timestamp: Date;
  originalError?: any;
}

export interface ErrorContext {
  component: string;
  action: string;
  userId?: string;
  additionalData?: Record<string, any>;
}

export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorLog: AppError[] = [];
  private maxLogSize = 100;

  private constructor() {}

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  /**
   * Create a standardized app error from various error types
   */
  createError(
    error: any,
    context: ErrorContext,
    category: AppError['category'] = 'unknown'
  ): AppError {
    const appError: AppError = {
      code: this.getErrorCode(error),
      message: this.getErrorMessage(error),
      userMessage: this.getUserMessage(error, category),
      severity: this.getErrorSeverity(error, category),
      category,
      retryable: this.isRetryable(error, category),
      timestamp: new Date(),
      originalError: error,
    };

    this.logError(appError, context);
    return appError;
  }

  /**
   * Handle network errors specifically
   */
  handleNetworkError(error: any, context: ErrorContext): AppError {
    let category: AppError['category'] = 'network';
    let severity: AppError['severity'] = 'medium';

    if (error.code === 'NETWORK_ERROR' || error.message?.includes('network')) {
      severity = 'medium';
    } else if (error.code === 'TIMEOUT' || error.message?.includes('timeout')) {
      severity = 'low';
    } else if (error.code === 'CONNECTION_REFUSED') {
      severity = 'high';
    }

    return this.createError(error, context, category);
  }

  /**
   * Handle authentication errors
   */
  handleAuthError(error: any, context: ErrorContext): AppError {
    let severity: AppError['severity'] = 'medium';

    if (error.code === 'INVALID_CREDENTIALS') {
      severity = 'low';
    } else if (error.code === 'TOKEN_EXPIRED') {
      severity = 'medium';
    } else if (error.code === 'UNAUTHORIZED') {
      severity = 'high';
    }

    return this.createError(error, context, 'auth');
  }

  /**
   * Handle content-related errors
   */
  handleContentError(error: any, context: ErrorContext): AppError {
    let severity: AppError['severity'] = 'medium';

    if (error.code === 'CONTENT_NOT_FOUND') {
      severity = 'low';
    } else if (error.code === 'CONTENT_UNAVAILABLE') {
      severity = 'medium';
    } else if (error.code === 'CONTENT_CORRUPTED') {
      severity = 'high';
    }

    return this.createError(error, context, 'content');
  }

  /**
   * Handle validation errors
   */
  handleValidationError(error: any, context: ErrorContext): AppError {
    return this.createError(error, context, 'validation');
  }

  /**
   * Check if an error is retryable
   */
  private isRetryable(error: any, category: AppError['category']): boolean {
    // Network errors are usually retryable
    if (category === 'network') {
      return !['CONNECTION_REFUSED', 'INVALID_URL'].includes(error.code);
    }

    // Auth errors might be retryable
    if (category === 'auth') {
      return ['TOKEN_EXPIRED', 'RATE_LIMIT_EXCEEDED'].includes(error.code);
    }

    // Content errors are usually not retryable
    if (category === 'content') {
      return ['CONTENT_UNAVAILABLE', 'RATE_LIMIT_EXCEEDED'].includes(error.code);
    }

    // Validation errors are never retryable
    if (category === 'validation') {
      return false;
    }

    return false;
  }

  /**
   * Get error severity based on error type and category
   */
  private getErrorSeverity(error: any, category: AppError['category']): AppError['severity'] {
    // Critical errors
    if (error.code === 'SYSTEM_CRASH' || error.code === 'DATABASE_CORRUPTION') {
      return 'critical';
    }

    // High severity errors
    if (error.code === 'UNAUTHORIZED' || error.code === 'PERMISSION_DENIED') {
      return 'high';
    }

    // Medium severity errors
    if (category === 'network' || category === 'auth') {
      return 'medium';
    }

    // Low severity errors
    if (category === 'validation' || error.code === 'CONTENT_NOT_FOUND') {
      return 'low';
    }

    return 'medium';
  }

  /**
   * Get error code from various error types
   */
  private getErrorCode(error: any): string {
    if (error.code) return error.code;
    if (error.status) return `HTTP_${error.status}`;
    if (error.name) return error.name.toUpperCase();
    return 'UNKNOWN_ERROR';
  }

  /**
   * Get technical error message
   */
  private getErrorMessage(error: any): string {
    if (error.message) return error.message;
    if (error.toString) return error.toString();
    return 'An unknown error occurred';
  }

  /**
   * Get user-friendly error message
   */
  private getUserMessage(error: any, category: AppError['category']): string {
    const code = this.getErrorCode(error);

    // Network errors
    if (category === 'network') {
      switch (code) {
        case 'NETWORK_ERROR':
          return 'Unable to connect to the server. Please check your internet connection.';
        case 'TIMEOUT':
          return 'The request took too long. Please try again.';
        case 'CONNECTION_REFUSED':
          return 'Unable to reach the server. Please try again later.';
        default:
          return 'A network error occurred. Please check your connection and try again.';
      }
    }

    // Authentication errors
    if (category === 'auth') {
      switch (code) {
        case 'INVALID_CREDENTIALS':
          return 'Invalid email or password. Please check your credentials.';
        case 'TOKEN_EXPIRED':
          return 'Your session has expired. Please sign in again.';
        case 'UNAUTHORIZED':
          return 'You are not authorized to perform this action.';
        default:
          return 'An authentication error occurred. Please try signing in again.';
      }
    }

    // Content errors
    if (category === 'content') {
      switch (code) {
        case 'CONTENT_NOT_FOUND':
          return 'The requested content could not be found.';
        case 'CONTENT_UNAVAILABLE':
          return 'This content is temporarily unavailable. Please try again later.';
        case 'CONTENT_CORRUPTED':
          return 'This content appears to be corrupted. Please contact support.';
        default:
          return 'Unable to load the requested content. Please try again.';
      }
    }

    // Validation errors
    if (category === 'validation') {
      return 'Please check your input and try again.';
    }

    // System errors
    if (category === 'system') {
      return 'A system error occurred. Please try again later.';
    }

    // Default message
    return 'Something went wrong. Please try again.';
  }

  /**
   * Log error for debugging and analytics
   */
  private logError(error: AppError, context: ErrorContext): void {
    const logEntry = {
      ...error,
      context,
    };

    this.errorLog.push(logEntry);

    // Keep log size manageable
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog = this.errorLog.slice(-this.maxLogSize);
    }

    // Log to console in development
    if (__DEV__) {
      console.error('App Error:', logEntry);
    }

    // TODO: Send to error reporting service in production
    // this.sendToErrorService(logEntry);
  }

  /**
   * Get recent errors for debugging
   */
  getRecentErrors(limit: number = 10): AppError[] {
    return this.errorLog.slice(-limit);
  }

  /**
   * Clear error log
   */
  clearErrorLog(): void {
    this.errorLog = [];
  }

  /**
   * Get error statistics
   */
  getErrorStats(): Record<string, number> {
    const stats: Record<string, number> = {
      total: this.errorLog.length,
      network: 0,
      auth: 0,
      content: 0,
      validation: 0,
      system: 0,
      unknown: 0,
    };

    this.errorLog.forEach(error => {
      stats[error.category]++;
    });

    return stats;
  }
}

// Export singleton instance
export const errorHandler = ErrorHandler.getInstance();

// Common error codes
export const ERROR_CODES = {
  // Network errors
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT: 'TIMEOUT',
  CONNECTION_REFUSED: 'CONNECTION_REFUSED',
  INVALID_URL: 'INVALID_URL',

  // Authentication errors
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  UNAUTHORIZED: 'UNAUTHORIZED',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',

  // Content errors
  CONTENT_NOT_FOUND: 'CONTENT_NOT_FOUND',
  CONTENT_UNAVAILABLE: 'CONTENT_UNAVAILABLE',
  CONTENT_CORRUPTED: 'CONTENT_CORRUPTED',

  // System errors
  SYSTEM_CRASH: 'SYSTEM_CRASH',
  DATABASE_CORRUPTION: 'DATABASE_CORRUPTION',

  // Validation errors
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
} as const;

// Error message templates
export const ERROR_MESSAGES = {
  GENERIC: 'Something went wrong. Please try again.',
  NETWORK: 'Please check your internet connection and try again.',
  AUTH: 'Please sign in again to continue.',
  CONTENT: 'Unable to load content. Please try again.',
  VALIDATION: 'Please check your input and try again.',
  SYSTEM: 'A system error occurred. Please try again later.',
} as const;
