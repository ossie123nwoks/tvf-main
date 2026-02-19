import { supabase } from '../supabase/client';
import { Category, Sermon, Article, ContentResponse, ContentFilters } from '../../types/content';

export interface CategoryHierarchy extends Category {
  children: CategoryHierarchy[];
  contentCount: number;
  subcategoryCount: number;
}

export interface ContentRelationship {
  id: string;
  type: 'sermon' | 'article';
  title: string;
  relationship: 'related' | 'series' | 'prerequisite' | 'followup';
  strength: number; // 0-1, indicating relationship strength
}

export interface ContentSeries {
  id: string;
  title: string;
  description: string;
  items: Array<{
    id: string;
    type: 'sermon' | 'article';
    title: string;
    order: number;
    date: string;
  }>;
  totalItems: number;
  isActive: boolean;
}

export interface ContentCollection {
  id: string;
  name: string;
  description: string;
  type: 'playlist' | 'study' | 'curriculum' | 'devotional';
  items: Array<{
    id: string;
    type: 'sermon' | 'article';
    title: string;
    addedAt: string;
    order?: number;
  }>;
  totalItems: number;
  isPublic: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryAnalytics {
  categoryId: string;
  categoryName: string;
  totalContent: number;
  totalViews: number;
  totalDownloads: number;
  averageRating: number;
  popularTags: string[];
  contentDistribution: {
    sermons: number;
    articles: number;
  };
  growthTrend: {
    period: string;
    newContent: number;
    views: number;
  }[];
}

export class CategorizationService {
  // Category Hierarchy Management
  static async getCategoryHierarchy(includeInactive = false): Promise<CategoryHierarchy[]> {
    try {
      const categories = await supabase
        .from('categories')
        .select('*')
        .order('sortOrder', { ascending: true });

      if (categories.error) {
        throw new Error(`Failed to fetch categories: ${categories.error.message}`);
      }

      const categoryMap = new Map<string, CategoryHierarchy>();
      const rootCategories: CategoryHierarchy[] = [];

      // Create category map with children array
      categories.data?.forEach(cat => {
        if (!includeInactive && !cat.isActive) return;

        categoryMap.set(cat.id, {
          ...cat,
          children: [],
          contentCount: 0,
          subcategoryCount: 0,
        });
      });

      // Build hierarchy
      categories.data?.forEach(cat => {
        if (!includeInactive && !cat.isActive) return;

        const category = categoryMap.get(cat.id);
        if (!category) return;

        if (cat.parentId && categoryMap.has(cat.parentId)) {
          const parent = categoryMap.get(cat.parentId);
          if (parent) {
            parent.children.push(category);
            parent.subcategoryCount = parent.children.length;
          }
        } else {
          rootCategories.push(category);
        }
      });

      // Calculate content counts for each category
      await Promise.all(
        rootCategories.map(category => this.calculateCategoryStats(category, categoryMap))
      );

      return rootCategories;
    } catch (error) {
      console.error('Failed to get category hierarchy:', error);
      throw error;
    }
  }

  private static async calculateCategoryStats(
    category: CategoryHierarchy,
    categoryMap: Map<string, CategoryHierarchy>
  ): Promise<void> {
    try {
      // Count content in this category
      const [sermonCount, articleCount] = await Promise.all([
        supabase
          .from('sermons')
          .select('id', { count: 'exact', head: true })
          .eq('category', category.id)
          .eq('isPublished', true),
        supabase
          .from('articles')
          .select('id', { count: 'exact', head: true })
          .eq('category', category.id)
          .eq('isPublished', true),
      ]);

      category.contentCount = (sermonCount.count || 0) + (articleCount.count || 0);

      // Recursively calculate for children
      for (const child of category.children) {
        await this.calculateCategoryStats(child, categoryMap);
        category.contentCount += child.contentCount;
      }
    } catch (error) {
      console.warn(`Failed to calculate stats for category ${category.id}:`, error);
    }
  }

