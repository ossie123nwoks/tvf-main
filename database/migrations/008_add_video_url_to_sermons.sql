-- Migration to add video_url column to the sermons table

ALTER TABLE public.sermons 
ADD COLUMN IF NOT EXISTS video_url TEXT;

COMMENT ON COLUMN public.sermons.video_url IS 'Optional URL for video version of the sermon (e.g., YouTube link or Supabase storage URL)';
