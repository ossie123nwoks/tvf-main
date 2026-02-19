import { makeRedirectUri } from 'expo-auth-session';
import * as Linking from 'expo-linking';

/**
 * Get the redirect URL for OAuth flows
 * This creates the proper redirect URI based on the app scheme
 */
export const getRedirectURL = (): string => {
  const redirectUrl = makeRedirectUri({
    scheme: 'tvf-app',
    path: 'auth/callback',
  });
  
  return redirectUrl;
};

/**
 * Get the Supabase auth callback URL
 * This is used when initiating OAuth with Supabase
 */
export const getSupabaseCallbackURL = (): string => {
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  
  if (!supabaseUrl) {
    throw new Error('EXPO_PUBLIC_SUPABASE_URL is not configured');
  }
  
  return `${supabaseUrl}/auth/v1/callback`;
};

/**
 * Build the OAuth authorization URL for Google
 * This constructs the Google OAuth endpoint with all required parameters
 */
export const buildGoogleAuthURL = (redirectUri: string): string => {
  const clientId = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID;
  
  if (!clientId) {
    throw new Error('EXPO_PUBLIC_GOOGLE_CLIENT_ID is not configured');
  }
  
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'select_account',
  });
  
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
};

/**
 * Parse the authorization code from the OAuth callback
 * Extracts the code from the callback URL after user authorizes
 */
export const parseAuthCode = (url: string): string | null => {
  try {
    const parsedUrl = Linking.parse(url);
    const code = parsedUrl.queryParams?.code as string | undefined;
    return code || null;
  } catch (error) {
    console.error('Error parsing auth code:', error);
    return null;
  }
};

/**
 * Handle OAuth callback and extract the authorization code
 * This processes the callback after user returns from Google
 */
export const handleOAuthCallback = async (url: string): Promise<string | null> => {
  try {
    // Wait a bit to ensure the callback is fully processed
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const code = parseAuthCode(url);
    
    if (!code) {
      console.error('No authorization code found in callback URL');
      return null;
    }
    
    return code;
  } catch (error) {
    console.error('Error handling OAuth callback:', error);
    return null;
  }
};

/**
 * Initialize OAuth flow with Google
 * This sets up the OAuth parameters and returns the authorization URL
 */
export const initiateOAuthFlow = (): {
  authUrl: string;
  redirectUrl: string;
} => {
  const redirectUrl = getRedirectURL();
  const authUrl = buildGoogleAuthURL(redirectUrl);
  
  return {
    authUrl,
    redirectUrl,
  };
};

/**
 * Exchange authorization code for access token (via Supabase)
 * Note: In this implementation, Supabase handles the token exchange
 * This function validates the flow is ready
 */
export const validateOAuthFlow = async (code: string): Promise<boolean> => {
  try {
    if (!code || code.length === 0) {
      return false;
    }
    
    // Additional validation could go here
    return true;
  } catch (error) {
    console.error('Error validating OAuth flow:', error);
    return false;
  }
};

/**
 * Error handling utilities for OAuth flows
 */
export const OAuthError = {
  CANCELLED: 'OAuth flow was cancelled by the user',
  NETWORK_ERROR: 'Network error during OAuth flow',
  INVALID_RESPONSE: 'Invalid response from OAuth provider',
  MISSING_CODE: 'Authorization code is missing from OAuth callback',
  INVALID_CONFIG: 'OAuth configuration is missing or invalid',
};

/**
 * Get user-friendly error message from OAuth error
 */
export const getOAuthErrorMessage = (error: unknown): string => {
  if (typeof error === 'string') {
    return error;
  }
  
  if (error instanceof Error) {
    if (error.message.includes('cancelled') || error.message.includes('cancel')) {
      return OAuthError.CANCELLED;
    }
    if (error.message.includes('network') || error.message.includes('fetch')) {
      return OAuthError.NETWORK_ERROR;
    }
    return error.message;
  }
  
  return 'An unknown error occurred during authentication';
};

