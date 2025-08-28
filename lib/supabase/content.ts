import { supabase } from './client';
import {
  Sermon,
  Article,
  Category,
  ContentSearchParams,
  ContentResponse,
  ContentFilters,
  ContentStats,
  ContentMetadata,
} from '../../types/content';

export class ContentService {
  // Sermon operations
  static async getSermons(params: ContentSearchParams = {}): Promise<ContentResponse<Sermon>> {
    const {
      query,
      category,
      tags,
      page = 1,
      limit = 20,
      sortBy = 'date',
      sortOrder = 'desc',
      featured,
      published = true,
    } = params;

    let queryBuilder = supabase.from('sermons').select('*', { count: 'exact' });

    // Apply filters
    if (query) {
      queryBuilder = queryBuilder.or(
        `title.ilike.%${query}%,description.ilike.%${query}%,preacher.ilike.%${query}%`
      );
    }

    if (category) {
      queryBuilder = queryBuilder.eq('category_id', category);
    }

    if (tags && tags.length > 0) {
      queryBuilder = queryBuilder.overlaps('tags', tags);
    }

    if (featured !== undefined) {
      queryBuilder = queryBuilder.eq('is_featured', featured);
    }

    if (published !== undefined) {
      queryBuilder = queryBuilder.eq('is_published', published);
    }

    // Apply sorting
    const sortColumn = sortBy === 'popularity' ? 'downloads' : sortBy;
    queryBuilder = queryBuilder.order(sortColumn, { ascending: sortOrder === 'asc' });

    // Apply pagination
    const offset = (page - 1) * limit;
    queryBuilder = queryBuilder.range(offset, offset + limit - 1);

    const { data, error, count } = await queryBuilder;

    if (error) {
      throw new Error(`Failed to fetch sermons: ${error.message}`);
    }

    return {
      data: data || [],
      total: count || 0,
      page,
      limit,
      hasMore: (data?.length || 0) === limit,
    };
  }

  static async getSermonById(id: string): Promise<Sermon> {
    const { data, error } = await supabase
      .from('sermons')
      .select('*')
      .eq('id', id)
      .eq('is_published', true)
      .single();

    if (error) {
      throw new Error(`Failed to fetch sermon: ${error.message}`);
    }

    if (!data) {
      throw new Error('Sermon not found');
    }

    return data;
  }

  static async createSermon(
    sermon: Omit<Sermon, 'id' | 'created_at' | 'updated_at' | 'downloads' | 'views'>
  ): Promise<Sermon> {
    const { data, error } = await supabase
      .from('sermons')
      .insert({
        ...sermon,
        downloads: 0,
        views: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create sermon: ${error.message}`);
    }

    return data;
  }

  static async updateSermon(
    id: string,
    updates: Partial<Omit<Sermon, 'id' | 'created_at'>>
  ): Promise<Sermon> {
    const { data, error } = await supabase
      .from('sermons')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update sermon: ${error.message}`);
    }

    return data;
  }

  static async deleteSermon(id: string): Promise<void> {
    const { error } = await supabase.from('sermons').delete().eq('id', id);

    if (error) {
      throw new Error(`Failed to delete sermon: ${error.message}`);
    }
  }

  static async incrementSermonViews(id: string): Promise<void> {
    const { error } = await supabase.rpc('increment_sermon_views', { sermon_id: id });

    if (error) {
      // Fallback to manual update if RPC function doesn't exist
      const { error: updateError } = await supabase
        .from('sermons')
        .update({ views: supabase.rpc('increment', { x: 1 }) })
        .eq('id', id);

      if (updateError) {
        console.warn('Failed to increment sermon views:', updateError.message);
      }
    }
  }

  static async incrementSermonDownloads(id: string): Promise<void> {
    const { error } = await supabase.rpc('increment_sermon_downloads', { sermon_id: id });

    if (error) {
      // Fallback to manual update if RPC function doesn't exist
      const { error: updateError } = await supabase
        .from('sermons')
        .update({ downloads: supabase.rpc('increment', { x: 1 }) })
        .eq('id', id);

      if (updateError) {
        console.warn('Failed to increment sermon downloads:', updateError.message);
      }
    }
  }

