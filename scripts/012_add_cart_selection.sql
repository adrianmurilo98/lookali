-- Adicionar coluna de seleção no carrinho
ALTER TABLE cart_items ADD COLUMN IF NOT EXISTS selected BOOLEAN DEFAULT true;
