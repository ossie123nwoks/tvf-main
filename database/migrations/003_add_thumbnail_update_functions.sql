-- Add functions specifically for updating thumbnail URLs
-- This migration adds functions to help with updating image URLs separately

-- Function to update sermon thumbnail URL
CREATE OR REPLACE FUNCTION public.update_sermon_thumbnail(
  p_id UUID,
  p_thumbnail_url TEXT
) RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.sermons
  SET 
    thumbnail_url = p_thumbnail_url,
    updated_at = NOW()
  WHERE id = p_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Function to update article thumbnail URL
CREATE OR REPLACE FUNCTION public.update_article_thumbnail(
  p_id UUID,
  p_thumbnail_url TEXT
) RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.articles
  SET 
    thumbnail_url = p_thumbnail_url,
    updated_at = NOW()
  WHERE id = p_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;
