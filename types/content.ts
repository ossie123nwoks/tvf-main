export interface Sermon {
  id: string;
  title: string;
  preacher: string;
  date: string;
  duration: number; // in seconds
  audio_url: string;
  thumbnail_url?: string;
  description: string;
  category_id: string;
  series_id?: string; // Optional - sermon can belong to a series
  tags: string[];
  downloads: number;
  views: number;
  is_featured: boolean;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface Series {
  id: string;
  name: string;
  description?: string;
  thumbnail_url?: string;
  start_date?: string;
  end_date?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Topic {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Article {
  id: string;
  title: string;
  author: string;
  content: string;
  excerpt: string;
  thumbnail_url?: string;
  category_id: string;
  tags: string[];
  views: number;
  is_featured: boolean;
  is_published: boolean;
  published_at: string;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  parent_id?: string; // For nested categories
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ContentSearchParams {
  query?: string;
  category?: string;
  tags?: string[];
  page?: number;
  limit?: number;
  sortBy?: 'date' | 'title' | 'popularity' | 'views' | 'downloads';
  sortOrder?: 'asc' | 'desc';
  featured?: boolean;
  published?: boolean;
}

export interface ContentResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface ContentFilters {
  categories: string[];
  tags: string[];
  dateRange?: {
    start: string;
    end: string;
  };
  featured?: boolean;
  published?: boolean;
}

export interface ContentStats {
  totalSermons: number;
  totalArticles: number;
  totalCategories: number;
  totalDownloads: number;
  totalViews: number;
  recentContent: Array<Sermon | Article>;
}

export interface ContentMetadata {
  lastSync: string;
  version: string;
  totalSize: number; // in bytes
  checksum: string;
}
