-- Create article_topics and article_series junction tables
-- This migration adds support for organizing articles by series and topics

-- Article topics relationship (many-to-many)
CREATE TABLE IF NOT EXISTS public.article_topics (
    article_id UUID REFERENCES public.articles(id) ON DELETE CASCADE,
    topic_id UUID REFERENCES public.topics(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (article_id, topic_id)
);

-- Article series relationship (many-to-many)
-- Note: Unlike sermons which have a direct series_id column,
-- articles use a junction table to support multiple series per article
CREATE TABLE IF NOT EXISTS public.article_series (
    article_id UUID REFERENCES public.articles(id) ON DELETE CASCADE,
    series_id UUID REFERENCES public.series(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (article_id, series_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_article_topics_article_id ON public.article_topics(article_id);
CREATE INDEX IF NOT EXISTS idx_article_topics_topic_id ON public.article_topics(topic_id);
CREATE INDEX IF NOT EXISTS idx_article_series_article_id ON public.article_series(article_id);
CREATE INDEX IF NOT EXISTS idx_article_series_series_id ON public.article_series(series_id);

-- Enable RLS
ALTER TABLE public.article_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.article_series ENABLE ROW LEVEL SECURITY;

-- Public read access policies
CREATE POLICY "Public read access to article topics" ON public.article_topics
    FOR SELECT USING (true);

CREATE POLICY "Public read access to article series" ON public.article_series
    FOR SELECT USING (true);

-- Admin access policies
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

