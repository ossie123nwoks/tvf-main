// Admin Dashboard Types
export type AdminRole = 'super_admin' | 'content_manager' | 'moderator';

export interface AdminPermission {
  id: string;
  name: string;
  description: string;
  resource: string;
  action: string;
}

export interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: AdminRole;
  permissions: AdminPermission[];
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminDashboardSection {
  id: string;
  title: string;
  description: string;
  icon: string;
  component: string;
  permissions: string[];
  isExpanded: boolean;
}

export interface AdminStats {
  totalUsers: number;
  totalSermons: number;
  totalArticles: number;
  totalTopics: number;
  totalSeries: number;
  totalCategories: number;
  recentActivity: AdminActivity[];
  recentUsers: any[];
  recentSermons: any[];
  recentArticles: any[];
}

export interface AdminActivity {
  id: string;
  type: 'content_created' | 'content_updated' | 'user_registered' | 'notification_sent';
  description: string;
  userId: string;
  userName: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

// Content Management Types
export interface ContentFormData {
  title: string;
  description?: string;
  content?: string;
  preacher?: string;
  author?: string;
  date?: string;
  categoryId?: string;
  topicIds?: string[];
  seriesId?: string;
  isPublished: boolean;
  scheduledAt?: string;
  thumbnailUrl?: string;
  audioUrl?: string;
  duration?: number;
}

// User Management Types
export interface UserManagementFilters {
  search: string;
  role?: AdminRole;
  isEmailVerified?: boolean;
  dateRange?: {
    start: string;
    end: string;
  };
}

export interface UserEngagementStats {
  userId: string;
  userName: string;
  totalSermonsListened: number;
  totalArticlesRead: number;
  totalDownloads: number;
  lastActivityAt: string;
  averageSessionDuration: number;
}

// Media Library Types
export interface MediaFile {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
  uploadedBy: string;
  uploadedAt: string;
  isUsed: boolean;
  usageCount: number;
  metadata?: {
    duration?: number;
    dimensions?: {
      width: number;
      height: number;
    };
  };
}

export interface MediaUploadProgress {
  fileId: string;
  filename: string;
  progress: number;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  error?: string;
}
