-- TRUEVINE FELLOWSHIP Church App Database Schema
-- This file contains all the necessary tables, relationships, and indexes

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text search

-- ========================================
-- CORE TABLES
-- ========================================

-- Users table already exists - skipping creation
-- Make sure your existing users table has these columns:
-- id (UUID, PRIMARY KEY, REFERENCES auth.users(id))
-- email (TEXT, UNIQUE, NOT NULL)
-- first_name (TEXT, NOT NULL)
-- last_name (TEXT, NOT NULL)
-- avatar_url (TEXT)
-- role (TEXT, NOT NULL, DEFAULT 'member')
-- is_email_verified (BOOLEAN, DEFAULT FALSE)
-- last_sign_in_at (TIMESTAMPTZ)
-- created_at (TIMESTAMPTZ, DEFAULT NOW())
-- updated_at (TIMESTAMPTZ, DEFAULT NOW())

-- Categories table
CREATE TABLE public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    color TEXT NOT NULL DEFAULT '#1976D2',
    icon TEXT NOT NULL DEFAULT 'folder',
    parent_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tags table
CREATE TABLE public.tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    color TEXT DEFAULT '#666666',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Topics table for sermon topics
CREATE TABLE public.topics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    color TEXT DEFAULT '#FFA726',
    icon TEXT DEFAULT 'tag',
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sermons table
CREATE TABLE public.sermons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    preacher TEXT NOT NULL,
    date DATE NOT NULL,
    duration INTEGER NOT NULL, -- in seconds
    audio_url TEXT NOT NULL,
    thumbnail_url TEXT,
    description TEXT,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    is_featured BOOLEAN DEFAULT FALSE,
    is_published BOOLEAN DEFAULT FALSE,
    downloads INTEGER DEFAULT 0,
    views INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Articles table
CREATE TABLE public.articles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    content TEXT NOT NULL,
    excerpt TEXT,
    thumbnail_url TEXT,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    is_featured BOOLEAN DEFAULT FALSE,
    is_published BOOLEAN DEFAULT FALSE,
    views INTEGER DEFAULT 0,
    published_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- RELATIONSHIP TABLES
-- ========================================

