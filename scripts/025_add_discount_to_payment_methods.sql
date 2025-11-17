-- Adiciona coluna de desconto à tabela payment_methods
ALTER TABLE payment_methods 
ADD COLUMN IF NOT EXISTS discount_percent NUMERIC DEFAULT 0;

-- Atualizar políticas RLS se necessário (já estão em vigor)
-- As políticas existentes já permitem atualização de métodos de pagamento
