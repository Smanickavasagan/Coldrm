-- Add referral fields to profiles table
ALTER TABLE profiles 
ADD COLUMN referral_code VARCHAR(10) UNIQUE,
ADD COLUMN referred_by VARCHAR(10),
ADD COLUMN bonus_contacts INTEGER DEFAULT 0,
ADD COLUMN bonus_emails INTEGER DEFAULT 0;

-- Create referrals tracking table
CREATE TABLE referrals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID REFERENCES profiles(id),
  referee_id UUID REFERENCES profiles(id),
  referral_code VARCHAR(10),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  rewards_given BOOLEAN DEFAULT FALSE
);

-- Generate referral codes for existing users
UPDATE profiles 
SET referral_code = UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 8))
WHERE referral_code IS NULL;