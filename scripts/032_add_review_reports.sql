-- Tabela para denúncias de avaliações
CREATE TABLE IF NOT EXISTS public.review_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID REFERENCES public.reviews(id) ON DELETE CASCADE NOT NULL,
  reporter_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'dismissed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.review_reports ENABLE ROW LEVEL SECURITY;

-- Drop existing policies before creating them
DROP POLICY IF EXISTS "review_reports_select_own" ON public.review_reports;
DROP POLICY IF EXISTS "review_reports_insert_own" ON public.review_reports;

CREATE POLICY "review_reports_select_own"
  ON public.review_reports FOR SELECT
  USING (auth.uid() = reporter_id);

CREATE POLICY "review_reports_insert_own"
  ON public.review_reports FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

-- Adding fraud_checks table with RLS policies
-- Tabela para registrar verificações de fraude
CREATE TABLE IF NOT EXISTS public.fraud_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  action_type TEXT NOT NULL,
  related_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.fraud_checks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies before creating them
DROP POLICY IF EXISTS "fraud_checks_insert_authenticated" ON public.fraud_checks;
DROP POLICY IF EXISTS "fraud_checks_select_own" ON public.fraud_checks;

-- Allow system to insert fraud checks (authenticated users)
CREATE POLICY "fraud_checks_insert_authenticated"
  ON public.fraud_checks FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Only admins can view fraud checks (for now, allow authenticated users to view their own)
CREATE POLICY "fraud_checks_select_own"
  ON public.fraud_checks FOR SELECT
  USING (auth.uid() = user_id);

-- Adicionar coluna de foto de perfil na tabela profiles se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='profile_image_url') THEN
    ALTER TABLE public.profiles ADD COLUMN profile_image_url TEXT;
  END IF;
END $$;