  // Content Series Management
  static async createContentSeries(
    series: Omit<ContentSeries, 'id' | 'totalItems'>
  ): Promise<ContentSeries> {
    try {
      const { data, error } = await supabase
        .from('content_series')
        .insert({
          ...series,
          totalItems: series.items.length,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create content series: ${error.message}`);
      }

      return {
        ...data,
        items: series.items,
        totalItems: series.items.length,
      };
    } catch (error) {
      console.error('Failed to create content series:', error);
      throw error;
    }
  }

  static async getContentSeries(seriesId: string): Promise<ContentSeries> {
    try {
      const { data, error } = await supabase
        .from('content_series')
        .select('*')
        .eq('id', seriesId)
        .single();

      if (error) {
        throw new Error(`Failed to fetch content series: ${error.message}`);
      }

      // Fetch series items
      const { data: items, error: itemsError } = await supabase
        .from('content_series_items')
        .select('*')
        .eq('seriesId', seriesId)
        .order('order', { ascending: true });

      if (itemsError) {
        throw new Error(`Failed to fetch series items: ${itemsError.message}`);
      }

      return {
        ...data,
        items: items || [],
        totalItems: items?.length || 0,
      };
    } catch (error) {
      console.error('Failed to get content series:', error);
      throw error;
    }
  }

  static async addToContentSeries(
    seriesId: string,
    item: {
      id: string;
      type: 'sermon' | 'article';
      order?: number;
    }
  ): Promise<void> {
    try {
      const { error } = await supabase.from('content_series_items').insert({
        seriesId,
        contentId: item.id,
        contentType: item.type,
        order: item.order || 0,
        addedAt: new Date().toISOString(),
      });

      if (error) {
        throw new Error(`Failed to add item to series: ${error.message}`);
      }

      // Update series total items count
      await supabase
        .from('content_series')
        .update({
          totalItems: supabase.rpc('increment', { x: 1 }),
          updatedAt: new Date().toISOString(),
        })
        .eq('id', seriesId);
    } catch (error) {
      console.error('Failed to add item to series:', error);
      throw error;
    }
  }

  // Content Collections Management
  static async createContentCollection(
    collection: Omit<ContentCollection, 'id' | 'totalItems' | 'createdAt' | 'updatedAt'>
  ): Promise<ContentCollection> {
    try {
      const { data, error } = await supabase
        .from('content_collections')
        .insert({
          ...collection,
          totalItems: collection.items.length,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create content collection: ${error.message}`);
      }

      return {
        ...data,
        items: collection.items,
        totalItems: collection.items.length,
      };
    } catch (error) {
      console.error('Failed to create content collection:', error);
      throw error;
    }
  }

