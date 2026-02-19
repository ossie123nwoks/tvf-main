-- Add stored procedures for direct updates
-- This migration adds functions to help with updating records

-- Function to update sermon basic fields
CREATE OR REPLACE FUNCTION public.update_sermon_basic(
  p_id UUID,
  p_title TEXT,
  p_preacher TEXT
) RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.sermons
  SET 
    title = p_title,
    preacher = p_preacher,
    updated_at = NOW()
  WHERE id = p_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Function to update article basic fields
CREATE OR REPLACE FUNCTION public.update_article_basic(
  p_id UUID,
  p_title TEXT,
  p_author TEXT
) RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.articles
  SET 
    title = p_title,
    author = p_author,
    updated_at = NOW()
  WHERE id = p_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;
