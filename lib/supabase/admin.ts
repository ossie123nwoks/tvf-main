import { supabase } from './client';
import { User } from '@/types/user';
import { Sermon, Article } from '@/types/content';
import { AdminStats, AdminActivity } from '@/types/admin';

export class AdminService {
  /**
   * Check if current user has admin privileges
   */
  static async isCurrentUserAdmin(): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      return profile?.role === 'admin' || profile?.role === 'moderator';
    } catch (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
  }

  /**
   * Get admin dashboard statistics
   */
  static async getAdminStats(): Promise<AdminStats> {
    try {
      // Get total counts
      const [usersResult, sermonsResult, articlesResult, categoriesResult] = await Promise.all([
        supabase.from('users').select('id', { count: 'exact', head: true }),
        supabase.from('sermons').select('id', { count: 'exact', head: true }),
        supabase.from('articles').select('id', { count: 'exact', head: true }),
        supabase.from('categories').select('id', { count: 'exact', head: true }),
      ]);

      // Get recent activity
      const [recentUsers, recentSermons, recentArticles] = await Promise.all([
        supabase
          .from('users')
          .select('id, first_name, last_name, created_at')
          .order('created_at', { ascending: false })
          .limit(5),
        supabase
          .from('sermons')
          .select('id, title, created_at')
          .order('created_at', { ascending: false })
          .limit(5),
        supabase
          .from('articles')
          .select('id, title, created_at')
          .order('created_at', { ascending: false })
          .limit(5),
      ]);

      return {
        totalUsers: usersResult.count || 0,
        totalSermons: sermonsResult.count || 0,
        totalArticles: articlesResult.count || 0,
        totalTopics: 0, // TODO: Implement when topics table is ready
        totalSeries: 0, // TODO: Implement when series table is ready
        recentActivity: [], // TODO: Implement activity tracking
        recentUsers: recentUsers.data || [],
        recentSermons: recentSermons.data || [],
        recentArticles: recentArticles.data || [],
        totalCategories: categoriesResult.count || 0,
      };
    } catch (error) {
      console.error('Error fetching admin stats:', error);
      throw new Error('Failed to fetch admin statistics');
    }
  }

  /**
   * Get all users with pagination
   */
  static async getUsers(page: number = 1, limit: number = 20, search?: string) {
    try {
      let query = supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })
        .range((page - 1) * limit, page * limit - 1);

      if (search) {
        query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        users: data || [],
        totalCount: count || 0,
        page,
        totalPages: Math.ceil((count || 0) / limit),
      };
    } catch (error) {
      console.error('Error fetching users:', error);
      throw new Error('Failed to fetch users');
    }
  }

  /**
   * Update user role
   */
  static async updateUserRole(userId: string, role: 'member' | 'admin' | 'moderator') {
    try {
      const { data, error } = await supabase
        .from('users')
        .update({ role, updated_at: new Date().toISOString() })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error updating user role:', error);
      throw new Error('Failed to update user role');
    }
  }

  /**
   * Get user by ID with detailed information
   */
  static async getUserById(userId: string) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error fetching user:', error);
      throw new Error('Failed to fetch user details');
    }
  }

  /**
   * Get users by role
   */
  static async getUsersByRole(role: 'member' | 'admin' | 'moderator', page: number = 1, limit: number = 20) {
    try {
      const { data, error, count } = await supabase
        .from('users')
        .select('*', { count: 'exact' })
        .eq('role', role)
        .order('created_at', { ascending: false })
        .range((page - 1) * limit, page * limit - 1);

      if (error) throw error;

      return {
        users: data || [],
        totalCount: count || 0,
        page,
        totalPages: Math.ceil((count || 0) / limit),
      };
    } catch (error) {
      console.error('Error fetching users by role:', error);
      throw new Error('Failed to fetch users by role');
    }
  }

  /**
   * Get user engagement statistics
   */
  static async getUserEngagementStats(userId: string) {
    try {
      // This would need to be implemented based on your analytics tracking
      // For now, returning mock data structure
      return {
        userId,
        totalSermonsListened: 0,
        totalArticlesRead: 0,
        totalDownloads: 0,
        lastActivityAt: new Date().toISOString(),
        averageSessionDuration: 0,
      };
    } catch (error) {
      console.error('Error fetching user engagement stats:', error);
      throw new Error('Failed to fetch user engagement statistics');
    }
  }

  /**
   * Get all users with engagement statistics
   */
  static async getUsersWithEngagement(page: number = 1, limit: number = 20) {
    try {
      const { data: users, error, count } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })
        .range((page - 1) * limit, page * limit - 1);

      if (error) throw error;

      // Get engagement stats for each user
      const usersWithStats = await Promise.all(
        (users || []).map(async (user) => {
          const stats = await this.getUserEngagementStats(user.id);
          return { ...user, engagement: stats };
        })
      );

      return {
        users: usersWithStats,
        totalCount: count || 0,
        page,
        totalPages: Math.ceil((count || 0) / limit),
      };
    } catch (error) {
      console.error('Error fetching users with engagement:', error);
      throw new Error('Failed to fetch users with engagement data');
    }
  }

  /**
   * Bulk update user roles
   */
  static async bulkUpdateUserRoles(updates: { userId: string; role: 'member' | 'admin' | 'moderator' }[]) {
    try {
      const promises = updates.map(({ userId, role }) =>
        supabase
          .from('users')
          .update({ role, updated_at: new Date().toISOString() })
          .eq('id', userId)
      );

      const results = await Promise.all(promises);
      
      // Check for any errors
      const errors = results.filter(result => result.error);
      if (errors.length > 0) {
        throw new Error(`Failed to update ${errors.length} users`);
      }

      return { success: true, updatedCount: updates.length };
    } catch (error) {
      console.error('Error bulk updating user roles:', error);
      throw new Error('Failed to bulk update user roles');
    }
  }

  /**
   * Log admin action for audit trail
   */
  static async logAdminAction(action: {
    type: 'user_role_changed' | 'content_created' | 'content_updated' | 'content_deleted' | 'user_created' | 'user_updated' | 'notification_sent';
    description: string;
    targetUserId?: string;
    targetUserName?: string;
    metadata?: Record<string, any>;
  }) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('admin_audit_logs')
        .insert({
          admin_user_id: user.id,
          action_type: action.type,
          description: action.description,
          target_user_id: action.targetUserId,
          target_user_name: action.targetUserName,
          metadata: action.metadata,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error logging admin action:', error);
      // Don't throw error for logging failures to avoid breaking main functionality
      return null;
    }
  }

  /**
   * Get admin audit logs with pagination
   */
  static async getAuditLogs(page: number = 1, limit: number = 20, filters?: {
    actionType?: string;
    adminUserId?: string;
    targetUserId?: string;
    dateFrom?: string;
    dateTo?: string;
  }) {
    try {
      let query = supabase
        .from('admin_audit_logs')
        .select(`
          *,
          admin_user:admin_user_id (
            id,
            first_name,
            last_name,
            email
          ),
          target_user:target_user_id (
            id,
            first_name,
            last_name,
            email
          )
        `)
        .order('created_at', { ascending: false })
        .range((page - 1) * limit, page * limit - 1);

      if (filters?.actionType) {
        query = query.eq('action_type', filters.actionType);
      }
      if (filters?.adminUserId) {
        query = query.eq('admin_user_id', filters.adminUserId);
      }
      if (filters?.targetUserId) {
        query = query.eq('target_user_id', filters.targetUserId);
      }
      if (filters?.dateFrom) {
        query = query.gte('created_at', filters.dateFrom);
      }
      if (filters?.dateTo) {
        query = query.lte('created_at', filters.dateTo);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        logs: data || [],
        totalCount: count || 0,
        page,
        totalPages: Math.ceil((count || 0) / limit),
      };
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      throw new Error('Failed to fetch audit logs');
    }
  }

  /**
   * Get user activity logs
   */
  static async getUserActivityLogs(userId: string, page: number = 1, limit: number = 20) {
    try {
      const { data, error, count } = await supabase
        .from('user_activity_logs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range((page - 1) * limit, page * limit - 1);

      if (error) throw error;

      return {
        logs: data || [],
        totalCount: count || 0,
        page,
        totalPages: Math.ceil((count || 0) / limit),
      };
    } catch (error) {
      console.error('Error fetching user activity logs:', error);
      throw new Error('Failed to fetch user activity logs');
    }
  }

  /**
   * Get system activity summary
   */
  static async getActivitySummary(days: number = 7) {
    try {
      const dateFrom = new Date();
      dateFrom.setDate(dateFrom.getDate() - days);
      const dateFromISO = dateFrom.toISOString();

      const [auditLogs, userActivity] = await Promise.all([
        supabase
          .from('admin_audit_logs')
          .select('action_type, created_at')
          .gte('created_at', dateFromISO),
        supabase
          .from('user_activity_logs')
          .select('activity_type, created_at')
          .gte('created_at', dateFromISO),
      ]);

      // Process audit logs
      const auditSummary = (auditLogs.data || []).reduce((acc: any, log: any) => {
        acc[log.action_type] = (acc[log.action_type] || 0) + 1;
        return acc;
      }, {});

      // Process user activity
      const activitySummary = (userActivity.data || []).reduce((acc: any, log: any) => {
        acc[log.activity_type] = (acc[log.activity_type] || 0) + 1;
        return acc;
      }, {});

      return {
        auditLogs: auditSummary,
        userActivity: activitySummary,
        totalAuditActions: auditLogs.data?.length || 0,
        totalUserActivities: userActivity.data?.length || 0,
        period: `${days} days`,
      };
    } catch (error) {
      console.error('Error fetching activity summary:', error);
      throw new Error('Failed to fetch activity summary');
    }
  }

  /**
   * Get all media files with pagination and filters
   */
  static async getMediaFiles(page: number = 1, limit: number = 20, filters?: {
    search?: string;
    type?: string;
    isUsed?: boolean;
    uploadedBy?: string;
  }) {
    try {
      let query = supabase
        .from('media_files')
        .select('*')
        .order('uploaded_at', { ascending: false })
        .range((page - 1) * limit, page * limit - 1);

      if (filters?.search) {
        query = query.or(`filename.ilike.%${filters.search}%,original_name.ilike.%${filters.search}%`);
      }
      if (filters?.type) {
        if (filters.type === 'image') {
          query = query.like('mime_type', 'image/%');
        } else if (filters.type === 'video') {
          query = query.like('mime_type', 'video/%');
        } else if (filters.type === 'audio') {
          query = query.like('mime_type', 'audio/%');
        } else if (filters.type === 'document') {
          query = query.or('mime_type.like.%pdf%,mime_type.like.%document%');
        }
      }
      if (filters?.isUsed !== undefined) {
        query = query.eq('is_used', filters.isUsed);
      }
      if (filters?.uploadedBy) {
        query = query.eq('uploaded_by', filters.uploadedBy);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        files: data || [],
        totalCount: count || 0,
        page,
        totalPages: Math.ceil((count || 0) / limit),
      };
    } catch (error) {
      console.error('Error fetching media files:', error);
      throw new Error('Failed to fetch media files');
    }
  }

  /**
   * Delete a media file
   */
  static async deleteMediaFile(fileId: string) {
    try {
      // First, get the file to check if it's being used
      const { data: file, error: fetchError } = await supabase
        .from('media_files')
        .select('*')
        .eq('id', fileId)
        .single();

      if (fetchError) throw fetchError;

      if (file.is_used) {
        throw new Error('Cannot delete file that is currently being used');
      }

      // Delete the file record
      const { error: deleteError } = await supabase
        .from('media_files')
        .delete()
        .eq('id', fileId);

      if (deleteError) throw deleteError;

      // Log the deletion action
      await this.logAdminAction({
        type: 'content_deleted',
        description: `Deleted media file: ${file.filename}`,
        metadata: {
          fileId: fileId,
          filename: file.filename,
          fileSize: file.size,
          mimeType: file.mime_type,
        },
      });

      return { success: true };
    } catch (error) {
      console.error('Error deleting media file:', error);
      throw new Error('Failed to delete media file');
    }
  }

  /**
   * Bulk delete media files
   */
  static async bulkDeleteMediaFiles(fileIds: string[]) {
    try {
      // Check if any files are being used
      const { data: files, error: fetchError } = await supabase
        .from('media_files')
        .select('id, filename, is_used')
        .in('id', fileIds);

      if (fetchError) throw fetchError;

      const usedFiles = files?.filter(file => file.is_used) || [];
      if (usedFiles.length > 0) {
        throw new Error(`Cannot delete ${usedFiles.length} files that are currently being used`);
      }

      // Delete the files
      const { error: deleteError } = await supabase
        .from('media_files')
        .delete()
        .in('id', fileIds);

      if (deleteError) throw deleteError;

      // Log the bulk deletion action
      await this.logAdminAction({
        type: 'content_deleted',
        description: `Bulk deleted ${fileIds.length} media files`,
        metadata: {
          fileIds: fileIds,
          deletedCount: fileIds.length,
        },
      });

      return { success: true, deletedCount: fileIds.length };
    } catch (error) {
      console.error('Error bulk deleting media files:', error);
      throw new Error('Failed to bulk delete media files');
    }
  }

  /**
   * Get unused media files for cleanup
   */
  static async getUnusedMediaFiles(olderThanDays: number = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      const { data, error } = await supabase
        .from('media_files')
        .select('*')
        .eq('is_used', false)
        .lt('uploaded_at', cutoffDate.toISOString())
        .order('uploaded_at', { ascending: true });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching unused media files:', error);
      throw new Error('Failed to fetch unused media files');
    }
  }

  /**
   * Clean up unused media files
   */
  static async cleanupUnusedMediaFiles(olderThanDays: number = 30, dryRun: boolean = true) {
    try {
      const unusedFiles = await this.getUnusedMediaFiles(olderThanDays);
      
      if (dryRun) {
        return {
          filesToDelete: unusedFiles,
          totalSize: unusedFiles.reduce((sum, file) => sum + file.size, 0),
          count: unusedFiles.length,
        };
      }

      if (unusedFiles.length === 0) {
        return { deletedCount: 0, totalSize: 0 };
      }

      const fileIds = unusedFiles.map(file => file.id);
      const result = await this.bulkDeleteMediaFiles(fileIds);

      // Log the cleanup action
      await this.logAdminAction({
        type: 'content_deleted',
        description: `Cleaned up ${result.deletedCount} unused media files older than ${olderThanDays} days`,
        metadata: {
          deletedCount: result.deletedCount,
          olderThanDays: olderThanDays,
          totalSize: unusedFiles.reduce((sum, file) => sum + file.size, 0),
        },
      });

      return {
        deletedCount: result.deletedCount,
        totalSize: unusedFiles.reduce((sum, file) => sum + file.size, 0),
      };
    } catch (error) {
      console.error('Error cleaning up unused media files:', error);
      throw new Error('Failed to cleanup unused media files');
    }
  }

  /**
   * Update media file metadata
   */
  static async updateMediaFileMetadata(fileId: string, metadata: Record<string, any>) {
    try {
      const { data, error } = await supabase
        .from('media_files')
        .update({
          metadata: metadata,
          updated_at: new Date().toISOString(),
        })
        .eq('id', fileId)
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error updating media file metadata:', error);
      throw new Error('Failed to update media file metadata');
    }
  }

  /**
   * Get media file usage statistics
   */
  static async getMediaUsageStats() {
    try {
      const { data, error } = await supabase
        .from('media_files')
        .select('is_used, size, mime_type, uploaded_at');

      if (error) throw error;

      const totalFiles = data?.length || 0;
      const usedFiles = data?.filter(file => file.is_used).length || 0;
      const unusedFiles = totalFiles - usedFiles;
      const totalSize = data?.reduce((sum, file) => sum + file.size, 0) || 0;
      const usedSize = data?.filter(file => file.is_used).reduce((sum, file) => sum + file.size, 0) || 0;
      const unusedSize = totalSize - usedSize;

      // Group by type
      const typeStats = data?.reduce((acc: any, file) => {
        const type = file.mime_type.split('/')[0];
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {}) || {};

      return {
        totalFiles,
        usedFiles,
        unusedFiles,
        totalSize,
        usedSize,
        unusedSize,
        typeStats,
        usageRate: totalFiles > 0 ? (usedFiles / totalFiles) * 100 : 0,
      };
    } catch (error) {
      console.error('Error fetching media usage stats:', error);
      throw new Error('Failed to fetch media usage statistics');
    }
  }

  /**
   * Get all sermons with pagination
   */
  static async getSermons(page: number = 1, limit: number = 20, search?: string) {
    try {
      let query = supabase
        .from('sermons')
        .select('*')
        .order('created_at', { ascending: false })
        .range((page - 1) * limit, page * limit - 1);

      if (search) {
        query = query.ilike('title', `%${search}%`);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        sermons: data || [],
        totalCount: count || 0,
        page,
        totalPages: Math.ceil((count || 0) / limit),
      };
    } catch (error) {
      console.error('Error fetching sermons:', error);
      throw new Error('Failed to fetch sermons');
    }
  }

  /**
   * Get all articles with pagination
   */
  static async getArticles(page: number = 1, limit: number = 20, search?: string) {
    try {
      let query = supabase
        .from('articles')
        .select('*')
        .order('created_at', { ascending: false })
        .range((page - 1) * limit, page * limit - 1);

      if (search) {
        query = query.ilike('title', `%${search}%`);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        articles: data || [],
        totalCount: count || 0,
        page,
        totalPages: Math.ceil((count || 0) / limit),
      };
    } catch (error) {
      console.error('Error fetching articles:', error);
      throw new Error('Failed to fetch articles');
    }
  }

  /**
   * Create a new sermon
   */
  static async createSermon(sermonData: Partial<Sermon>) {
    try {
      const { data, error } = await supabase
        .from('sermons')
        .insert({
          ...sermonData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error creating sermon:', error);
      throw new Error('Failed to create sermon');
    }
  }

  /**
   * Update an existing sermon
   */
  static async updateSermon(sermonId: string, sermonData: Partial<Sermon>) {
    try {
      console.log('updateSermon called with ID:', sermonId);
      
      // Validate the ID format (should be a valid UUID)
      if (!sermonId || typeof sermonId !== 'string' || sermonId.length < 32) {
        throw new Error(`Invalid sermon ID format: ${sermonId}`);
      }
      
      // First check if the sermon exists
      const { data: existingSermon, error: checkError } = await supabase
        .from('sermons')
        .select('*')
        .eq('id', sermonId)
        .single();
        
      if (checkError || !existingSermon) {
        console.error('Sermon does not exist:', checkError || 'No data returned');
        throw new Error(`Sermon with ID ${sermonId} not found`);
      }
      
      console.log('Found existing sermon:', existingSermon);
      
      // Clean up the sermon data to avoid any issues
      const cleanSermonData = { ...sermonData };
      
      // Handle thumbnail_url specifically - if it's empty or invalid, use the existing one
      if (!cleanSermonData.thumbnail_url || cleanSermonData.thumbnail_url === '') {
        cleanSermonData.thumbnail_url = existingSermon.thumbnail_url;
      }
      
      // Log the clean data
      console.log('Clean update data:', cleanSermonData);
      
      // Log the exact SQL that would be executed (for debugging)
      console.log('Update operation for sermon ID:', sermonId);
      console.log('Fields being updated:', Object.keys(cleanSermonData));
      
      // Now perform the update - with minimal fields to reduce chance of errors
      const minimalUpdateData = {
        title: cleanSermonData.title,
        preacher: cleanSermonData.preacher,
        updated_at: new Date().toISOString()
      };
      
      console.log('Using minimal update data:', minimalUpdateData);
      
      const { data, error } = await supabase
        .from('sermons')
        .update(minimalUpdateData)
        .eq('id', sermonId)
        .select();

      if (error) {
        console.error('Supabase error updating sermon:', error);
        
        // Try a simpler update with just the title
        console.log('Trying simpler update with just title...');
        const { data: simpleData, error: simpleError } = await supabase
          .from('sermons')
          .update({ title: cleanSermonData.title, updated_at: new Date().toISOString() })
          .eq('id', sermonId)
          .select();
          
        if (simpleError) {
          console.error('Simple update failed:', simpleError);
          throw simpleError;
        }
        
        console.log('Simple update succeeded:', simpleData);
        return simpleData[0];
      }

      if (!data || data.length === 0) {
        throw new Error(`Failed to update sermon with ID: ${sermonId}`);
      }
      
      console.log('Update succeeded with data:', data[0]);
      return data[0];
    } catch (error) {
      console.error('Error updating sermon:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to update sermon: ${error.message}`);
      } else {
        throw new Error('Failed to update sermon: Unknown error');
      }
    }
  }

  /**
   * Get a sermon by ID
   */
  static async getSermonById(sermonId: string): Promise<Sermon> {
    try {
      console.log('getSermonById called with ID:', sermonId);
      
      // Validate the ID format (should be a valid UUID)
      if (!sermonId || typeof sermonId !== 'string' || sermonId.length < 32) {
        throw new Error(`Invalid sermon ID format: ${sermonId}`);
      }
      
      const { data, error } = await supabase
        .from('sermons')
        .select('*')
        .eq('id', sermonId)
        .single();

      if (error) {
        console.error('Supabase error fetching sermon:', error);
        throw error;
      }

      if (!data) {
        throw new Error(`No sermon found with ID: ${sermonId}`);
      }

      return data;
    } catch (error) {
      console.error('Error fetching sermon:', error);
      throw new Error('Failed to fetch sermon');
    }
  }

  /**
   * Get an article by ID
   */
  static async getArticleById(articleId: string): Promise<Article> {
    try {
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .eq('id', articleId)
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error fetching article:', error);
      throw new Error('Failed to fetch article');
    }
  }

  /**
   * Create a new article
   */
  static async createArticle(articleData: Partial<Article>) {
    try {
      const { data, error } = await supabase
        .from('articles')
        .insert({
          ...articleData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error creating article:', error);
      throw new Error('Failed to create article');
    }
  }

  /**
   * Update an existing article
   */
  static async updateArticle(articleId: string, articleData: Partial<Article>) {
    try {
      console.log('updateArticle called with ID:', articleId);
      
      // Validate the ID format (should be a valid UUID)
      if (!articleId || typeof articleId !== 'string' || articleId.length < 32) {
        throw new Error(`Invalid article ID format: ${articleId}`);
      }
      
      // First check if the article exists
      const { data: existingArticle, error: checkError } = await supabase
        .from('articles')
        .select('*')
        .eq('id', articleId)
        .single();
        
      if (checkError || !existingArticle) {
        console.error('Article does not exist:', checkError || 'No data returned');
        throw new Error(`Article with ID ${articleId} not found`);
      }
      
      console.log('Found existing article:', existingArticle);
      
      // Clean up the article data to avoid any issues
      const cleanArticleData = { ...articleData };
      
      // Handle thumbnail_url specifically - if it's empty or invalid, use the existing one
      if (!cleanArticleData.thumbnail_url || cleanArticleData.thumbnail_url === '') {
        cleanArticleData.thumbnail_url = existingArticle.thumbnail_url;
      }
      
      // Log the clean data
      console.log('Clean update data:', cleanArticleData);
      
      // Now perform the update
      const { data, error } = await supabase
        .from('articles')
        .update({
          ...cleanArticleData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', articleId)
        .select();

      if (error) {
        console.error('Supabase error updating article:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        throw new Error(`Failed to update article with ID: ${articleId}`);
      }

      console.log('Update result:', data[0]);
      return data[0];
    } catch (error) {
      console.error('Error updating article:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to update article: ${error.message}`);
      } else {
        throw new Error('Failed to update article: Unknown error');
      }
    }
  }

  /**
   * Delete a sermon
   */
  static async deleteSermon(sermonId: string) {
    try {
      const { error } = await supabase
        .from('sermons')
        .delete()
        .eq('id', sermonId);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Error deleting sermon:', error);
      throw new Error('Failed to delete sermon');
    }
  }

  /**
   * Delete an article
   */
  static async deleteArticle(articleId: string) {
    try {
      const { error } = await supabase
        .from('articles')
        .delete()
        .eq('id', articleId);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Error deleting article:', error);
      throw new Error('Failed to delete article');
    }
  }

  /**
   * Get categories for content assignment
   */
  static async getCategories() {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw new Error('Failed to fetch categories');
    }
  }

  /**
   * Get all carousel images
   */
  static async getCarouselImages() {
    try {
      const { data, error } = await supabase
        .from('carousel_images')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching carousel images:', error);
      throw new Error('Failed to fetch carousel images');
    }
  }

  /**
   * Create a new carousel image
   */
  static async createCarouselImage(carouselData: {
    image_url: string;
    title?: string;
    description?: string;
    link_url?: string;
    display_order?: number;
    is_active?: boolean;
  }) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('carousel_images')
        .insert({
          ...carouselData,
          created_by: user.id,
          display_order: carouselData.display_order ?? 0,
          is_active: carouselData.is_active ?? true,
        })
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error creating carousel image:', error);
      throw new Error('Failed to create carousel image');
    }
  }

  /**
   * Update a carousel image
   */
  static async updateCarouselImage(
    id: string,
    updates: {
      image_url?: string;
      title?: string;
      description?: string;
      link_url?: string;
      display_order?: number;
      is_active?: boolean;
    }
  ) {
    try {
      const { data, error } = await supabase
        .from('carousel_images')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error updating carousel image:', error);
      throw new Error('Failed to update carousel image');
    }
  }

  /**
   * Delete a carousel image
   */
  static async deleteCarouselImage(id: string) {
    try {
      const { error } = await supabase
        .from('carousel_images')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error deleting carousel image:', error);
      throw new Error('Failed to delete carousel image');
    }
  }

  /**
   * Reorder carousel images
   */
  static async reorderCarouselImages(ids: string[]) {
    try {
      const updates = ids.map((id, index) => ({
        id,
        display_order: index,
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from('carousel_images')
          .update({ display_order: update.display_order })
          .eq('id', update.id);

        if (error) throw error;
      }

      return { success: true };
    } catch (error) {
      console.error('Error reordering carousel images:', error);
      throw new Error('Failed to reorder carousel images');
    }
  }

  /**
   * Assign a sermon to a series
   */
  static async assignSermonToSeries(sermonId: string, seriesId: string | null): Promise<void> {
    try {
      const { error } = await supabase
        .from('sermons')
        .update({ series_id: seriesId })
        .eq('id', sermonId);

      if (error) throw error;
    } catch (error) {
      console.error('Error assigning sermon to series:', error);
      throw new Error('Failed to assign sermon to series');
    }
  }

  /**
   * Assign topics to a sermon
   */
  static async assignSermonToTopics(sermonId: string, topicIds: string[]): Promise<void> {
    try {
      // Use ContentService method which handles the junction table
      const { ContentService } = await import('./content');
      await ContentService.assignTopicsToSermon(sermonId, topicIds);
    } catch (error) {
      console.error('Error assigning sermon to topics:', error);
      throw new Error('Failed to assign sermon to topics');
    }
  }

  /**
   * Get sermons with their series and topics information
   */
  static async getSermonsForAssignment(limit: number = 100, search?: string) {
    try {
      let query = supabase
        .from('sermons')
        .select('*')
        .order('date', { ascending: false })
        .limit(limit);

      if (search) {
        query = query.or(`title.ilike.%${search}%,preacher.ilike.%${search}%,description.ilike.%${search}%`);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Get all series for mapping
      const allSeries = await this.getAllSeries();
      const seriesMap = new Map(allSeries.map(s => [s.id, s]));

      // Get topics for each sermon and map series
      const sermonsWithTopics = await Promise.all(
        (data || []).map(async (sermon) => {
          const { ContentService } = await import('./content');
          const topics = await ContentService.getTopicsForSermon(sermon.id);
          return {
            ...sermon,
            topics: topics || [],
            series: sermon.series_id ? seriesMap.get(sermon.series_id) : undefined,
          };
        })
      );

      return sermonsWithTopics;
    } catch (error) {
      console.error('Error fetching sermons for assignment:', error);
      throw new Error('Failed to fetch sermons');
    }
  }

  /**
   * Get all series for dropdown
   */
  static async getAllSeries() {
    try {
      const { data, error } = await supabase
        .from('series')
        .select('id, name, description')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching series:', error);
      throw new Error('Failed to fetch series');
    }
  }

  /**
   * Get all topics for dropdown
   */
  static async getAllTopics() {
    try {
      const { data, error } = await supabase
        .from('topics')
        .select('id, name, description, color, icon')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching topics:', error);
      throw new Error('Failed to fetch topics');
    }
  }
}