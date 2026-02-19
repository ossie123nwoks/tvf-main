-- Ensure the images bucket exists and is public
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Create storage policies for the images bucket
CREATE POLICY "Public read access for images" ON storage.objects
    FOR SELECT USING (bucket_id = 'images');

CREATE POLICY "Public upload access for images" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'images');

CREATE POLICY "Public update access for images" ON storage.objects
    FOR UPDATE USING (bucket_id = 'images');

CREATE POLICY "Public delete access for images" ON storage.objects
    FOR DELETE USING (bucket_id = 'images');