  static async getUserCollections(userId: string): Promise<ContentCollection[]> {
    try {
      const { data, error } = await supabase
        .from('content_collections')
        .select('*')
        .eq('createdBy', userId)
        .order('updatedAt', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch user collections: ${error.message}`);
      }

      // Fetch collection items for each collection
      const collectionsWithItems = await Promise.all(
        (data || []).map(async collection => {
          const { data: items } = await supabase
            .from('content_collection_items')
            .select('*')
            .eq('collectionId', collection.id)
            .order('addedAt', { ascending: false });

          return {
            ...collection,
            items: items || [],
            totalItems: items?.length || 0,
          };
        })
      );

      return collectionsWithItems;
    } catch (error) {
      console.error('Failed to get user collections:', error);
      throw error;
    }
  }

  // Content Relationships
  static async getRelatedContent(
    contentId: string,
    contentType: 'sermon' | 'article',
    limit = 10
  ): Promise<ContentRelationship[]> {
    try {
      // Get content details first
      const table = contentType === 'sermon' ? 'sermons' : 'articles';
      const { data: content, error: contentError } = await supabase
        .from(table)
        .select('category, tags')
        .eq('id', contentId)
        .single();

      if (contentError || !content) {
        throw new Error('Content not found');
      }

      // Find related content based on category and tags
      const { data: related, error: relatedError } = await supabase
        .from(table)
        .select('id, title')
        .neq('id', contentId)
        .eq('isPublished', true)
        .or(`category.eq.${content.category},tags.overlaps.{${content.tags.join(',')}}`)
        .limit(limit);

      if (relatedError) {
        throw new Error(`Failed to fetch related content: ${relatedError.message}`);
      }

      return (related || []).map(item => ({
        id: item.id,
        type: contentType,
        title: item.title,
        relationship: 'related' as const,
        strength: 0.7, // Base strength for category/tag matches
      }));
    } catch (error) {
      console.error('Failed to get related content:', error);
      throw error;
    }
  }

  // Category Analytics
  static async getCategoryAnalytics(categoryId: string): Promise<CategoryAnalytics> {
    try {
      const [category, sermons, articles] = await Promise.all([
        supabase.from('categories').select('*').eq('id', categoryId).single(),
        supabase
          .from('sermons')
          .select('views, downloads, tags')
          .eq('category', categoryId)
          .eq('isPublished', true),
        supabase
          .from('articles')
          .select('views, tags')
          .eq('category', categoryId)
          .eq('isPublished', true),
      ]);

      if (category.error) {
        throw new Error(`Failed to fetch category: ${category.error.message}`);
      }

      const sermonData = sermons.data || [];
      const articleData = articles.data || [];

      // Calculate analytics
      const totalViews =
        sermonData.reduce((sum, s) => sum + (s.views || 0), 0) +
        articleData.reduce((sum, a) => sum + (a.views || 0), 0);

      const totalDownloads = sermonData.reduce((sum, s) => sum + (s.downloads || 0), 0);

      // Get popular tags
      const allTags = [
        ...sermonData.flatMap(s => s.tags || []),
        ...articleData.flatMap(a => a.tags || []),
      ];

      const tagCounts = allTags.reduce(
        (acc, tag) => {
          acc[tag] = (acc[tag] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      const popularTags = Object.entries(tagCounts)
        .sort(([, a], [, b]) => (b as number) - (a as number))
        .slice(0, 10)
        .map(([tag]) => tag);

      return {
        categoryId,
        categoryName: category.data.name,
        totalContent: sermonData.length + articleData.length,
        totalViews,
        totalDownloads,
        averageRating: 0, // Would need ratings table
        popularTags,
        contentDistribution: {
          sermons: sermonData.length,
          articles: articleData.length,
        },
        growthTrend: [], // Would need historical data
      };
    } catch (error) {
      console.error('Failed to get category analytics:', error);
      throw error;
    }
  }

  // Smart Categorization
  static async suggestCategory(
    title: string,
    description: string,
    tags: string[]
  ): Promise<{ categoryId: string; confidence: number }> {
    try {
      // Get all active categories
      const { data: categories, error } = await supabase
        .from('categories')
        .select('*')
        .eq('isActive', true);

      if (error) {
        throw new Error(`Failed to fetch categories: ${error.message}`);
      }

      let bestMatch = { categoryId: '', confidence: 0 };

      for (const category of categories || []) {
        let score = 0;
        const searchText = `${title} ${description} ${tags.join(' ')}`.toLowerCase();
        const categoryText = `${category.name} ${category.description}`.toLowerCase();

        // Check for exact matches
        if (searchText.includes(category.name.toLowerCase())) {
          score += 0.4;
        }

        // Check for tag matches
        const matchingTags = tags.filter(tag => categoryText.includes(tag.toLowerCase()));
        score += (matchingTags.length / tags.length) * 0.3;

        // Check for keyword matches
        const keywords = category.description.split(' ').filter((word: string) => word.length > 3);
        const keywordMatches = keywords.filter((keyword: string) =>
          searchText.includes(keyword.toLowerCase())
        );
        score += (keywordMatches.length / keywords.length) * 0.3;

        if (score > bestMatch.confidence) {
          bestMatch = { categoryId: category.id, confidence: score };
        }
      }

      return bestMatch;
    } catch (error) {
      console.error('Failed to suggest category:', error);
      throw error;
    }
  }

  // Bulk Operations
  static async bulkUpdateCategories(
    contentIds: string[],
    contentType: 'sermon' | 'article',
    categoryId: string
  ): Promise<void> {
    try {
      const table = contentType === 'sermon' ? 'sermons' : 'articles';

      const { error } = await supabase
        .from(table)
        .update({
          category: categoryId,
          updatedAt: new Date().toISOString(),
        })
        .in('id', contentIds);

      if (error) {
        throw new Error(`Failed to bulk update categories: ${error.message}`);
      }
    } catch (error) {
      console.error('Failed to bulk update categories:', error);
      throw error;
    }
  }

  static async bulkAddTags(
    contentIds: string[],
    contentType: 'sermon' | 'article',
    tags: string[]
  ): Promise<void> {
    try {
      const table = contentType === 'sermon' ? 'sermons' : 'articles';

      // Get current tags for each content item
      const { data: content, error: fetchError } = await supabase
        .from(table)
        .select('id, tags')
        .in('id', contentIds);

      if (fetchError) {
        throw new Error(`Failed to fetch content: ${fetchError.message}`);
      }

      // Update each content item with merged tags
      const updates = content?.map(item => ({
        id: item.id,
        tags: [...new Set([...(item.tags || []), ...tags])],
        updatedAt: new Date().toISOString(),
      }));

      if (updates && updates.length > 0) {
        const { error: updateError } = await supabase.from(table).upsert(updates);

        if (updateError) {
          throw new Error(`Failed to bulk add tags: ${updateError.message}`);
        }
      }
    } catch (error) {
      console.error('Failed to bulk add tags:', error);
      throw error;
    }
  }

  // Category CRUD Operations
  static async createCategory(categoryData: Partial<Category>): Promise<Category> {
    try {
      const { data, error } = await supabase
        .from('categories')
        .insert([categoryData])
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create category: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error creating category:', error);
      throw error;
    }
  }

  static async updateCategory(
    categoryId: string,
    categoryData: Partial<Category>
  ): Promise<Category> {
    try {
      const { data, error } = await supabase
        .from('categories')
        .update(categoryData)
        .eq('id', categoryId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update category: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error updating category:', error);
      throw error;
    }
  }

  static async deleteCategory(categoryId: string): Promise<void> {
    try {
      const { error } = await supabase.from('categories').delete().eq('id', categoryId);

      if (error) {
        throw new Error(`Failed to delete category: ${error.message}`);
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      throw error;
    }
  }
}
