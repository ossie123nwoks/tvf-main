-- Enable RLS on sermons and articles tables
ALTER TABLE public.sermons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;

-- Create policies for sermons
CREATE POLICY "Allow all operations on sermons" ON public.sermons
    FOR ALL USING (true) WITH CHECK (true);

-- Create policies for articles  
CREATE POLICY "Allow all operations on articles" ON public.articles
    FOR ALL USING (true) WITH CHECK (true);

-- Grant necessary permissions
GRANT ALL ON public.sermons TO authenticated;
GRANT ALL ON public.articles TO authenticated;
GRANT ALL ON public.sermons TO anon;
GRANT ALL ON public.articles TO anon;
