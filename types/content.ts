export interface Sermon {
  id: string;
  title: string;
  preacher: string;
  date: string;
  duration: number; // in seconds
  audioUrl: string;
  thumbnailUrl?: string;
  description: string;
  category: string;
  tags: string[];
  downloads: number;
  views: number;
  isFeatured: boolean;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Article {
  id: string;
  title: string;
  author: string;
  content: string;
  excerpt: string;
  thumbnailUrl?: string;
  category: string;
  tags: string[];
  views: number;
  isFeatured: boolean;
  isPublished: boolean;
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  parentId?: string; // For nested categories
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
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
