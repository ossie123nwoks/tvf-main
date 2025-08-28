export interface AuthErrorInfo {
  code: string;
  message: string;
  userMessage: string;
  severity: 'error' | 'warning' | 'info';
  actionRequired?: string;
  retryable: boolean;
}

export interface ErrorMapping {
  [key: string]: AuthErrorInfo;
}

// Supabase authentication error codes and their user-friendly mappings
export const AUTH_ERROR_MAPPINGS: ErrorMapping = {
  // Sign Up Errors
  signup_disabled: {
    code: 'SIGNUP_DISABLED',
    message: 'Sign up is currently disabled',
    userMessage: 'New account creation is temporarily unavailable. Please try again later.',
    severity: 'warning',
    actionRequired: 'Wait and try again later',
    retryable: true,
  },
  invalid_signup_data: {
    code: 'INVALID_SIGNUP_DATA',
    message: 'Invalid signup data provided',
    userMessage: 'Please check your information and try again.',
    severity: 'error',
    actionRequired: 'Review and correct your information',
    retryable: true,
  },
  user_already_exists: {
    code: 'USER_ALREADY_EXISTS',
    message: 'User already exists',
    userMessage: 'An account with this email already exists. Please sign in instead.',
    severity: 'warning',
    actionRequired: 'Use sign in instead of sign up',
    retryable: false,
  },

  // Sign In Errors
  invalid_credentials: {
    code: 'INVALID_CREDENTIALS',
    message: 'Invalid email or password',
    userMessage: 'The email or password you entered is incorrect. Please try again.',
    severity: 'error',
    actionRequired: 'Check your email and password',
    retryable: true,
  },
  user_not_found: {
    code: 'USER_NOT_FOUND',
    message: 'User not found',
    userMessage:
      'No account found with this email address. Please check your email or create a new account.',
    severity: 'error',
    actionRequired: 'Verify email or create account',
    retryable: false,
  },
  too_many_requests: {
    code: 'TOO_MANY_REQUESTS',
    message: 'Too many sign in attempts',
    userMessage: 'Too many failed sign in attempts. Please wait a few minutes before trying again.',
    severity: 'warning',
    actionRequired: 'Wait before retrying',
    retryable: true,
  },
  account_locked: {
    code: 'ACCOUNT_LOCKED',
    message: 'Account is locked',
    userMessage:
      'Your account has been temporarily locked due to security concerns. Please contact support.',
    severity: 'error',
    actionRequired: 'Contact support',
    retryable: false,
  },

  // Password Reset Errors
  password_reset_failed: {
    code: 'PASSWORD_RESET_FAILED',
    message: 'Password reset failed',
    userMessage: 'Unable to process your password reset request. Please try again.',
    severity: 'error',
    actionRequired: 'Try again or contact support',
    retryable: true,
  },
  invalid_reset_token: {
    code: 'INVALID_RESET_TOKEN',
    message: 'Invalid or expired reset token',
    userMessage: 'Your password reset link has expired or is invalid. Please request a new one.',
    severity: 'warning',
    actionRequired: 'Request new password reset',
    retryable: true,
  },
  weak_password: {
    code: 'WEAK_PASSWORD',
    message: 'Password is too weak',
    userMessage: 'Please choose a stronger password with at least 6 characters.',
    severity: 'error',
    actionRequired: 'Choose a stronger password',
    retryable: true,
  },

  // Email Verification Errors
  email_verification_failed: {
    code: 'EMAIL_VERIFICATION_FAILED',
    message: 'Email verification failed',
    userMessage: 'Unable to verify your email address. Please try again or contact support.',
    severity: 'error',
    actionRequired: 'Try again or contact support',
    retryable: true,
  },
  verification_token_expired: {
    code: 'VERIFICATION_TOKEN_EXPIRED',
    message: 'Verification token expired',
    userMessage: 'Your email verification link has expired. Please request a new one.',
    severity: 'warning',
    actionRequired: 'Request new verification email',
    retryable: true,
  },

  // Network and System Errors
  network_error: {
    code: 'NETWORK_ERROR',
    message: 'Network connection error',
    userMessage:
      'Unable to connect to our servers. Please check your internet connection and try again.',
    severity: 'error',
    actionRequired: 'Check internet connection',
    retryable: true,
  },
  server_error: {
    code: 'SERVER_ERROR',
    message: 'Server error',
    userMessage: "We're experiencing technical difficulties. Please try again in a few moments.",
    severity: 'error',
    actionRequired: 'Wait and try again',
    retryable: true,
  },
  timeout_error: {
    code: 'TIMEOUT_ERROR',
    message: 'Request timeout',
    userMessage: 'The request took too long to complete. Please try again.',
    severity: 'warning',
    actionRequired: 'Try again',
    retryable: true,
  },

  // Session and Token Errors
  invalid_session: {
    code: 'INVALID_SESSION',
    message: 'Invalid session',
    userMessage: 'Your session has expired. Please sign in again.',
    severity: 'warning',
    actionRequired: 'Sign in again',
    retryable: true,
  },
  token_expired: {
    code: 'TOKEN_EXPIRED',
    message: 'Authentication token expired',
    userMessage: 'Your login has expired. Please sign in again.',
    severity: 'warning',
    actionRequired: 'Sign in again',
    retryable: true,
  },
  token_refresh_failed: {
    code: 'TOKEN_REFRESH_FAILED',
    message: 'Failed to refresh authentication token',
    userMessage: 'Unable to maintain your session. Please sign in again.',
    severity: 'warning',
    actionRequired: 'Sign in again',
    retryable: true,
  },

  // Profile Update Errors
  profile_update_failed: {
    code: 'PROFILE_UPDATE_FAILED',
    message: 'Profile update failed',
    userMessage: 'Unable to update your profile. Please try again.',
    severity: 'error',
    actionRequired: 'Try again',
    retryable: true,
  },
  invalid_profile_data: {
    code: 'INVALID_PROFILE_DATA',
    message: 'Invalid profile data',
    userMessage: 'Please check your profile information and try again.',
    severity: 'error',
    actionRequired: 'Review and correct information',
    retryable: true,
  },

  // Account Deletion Errors
  account_deletion_failed: {
    code: 'ACCOUNT_DELETION_FAILED',
    message: 'Account deletion failed',
    userMessage: 'Unable to delete your account. Please try again or contact support.',
    severity: 'error',
    actionRequired: 'Try again or contact support',
    retryable: true,
  },
  incorrect_password: {
    code: 'INCORRECT_PASSWORD',
    message: 'Incorrect password for account deletion',
    userMessage: 'The password you entered is incorrect. Please try again.',
    severity: 'error',
    actionRequired: 'Enter correct password',
    retryable: true,
  },

  // Generic Errors
  unknown_error: {
    code: 'UNKNOWN_ERROR',
    message: 'An unexpected error occurred',
    userMessage:
      'Something went wrong. Please try again or contact support if the problem persists.',
    severity: 'error',
    actionRequired: 'Try again or contact support',
    retryable: true,
  },
  validation_error: {
    code: 'VALIDATION_ERROR',
    message: 'Validation error',
    userMessage: 'Please check your information and try again.',
    severity: 'error',
    actionRequired: 'Review and correct information',
    retryable: true,
  },
};

