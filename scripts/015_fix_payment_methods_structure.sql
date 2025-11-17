-- Remove as tabelas se existirem para recriá-las corretamente
DROP TABLE IF EXISTS payment_method_fees CASCADE;
DROP TABLE IF EXISTS payment_methods CASCADE;

-- Recria a tabela de métodos de pagamento com estrutura correta
CREATE TABLE payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  payment_type TEXT NOT NULL CHECK (payment_type IN ('dinheiro', 'pix', 'credito', 'debito', 'vale_alimentacao', 'vale_refeicao', 'outros')),
  card_brand TEXT CHECK (card_brand IN ('visa', 'mastercard', 'elo', 'american_express', 'diners', 'hipercard', 'aura', 'cabal', 'sorocred', 'outros')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Recria a tabela de taxas por parcela
CREATE TABLE payment_method_fees (
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

-- Ativa RLS
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

-- Insere métodos de pagamento padrão (Dinheiro e PIX) para todos os parceiros
INSERT INTO payment_methods (partner_id, name, payment_type, is_active)
SELECT id, 'Dinheiro', 'dinheiro', true
FROM partners;

INSERT INTO payment_methods (partner_id, name, payment_type, is_active)
SELECT id, 'PIX', 'pix', true
FROM partners;

-- Triggers para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_payment_methods_updated_at
  BEFORE UPDATE ON payment_methods
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_method_fees_updated_at
  BEFORE UPDATE ON payment_method_fees
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
