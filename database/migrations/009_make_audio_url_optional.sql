-- Migration to make audio_url optional in the sermons table

ALTER TABLE public.sermons 
ALTER COLUMN audio_url DROP NOT NULL;

COMMENT ON COLUMN public.sermons.audio_url IS 'Optional URL for audio version of the sermon';
