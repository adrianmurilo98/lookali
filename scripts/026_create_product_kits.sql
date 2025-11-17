-- Criar tabela de kits de produtos
CREATE TABLE IF NOT EXISTS product_kits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  sku TEXT UNIQUE,
  kit_price NUMERIC(10,2) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar tabela de itens do kit
CREATE TABLE IF NOT EXISTS kit_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kit_id UUID NOT NULL REFERENCES product_kits(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE product_kits ENABLE ROW LEVEL SECURITY;
ALTER TABLE kit_items ENABLE ROW LEVEL SECURITY;

-- Políticas para product_kits
CREATE POLICY "Parceiros podem ver seus kits"
  ON product_kits FOR SELECT
  USING (partner_id IN (SELECT id FROM partners WHERE user_id = auth.uid()));

CREATE POLICY "Parceiros podem criar kits"
  ON product_kits FOR INSERT
  WITH CHECK (partner_id IN (SELECT id FROM partners WHERE user_id = auth.uid()));

CREATE POLICY "Parceiros podem atualizar seus kits"
  ON product_kits FOR UPDATE
  USING (partner_id IN (SELECT id FROM partners WHERE user_id = auth.uid()));

CREATE POLICY "Parceiros podem deletar seus kits"
  ON product_kits FOR DELETE
  USING (partner_id IN (SELECT id FROM partners WHERE user_id = auth.uid()));

-- Políticas para kit_items
CREATE POLICY "Parceiros podem ver itens de seus kits"
  ON kit_items FOR SELECT
  USING (kit_id IN (
    SELECT id FROM product_kits WHERE partner_id IN (
      SELECT id FROM partners WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY "Parceiros podem gerenciar itens de kits"
  ON kit_items FOR INSERT
  WITH CHECK (kit_id IN (
    SELECT id FROM product_kits WHERE partner_id IN (
      SELECT id FROM partners WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY "Parceiros podem atualizar itens de kits"
  ON kit_items FOR UPDATE
  USING (kit_id IN (
    SELECT id FROM product_kits WHERE partner_id IN (
      SELECT id FROM partners WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY "Parceiros podem deletar itens de kits"
  ON kit_items FOR DELETE
  USING (kit_id IN (
    SELECT id FROM product_kits WHERE partner_id IN (
      SELECT id FROM partners WHERE user_id = auth.uid()
    )
  ));

-- Triggers para updated_at
CREATE TRIGGER update_product_kits_updated_at
  BEFORE UPDATE ON product_kits
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
