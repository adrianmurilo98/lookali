-- Adiciona colunas de endereço separadas para a tabela partners
ALTER TABLE partners
ADD COLUMN IF NOT EXISTS zip_code TEXT,
ADD COLUMN IF NOT EXISTS street TEXT,
ADD COLUMN IF NOT EXISTS number TEXT,
ADD COLUMN IF NOT EXISTS complement TEXT,
ADD COLUMN IF NOT EXISTS neighborhood TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS state TEXT;

-- Adiciona colunas de endereço separadas para a tabela user_profiles
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS street TEXT,
ADD COLUMN IF NOT EXISTS number TEXT,
ADD COLUMN IF NOT EXISTS complement TEXT,
ADD COLUMN IF NOT EXISTS neighborhood TEXT;

-- Remove a coluna pix_discount_percent pois será gerenciado nos métodos de pagamento
ALTER TABLE partners
DROP COLUMN IF EXISTS pix_discount_percent;

-- Cria índice único para evitar lojas duplicadas por usuário
-- Primeiro, remove lojas duplicadas mantendo apenas a mais recente
WITH duplicates AS (
  SELECT id, 
         ROW_NUMBER() OVER (PARTITION BY user_id, LOWER(store_name) ORDER BY created_at DESC) as rn
  FROM partners
)
DELETE FROM partners
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- Agora cria o índice único
CREATE UNIQUE INDEX IF NOT EXISTS idx_partners_user_store_name 
ON partners (user_id, LOWER(store_name));

-- Atualiza a trigger de updated_at para partners se não existir
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_partners_updated_at ON partners;
CREATE TRIGGER update_partners_updated_at
  BEFORE UPDATE ON partners
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
