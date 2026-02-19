import { useState, useEffect, useCallback } from 'react';
import { ContentService } from '../supabase/content';
import { useAuth } from '../auth/AuthContext';
import { Sermon, Article } from '../../types/content';

interface SavedContentItem {
  content: Sermon | Article;
  savedAt: string;
}

interface UseSavedContentReturn {
  savedContent: SavedContentItem[];
  isLoading: boolean;
  error: string | null;
  isContentSaved: (contentType: 'sermon' | 'article', contentId: string) => boolean;
  saveContent: (contentType: 'sermon' | 'article', contentId: string) => Promise<void>;
  unsaveContent: (contentType: 'sermon' | 'article', contentId: string) => Promise<void>;
  toggleSave: (contentType: 'sermon' | 'article', contentId: string) => Promise<void>;
  refreshSavedContent: () => Promise<void>;
}

export function useSavedContent(): UseSavedContentReturn {
  const { user } = useAuth();
  const [savedContent, setSavedContent] = useState<SavedContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedContentIds, setSavedContentIds] = useState<Set<string>>(new Set());

  // Load saved content on mount and when user changes
  useEffect(() => {
    if (user?.id) {
      loadSavedContent();
    } else {
      setSavedContent([]);
      setSavedContentIds(new Set());
    }
  }, [user?.id]);

  const loadSavedContent = useCallback(async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      setError(null);
      
      const saved = await ContentService.getSavedContent(user.id);
      setSavedContent(saved);
      
      // Create a set of saved content IDs for quick lookup
      const savedIds = new Set(
        saved.map(item => `${item.content.id}-${'published_at' in item.content ? 'article' : 'sermon'}`)
      );
      setSavedContentIds(savedIds);
    } catch (err) {
      console.error('Failed to load saved content:', err);
      setError(err instanceof Error ? err.message : 'Failed to load saved content');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  const isContentSaved = useCallback((contentType: 'sermon' | 'article', contentId: string): boolean => {
    return savedContentIds.has(`${contentId}-${contentType}`);
  }, [savedContentIds]);

  const saveContent = useCallback(async (contentType: 'sermon' | 'article', contentId: string): Promise<void> => {
    if (!user?.id) {
      throw new Error('User must be logged in to save content');
    }

    try {
      await ContentService.saveContent(user.id, contentType, contentId, 'save');
      
      // Update local state
      setSavedContentIds(prev => new Set([...prev, `${contentId}-${contentType}`]));
      
      // Reload saved content to get the full item with timestamp
      await loadSavedContent();
    } catch (err) {
      console.error('Failed to save content:', err);
      throw err;
    }
  }, [user?.id, loadSavedContent]);

  const unsaveContent = useCallback(async (contentType: 'sermon' | 'article', contentId: string): Promise<void> => {
    if (!user?.id) {
      throw new Error('User must be logged in to unsave content');
    }

    try {
      await ContentService.unsaveContent(user.id, contentType, contentId, 'save');
      
      // Update local state
      setSavedContentIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(`${contentId}-${contentType}`);
        return newSet;
      });
      
      // Remove from saved content list
      setSavedContent(prev => 
        prev.filter(item => 
          !(item.content.id === contentId && 
            ('published_at' in item.content ? 'article' : 'sermon') === contentType)
        )
      );
    } catch (err) {
      console.error('Failed to unsave content:', err);
      throw err;
    }
  }, [user?.id]);

  const toggleSave = useCallback(async (contentType: 'sermon' | 'article', contentId: string): Promise<void> => {
    if (isContentSaved(contentType, contentId)) {
      await unsaveContent(contentType, contentId);
    } else {
      await saveContent(contentType, contentId);
    }
  }, [isContentSaved, saveContent, unsaveContent]);

  const refreshSavedContent = useCallback(async (): Promise<void> => {
    await loadSavedContent();
  }, [loadSavedContent]);

  return {
    savedContent,
    isLoading,
    error,
    isContentSaved,
    saveContent,
    unsaveContent,
    toggleSave,
    refreshSavedContent,
  };
}







