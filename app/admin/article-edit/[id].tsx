import React from 'react';
import { AdminAuthGuard } from '@/components/admin/AdminAuthGuard';
import ArticleEditForm from '@/components/admin/ArticleEditForm';

export default function ArticleEditScreen() {
  return (
    <AdminAuthGuard requiredPermissions={['content.articles.edit']}>
      <ArticleEditForm />
    </AdminAuthGuard>
  );
}
