import React from 'react';
import { AdminAuthGuard } from '@/components/admin/AdminAuthGuard';
import TopicEditForm from '@/components/admin/TopicEditForm';

export default function TopicEditScreen() {
  return (
    <AdminAuthGuard requiredPermissions={['topics.manage']}>
      <TopicEditForm />
    </AdminAuthGuard>
  );
}
