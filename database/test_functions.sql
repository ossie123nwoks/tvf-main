-- Test script to check if the update functions exist and work
-- Run this in Supabase SQL Editor to test

-- Check if functions exist
SELECT 
  proname as function_name,
  proargnames as parameter_names,
  proargtypes as parameter_types
FROM pg_proc 
WHERE proname LIKE '%update%sermon%' 
   OR proname LIKE '%update%article%'
   OR proname LIKE '%update%thumbnail%';

-- Test the sermon update function with a dummy ID
-- Replace 'test-id' with an actual sermon ID from your database
SELECT update_sermon_basic(
  'test-id'::UUID,
  'Test Title',
  'Test Preacher'
);

-- Check if there are any sermons in the database
SELECT id, title, preacher, updated_at 
FROM sermons 
ORDER BY updated_at DESC 
LIMIT 5;
