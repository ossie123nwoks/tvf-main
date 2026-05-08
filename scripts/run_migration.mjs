import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://sueyhvsfqhcoqtzlrato.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN1ZXlodnNmcWhjb3F0emxyYXRvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2MTY0MjcsImV4cCI6MjA3MTE5MjQyN30.rPyTG3ye3T76Bfkajq5Xtx0JjNS_-7XNBUmVQB_dejM';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Test by checking current schema
const { data, error } = await supabase
  .from('sermons')
  .select('audio_url, video_url')
  .limit(1);

if (error) {
  console.error('Connection test failed:', error.message);
} else {
  console.log('Connected! Sample row:', data);
  console.log('\nNOTE: The anon key cannot ALTER TABLE schema.');
  console.log('You need a service_role key or the Supabase Dashboard SQL Editor to run DDL.');
}
