-- Enforce RLS on all tables (removendo public_user_profiles se não existir)
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_method_installment_fees ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public_user_profiles ENABLE ROW LEVEL SECURITY; -- Comentado - verificar se existe

-- Add missing RLS policy for payment_method_installment_fees (Partner filtering)
CREATE POLICY "Parceiros podem gerenciar taxas de parcelamento" ON payment_method_installment_fees
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM payment_methods
      WHERE payment_methods.id = payment_method_installment_fees.payment_method_id
        AND payment_methods.partner_id = (
          SELECT partner_id FROM partners WHERE user_id = auth.uid()
        )
    )
  );

-- Use partial unique indexes instead of WHERE clause in UNIQUE constraint
CREATE UNIQUE INDEX idx_customers_cnpj_partner_unique ON customers(partner_id, cnpj) WHERE cnpj IS NOT NULL;
CREATE UNIQUE INDEX idx_customers_cpf_partner_unique ON customers(partner_id, cpf) WHERE cpf IS NOT NULL;

-- Add CHECK constraints for person_type validation
ALTER TABLE customers ADD CONSTRAINT customers_person_type_valid CHECK (person_type IN ('pf', 'pj', 'foreign'));

-- Add CHECK constraint for discount percentage (0-100)
ALTER TABLE payment_methods ADD CONSTRAINT payment_methods_discount_valid CHECK (discount_percent IS NULL OR (discount_percent >= 0 AND discount_percent <= 100));

-- Add CHECK constraint for regime tributario
ALTER TABLE customers ADD CONSTRAINT customers_regime_tributario_valid CHECK (
  regime_tributario IS NULL OR regime_tributario IN (
    'Não definido',
    'Simples nacional',
    'Simples nacional - Excesso de sublimite de receita bruta',
    'Regime normal',
    'MEI'
  )
);

-- Add CHECK constraint for contribuinte values
ALTER TABLE customers ADD CONSTRAINT customers_contribuinte_valid CHECK (
  contribuinte IS NULL OR contribuinte IN ('1', '2', '9')
);
ALTER TABLE customers ADD CONSTRAINT customers_contribuinte_icms_valid CHECK (
  contribuinte_icms IS NULL OR contribuinte_icms IN ('1', '2', '9')
);

-- Ensure order references are properly protected
ALTER TABLE orders ADD CONSTRAINT orders_customer_not_null CHECK (customer_name IS NOT NULL OR buyer_id IS NOT NULL);

-- Add indexes for better query performance with RLS
CREATE INDEX IF NOT EXISTS idx_customers_partner_id ON customers(partner_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_partner_id ON payment_methods(partner_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_orders_partner_id ON orders(partner_id);