// Function to map Supabase errors to user-friendly messages
export function mapAuthError(error: any): AuthErrorInfo {
  if (!error) {
    return AUTH_ERROR_MAPPINGS.unknown_error;
  }

  // Extract error code and message
  let errorCode = 'unknown_error';
  let errorMessage = 'An unexpected error occurred';

  if (typeof error === 'string') {
    errorMessage = error;
  } else if (error?.message) {
    errorMessage = error.message;
  } else if (error?.error_description) {
    errorMessage = error.error_description;
  }

  if (error?.code) {
    errorCode = error.code;
  } else if (error?.error) {
    errorCode = error.error;
  }

  // Try to find exact match
  if (AUTH_ERROR_MAPPINGS[errorCode]) {
    return AUTH_ERROR_MAPPINGS[errorCode];
  }

  // Try to find partial matches based on error message
  const lowerMessage = errorMessage.toLowerCase();

  if (lowerMessage.includes('password') && lowerMessage.includes('weak')) {
    return AUTH_ERROR_MAPPINGS.weak_password;
  }
  if (lowerMessage.includes('email') && lowerMessage.includes('already')) {
    return AUTH_ERROR_MAPPINGS.user_already_exists;
  }
  if (lowerMessage.includes('invalid') && lowerMessage.includes('credentials')) {
    return AUTH_ERROR_MAPPINGS.invalid_credentials;
  }
  if (lowerMessage.includes('network') || lowerMessage.includes('connection')) {
    return AUTH_ERROR_MAPPINGS.network_error;
  }
  if (lowerMessage.includes('timeout')) {
    return AUTH_ERROR_MAPPINGS.timeout_error;
  }
  if (lowerMessage.includes('server') || lowerMessage.includes('internal')) {
    return AUTH_ERROR_MAPPINGS.server_error;
  }

  // Return generic error if no match found
  return {
    ...AUTH_ERROR_MAPPINGS.unknown_error,
    message: errorMessage,
  };
}

// Function to get error severity color
export function getErrorSeverityColor(severity: 'error' | 'warning' | 'info'): string {
  switch (severity) {
    case 'error':
      return '#d32f2f'; // Red
    case 'warning':
      return '#f57c00'; // Orange
    case 'info':
      return '#1976d2'; // Blue
    default:
      return '#d32f2f';
  }
}

// Function to check if error is retryable
export function isErrorRetryable(error: any): boolean {
  const errorInfo = mapAuthError(error);
  return errorInfo.retryable;
}

// Function to get user-friendly error message
export function getUserFriendlyMessage(error: any): string {
  const errorInfo = mapAuthError(error);
  return errorInfo.userMessage;
}

// Function to get error action required
export function getErrorActionRequired(error: any): string | undefined {
  const errorInfo = mapAuthError(error);
  return errorInfo.actionRequired;
}
