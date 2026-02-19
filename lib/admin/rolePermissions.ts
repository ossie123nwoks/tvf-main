import { AdminRole, AdminPermission } from '@/types/admin';

// Define all available permissions
export const ADMIN_PERMISSIONS: Record<string, AdminPermission> = {
  // Content Management Permissions
  'content.sermons.create': {
    id: 'content.sermons.create',
    name: 'Create Sermons',
    description: 'Create new sermon content',
    resource: 'sermons',
    action: 'create'
  },
  'content.sermons.edit': {
    id: 'content.sermons.edit',
    name: 'Edit Sermons',
    description: 'Edit existing sermon content',
    resource: 'sermons',
    action: 'update'
  },
  'content.sermons.delete': {
    id: 'content.sermons.delete',
    name: 'Delete Sermons',
    description: 'Delete sermon content',
    resource: 'sermons',
    action: 'delete'
  },
  'content.articles.create': {
    id: 'content.articles.create',
    name: 'Create Articles',
    description: 'Create new article content',
    resource: 'articles',
    action: 'create'
  },
  'content.articles.edit': {
    id: 'content.articles.edit',
    name: 'Edit Articles',
    description: 'Edit existing article content',
    resource: 'articles',
    action: 'update'
  },
  'content.articles.delete': {
    id: 'content.articles.delete',
    name: 'Delete Articles',
    description: 'Delete article content',
    resource: 'articles',
    action: 'delete'
  },
  
  // Topic & Series Management
  'topics.create': {
    id: 'topics.create',
    name: 'Create Topics',
    description: 'Create new content topics',
    resource: 'topics',
    action: 'create'
  },
  'topics.manage': {
    id: 'topics.manage',
    name: 'Manage Topics',
    description: 'Edit and delete topics',
    resource: 'topics',
    action: 'manage'
  },
  'series.create': {
    id: 'series.create',
    name: 'Create Series',
    description: 'Create new content series',
    resource: 'series',
    action: 'create'
  },
  'series.manage': {
    id: 'series.manage',
    name: 'Manage Series',
    description: 'Edit and delete series',
    resource: 'series',
    action: 'manage'
  },
  
  // User Management
  'users.view': {
    id: 'users.view',
    name: 'View Users',
    description: 'View user list and details',
    resource: 'users',
    action: 'read'
  },
  'users.manage_roles': {
    id: 'users.manage_roles',
    name: 'Manage User Roles',
    description: 'Assign and modify user roles',
    resource: 'users',
    action: 'manage_roles'
  },
  'users.send_notifications': {
    id: 'users.send_notifications',
    name: 'Send Notifications',
    description: 'Send notifications to users',
    resource: 'users',
    action: 'notify'
  },
  'notifications.manage': {
    id: 'notifications.manage',
    name: 'Manage Notifications',
    description: 'Create and manage notifications',
    resource: 'notifications',
    action: 'manage'
  },
  
  // Media Management
  'media.upload': {
    id: 'media.upload',
    name: 'Upload Media',
    description: 'Upload media files',
    resource: 'media',
    action: 'create'
  },
  'media.manage': {
    id: 'media.manage',
    name: 'Manage Media',
    description: 'Delete and organize media files',
    resource: 'media',
    action: 'manage'
  },
  
  // Analytics & Reports
  'analytics.view': {
    id: 'analytics.view',
    name: 'View Analytics',
    description: 'View user engagement analytics',
    resource: 'analytics',
    action: 'read'
  }
};

// Define role-based permissions
export const ROLE_PERMISSIONS: Record<AdminRole, string[]> = {
  super_admin: [
    // Full access to everything
    'content.sermons.create',
    'content.sermons.edit',
    'content.sermons.delete',
    'content.articles.create',
    'content.articles.edit',
    'content.articles.delete',
    'topics.create',
    'topics.manage',
    'series.create',
    'series.manage',
    'users.view',
    'users.manage_roles',
    'users.send_notifications',
    'notifications.manage',
    'media.upload',
    'media.manage',
    'analytics.view'
  ],
  content_manager: [
    // Content creation and management
    'content.sermons.create',
    'content.sermons.edit',
    'content.sermons.delete',
    'content.articles.create',
    'content.articles.edit',
    'content.articles.delete',
    'topics.create',
    'topics.manage',
    'series.create',
    'series.manage',
    'media.upload',
    'media.manage',
    'analytics.view'
  ],
  moderator: [
    // Limited content management and user communication
    'content.sermons.edit',
    'content.articles.edit',
    'users.view',
    'users.send_notifications',
    'notifications.manage',
    'analytics.view'
  ]
};

/**
 * Check if a user with a specific role has a particular permission
 */
export function hasPermission(role: AdminRole, permissionId: string): boolean {
  const rolePermissions = ROLE_PERMISSIONS[role] || [];
  return rolePermissions.includes(permissionId);
}

/**
 * Get all permissions for a specific role
 */
export function getRolePermissions(role: AdminRole): AdminPermission[] {
  const permissionIds = ROLE_PERMISSIONS[role] || [];
  return permissionIds.map(id => ADMIN_PERMISSIONS[id]).filter(Boolean);
}

/**
 * Check if a user can access a specific admin section
 */
export function canAccessSection(role: AdminRole, requiredPermissions: string[]): boolean {
  return requiredPermissions.every(permission => hasPermission(role, permission));
}

/**
 * Get dashboard sections available to a specific role
 */
export function getAvailableSections(role: AdminRole) {
  const sections = [
    {
      id: 'overview',
      title: 'Overview',
      description: 'System overview and statistics',
      icon: 'dashboard',
      permissions: ['analytics.view'],
      isExpanded: false
    },
    {
      id: 'content',
      title: 'Content Management',
      description: 'Manage sermons and articles',
      icon: 'description',
      permissions: ['content.sermons.create', 'content.articles.create'],
      isExpanded: false
    },
    {
      id: 'topics-series',
      title: 'Topics & Series',
      description: 'Organize content with topics and series',
      icon: 'label',
      permissions: ['topics.create', 'series.create'],
      isExpanded: false
    },
    {
      id: 'users',
      title: 'User Management',
      description: 'Manage users and their roles',
      icon: 'people',
      permissions: ['users.view'],
      isExpanded: false
    },
    {
      id: 'analytics',
      title: 'Analytics',
      description: 'View user engagement and content performance',
      icon: 'trending-up',
      permissions: ['analytics.view'],
      isExpanded: false
    },
    {
      id: 'notifications',
      title: 'Notifications',
      description: 'Send and manage user notifications',
      icon: 'notifications',
      permissions: ['notifications.manage'],
      isExpanded: false
    },
    {
      id: 'carousel',
      title: 'Carousel Management',
      description: 'Manage dashboard carousel images',
      icon: 'image',
      permissions: ['content.sermons.create'], // Use content permission for now
      isExpanded: false
    }
  ];

  return sections.filter(section => canAccessSection(role, section.permissions));
}
