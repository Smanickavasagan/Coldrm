-- Add email configuration columns to profiles table
ALTER TABLE profiles ADD COLUMN email_provider VARCHAR(50);
ALTER TABLE profiles ADD COLUMN encrypted_email_password TEXT;
ALTER TABLE profiles ADD COLUMN email_configured BOOLEAN DEFAULT FALSE;