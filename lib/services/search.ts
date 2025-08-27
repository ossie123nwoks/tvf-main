import { ContentService } from '../supabase/content';
import { Sermon, Article, Category, ContentSearchParams, ContentFilters } from '../../types/content';

export interface SearchResult {
  id: string;
  type: 'sermon' | 'article';
  title: string;
  excerpt: string;
  category: string;
  tags: string[];
  relevance: number;
  data: Sermon | Article;
}

export interface SearchOptions {
  query: string;
  filters?: ContentFilters;
  type?: 'sermon' | 'article' | 'all';
  limit?: number;
  includeInactive?: boolean;
}

export class SearchService {
  private static readonly MIN_QUERY_LENGTH = 2;
  private static readonly MAX_RESULTS = 100;

  /**
   * Perform a comprehensive search across sermons and articles
   */
  static async searchContent(options: SearchOptions): Promise<SearchResult[]> {
    const { query, filters, type = 'all', limit = 50 } = options;

    if (query.length < this.MIN_QUERY_LENGTH) {
      return [];
    }

    try {
      const results: SearchResult[] = [];
      const searchParams: ContentSearchParams = {
        query,
        limit: Math.min(limit, this.MAX_RESULTS),
        published: true
      };

      // Apply filters
      if (filters) {
        if (filters.categories.length > 0) {
          searchParams.category = filters.categories[0]; // Supabase doesn't support multiple categories in single query
        }
        if (filters.tags.length > 0) {
          searchParams.tags = filters.tags;
        }
        if (filters.featured !== undefined) {
          searchParams.featured = filters.featured;
        }
      }

      // Search sermons
      if (type === 'all' || type === 'sermon') {
        const sermons = await ContentService.getSermons(searchParams);
        const sermonResults = sermons.data.map(sermon => ({
          id: sermon.id,
          type: 'sermon' as const,
          title: sermon.title,
          excerpt: sermon.description,
          category: sermon.category,
          tags: sermon.tags,
          relevance: this.calculateRelevance(query, sermon.title, sermon.description, sermon.preacher, sermon.tags),
          data: sermon
        }));
        results.push(...sermonResults);
      }

      // Search articles
      if (type === 'all' || type === 'article') {
        const articles = await ContentService.getArticles(searchParams);
        const articleResults = articles.data.map(article => ({
          id: article.id,
          type: 'article' as const,
          title: article.title,
          excerpt: article.excerpt,
          category: article.category,
          tags: article.tags,
          relevance: this.calculateRelevance(query, article.title, article.content, article.author, article.tags),
          data: article
        }));
        results.push(...articleResults);
      }

      // Sort by relevance and return top results
      return results
        .sort((a, b) => b.relevance - a.relevance)
        .slice(0, limit);

    } catch (error) {
      console.error('Search failed:', error);
      return [];
    }
  }

  /**
   * Search by specific tags
   */
  static async searchByTags(tags: string[], type?: 'sermon' | 'article'): Promise<SearchResult[]> {
    try {
      const content = await ContentService.getContentByTags(tags, type);
      
      return content.map(item => ({
        id: item.id,
        type: 'publishedAt' in item ? 'article' as const : 'sermon' as const,
        title: item.title,
        excerpt: 'excerpt' in item ? item.excerpt : item.description,
        category: item.category,
        tags: item.tags,
        relevance: 1.0, // Tag matches get high relevance
        data: item
      }));
    } catch (error) {
      console.error('Tag search failed:', error);
      return [];
    }
  }

  /**
   * Search by category
   */
  static async searchByCategory(categoryId: string, type?: 'sermon' | 'article'): Promise<SearchResult[]> {
    try {
      const content = await ContentService.getContentByCategory(categoryId, type);
      
      return content.map(item => ({
        id: item.id,
        type: 'publishedAt' in item ? 'article' as const : 'sermon' as const,
        title: item.title,
        excerpt: 'excerpt' in item ? item.excerpt : item.description,
        category: item.category,
        tags: item.tags,
        relevance: 0.8, // Category matches get good relevance
        data: item
      }));
    } catch (error) {
      console.error('Category search failed:', error);
      return [];
    }
  }

