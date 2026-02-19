import React from 'react';
import { AdminAuthGuard } from '@/components/admin/AdminAuthGuard';
import SeriesEditForm from '@/components/admin/SeriesEditForm';

export default function SeriesEditScreen() {
  return (
    <AdminAuthGuard requiredPermissions={['series.manage']}>
      <SeriesEditForm />
    </AdminAuthGuard>
  );
}