  // Article operations
  static async getArticles(params: ContentSearchParams = {}): Promise<ContentResponse<Article>> {
    const {
      query,
      category,
      tags,
      page = 1,
      limit = 20,
      sortBy = 'published_at',
      sortOrder = 'desc',
      featured,
      published = true,
    } = params;

    let queryBuilder = supabase.from('articles').select('*', { count: 'exact' });

    // Apply filters
    if (query) {
      queryBuilder = queryBuilder.or(
        `title.ilike.%${query}%,content.ilike.%${query}%,excerpt.ilike.%${query}%,author.ilike.%${query}%`
      );
    }

    if (category) {
      queryBuilder = queryBuilder.eq('category_id', category);
    }

    if (tags && tags.length > 0) {
      queryBuilder = queryBuilder.overlaps('tags', tags);
    }

    if (featured !== undefined) {
      queryBuilder = queryBuilder.eq('is_featured', featured);
    }

    if (published !== undefined) {
      queryBuilder = queryBuilder.eq('is_published', published);
    }

    // Apply sorting
    const sortColumn = sortBy === 'popularity' ? 'views' : sortBy;
    queryBuilder = queryBuilder.order(sortColumn, { ascending: sortOrder === 'asc' });

    // Apply pagination
    const offset = (page - 1) * limit;
    queryBuilder = queryBuilder.range(offset, offset + limit - 1);

    const { data, error, count } = await queryBuilder;

    if (error) {
      throw new Error(`Failed to fetch articles: ${error.message}`);
    }

    return {
      data: data || [],
      total: count || 0,
      page,
      limit,
      hasMore: (data?.length || 0) === limit,
    };
  }

  static async getArticleById(id: string): Promise<Article> {
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .eq('id', id)
      .eq('is_published', true)
      .single();

    if (error) {
      throw new Error(`Failed to fetch article: ${error.message}`);
    }

    if (!data) {
      throw new Error('Article not found');
    }

    return data;
  }

  static async createArticle(
    article: Omit<Article, 'id' | 'created_at' | 'updated_at' | 'views'>
  ): Promise<Article> {
    const { data, error } = await supabase
      .from('articles')
      .insert({
        ...article,
        views: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create article: ${error.message}`);
    }

    return data;
  }

  static async updateArticle(
    id: string,
    updates: Partial<Omit<Article, 'id' | 'created_at'>>
  ): Promise<Article> {
    const { data, error } = await supabase
      .from('articles')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update article: ${error.message}`);
    }

    return data;
  }

  static async deleteArticle(id: string): Promise<void> {
    const { error } = await supabase.from('articles').delete().eq('id', id);

    if (error) {
      throw new Error(`Failed to delete article: ${error.message}`);
    }
  }

  static async incrementArticleViews(id: string): Promise<void> {
    const { error } = await supabase.rpc('increment_article_views', { article_id: id });

    if (error) {
      // Fallback to manual update if RPC function doesn't exist
      const { error: updateError } = await supabase
        .from('articles')
        .update({ views: supabase.rpc('increment', { x: 1 }) })
        .eq('id', id);

      if (updateError) {
        console.warn('Failed to increment article views:', updateError.message);
      }
    }
  }

