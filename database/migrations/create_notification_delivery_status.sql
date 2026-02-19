-- Migration: Create notification_delivery_status table for analytics tracking
-- Run this in your Supabase SQL Editor to enable notification delivery tracking

-- Create notification_delivery_status table
CREATE TABLE IF NOT EXISTS public.notification_delivery_status (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    notification_id UUID NOT NULL REFERENCES public.notifications(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('pending', 'sent', 'delivered', 'opened', 'clicked', 'dismissed', 'failed')),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    error_message TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notification_delivery_status_notification_id 
    ON public.notification_delivery_status(notification_id);
CREATE INDEX IF NOT EXISTS idx_notification_delivery_status_user_id 
    ON public.notification_delivery_status(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_delivery_status_status 
    ON public.notification_delivery_status(status);
CREATE INDEX IF NOT EXISTS idx_notification_delivery_status_timestamp 
    ON public.notification_delivery_status(timestamp);

-- Enable Row Level Security
ALTER TABLE public.notification_delivery_status ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view their own delivery status
CREATE POLICY "Users can view own notification delivery status" 
    ON public.notification_delivery_status
    FOR SELECT 
    USING (auth.uid() = user_id);

-- Service role can insert delivery status (for server-side tracking)
-- Note: This requires service role key, not anon key
-- For client-side tracking, we'll allow users to insert their own records
CREATE POLICY "Users can insert own notification delivery status" 
    ON public.notification_delivery_status
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- Admins can view all delivery statuses
CREATE POLICY "Admins can view all notification delivery status" 
    ON public.notification_delivery_status
    FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Add comment
COMMENT ON TABLE public.notification_delivery_status IS 'Tracks delivery and engagement status of push notifications for analytics';