  /**
   * Get search suggestions based on partial query
   */
  static async getSearchSuggestions(partialQuery: string, limit = 10): Promise<string[]> {
    if (partialQuery.length < 2) {
      return [];
    }

    try {
      const suggestions = new Set<string>();
      
      // Search for matching titles
      const [sermons, articles] = await Promise.all([
        ContentService.getSermons({ query: partialQuery, limit: 20 }),
        ContentService.getArticles({ query: partialQuery, limit: 20 })
      ]);

      // Extract title suggestions
      sermons.data.forEach(sermon => {
        if (sermon.title.toLowerCase().includes(partialQuery.toLowerCase())) {
          suggestions.add(sermon.title);
        }
      });

      articles.data.forEach(article => {
        if (article.title.toLowerCase().includes(partialQuery.toLowerCase())) {
          suggestions.add(article.title);
        }
      });

      // Extract tag suggestions
      const allTags = new Set<string>();
      sermons.data?.forEach(sermon => {
        if (sermon.tags && Array.isArray(sermon.tags)) {
          sermon.tags.forEach(tag => allTags.add(tag));
        }
      });
      articles.data?.forEach(article => {
        if (article.tags && Array.isArray(article.tags)) {
          article.tags.forEach(tag => allTags.add(tag));
        }
      });

      allTags.forEach(tag => {
        if (tag.toLowerCase().includes(partialQuery.toLowerCase())) {
          suggestions.add(tag);
        }
      });

      return Array.from(suggestions).slice(0, limit);
    } catch (error) {
      console.error('Failed to get search suggestions:', error);
      return [];
    }
  }

  /**
   * Get trending search terms based on recent activity
   */
  static async getTrendingSearches(limit = 10): Promise<string[]> {
    try {
      // This would typically come from analytics data
      // For now, return some common church-related terms
      const trendingTerms = [
        'faith', 'prayer', 'worship', 'bible study', 'community',
        'forgiveness', 'grace', 'love', 'hope', 'peace'
      ];

      return trendingTerms.slice(0, limit);
    } catch (error) {
      console.error('Failed to get trending searches:', error);
      return [];
    }
  }

  /**
   * Get search filters and options
   */
  static async getSearchFilters(): Promise<ContentFilters> {
    try {
      const categories = await ContentService.getCategories();
      
      // Get all unique tags from content
      const [sermons, articles] = await Promise.all([
        ContentService.getSermons({ limit: 100 }),
        ContentService.getArticles({ limit: 100 })
      ]);

      const allTags = new Set<string>();
      sermons.data?.forEach(sermon => {
        if (sermon.tags && Array.isArray(sermon.tags)) {
          sermon.tags.forEach(tag => allTags.add(tag));
        }
      });
      articles.data?.forEach(article => {
        if (article.tags && Array.isArray(article.tags)) {
          article.tags.forEach(tag => allTags.add(tag));
        }
      });

      return {
        categories: categories.map(cat => cat.id),
        tags: Array.from(allTags),
        featured: undefined,
        published: true
      };
    } catch (error) {
      console.error('Failed to get search filters:', error);
      return {
        categories: [],
        tags: [],
        featured: undefined,
        published: true
      };
    }
  }

  /**
   * Calculate relevance score for search results
   */
  private static calculateRelevance(
    query: string,
    title: string,
    content: string,
    author: string,
    tags: string[]
  ): number {
    const queryLower = query.toLowerCase();
    let score = 0;

    // Title matches get highest weight
    if (title.toLowerCase().includes(queryLower)) {
      score += 10;
      // Exact title match gets bonus
      if (title.toLowerCase() === queryLower) {
        score += 5;
      }
    }

    // Content matches get medium weight
    if (content.toLowerCase().includes(queryLower)) {
      score += 3;
    }

    // Author matches get good weight
    if (author.toLowerCase().includes(queryLower)) {
      score += 7;
    }

    // Tag matches get good weight
    if (tags && Array.isArray(tags)) {
      tags.forEach(tag => {
        if (tag.toLowerCase().includes(queryLower)) {
          score += 6;
        }
      });
    }

    // Boost score for multiple matches
    const matchCount = [
      title.toLowerCase().includes(queryLower),
      content.toLowerCase().includes(queryLower),
      author.toLowerCase().includes(queryLower),
      tags.some(tag => tag.toLowerCase().includes(queryLower))
    ].filter(Boolean).length;

    if (matchCount > 1) {
      score += matchCount * 2;
    }

    return score;
  }

