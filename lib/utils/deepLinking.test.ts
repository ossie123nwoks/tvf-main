import { parseDeepLink, generateDeepLink, buildQueryString } from './deepLinking';

// Mock expo-linking
jest.mock('expo-linking', () => ({
  parse: jest.fn()
}));

// Mock expo-router
jest.mock('expo-router', () => ({
  router: {
    push: jest.fn()
  }
}));

describe('Deep Linking Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('parseDeepLink', () => {
    it('should parse sermon deep links correctly', () => {
      const mockParse = require('expo-linking').parse;
      mockParse.mockReturnValue({
        hostname: 'tvf-app',
        path: '/sermon/123',
        queryParams: {}
      });

      const result = parseDeepLink('tvf-app://sermon/123');
      
      expect(result).toEqual({
        type: 'sermon',
        id: '123'
      });
    });

    it('should parse article deep links correctly', () => {
      const mockParse = require('expo-linking').parse;
      mockParse.mockReturnValue({
        hostname: 'tvf-app',
        path: '/article/456',
        queryParams: {}
      });

      const result = parseDeepLink('tvf-app://article/456');
      
      expect(result).toEqual({
        type: 'article',
        id: '456'
      });
    });

    it('should parse category deep links correctly', () => {
      const mockParse = require('expo-linking').parse;
      mockParse.mockReturnValue({
        hostname: 'tvf-app',
        path: '/category/sermons',
        queryParams: { tab: 'sermons' }
      });

      const result = parseDeepLink('tvf-app://category/sermons?tab=sermons');
      
      expect(result).toEqual({
        type: 'category',
        category: 'sermons',
        tab: 'sermons'
      });
    });

    it('should parse tab navigation deep links correctly', () => {
      const mockParse = require('expo-linking').parse;
      mockParse.mockReturnValue({
        hostname: 'tvf-app',
        path: '/dashboard',
        queryParams: {}
      });

      const result = parseDeepLink('tvf-app://dashboard');
      
      expect(result).toEqual({
        type: 'dashboard',
        tab: 'dashboard'
      });
    });

    it('should return null for invalid URLs', () => {
      const mockParse = require('expo-linking').parse;
      mockParse.mockReturnValue({
        hostname: 'invalid-app',
        path: '/sermon/123',
        queryParams: {}
      });

      const result = parseDeepLink('invalid-app://sermon/123');
      
      expect(result).toBeNull();
    });

    it('should handle empty path segments', () => {
      const mockParse = require('expo-linking').parse;
      mockParse.mockReturnValue({
        hostname: 'tvf-app',
        path: '',
        queryParams: {}
      });

      const result = parseDeepLink('tvf-app://');
      
      expect(result).toEqual({
        type: 'dashboard'
      });
    });

    it('should handle parsing errors gracefully', () => {
      const mockParse = require('expo-linking').parse;
      mockParse.mockImplementation(() => {
        throw new Error('Parse error');
      });

      const result = parseDeepLink('invalid-url');
      
      expect(result).toBeNull();
    });
  });

  describe('generateDeepLink', () => {
    it('should generate sermon deep links correctly', () => {
      const result = generateDeepLink('sermon', '123');
      
      expect(result).toBe('tvf-app://sermon/123');
    });

    it('should generate article deep links correctly', () => {
      const result = generateDeepLink('article', '456');
      
      expect(result).toBe('tvf-app://article/456');
    });

    it('should generate category deep links correctly', () => {
      const result = generateDeepLink('category', 'sermons');
      
      expect(result).toBe('tvf-app://category/sermons');
    });

    it('should include additional parameters when provided', () => {
      const result = generateDeepLink('sermon', '123', {
        title: 'Test Sermon',
        author: 'Pastor John'
      });
      
      expect(result).toBe('tvf-app://sermon/123?title=Test%20Sermon&author=Pastor%20John');
    });

    it('should filter out undefined and empty parameters', () => {
      const result = generateDeepLink('sermon', '123', {
        title: 'Test Sermon',
        author: '',
        date: undefined,
        valid: 'value'
      });
      
      expect(result).toBe('tvf-app://sermon/123?title=Test%20Sermon&valid=value');
    });
  });

  describe('buildQueryString', () => {
    it('should build query string from parameters', () => {
      const params = {
        title: 'Test Title',
        author: 'Test Author'
      };
      
      const result = buildQueryString(params);
      
      expect(result).toBe('?title=Test%20Title&author=Test%20Author');
    });

    it('should return empty string for no parameters', () => {
      const result = buildQueryString({});
      
      expect(result).toBe('');
    });

    it('should filter out undefined and empty values', () => {
      const params = {
        title: 'Test Title',
        author: '',
        date: undefined,
        valid: 'value'
      };
      
      const result = buildQueryString(params);
      
      expect(result).toBe('?title=Test%20Title&valid=value');
    });

    it('should handle special characters in parameters', () => {
      const params = {
        title: 'Test & Title',
        author: 'John Doe'
      };
      
      const result = buildQueryString(params);
      
      expect(result).toBe('?title=Test%20%26%20Title&author=John%20Doe');
    });
  });
});
