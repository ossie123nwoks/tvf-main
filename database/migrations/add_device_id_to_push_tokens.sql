-- Migration: Add device_id column to push_tokens table
-- Run this in your Supabase SQL Editor to fix the push notification error

-- Add device_id column to push_tokens table
ALTER TABLE public.push_tokens 
ADD COLUMN IF NOT EXISTS device_id TEXT;

-- Add comment to document the column
COMMENT ON COLUMN public.push_tokens.device_id IS 'Device identifier for push notification targeting';







