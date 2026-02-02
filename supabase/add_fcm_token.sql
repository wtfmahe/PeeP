-- Add FCM token column to profiles table for push notifications
-- Run this AFTER running schema.sql

-- Add FCM token column
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS fcm_token TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_fcm_token ON public.profiles(fcm_token) 
WHERE fcm_token IS NOT NULL;

-- Update RLS policy to allow users to update their own fcm_token
-- (This should already be covered by existing policies, but just in case)

-- Grant update permission on fcm_token
COMMENT ON COLUMN public.profiles.fcm_token IS 'Firebase Cloud Messaging token for push notifications';