-- Sermon tags relationship
CREATE TABLE public.sermon_tags (
    sermon_id UUID REFERENCES public.sermons(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES public.tags(id) ON DELETE CASCADE,
    PRIMARY KEY (sermon_id, tag_id)
);

-- Sermon topics relationship
CREATE TABLE public.sermon_topics (
    sermon_id UUID REFERENCES public.sermons(id) ON DELETE CASCADE,
    topic_id UUID REFERENCES public.topics(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (sermon_id, topic_id)
);

-- Article tags relationship
CREATE TABLE public.article_tags (
    article_id UUID REFERENCES public.articles(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES public.tags(id) ON DELETE CASCADE,
    PRIMARY KEY (article_id, tag_id)
);

-- Article topics relationship
CREATE TABLE public.article_topics (
    article_id UUID REFERENCES public.articles(id) ON DELETE CASCADE,
    topic_id UUID REFERENCES public.topics(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (article_id, topic_id)
);

-- Article series relationship
-- Note: Unlike sermons which have a direct series_id column,
-- articles use a junction table to support multiple series per article
CREATE TABLE public.article_series (
    article_id UUID REFERENCES public.articles(id) ON DELETE CASCADE,
    series_id UUID REFERENCES public.series(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (article_id, series_id)
);

-- ========================================
-- USER INTERACTION TABLES
-- ========================================

-- User preferences table
CREATE TABLE public.user_preferences (
    user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    theme TEXT DEFAULT 'auto' CHECK (theme IN ('light', 'dark', 'auto')),
    audio_quality TEXT DEFAULT 'medium' CHECK (audio_quality IN ('low', 'medium', 'high')),
    auto_download BOOLEAN DEFAULT FALSE,
    language TEXT DEFAULT 'en',
    notifications_new_content BOOLEAN DEFAULT TRUE,
    notifications_reminders BOOLEAN DEFAULT TRUE,
    notifications_updates BOOLEAN DEFAULT TRUE,
    notifications_marketing BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User content interactions (saves, favorites)
CREATE TABLE public.user_content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    content_type TEXT NOT NULL CHECK (content_type IN ('sermon', 'article')),
    content_id UUID NOT NULL,
    action_type TEXT NOT NULL CHECK (action_type IN ('save', 'favorite', 'like')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, content_type, content_id, action_type)
);

-- User reminders table
CREATE TABLE public.user_reminders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    content_type TEXT NOT NULL CHECK (content_type IN ('sermon', 'article')),
    content_id UUID NOT NULL,
    reminder_time TIMESTAMPTZ NOT NULL,
    message TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User downloads table
CREATE TABLE public.user_downloads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    content_type TEXT NOT NULL CHECK (content_type IN ('sermon', 'article')),
    content_id UUID NOT NULL,
    download_date TIMESTAMPTZ DEFAULT NOW(),
    file_size INTEGER, -- in bytes
    download_path TEXT,
    is_offline BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- ANALYTICS TABLES
-- ========================================

-- Content views tracking
CREATE TABLE public.content_views (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL, -- NULL for anonymous views
    content_type TEXT NOT NULL CHECK (content_type IN ('sermon', 'article')),
    content_id UUID NOT NULL,
    view_date TIMESTAMPTZ DEFAULT NOW(),
    session_id TEXT,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Content downloads tracking
CREATE TABLE public.content_downloads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    content_type TEXT NOT NULL CHECK (content_type IN ('sermon', 'article')),
    content_id UUID NOT NULL,
    download_date TIMESTAMPTZ DEFAULT NOW(),
    file_size INTEGER,
    download_method TEXT DEFAULT 'app', -- 'app', 'web', 'api'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- NOTIFICATION TABLES
-- ========================================

-- Push notification tokens
CREATE TABLE public.push_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    token TEXT NOT NULL,
    platform TEXT NOT NULL CHECK (platform IN ('ios', 'android', 'web')),
    device_id TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notification history
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('new_content', 'reminder', 'update', 'marketing')),
    data JSONB,
    is_read BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- APP INVITATION SYSTEM
-- ========================================

-- App invitations tracking
CREATE TABLE public.app_invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inviter_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    invitee_email TEXT NOT NULL,
    invitation_code TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
    expires_at TIMESTAMPTZ NOT NULL,
    accepted_at TIMESTAMPTZ,
    accepted_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- INDEXES FOR PERFORMANCE
-- ========================================

-- Users indexes already exist - skipping creation
-- Make sure you have these indexes on your users table:
-- idx_users_email on email column
-- idx_users_role on role column

-- Categories indexes
CREATE INDEX idx_categories_parent_id ON public.categories(parent_id);
CREATE INDEX idx_categories_sort_order ON public.categories(sort_order);
CREATE INDEX idx_categories_active ON public.categories(is_active);

-- Tags indexes
CREATE INDEX idx_tags_name ON public.tags(name);

-- Topics indexes
CREATE INDEX idx_topics_name ON public.topics(name);
CREATE INDEX idx_topics_active ON public.topics(is_active);
CREATE INDEX idx_sermon_topics_sermon_id ON public.sermon_topics(sermon_id);
CREATE INDEX idx_sermon_topics_topic_id ON public.sermon_topics(topic_id);
CREATE INDEX idx_article_topics_article_id ON public.article_topics(article_id);
CREATE INDEX idx_article_topics_topic_id ON public.article_topics(topic_id);
CREATE INDEX idx_article_series_article_id ON public.article_series(article_id);
CREATE INDEX idx_article_series_series_id ON public.article_series(series_id);

-- Sermons indexes
CREATE INDEX idx_sermons_category_id ON public.sermons(category_id);
CREATE INDEX idx_sermons_date ON public.sermons(date);
CREATE INDEX idx_sermons_featured ON public.sermons(is_featured);
CREATE INDEX idx_sermons_published ON public.sermons(is_published);
CREATE INDEX idx_sermons_preacher ON public.sermons(preacher);
CREATE INDEX idx_sermons_title_gin ON public.sermons USING gin(to_tsvector('english', title));
CREATE INDEX idx_sermons_description_gin ON public.sermons USING gin(to_tsvector('english', description));

-- Articles indexes
CREATE INDEX idx_articles_category_id ON public.articles(category_id);
CREATE INDEX idx_articles_published_at ON public.articles(published_at);
CREATE INDEX idx_articles_featured ON public.articles(is_featured);
CREATE INDEX idx_articles_published ON public.articles(is_published);
CREATE INDEX idx_articles_author ON public.articles(author);
CREATE INDEX idx_articles_title_gin ON public.articles USING gin(to_tsvector('english', title));
CREATE INDEX idx_articles_content_gin ON public.articles USING gin(to_tsvector('english', content));

-- User content indexes
CREATE INDEX idx_user_content_user_id ON public.user_content(user_id);
CREATE INDEX idx_user_content_content ON public.user_content(content_type, content_id);
CREATE INDEX idx_user_content_action ON public.user_content(action_type);

-- User reminders indexes
CREATE INDEX idx_user_reminders_user_id ON public.user_reminders(user_id);
CREATE INDEX idx_user_reminders_time ON public.user_reminders(reminder_time);
CREATE INDEX idx_user_reminders_active ON public.user_reminders(is_active);

-- User downloads indexes
CREATE INDEX idx_user_downloads_user_id ON public.user_downloads(user_id);
CREATE INDEX idx_user_downloads_content ON public.user_downloads(content_type, content_id);
CREATE INDEX idx_user_downloads_date ON public.user_downloads(download_date);

-- Content views indexes
CREATE INDEX idx_content_views_content ON public.content_views(content_type, content_id);
CREATE INDEX idx_content_views_date ON public.content_views(view_date);
CREATE INDEX idx_content_views_user ON public.content_views(user_id);

-- Content downloads indexes
CREATE INDEX idx_content_downloads_content ON public.content_downloads(content_type, content_id);
CREATE INDEX idx_content_downloads_date ON public.content_downloads(download_date);
CREATE INDEX idx_content_downloads_user ON public.content_downloads(user_id);

-- Push tokens indexes
CREATE INDEX idx_push_tokens_user_id ON public.push_tokens(user_id);
CREATE INDEX idx_push_tokens_platform ON public.push_tokens(platform);
CREATE INDEX idx_push_tokens_active ON public.push_tokens(is_active);

-- Notifications indexes
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_type ON public.notifications(type);
CREATE INDEX idx_notifications_read ON public.notifications(is_read);
CREATE INDEX idx_notifications_sent ON public.notifications(sent_at);

-- App invitations indexes
CREATE INDEX idx_app_invitations_inviter ON public.app_invitations(inviter_id);
CREATE INDEX idx_app_invitations_code ON public.app_invitations(invitation_code);
CREATE INDEX idx_app_invitations_status ON public.app_invitations(status);
CREATE INDEX idx_app_invitations_expires ON public.app_invitations(expires_at);

-- ========================================
-- TRIGGERS FOR UPDATED_AT
-- ========================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to tables with updated_at (users table trigger already exists)
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tags_updated_at BEFORE UPDATE ON public.tags FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Topics triggers
CREATE TRIGGER update_topics_updated_at BEFORE UPDATE ON public.topics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sermons_updated_at BEFORE UPDATE ON public.sermons FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_articles_updated_at BEFORE UPDATE ON public.articles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON public.user_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_reminders_updated_at BEFORE UPDATE ON public.user_reminders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_push_tokens_updated_at BEFORE UPDATE ON public.push_tokens FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_app_invitations_updated_at BEFORE UPDATE ON public.app_invitations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ========================================

-- Enable RLS on all tables (users table already has RLS enabled)
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;

-- Enable RLS for topics tables
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sermon_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.article_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.article_series ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sermons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_invitations ENABLE ROW LEVEL SECURITY;

-- Public read access to published content
CREATE POLICY "Public read access to published sermons" ON public.sermons
    FOR SELECT USING (is_published = true);

CREATE POLICY "Public read access to published articles" ON public.articles
    FOR SELECT USING (is_published = true);

CREATE POLICY "Public read access to categories" ON public.categories
    FOR SELECT USING (is_active = true);

CREATE POLICY "Public read access to tags" ON public.tags
    FOR SELECT USING (true);

-- Topics policies
CREATE POLICY "Public read access to topics" ON public.topics
    FOR SELECT USING (is_active = true);

CREATE POLICY "Public read access to sermon topics" ON public.sermon_topics
    FOR SELECT USING (true);

CREATE POLICY "Public read access to article topics" ON public.article_topics
    FOR SELECT USING (true);

CREATE POLICY "Public read access to article series" ON public.article_series
    FOR SELECT USING (true);

-- Authenticated user access to their own data (users table policies already exist)
-- Make sure you have these policies on your users table:
-- "Users can view own profile" - SELECT policy with auth.uid() = id
-- "Users can update own profile" - UPDATE policy with auth.uid() = id

CREATE POLICY "Users can view own preferences" ON public.user_preferences
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own content interactions" ON public.user_content
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own reminders" ON public.user_reminders
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own downloads" ON public.user_downloads
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own push tokens" ON public.push_tokens
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own notifications" ON public.notifications
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own invitations" ON public.app_invitations
    FOR ALL USING (auth.uid() = inviter_id);

-- Admin access policies (users table policies already exist)
-- Make sure you have this policy on your users table:
-- "Admins can view all users" - SELECT policy for admin role

CREATE POLICY "Admins can manage all content" ON public.sermons
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can manage all content" ON public.articles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can manage article topics" ON public.article_topics
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can manage article series" ON public.article_series
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ========================================
-- FUNCTIONS FOR COMMON OPERATIONS
-- ========================================

-- Function to increment content views
CREATE OR REPLACE FUNCTION increment_content_views(
    p_content_type TEXT,
    p_content_id UUID,
    p_user_id UUID DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    -- Insert view record
    INSERT INTO public.content_views (user_id, content_type, content_id)
    VALUES (p_user_id, p_content_type, p_content_id);
    
    -- Update content view count
    IF p_content_type = 'sermon' THEN
        UPDATE public.sermons SET views = views + 1 WHERE id = p_content_id;
    ELSIF p_content_type = 'article' THEN
        UPDATE public.articles SET views = views + 1 WHERE id = p_content_id;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to increment content downloads
CREATE OR REPLACE FUNCTION increment_content_downloads(
    p_content_type TEXT,
    p_content_id UUID,
    p_user_id UUID DEFAULT NULL,
    p_file_size INTEGER DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    -- Insert download record
    INSERT INTO public.content_downloads (user_id, content_type, content_id, file_size)
    VALUES (p_user_id, p_content_type, p_content_id, p_file_size);
    
    -- Update content download count
    IF p_content_type = 'sermon' THEN
        UPDATE public.sermons SET downloads = downloads + 1 WHERE id = p_content_id;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to search content
CREATE OR REPLACE FUNCTION search_content(
    p_query TEXT,
    p_content_type TEXT DEFAULT NULL,
    p_category_id UUID DEFAULT NULL,
    p_limit INTEGER DEFAULT 20,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE(
    id UUID,
    title TEXT,
    content_type TEXT,
    excerpt TEXT,
    relevance REAL,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id,
        s.title,
        'sermon'::TEXT as content_type,
        s.description as excerpt,
        ts_rank(to_tsvector('english', s.title || ' ' || COALESCE(s.description, '')), plainto_tsquery('english', p_query)) as relevance,
        s.created_at
    FROM public.sermons s
    WHERE s.is_published = true
        AND (p_content_type IS NULL OR p_content_type = 'sermon')
        AND (p_category_id IS NULL OR s.category_id = p_category_id)
        AND to_tsvector('english', s.title || ' ' || COALESCE(s.description, '')) @@ plainto_tsquery('english', p_query)
    
    UNION ALL
    
    SELECT 
        a.id,
        a.title,
        'article'::TEXT as content_type,
        a.excerpt,
        ts_rank(to_tsvector('english', a.title || ' ' || COALESCE(a.excerpt, '') || ' ' || a.content), plainto_tsquery('english', p_query)) as relevance,
        a.created_at
    FROM public.articles a
    WHERE a.is_published = true
        AND (p_content_type IS NULL OR p_content_type = 'article')
        AND (p_category_id IS NULL OR a.category_id = p_category_id)
        AND to_tsvector('english', a.title || ' ' || COALESCE(a.excerpt, '') || ' ' || a.content) @@ plainto_tsquery('english', p_query)
    
    ORDER BY relevance DESC, created_at DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- INITIAL DATA
-- ========================================

-- Insert default categories
INSERT INTO public.categories (name, description, color, icon, sort_order) VALUES
('Series', 'Sermon series and multi-part teachings', '#1976D2', 'book-series', 1),
('Topics', 'Sermons organized by specific topics and themes', '#388E3C', 'tag-multiple', 2),
('Articles', 'Spiritual articles and devotionals', '#F57C00', 'book-open', 3),
('Announcements', 'Church announcements and updates', '#7B1FA2', 'bullhorn', 4),
('Events', 'Church events and activities', '#D32F2F', 'calendar', 5),
('Ministries', 'Information about church ministries', '#FF6F00', 'account-group', 6);

-- Insert default tags
INSERT INTO public.tags (name, description, color) VALUES
('Faith', 'Topics related to faith and belief', '#1976D2'),
('Family', 'Family and relationships', '#388E3C'),
('Prayer', 'Prayer and spiritual practices', '#F57C00'),
('Bible Study', 'Biblical teachings and study', '#7B1FA2'),
('Worship', 'Worship and praise', '#D32F2F'),
('Community', 'Community and fellowship', '#FF6F00'),
('Leadership', 'Leadership and service', '#8E24AA'),
('Youth', 'Youth ministry and topics', '#43A047');

-- Insert default topics
INSERT INTO public.topics (name, description, color, icon, sort_order) VALUES
('Love', 'Sermons about love, compassion, and relationships', '#E91E63', 'heart', 1),
('Faith', 'Sermons about faith, trust, and belief', '#9C27B0', 'cross', 2),
('Hope', 'Sermons about hope, encouragement, and future', '#3F51B5', 'lightbulb', 3),
('Grace', 'Sermons about God''s grace and mercy', '#2196F3', 'gift', 4),
('Prayer', 'Sermons about prayer and communication with God', '#00BCD4', 'pray', 5),
('Worship', 'Sermons about worship and praise', '#4CAF50', 'music', 6),
('Forgiveness', 'Sermons about forgiveness and reconciliation', '#8BC34A', 'handshake', 7),
('Salvation', 'Sermons about salvation and eternal life', '#CDDC39', 'star', 8),
('Healing', 'Sermons about healing and restoration', '#FFEB3B', 'medical-bag', 9),
('Wisdom', 'Sermons about wisdom and understanding', '#FFC107', 'book-open', 10);

-- ========================================
-- COMMENTS
-- ========================================

COMMENT ON TABLE public.categories IS 'Content categorization system';
COMMENT ON TABLE public.tags IS 'Content tagging system';
COMMENT ON TABLE public.sermons IS 'Sermon recordings and metadata';
COMMENT ON TABLE public.articles IS 'Spiritual articles and content';
COMMENT ON TABLE public.user_preferences IS 'User app preferences and settings';
COMMENT ON TABLE public.user_content IS 'User interactions with content (saves, favorites)';
COMMENT ON TABLE public.user_reminders IS 'User-scheduled content reminders';
COMMENT ON TABLE public.user_downloads IS 'Offline content management';
COMMENT ON TABLE public.content_views IS 'Content view analytics';
COMMENT ON TABLE public.content_downloads IS 'Content download analytics';
COMMENT ON TABLE public.push_tokens IS 'Push notification device tokens';
COMMENT ON TABLE public.notifications IS 'Notification history and tracking';
COMMENT ON TABLE public.app_invitations IS 'App invitation system tracking';
