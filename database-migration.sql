-- Add notify_full_version column to profiles table
ALTER TABLE profiles 
ADD COLUMN notify_full_version BOOLEAN DEFAULT true;

-- Update existing records to have the default value
UPDATE profiles 
SET notify_full_version = true 
WHERE notify_full_version IS NULL;