  // Category operations
  static async getCategories(includeInactive = false): Promise<Category[]> {
    let queryBuilder = supabase
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true });

    if (!includeInactive) {
      queryBuilder = queryBuilder.eq('is_active', true);
    }

    const { data, error } = await queryBuilder;

    if (error) {
      throw new Error(`Failed to fetch categories: ${error.message}`);
    }

    return data || [];
  }

  static async getCategoryById(id: string): Promise<Category> {
    const { data, error } = await supabase.from('categories').select('*').eq('id', id).single();

    if (error) {
      throw new Error(`Failed to fetch category: ${error.message}`);
    }

    if (!data) {
      throw new Error('Category not found');
    }

    return data;
  }

  static async createCategory(
    category: Omit<Category, 'id' | 'created_at' | 'updated_at'>
  ): Promise<Category> {
    const { data, error } = await supabase
      .from('categories')
      .insert({
        ...category,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create category: ${error.message}`);
    }

    return data;
  }

  static async updateCategory(
    id: string,
    updates: Partial<Omit<Category, 'id' | 'created_at'>>
  ): Promise<Category> {
    const { data, error } = await supabase
      .from('categories')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update category: ${error.message}`);
    }

    return data;
  }

  static async deleteCategory(id: string): Promise<void> {
    const { error } = await supabase.from('categories').delete().eq('id', id);

    if (error) {
      throw new Error(`Failed to delete category: ${error.message}`);
    }
  }

  // Search and filtering operations
  static async searchContent(
    query: string,
    type?: 'sermon' | 'article'
  ): Promise<Array<Sermon | Article>> {
    const results: Array<Sermon | Article> = [];

    if (!type || type === 'sermon') {
      const sermons = await this.getSermons({ query, limit: 10 });
      results.push(...sermons.data);
    }

    if (!type || type === 'article') {
      const articles = await this.getArticles({ query, limit: 10 });
      results.push(...articles.data);
    }

    // Sort by relevance (simplified - could be enhanced with proper search ranking)
    return results.sort((a, b) => {
      const aDate = 'published_at' in a ? a.published_at : (a as Sermon).date;
      const bDate = 'published_at' in b ? b.published_at : (b as Sermon).date;
      return new Date(bDate).getTime() - new Date(aDate).getTime();
    });
  }

  static async getFeaturedContent(): Promise<{ sermons: Sermon[]; articles: Article[] }> {
    const [sermons, articles] = await Promise.all([
      this.getSermons({ featured: true, limit: 5 }),
      this.getArticles({ featured: true, limit: 5 }),
    ]);

    return {
      sermons: sermons.data,
      articles: articles.data,
    };
  }

  static async getContentStats(): Promise<ContentStats> {
    const [
      { count: totalSermons },
      { count: totalArticles },
      { count: totalCategories },
      { data: recentSermons },
      { data: recentArticles },
    ] = await Promise.all([
      supabase.from('sermons').select('*', { count: 'exact', head: true }),
      supabase.from('articles').select('*', { count: 'exact', head: true }),
      supabase.from('categories').select('*', { count: 'exact', head: true }),
      supabase.from('sermons').select('*').order('created_at', { ascending: false }).limit(5),
      supabase.from('articles').select('*').order('published_at', { ascending: false }).limit(5),
    ]);

    const recentContent = [...(recentSermons || []), ...(recentArticles || [])]
      .sort((a, b) => {
        const aDate = 'published_at' in a ? a.published_at : (a as Sermon).date;
        const bDate = 'published_at' in b ? b.published_at : (b as Sermon).date;
        return new Date(bDate).getTime() - new Date(aDate).getTime();
      })
      .slice(0, 10);

    // Calculate totals (simplified - could be enhanced with proper aggregation)
    const totalDownloads = 0; // Would need proper aggregation query
    const totalViews = 0; // Would need proper aggregation query

    return {
      totalSermons: totalSermons || 0,
      totalArticles: totalArticles || 0,
      totalCategories: totalCategories || 0,
      totalDownloads,
      totalViews,
      recentContent,
    };
  }

  // Utility methods
  static async getContentByTags(
    tags: string[],
    type?: 'sermon' | 'article'
  ): Promise<Array<Sermon | Article>> {
    const results: Array<Sermon | Article> = [];

    if (!type || type === 'sermon') {
      const sermons = await this.getSermons({ tags, limit: 20 });
      results.push(...sermons.data);
    }

    if (!type || type === 'article') {
      const articles = await this.getArticles({ tags, limit: 20 });
      results.push(...articles.data);
    }

    return results;
  }

  static async getContentByCategory(
    categoryId: string,
    type?: 'sermon' | 'article'
  ): Promise<Array<Sermon | Article>> {
    const results: Array<Sermon | Article> = [];

    if (!type || type === 'sermon') {
      const sermons = await this.getSermons({ category: categoryId, limit: 50 });
      results.push(...sermons.data);
    }

    if (!type || type === 'article') {
      const articles = await this.getArticles({ category: categoryId, limit: 50 });
      results.push(...articles.data);
    }

    return results;
  }
}
