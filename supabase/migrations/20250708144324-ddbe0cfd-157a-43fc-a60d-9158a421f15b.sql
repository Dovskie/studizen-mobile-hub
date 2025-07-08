
-- Add language preference to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'en' CHECK (language IN ('en', 'id', 'zh'));

-- Create premium subscriptions table
CREATE TABLE IF NOT EXISTS public.premium_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('monthly', 'quarterly', 'yearly')),
  price DECIMAL(10,2) NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, plan_type)
);

-- Add RLS policies for premium subscriptions
ALTER TABLE public.premium_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscriptions" ON public.premium_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscriptions" ON public.premium_subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscriptions" ON public.premium_subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

-- Add priority and estimated_time columns to tugas table
ALTER TABLE public.tugas ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low'));
ALTER TABLE public.tugas ADD COLUMN IF NOT EXISTS estimated_hours INTEGER DEFAULT 1;
ALTER TABLE public.tugas ADD COLUMN IF NOT EXISTS file_attachments JSONB DEFAULT '[]'::jsonb;

-- Create subtasks table
CREATE TABLE IF NOT EXISTS public.subtasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tugas_id UUID NOT NULL REFERENCES public.tugas(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies for subtasks
ALTER TABLE public.subtasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage subtasks of their tugas" ON public.subtasks
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.tugas 
      WHERE tugas.id = subtasks.tugas_id 
      AND tugas.user_id = auth.uid()
    )
  );

-- Create function to check if user is premium
CREATE OR REPLACE FUNCTION public.is_user_premium(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.premium_subscriptions
    WHERE premium_subscriptions.user_id = $1
    AND is_active = TRUE
    AND end_date > NOW()
  );
END;
$$;
