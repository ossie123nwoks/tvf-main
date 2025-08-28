import { useState, useCallback, useRef } from 'react';

export interface AsyncLoadingState {
  isLoading: boolean;
  error: string | null;
  retry?: () => void;
}

export interface AsyncLoadingActions {
  startLoading: () => void;
  stopLoading: () => void;
  setError: (error: string | null) => void;
  reset: () => void;
  executeAsync: <T>(asyncFn: () => Promise<T>) => Promise<T>;
  executeAsyncWithRetry: <T>(
    asyncFn: () => Promise<T>,
    maxRetries?: number,
    retryDelay?: number
  ) => Promise<T>;
}

export function useAsyncLoading(initialState: Partial<AsyncLoadingState> = {}): AsyncLoadingState & AsyncLoadingActions {
  const [isLoading, setIsLoading] = useState(initialState.isLoading || false);
  const [error, setErrorState] = useState<string | null>(initialState.error || null);
  const retryRef = useRef<(() => void) | undefined>(initialState.retry);

  const startLoading = useCallback(() => {
    setIsLoading(true);
    setErrorState(null);
  }, []);

  const stopLoading = useCallback(() => {
    setIsLoading(false);
  }, []);

  const setError = useCallback((errorMessage: string | null) => {
    setErrorState(errorMessage);
    setIsLoading(false);
  }, []);

  const reset = useCallback(() => {
    setIsLoading(false);
    setErrorState(null);
    retryRef.current = undefined;
  }, []);

  const executeAsync = useCallback(async <T>(asyncFn: () => Promise<T>): Promise<T> => {
    try {
      startLoading();
      const result = await asyncFn();
      stopLoading();
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      throw err;
    }
  }, [startLoading, stopLoading, setError]);

  const executeAsyncWithRetry = useCallback(async <T>(
    asyncFn: () => Promise<T>,
    maxRetries: number = 3,
    retryDelay: number = 1000
  ): Promise<T> => {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        startLoading();
        const result = await asyncFn();
        stopLoading();
        return result;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error('An unexpected error occurred');
        
        if (attempt === maxRetries) {
          const errorMessage = `Failed after ${maxRetries} attempts: ${lastError.message}`;
          setError(errorMessage);
          
          // Set up retry function for the next attempt
          retryRef.current = () => {
            executeAsyncWithRetry(asyncFn, maxRetries, retryDelay);
          };
          
          throw lastError;
        }
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
      }
    }
    
    // This should never be reached, but TypeScript requires it
    throw new Error('Unexpected error in retry logic');
  }, [startLoading, stopLoading, setError]);

  return {
    isLoading,
    error,
    retry: retryRef.current,
    startLoading,
    stopLoading,
    setError,
    reset,
    executeAsync,
    executeAsyncWithRetry,
  };
}

export function useAsyncOperation<T>(
  asyncFn: () => Promise<T>,
  options: {
    autoExecute?: boolean;
    onSuccess?: (result: T) => void;
    onError?: (error: Error) => void;
    maxRetries?: number;
    retryDelay?: number;
  } = {}
): AsyncLoadingState & AsyncLoadingActions & { data: T | null } {
  const [data, setData] = useState<T | null>(null);
  const {
    autoExecute = false,
    onSuccess,
    onError,
    maxRetries = 3,
    retryDelay = 1000,
  } = options;

  const loadingState = useAsyncLoading();

  const executeWithHandlers = useCallback(async () => {
    try {
      const result = await loadingState.executeAsync(asyncFn);
      setData(result);
      onSuccess?.(result);
      return result;
    } catch (error) {
      const appError = error instanceof Error ? error : new Error('An unexpected error occurred');
      onError?.(appError);
      throw appError;
    }
  }, [loadingState, asyncFn, onSuccess, onError]);

  const executeWithRetryAndHandlers = useCallback(async () => {
    try {
      const result = await loadingState.executeAsyncWithRetry(asyncFn, maxRetries, retryDelay);
      setData(result);
      onSuccess?.(result);
      return result;
    } catch (error) {
      const appError = error instanceof Error ? error : new Error('An unexpected error occurred');
      onError?.(appError);
      throw appError;
    }
  }, [loadingState, asyncFn, maxRetries, retryDelay, onSuccess, onError]);

  // Auto-execute if requested
  if (autoExecute && !loadingState.isLoading && !data && !loadingState.error) {
    executeWithHandlers();
  }

  return {
    ...loadingState,
    data,
    executeAsync: executeWithHandlers,
    executeAsyncWithRetry: executeWithRetryAndHandlers,
  };
}
