-- Add fee configuration columns directly to payment_methods table
ALTER TABLE payment_methods
ADD COLUMN IF NOT EXISTS max_installments INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS fee_type TEXT DEFAULT 'percentage' CHECK (fee_type IN ('percentage', 'fixed', 'both')),
ADD COLUMN IF NOT EXISTS percentage_rate NUMERIC(5, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS fixed_amount NUMERIC(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS receiving_days INTEGER DEFAULT 0;

-- Update existing payment methods with default values
UPDATE payment_methods
SET 
  fee_type = 'percentage',
  percentage_rate = 0,
  fixed_amount = 0,
  receiving_days = 0
WHERE fee_type IS NULL;

-- Add comment explaining the structure
COMMENT ON COLUMN payment_methods.fee_type IS 'Tipo de taxa: percentage (alíquota %), fixed (valor fixo R$), ou both (ambos)';
COMMENT ON COLUMN payment_methods.percentage_rate IS 'Taxa percentual aplicada (0-100)';
COMMENT ON COLUMN payment_methods.fixed_amount IS 'Valor fixo em reais aplicado como taxa';
COMMENT ON COLUMN payment_methods.receiving_days IS 'Prazo em dias para recebimento';
COMMENT ON COLUMN payment_methods.max_installments IS 'Número máximo de parcelas (apenas para cartão de crédito)';
