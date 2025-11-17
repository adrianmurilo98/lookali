-- Adiciona configurações de pagamento aos parceiros
ALTER TABLE partners 
ADD COLUMN IF NOT EXISTS pix_discount_percent numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS max_installments integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS installments_without_interest integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS interest_rate_percent numeric DEFAULT 0;

-- Adiciona colunas para parcelas nas contas a receber
ALTER TABLE accounts_receivable
ADD COLUMN IF NOT EXISTS installment_number integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS total_installments integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS original_amount numeric,
ADD COLUMN IF NOT EXISTS interest_amount numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS payment_type text;

-- Atualiza a constraint da situação dos pedidos
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_situation_check;
ALTER TABLE orders ADD CONSTRAINT orders_situation_check 
CHECK (situation IN ('pending', 'paid', 'cancelled'));

-- Remove a opção de boleto dos métodos de pagamento
DELETE FROM partner_payment_methods WHERE payment_method = 'Boleto';
