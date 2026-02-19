import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase/client';

export interface DeepLinkData {
  type: 'sermon' | 'article' | 'category' | 'dashboard' | 'invitation' | 'share';
  id?: string;
  category?: string;
  tab?: string;
  invitationCode?: string;
  shareId?: string;
  metadata?: {
    source?: string;
    campaign?: string;
    referrer?: string;
    timestamp?: string;
  };
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
    if (parsed.hostname === 'tvf-app' || parsed.scheme === 'tvf-app' || 
        parsed.hostname === 'tvffellowship.com' || parsed.hostname === 'www.tvffellowship.com') {
      const path = parsed.path || '';
      const queryParams = parsed.queryParams || {};

      // Parse path segments
      const segments = path.split('/').filter(Boolean);

      if (segments.length === 0) {
        return { 
          type: 'dashboard',
          metadata: {
            source: 'direct',
            timestamp: new Date().toISOString(),
          }
        };
      }

      // Handle sermon deep links: tvf-app://sermon/123 or tvffellowship.com/sermon/123
      if (segments[0] === 'sermon' && segments[1]) {
        return {
          type: 'sermon',
          id: segments[1],
          metadata: {
            source: parsed.hostname?.includes('tvffellowship.com') ? 'web' : 'app',
            campaign: queryParams.campaign as string,
            referrer: queryParams.ref as string,
            timestamp: new Date().toISOString(),
          },
        };
      }

      // Handle article deep links: tvf-app://article/456 or tvffellowship.com/article/456
      if (segments[0] === 'article' && segments[1]) {
        return {
          type: 'article',
          id: segments[1],
          metadata: {
            source: parsed.hostname?.includes('tvffellowship.com') ? 'web' : 'app',
            campaign: queryParams.campaign as string,
            referrer: queryParams.ref as string,
            timestamp: new Date().toISOString(),
          },
        };
      }

      // Handle category deep links: tvf-app://category/sermons
      if (segments[0] === 'category' && segments[1]) {
        return {
          type: 'category',
          category: segments[1],
          tab: (queryParams.tab as string) || 'sermons',
          metadata: {
            source: parsed.hostname?.includes('tvffellowship.com') ? 'web' : 'app',
            campaign: queryParams.campaign as string,
            timestamp: new Date().toISOString(),
          },
        };
      }

      // Handle invitation deep links: tvf-app://invite/ABC123 or tvffellowship.com/invite/ABC123
      if (segments[0] === 'invite' && segments[1]) {
        return {
          type: 'invitation',
          invitationCode: segments[1],
          metadata: {
            source: parsed.hostname?.includes('tvffellowship.com') ? 'web' : 'app',
            campaign: queryParams.campaign as string,
            referrer: queryParams.ref as string,
            timestamp: new Date().toISOString(),
          },
        };
      }

      // Handle share deep links: tvf-app://share/123 or tvffellowship.com/share/123
      if (segments[0] === 'share' && segments[1]) {
        return {
          type: 'share',
          shareId: segments[1],
          metadata: {
            source: parsed.hostname?.includes('tvffellowship.com') ? 'web' : 'app',
            campaign: queryParams.campaign as string,
            referrer: queryParams.ref as string,
            timestamp: new Date().toISOString(),
          },
        };
      }

      // Handle tab navigation: tvf-app://dashboard, tvf-app://sermons, etc.
      if (['dashboard', 'sermons', 'articles', 'profile'].includes(segments[0])) {
        return {
          type: 'dashboard',
          tab: segments[0],
          metadata: {
            source: parsed.hostname?.includes('tvffellowship.com') ? 'web' : 'app',
            timestamp: new Date().toISOString(),
          },
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
    // Log deep link analytics
    logDeepLinkAnalytics(data);

    switch (data.type) {
      case 'sermon':
        if (data.id) {
          router.push(`/sermon/${data.id}`);
        } else {
          router.push('/(tabs)/sermons');
        }
        break;

      case 'article':
        if (data.id) {
          router.push(`/article/${data.id}`);
        } else {
          router.push('/(tabs)/articles');
        }
        break;

      case 'category':
        if (data.category && data.tab) {
          // Navigate to specific tab and apply category filter
          router.push(`/(tabs)/${data.tab}?category=${data.category}`);
        } else if (data.category) {
          router.push(`/(tabs)/sermons?category=${data.category}`);
        } else {
          router.push('/(tabs)/sermons');
        }
        break;

      case 'invitation':
        if (data.invitationCode) {
          // Navigate to invitation landing page
          router.push(`/invitation/${data.invitationCode}`);
        } else {
          router.push('/(tabs)/dashboard');
        }
        break;

      case 'share':
        if (data.shareId) {
          // Navigate to shared content
          router.push(`/shared/${data.shareId}`);
        } else {
          router.push('/(tabs)/dashboard');
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
 * @param useWebFallback Whether to generate web fallback URLs
 * @returns Deep link URL string
 */
export function generateDeepLink(
  type: 'sermon' | 'article' | 'category' | 'invitation' | 'share',
  id: string,
  additionalParams: Record<string, string> = {},
  useWebFallback: boolean = true
): string {
  const appBaseUrl = 'tvf-app://';
  const webBaseUrl = 'https://tvffellowship.com/';

  const queryString = buildQueryString(additionalParams);

  switch (type) {
    case 'sermon':
      const sermonAppUrl = `${appBaseUrl}sermon/${id}${queryString}`;
      const sermonWebUrl = `${webBaseUrl}sermon/${id}${queryString}`;
      return useWebFallback ? `${sermonAppUrl} (${sermonWebUrl})` : sermonAppUrl;

    case 'article':
      const articleAppUrl = `${appBaseUrl}article/${id}${queryString}`;
      const articleWebUrl = `${webBaseUrl}article/${id}${queryString}`;
      return useWebFallback ? `${articleAppUrl} (${articleWebUrl})` : articleAppUrl;

    case 'category':
      const categoryAppUrl = `${appBaseUrl}category/${id}${queryString}`;
      const categoryWebUrl = `${webBaseUrl}category/${id}${queryString}`;
      return useWebFallback ? `${categoryAppUrl} (${categoryWebUrl})` : categoryAppUrl;

    case 'invitation':
      const invitationAppUrl = `${appBaseUrl}invite/${id}${queryString}`;
      const invitationWebUrl = `${webBaseUrl}invite/${id}${queryString}`;
      return useWebFallback ? `${invitationAppUrl} (${invitationWebUrl})` : invitationAppUrl;

    case 'share':
      const shareAppUrl = `${appBaseUrl}share/${id}${queryString}`;
      const shareWebUrl = `${webBaseUrl}share/${id}${queryString}`;
      return useWebFallback ? `${shareAppUrl} (${shareWebUrl})` : shareAppUrl;

    default:
      return appBaseUrl;
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

/**
 * Log deep link analytics to database
 * @param data Parsed deep link data
 */
async function logDeepLinkAnalytics(data: DeepLinkData): Promise<void> {
  try {
    const { error } = await supabase
      .from('deep_link_analytics')
      .insert({
        link_type: data.type,
        content_id: data.id,
        category: data.category,
        tab: data.tab,
        invitation_code: data.invitationCode,
        share_id: data.shareId,
        source: data.metadata?.source,
        campaign: data.metadata?.campaign,
        referrer: data.metadata?.referrer,
        timestamp: data.metadata?.timestamp || new Date().toISOString(),
        created_at: new Date().toISOString(),
      });

    if (error) {
      console.error('Error logging deep link analytics:', error);
    }
  } catch (error) {
    console.error('Error logging deep link analytics:', error);
  }
}

/**
 * Get deep link analytics for content
 * @param contentId Content ID to get analytics for
 * @param contentType Type of content
 * @returns Analytics data
 */
export async function getDeepLinkAnalytics(
  contentId: string,
  contentType: 'sermon' | 'article'
): Promise<{
  totalClicks: number;
  clicksBySource: Record<string, number>;
  clicksByCampaign: Record<string, number>;
  recentClicks: Array<{
    timestamp: Date;
    source: string;
    campaign?: string;
    referrer?: string;
  }>;
}> {
  try {
    const { data, error } = await supabase
      .from('deep_link_analytics')
      .select('*')
      .eq('content_id', contentId)
      .eq('link_type', contentType)
      .order('timestamp', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch deep link analytics: ${error.message}`);
    }

    const totalClicks = data?.length || 0;
    const clicksBySource = data?.reduce((acc, click) => {
      acc[click.source] = (acc[click.source] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    const clicksByCampaign = data?.reduce((acc, click) => {
      if (click.campaign) {
        acc[click.campaign] = (acc[click.campaign] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>) || {};

    const recentClicks = (data || []).slice(0, 10).map(click => ({
      timestamp: new Date(click.timestamp),
      source: click.source,
      campaign: click.campaign,
      referrer: click.referrer,
    }));

    return {
      totalClicks,
      clicksBySource,
      clicksByCampaign,
      recentClicks,
    };
  } catch (error) {
    console.error('Error fetching deep link analytics:', error);
    return {
      totalClicks: 0,
      clicksBySource: {},
      clicksByCampaign: {},
      recentClicks: [],
    };
  }
}

/**
 * Create a shareable deep link with tracking
 * @param type Type of content
 * @param id Content ID
 * @param campaign Campaign name for tracking
 * @param referrer Referrer information
 * @returns Shareable deep link with tracking
 */
export function createShareableDeepLink(
  type: 'sermon' | 'article' | 'category' | 'invitation',
  id: string,
  campaign?: string,
  referrer?: string
): string {
  const params: Record<string, string> = {};
  
  if (campaign) {
    params.campaign = campaign;
  }
  
  if (referrer) {
    params.ref = referrer;
  }

  return generateDeepLink(type, id, params, true);
}
