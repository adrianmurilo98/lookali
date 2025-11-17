-- Criar tabela de métodos de pagamento customizados
CREATE TABLE IF NOT EXISTS payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  payment_type TEXT NOT NULL CHECK (payment_type IN ('dinheiro', 'pix', 'cartao_credito', 'cartao_debito', 'vale_alimentacao', 'vale_refeicao', 'outros')),
  card_brand TEXT CHECK (card_brand IN ('visa', 'mastercard', 'american_express', 'elo', 'hipercard', 'diners_club', 'aura', 'cabal', 'sorocredi', 'outros') OR card_brand IS NULL),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de taxas por parcela
CREATE TABLE IF NOT EXISTS payment_method_installment_fees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_method_id UUID NOT NULL REFERENCES payment_methods(id) ON DELETE CASCADE,
  installment_number INTEGER NOT NULL CHECK (installment_number >= 1),
  fee_type TEXT NOT NULL CHECK (fee_type IN ('percentage', 'fixed', 'both')),
  percentage_rate NUMERIC(5,4) DEFAULT 0,
  fixed_amount NUMERIC(10,2) DEFAULT 0,
  receiving_days INTEGER DEFAULT 30,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(payment_method_id, installment_number)
);

-- RLS para payment_methods
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;

CREATE POLICY payment_methods_select_partner ON payment_methods
  FOR SELECT USING (partner_id IN (
    SELECT id FROM partners WHERE user_id = auth.uid()
  ));

CREATE POLICY payment_methods_insert_partner ON payment_methods
  FOR INSERT WITH CHECK (partner_id IN (
    SELECT id FROM partners WHERE user_id = auth.uid()
  ));

CREATE POLICY payment_methods_update_partner ON payment_methods
  FOR UPDATE USING (partner_id IN (
    SELECT id FROM partners WHERE user_id = auth.uid()
  ));

CREATE POLICY payment_methods_delete_partner ON payment_methods
  FOR DELETE USING (partner_id IN (
    SELECT id FROM partners WHERE user_id = auth.uid()
  ));

CREATE POLICY payment_methods_select_all_active ON payment_methods
  FOR SELECT USING (is_active = true);

-- RLS para installment_fees
ALTER TABLE payment_method_installment_fees ENABLE ROW LEVEL SECURITY;

CREATE POLICY installment_fees_select_partner ON payment_method_installment_fees
  FOR SELECT USING (payment_method_id IN (
    SELECT id FROM payment_methods WHERE partner_id IN (
      SELECT id FROM partners WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY installment_fees_insert_partner ON payment_method_installment_fees
  FOR INSERT WITH CHECK (payment_method_id IN (
    SELECT id FROM payment_methods WHERE partner_id IN (
      SELECT id FROM partners WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY installment_fees_update_partner ON payment_method_installment_fees
  FOR UPDATE USING (payment_method_id IN (
    SELECT id FROM payment_methods WHERE partner_id IN (
      SELECT id FROM partners WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY installment_fees_delete_partner ON payment_method_installment_fees
  FOR DELETE USING (payment_method_id IN (
    SELECT id FROM payment_methods WHERE partner_id IN (
      SELECT id FROM partners WHERE user_id = auth.uid()
    )
  ));

-- Inserir métodos de pagamento padrão (Dinheiro e PIX) para parceiros existentes
INSERT INTO payment_methods (partner_id, name, payment_type, is_active)
SELECT id, 'Dinheiro', 'dinheiro', true FROM partners
ON CONFLICT DO NOTHING;

INSERT INTO payment_methods (partner_id, name, payment_type, is_active)
SELECT id, 'PIX', 'pix', true FROM partners
ON CONFLICT DO NOTHING;
