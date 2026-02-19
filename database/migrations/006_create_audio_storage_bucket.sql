-- Create the audio storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('audio', 'audio', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Create storage policies for the audio bucket
CREATE POLICY "Public read access for audio" ON storage.objects
    FOR SELECT USING (bucket_id = 'audio');

CREATE POLICY "Public upload access for audio" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'audio');

CREATE POLICY "Public update access for audio" ON storage.objects
    FOR UPDATE USING (bucket_id = 'audio');

CREATE POLICY "Public delete access for audio" ON storage.objects
    FOR DELETE USING (bucket_id = 'audio');