  /**
   * Perform advanced search with multiple criteria
   */
  static async advancedSearch(criteria: {
    query?: string;
    categories?: string[];
    tags?: string[];
    dateRange?: { start: string; end: string };
    featured?: boolean;
    type?: 'sermon' | 'article' | 'all';
    sortBy?: 'relevance' | 'date' | 'title' | 'popularity';
    sortOrder?: 'asc' | 'desc';
    limit?: number;
  }): Promise<SearchResult[]> {
    const { query, categories, tags, dateRange, featured, type = 'all', sortBy = 'relevance', sortOrder = 'desc', limit = 50 } = criteria;

    try {
      let results: SearchResult[] = [];

      // Build search parameters
      const searchParams: ContentSearchParams = {
        limit: Math.min(limit, this.MAX_RESULTS),
        published: true
      };

      if (query) {
        searchParams.query = query;
      }

      if (categories && categories.length > 0) {
        // For multiple categories, we'll need to search each one separately
        // This is a limitation of Supabase's single query approach
        searchParams.category = categories[0];
      }

      if (tags && tags.length > 0) {
        searchParams.tags = tags;
      }

      if (featured !== undefined) {
        searchParams.featured = featured;
      }

      // Determine sort parameters
      if (sortBy === 'relevance' && query) {
        // Relevance sorting is handled after search
        searchParams.sortBy = 'date';
      } else {
        searchParams.sortBy = sortBy === 'popularity' ? 'downloads' : sortBy;
      }
      searchParams.sortOrder = sortOrder;

      // Perform search
      if (type === 'all' || type === 'sermon') {
        const sermons = await ContentService.getSermons(searchParams);
        const sermonResults = sermons.data.map(sermon => ({
          id: sermon.id,
          type: 'sermon' as const,
          title: sermon.title,
          excerpt: sermon.description,
          category: sermon.category,
          tags: sermon.tags,
          relevance: query ? this.calculateRelevance(query, sermon.title, sermon.description, sermon.preacher, sermon.tags) : 1,
          data: sermon
        }));
        results.push(...sermonResults);
      }

      if (type === 'all' || type === 'article') {
        const articles = await ContentService.getArticles(searchParams);
        const articleResults = articles.data.map(article => ({
          id: article.id,
          type: 'article' as const,
          title: article.title,
          excerpt: article.excerpt,
          category: article.category,
          tags: article.tags,
          relevance: query ? this.calculateRelevance(query, article.title, article.content, article.author, article.tags) : 1,
          data: article
        }));
        results.push(...articleResults);
      }

      // Apply date range filter if specified
      if (dateRange) {
        results = results.filter(item => {
          const itemDate = 'published_at' in item.data ? item.data.published_at : item.data.date;
          const itemDateObj = new Date(itemDate);
          const startDate = new Date(dateRange.start);
          const endDate = new Date(dateRange.end);
          return itemDateObj >= startDate && itemDateObj <= endDate;
        });
      }

      // Sort results
      if (sortBy === 'relevance' && query) {
        results.sort((a, b) => b.relevance - a.relevance);
      } else if (sortBy === 'date') {
        results.sort((a, b) => {
                const aDate = 'published_at' in a.data ? a.data.published_at : a.data.date;
      const bDate = 'published_at' in b.data ? b.data.published_at : b.data.date;
          return sortOrder === 'asc' 
            ? new Date(aDate).getTime() - new Date(bDate).getTime()
            : new Date(bDate).getTime() - new Date(aDate).getTime();
        });
      } else if (sortBy === 'title') {
        results.sort((a, b) => {
          return sortOrder === 'asc' 
            ? a.title.localeCompare(b.title)
            : b.title.localeCompare(a.title);
        });
      }

      return results.slice(0, limit);

    } catch (error) {
      console.error('Advanced search failed:', error);
      return [];
    }
  }
}
