import { supabase } from './client';
import {
  Sermon,
  Article,
  Category,
  Series,
  Topic,
  ContentSearchParams,
  ContentResponse,
  ContentFilters,
  ContentStats,
  ContentMetadata,
} from '../../types/content';
import { contentNotificationService, ContentNotificationOptions } from '../notifications/contentNotifications';

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
    sermon: Omit<Sermon, 'id' | 'created_at' | 'updated_at' | 'downloads' | 'views'>,
    notificationOptions?: ContentNotificationOptions
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

    // Send notification for new sermon if it's published
    if (data.is_published && notificationOptions !== null) {
      try {
        await contentNotificationService.notifyNewSermon(data, notificationOptions);
      } catch (notificationError) {
        console.error('Failed to send sermon notification:', notificationError);
        // Don't throw error - notification failure shouldn't break content creation
      }
    }

    return data;
  }

  static async updateSermon(
    id: string,
    updates: Partial<Omit<Sermon, 'id' | 'created_at'>>,
    notificationOptions?: ContentNotificationOptions
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

    // Send notification if sermon is being featured
    if (updates.is_featured && data.is_featured && notificationOptions !== null) {
      try {
        await contentNotificationService.notifyFeaturedContent(data, notificationOptions);
      } catch (notificationError) {
        console.error('Failed to send featured sermon notification:', notificationError);
        // Don't throw error - notification failure shouldn't break content update
      }
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
      sortBy = 'date',
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

    // Apply sorting - map sortBy values to actual database columns
    let sortColumn: string;
    switch (sortBy) {
      case 'date':
        sortColumn = 'published_at'; // Articles use published_at instead of date
        break;
      case 'popularity':
        sortColumn = 'views';
        break;
      default:
        sortColumn = sortBy;
    }
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
    article: Omit<Article, 'id' | 'created_at' | 'updated_at' | 'views'>,
    notificationOptions?: ContentNotificationOptions
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

    // Send notification for new article if it's published
    if (data.is_published && notificationOptions !== null) {
      try {
        await contentNotificationService.notifyNewArticle(data, notificationOptions);
      } catch (notificationError) {
        console.error('Failed to send article notification:', notificationError);
        // Don't throw error - notification failure shouldn't break content creation
      }
    }

    return data;
  }

  static async updateArticle(
    id: string,
    updates: Partial<Omit<Article, 'id' | 'created_at'>>,
    notificationOptions?: ContentNotificationOptions
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

    // Send notification if article is being featured
    if (updates.is_featured && data.is_featured && notificationOptions !== null) {
      try {
        await contentNotificationService.notifyFeaturedContent(data, notificationOptions);
      } catch (notificationError) {
        console.error('Failed to send featured article notification:', notificationError);
        // Don't throw error - notification failure shouldn't break content update
      }
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

  // Series operations
  static async getSeries(includeInactive = false): Promise<Series[]> {
    let queryBuilder = supabase
      .from('series')
      .select('*')
      .order('start_date', { ascending: false });

    if (!includeInactive) {
      queryBuilder = queryBuilder.eq('is_active', true);
    }

    const { data, error } = await queryBuilder;

    if (error) {
      throw new Error(`Failed to fetch series: ${error.message}`);
    }

    return data || [];
  }

  static async getSeriesById(id: string): Promise<Series> {
    const { data, error } = await supabase
      .from('series')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw new Error(`Failed to fetch series: ${error.message}`);
    }

    if (!data) {
      throw new Error('Series not found');
    }

    return data;
  }

  static async getSermonsBySeries(seriesId: string): Promise<Sermon[]> {
    const { data, error } = await supabase
      .from('sermons')
      .select('*')
      .eq('series_id', seriesId)
      .eq('is_published', true)
      .order('date', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch sermons for series: ${error.message}`);
    }

    return data || [];
  }

  // Topic operations
  static async getTopics(includeInactive = false): Promise<Topic[]> {
    let query = supabase
      .from('topics')
      .select('*')
      .order('sort_order', { ascending: true });

    if (!includeInactive) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch topics: ${error.message}`);
    }

    return data || [];
  }

  static async getTopicById(id: string): Promise<Topic> {
    const { data, error } = await supabase
      .from('topics')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw new Error(`Failed to fetch topic: ${error.message}`);
    }

    return data;
  }

  static async getSermonsByTopics(topicIds: string[]): Promise<Sermon[]> {
    const { data, error } = await supabase
      .from('sermon_topics')
      .select(`
        sermons (*)
      `)
      .in('topic_id', topicIds);

    if (error) {
      throw new Error(`Failed to fetch sermons for topics: ${error.message}`);
    }

    // Extract sermons from the junction table results
    const sermons = (data?.map((item: any) => item.sermons).filter(Boolean) || []) as Sermon[];

    // Filter only published sermons
    return sermons.filter((sermon: Sermon) => sermon.is_published);
  }

  static async getTopicsForSermon(sermonId: string): Promise<Topic[]> {
    const { data, error } = await supabase
      .from('sermon_topics')
      .select(`
        topics (*)
      `)
      .eq('sermon_id', sermonId);

    if (error) {
      throw new Error(`Failed to fetch topics for sermon: ${error.message}`);
    }

    // Extract topics from the junction table results
    return (data?.map(item => item.topics).filter(Boolean) || []) as unknown as Topic[];
  }

  static async assignTopicsToSermon(sermonId: string, topicIds: string[]): Promise<void> {
    // First, remove existing topic assignments
    await supabase
      .from('sermon_topics')
      .delete()
      .eq('sermon_id', sermonId);

    // Then, add new topic assignments
    if (topicIds.length > 0) {
      const assignments = topicIds.map(topicId => ({
        sermon_id: sermonId,
        topic_id: topicId,
      }));

      const { error } = await supabase
        .from('sermon_topics')
        .insert(assignments);

      if (error) {
        throw new Error(`Failed to assign topics to sermon: ${error.message}`);
      }
    }
  }

  // Article-series and article-topics operations
  static async getArticlesBySeries(seriesId: string): Promise<Article[]> {
    const { data, error } = await supabase
      .from('article_series')
      .select(`
        articles (*)
      `)
      .eq('series_id', seriesId);

    if (error) {
      throw new Error(`Failed to fetch articles for series: ${error.message}`);
    }

    // Extract articles from the junction table results
    const articles = (data?.map((item: any) => item.articles).filter(Boolean) || []) as Article[];

    // Filter only published articles
    return articles.filter((article: Article) => article.is_published);
  }

  static async getArticlesByTopics(topicIds: string[]): Promise<Article[]> {
    const { data, error } = await supabase
      .from('article_topics')
      .select(`
        articles (*)
      `)
      .in('topic_id', topicIds);

    if (error) {
      throw new Error(`Failed to fetch articles for topics: ${error.message}`);
    }

    // Extract articles from the junction table results
    const articlesByTopics = (data?.map((item: any) => item.articles).filter(Boolean) || []) as Article[];

    // Filter only published articles
    return articlesByTopics.filter((article: Article) => article.is_published);
  }

  static async getTopicsForArticle(articleId: string): Promise<Topic[]> {
    const { data, error } = await supabase
      .from('article_topics')
      .select(`
        topics (*)
      `)
      .eq('article_id', articleId);

    if (error) {
      throw new Error(`Failed to fetch topics for article: ${error.message}`);
    }

    // Extract topics from the junction table results
    return (data?.map((item: any) => item.topics).filter(Boolean) || []) as Topic[];
  }

  static async getSeriesForArticle(articleId: string): Promise<Series[]> {
    const { data, error } = await supabase
      .from('article_series')
      .select(`
        series (*)
      `)
      .eq('article_id', articleId);

    if (error) {
      throw new Error(`Failed to fetch series for article: ${error.message}`);
    }

    // Extract series from the junction table results
    return (data?.map((item: any) => item.series).filter(Boolean) || []) as Series[];
  }

  static async assignTopicsToArticle(articleId: string, topicIds: string[]): Promise<void> {
    // First, remove existing topic assignments
    await supabase
      .from('article_topics')
      .delete()
      .eq('article_id', articleId);

    // Then, add new topic assignments
    if (topicIds.length > 0) {
      const assignments = topicIds.map(topicId => ({
        article_id: articleId,
        topic_id: topicId,
      }));

      const { error } = await supabase
        .from('article_topics')
        .insert(assignments);

      if (error) {
        throw new Error(`Failed to assign topics to article: ${error.message}`);
      }
    }
  }

  static async assignSeriesToArticle(articleId: string, seriesIds: string[]): Promise<void> {
    // First, remove existing series assignments
    await supabase
      .from('article_series')
      .delete()
      .eq('article_id', articleId);

    // Then, add new series assignments
    if (seriesIds.length > 0) {
      const assignments = seriesIds.map(seriesId => ({
        article_id: articleId,
        series_id: seriesId,
      }));

      const { error } = await supabase
        .from('article_series')
        .insert(assignments);

      if (error) {
        throw new Error(`Failed to assign series to article: ${error.message}`);
      }
    }
  }

  // User content operations
  static async saveContent(
    userId: string,
    contentType: 'sermon' | 'article',
    contentId: string,
    actionType: 'save' | 'favorite' | 'like' = 'save'
  ): Promise<void> {
    const { error } = await supabase
      .from('user_content')
      .insert({
        user_id: userId,
        content_type: contentType,
        content_id: contentId,
        action_type: actionType,
      });

    if (error) {
      throw new Error(`Failed to save content: ${error.message}`);
    }
  }

  static async unsaveContent(
    userId: string,
    contentType: 'sermon' | 'article',
    contentId: string,
    actionType: 'save' | 'favorite' | 'like' = 'save'
  ): Promise<void> {
    const { error } = await supabase
      .from('user_content')
      .delete()
      .eq('user_id', userId)
      .eq('content_type', contentType)
      .eq('content_id', contentId)
      .eq('action_type', actionType);

    if (error) {
      throw new Error(`Failed to unsave content: ${error.message}`);
    }
  }

  static async isContentSaved(
    userId: string,
    contentType: 'sermon' | 'article',
    contentId: string,
    actionType: 'save' | 'favorite' | 'like' = 'save'
  ): Promise<boolean> {
    const { data, error } = await supabase
      .from('user_content')
      .select('id')
      .eq('user_id', userId)
      .eq('content_type', contentType)
      .eq('content_id', contentId)
      .eq('action_type', actionType)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" error
      throw new Error(`Failed to check saved content: ${error.message}`);
    }

    return !!data;
  }

  static async getSavedContent(
    userId: string,
    contentType?: 'sermon' | 'article',
    actionType: 'save' | 'favorite' | 'like' = 'save'
  ): Promise<Array<{ content: Sermon | Article; savedAt: string }>> {
    let query = supabase
      .from('user_content')
      .select('content_id, content_type, created_at')
      .eq('user_id', userId)
      .eq('action_type', actionType)
      .order('created_at', { ascending: false });

    if (contentType) {
      query = query.eq('content_type', contentType);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch saved content: ${error.message}`);
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Fetch the actual content for each saved item
    const results: Array<{ content: Sermon | Article; savedAt: string }> = [];

    for (const item of data) {
      try {
        if (item.content_type === 'sermon') {
          const sermon = await this.getSermonById(item.content_id);
          results.push({ content: sermon, savedAt: item.created_at });
        } else if (item.content_type === 'article') {
          const article = await this.getArticleById(item.content_id);
          results.push({ content: article, savedAt: item.created_at });
        }
      } catch (contentError) {
        // Skip content that no longer exists
        console.warn(`Saved content ${item.content_id} no longer exists:`, contentError);
      }
    }

    return results;
  }

  // Carousel image operations
  static async getCarouselImages(): Promise<Array<{
    id: string;
    image_url: string;
    title?: string;
    description?: string;
    link_url?: string;
    display_order: number;
  }>> {
    const { data, error } = await supabase
      .from('carousel_images')
      .select('id, image_url, title, description, link_url, display_order')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Failed to fetch carousel images:', error);
      return [];
    }

    return data || [];
  }
}
