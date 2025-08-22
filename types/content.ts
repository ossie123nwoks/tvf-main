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
}

export interface ContentSearchParams {
  query?: string;
  category?: string;
  tags?: string[];
  page?: number;
  limit?: number;
  sortBy?: 'date' | 'title' | 'popularity';
  sortOrder?: 'asc' | 'desc';
}
