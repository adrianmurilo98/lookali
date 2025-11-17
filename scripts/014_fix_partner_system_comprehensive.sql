-- Remove pix_discount_percent da tabela partners
ALTER TABLE partners DROP COLUMN IF EXISTS pix_discount_percent;

-- Adiciona colunas de endereço separadas na tabela partners
ALTER TABLE partners 
  ADD COLUMN IF NOT EXISTS zip_code TEXT,
  ADD COLUMN IF NOT EXISTS street TEXT,
  ADD COLUMN IF NOT EXISTS number TEXT,
  ADD COLUMN IF NOT EXISTS complement TEXT,
  ADD COLUMN IF NOT EXISTS neighborhood TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS state TEXT;

-- Adiciona colunas de endereço separadas na tabela user_profiles
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS zip_code TEXT,
  ADD COLUMN IF NOT EXISTS street TEXT,
  ADD COLUMN IF NOT EXISTS number TEXT,
  ADD COLUMN IF NOT EXISTS complement TEXT,
  ADD COLUMN IF NOT EXISTS neighborhood TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS state TEXT;

-- Remove lojas duplicadas antes de criar o índice único
-- Mantém apenas a loja mais recente de cada nome por usuário
DELETE FROM partners a USING partners b
WHERE LOWER(a.store_name) = LOWER(b.store_name) 
AND a.user_id = b.user_id
AND a.created_at < b.created_at;

-- Cria índice único para evitar lojas duplicadas por nome do mesmo usuário
CREATE UNIQUE INDEX IF NOT EXISTS idx_partners_user_store_name ON partners(user_id, LOWER(store_name));

-- Cria tabela para gerenciar códigos de verificação de email
CREATE TABLE IF NOT EXISTS email_verification_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  new_email TEXT NOT NULL,
  code TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '15 minutes'),
  verified BOOLEAN DEFAULT FALSE
);

-- Ativa RLS
ALTER TABLE email_verification_codes ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para email_verification_codes
CREATE POLICY "Usuários podem ver seus próprios códigos"
  ON email_verification_codes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar seus próprios códigos"
  ON email_verification_codes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seus próprios códigos"
  ON email_verification_codes FOR UPDATE
  USING (auth.uid() = user_id);

-- Cria tabela de métodos de pagamento
CREATE TABLE IF NOT EXISTS payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('dinheiro', 'pix', 'credito', 'debito', 'vale_alimentacao', 'vale_refeicao', 'outros')),
  card_brand TEXT CHECK (card_brand IN ('visa', 'mastercard', 'elo', 'american_express', 'diners', 'hipercard', 'aura', 'cabal', 'sorocred', 'outros')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cria tabela de taxas por parcela
CREATE TABLE IF NOT EXISTS payment_method_fees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_method_id UUID NOT NULL REFERENCES payment_methods(id) ON DELETE CASCADE,
  installment_number INTEGER NOT NULL,
  fee_type TEXT NOT NULL CHECK (fee_type IN ('percentage', 'fixed', 'both')),
  percentage_rate DECIMAL(5, 4) DEFAULT 0,
  fixed_amount DECIMAL(10, 2) DEFAULT 0,
  receiving_days INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(payment_method_id, installment_number)
);

-- Ativa RLS nas novas tabelas
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_method_fees ENABLE ROW LEVEL SECURITY;

-- Políticas para payment_methods
CREATE POLICY "Parceiros podem ver seus métodos de pagamento"
  ON payment_methods FOR SELECT
  USING (partner_id IN (SELECT id FROM partners WHERE user_id = auth.uid()));

CREATE POLICY "Parceiros podem criar métodos de pagamento"
  ON payment_methods FOR INSERT
  WITH CHECK (partner_id IN (SELECT id FROM partners WHERE user_id = auth.uid()));

CREATE POLICY "Parceiros podem atualizar seus métodos de pagamento"
  ON payment_methods FOR UPDATE
  USING (partner_id IN (SELECT id FROM partners WHERE user_id = auth.uid()));

CREATE POLICY "Parceiros podem deletar seus métodos de pagamento"
  ON payment_methods FOR DELETE
  USING (partner_id IN (SELECT id FROM partners WHERE user_id = auth.uid()));

-- Políticas para payment_method_fees
CREATE POLICY "Parceiros podem ver taxas de seus métodos"
  ON payment_method_fees FOR SELECT
  USING (payment_method_id IN (
    SELECT id FROM payment_methods WHERE partner_id IN (
      SELECT id FROM partners WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY "Parceiros podem criar taxas"
  ON payment_method_fees FOR INSERT
  WITH CHECK (payment_method_id IN (
    SELECT id FROM payment_methods WHERE partner_id IN (
      SELECT id FROM partners WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY "Parceiros podem atualizar taxas"
  ON payment_method_fees FOR UPDATE
  USING (payment_method_id IN (
    SELECT id FROM payment_methods WHERE partner_id IN (
      SELECT id FROM partners WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY "Parceiros podem deletar taxas"
  ON payment_method_fees FOR DELETE
  USING (payment_method_id IN (
    SELECT id FROM payment_methods WHERE partner_id IN (
      SELECT id FROM partners WHERE user_id = auth.uid()
    )
  ));

-- Insere métodos de pagamento padrão (Dinheiro e PIX) para parceiros existentes
INSERT INTO payment_methods (partner_id, name, type, is_active)
SELECT id, 'Dinheiro', 'dinheiro', true
FROM partners
WHERE NOT EXISTS (
  SELECT 1 FROM payment_methods 
  WHERE payment_methods.partner_id = partners.id 
  AND payment_methods.type = 'dinheiro'
);

INSERT INTO payment_methods (partner_id, name, type, is_active)
SELECT id, 'PIX', 'pix', true
FROM partners
WHERE NOT EXISTS (
  SELECT 1 FROM payment_methods 
  WHERE payment_methods.partner_id = partners.id 
  AND payment_methods.type = 'pix'
);

-- Triggers para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_payment_methods_updated_at ON payment_methods;
CREATE TRIGGER update_payment_methods_updated_at
  BEFORE UPDATE ON payment_methods
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_payment_method_fees_updated_at ON payment_method_fees;
CREATE TRIGGER update_payment_method_fees_updated_at
  BEFORE UPDATE ON payment_method_fees
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
