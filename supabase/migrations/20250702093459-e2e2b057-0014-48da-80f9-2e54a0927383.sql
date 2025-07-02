
-- Create table for OTP verifications
CREATE TABLE public.otp_verifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  email TEXT NOT NULL,
  otp_code TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_used BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add Row Level Security
ALTER TABLE public.otp_verifications ENABLE ROW LEVEL SECURITY;

-- Create policies for OTP verifications
CREATE POLICY "Users can view own OTP" 
  ON public.otp_verifications 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own OTP" 
  ON public.otp_verifications 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own OTP" 
  ON public.otp_verifications 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Add is_verified column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;
