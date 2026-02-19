import React from 'react';
import { AdminAuthGuard } from '@/components/admin/AdminAuthGuard';
import SermonEditForm from '@/components/admin/SermonEditForm';

export default function SermonEditScreen() {
  return (
    <AdminAuthGuard requiredPermissions={['content.sermons.edit']}>
      <SermonEditForm />
    </AdminAuthGuard>
  );
}
