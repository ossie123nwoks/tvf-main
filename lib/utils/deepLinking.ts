import * as Linking from 'expo-linking';
import { router } from 'expo-router';

export interface DeepLinkData {
  type: 'sermon' | 'article' | 'category' | 'dashboard';
  id?: string;
  category?: string;
  tab?: string;
}

/**
 * Parse a deep link URL and extract relevant data
 * @param url The deep link URL to parse
 * @returns Parsed deep link data or null if invalid
 */
export function parseDeepLink(url: string): DeepLinkData | null {
  try {
    const parsed = Linking.parse(url);
    
    // Handle different URL patterns
    if (parsed.hostname === 'tvf-app' || parsed.scheme === 'tvf-app') {
      const path = parsed.path || '';
      const queryParams = parsed.queryParams || {};
      
      // Parse path segments
      const segments = path.split('/').filter(Boolean);
      
      if (segments.length === 0) {
        return { type: 'dashboard' };
      }
      
      // Handle sermon deep links: tvf-app://sermon/123
      if (segments[0] === 'sermon' && segments[1]) {
        return {
          type: 'sermon',
          id: segments[1],
          ...queryParams
        };
      }
      
      // Handle article deep links: tvf-app://article/456
      if (segments[0] === 'article' && segments[1]) {
        return {
          type: 'article',
          id: segments[1],
          ...queryParams
        };
      }
      
      // Handle category deep links: tvf-app://category/sermons
      if (segments[0] === 'category' && segments[1]) {
        return {
          type: 'category',
          category: segments[1],
          tab: queryParams.tab as string || 'sermons'
        };
      }
      
      // Handle tab navigation: tvf-app://dashboard, tvf-app://sermons, etc.
      if (['dashboard', 'sermons', 'articles', 'profile'].includes(segments[0])) {
        return {
          type: 'dashboard',
          tab: segments[0]
        };
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error parsing deep link:', error);
    return null;
  }
}

/**
 * Navigate to content based on deep link data
 * @param data Parsed deep link data
 */
export function navigateToDeepLink(data: DeepLinkData): void {
  try {
    switch (data.type) {
      case 'sermon':
        if (data.id) {
          router.push(`/sermon/${data.id}`);
        }
        break;
        
      case 'article':
        if (data.id) {
          router.push(`/article/${data.id}`);
        }
        break;
        
      case 'category':
        if (data.category && data.tab) {
          // Navigate to specific tab and apply category filter
          router.push(`/(tabs)/${data.tab}?category=${data.category}`);
        }
        break;
        
      case 'dashboard':
        if (data.tab) {
          router.push(`/(tabs)/${data.tab}`);
        } else {
          router.push('/(tabs)/dashboard');
        }
        break;
        
      default:
        // Fallback to dashboard
        router.push('/(tabs)/dashboard');
    }
  } catch (error) {
    console.error('Error navigating to deep link:', error);
    // Fallback to dashboard on error
    router.push('/(tabs)/dashboard');
  }
}

/**
 * Generate a deep link URL for sharing content
 * @param type Type of content to share
 * @param id Content ID
 * @param additionalParams Additional query parameters
 * @returns Deep link URL string
 */
export function generateDeepLink(
  type: 'sermon' | 'article' | 'category',
  id: string,
  additionalParams: Record<string, string> = {}
): string {
  const baseUrl = 'tvf-app://';
  
  switch (type) {
    case 'sermon':
      return `${baseUrl}sermon/${id}${buildQueryString(additionalParams)}`;
      
    case 'article':
      return `${baseUrl}article/${id}${buildQueryString(additionalParams)}`;
      
    case 'category':
      return `${baseUrl}category/${id}${buildQueryString(additionalParams)}`;
      
    default:
      return baseUrl;
  }
}

/**
 * Build query string from parameters
 * @param params Query parameters
 * @returns Formatted query string
 */
export function buildQueryString(params: Record<string, string>): string {
  const queryParams = Object.entries(params)
    .filter(([_, value]) => value !== undefined && value !== '')
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`);
  
  return queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
}

/**
 * Handle incoming deep links when app is already running
 * @param url The incoming URL
 */
export function handleIncomingDeepLink(url: string): void {
  const data = parseDeepLink(url);
  if (data) {
    navigateToDeepLink(data);
  }
}

/**
 * Handle deep links when app is launched from a link
 * @param url The launch URL
 */
export function handleLaunchDeepLink(url: string): void {
  // Small delay to ensure app is fully initialized
  setTimeout(() => {
    const data = parseDeepLink(url);
    if (data) {
      navigateToDeepLink(data);
    }
  }, 1000);
}
