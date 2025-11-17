-- Create comprehensive products table structure with all required fields
-- Add new columns to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS sku TEXT UNIQUE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS gtin TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS cost_price NUMERIC;
ALTER TABLE products ADD COLUMN IF NOT EXISTS profit_margin NUMERIC;
ALTER TABLE products ADD COLUMN IF NOT EXISTS min_stock INTEGER DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS product_type TEXT DEFAULT 'Físico';
ALTER TABLE products ADD COLUMN IF NOT EXISTS condition TEXT DEFAULT 'Novo';
ALTER TABLE products ADD COLUMN IF NOT EXISTS brand TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS unit TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS subcategory TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS visibility_status TEXT DEFAULT 'Publicado';
ALTER TABLE products ADD COLUMN IF NOT EXISTS show_price_in_store BOOLEAN DEFAULT true;
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_on_promotion BOOLEAN DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS promotion_type TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS promotion_value NUMERIC;
ALTER TABLE products ADD COLUMN IF NOT EXISTS promotional_price NUMERIC;
ALTER TABLE products ADD COLUMN IF NOT EXISTS suppliers JSONB;

-- Create product_variants table for product variants
CREATE TABLE IF NOT EXISTS product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_name TEXT NOT NULL,
  variant_type TEXT,
  variant_value TEXT,
  sku TEXT UNIQUE,
  price_adjustment NUMERIC DEFAULT 0,
  stock_quantity INTEGER DEFAULT 0,
  variant_options JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create product_suppliers table for many-to-many relationship
CREATE TABLE IF NOT EXISTS product_suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  supplier_sku TEXT,
  lead_time_days INTEGER,
  cost_price NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(product_id, supplier_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_sku ON product_variants(sku);
CREATE INDEX IF NOT EXISTS idx_product_suppliers_product_id ON product_suppliers(product_id);
CREATE INDEX IF NOT EXISTS idx_product_suppliers_supplier_id ON product_suppliers(supplier_id);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);

-- Enable RLS on new tables
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_suppliers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for product_variants
CREATE POLICY "Parceiros podem ver suas variantes" ON product_variants
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = product_variants.product_id
      AND products.partner_id = (SELECT partner_id FROM auth.users WHERE id = auth.uid())
    )
  );

CREATE POLICY "Parceiros podem criar variantes" ON product_variants
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = product_variants.product_id
      AND products.partner_id = (SELECT partner_id FROM auth.users WHERE id = auth.uid())
    )
  );

CREATE POLICY "Parceiros podem atualizar variantes" ON product_variants
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = product_variants.product_id
      AND products.partner_id = (SELECT partner_id FROM auth.users WHERE id = auth.uid())
    )
  );

CREATE POLICY "Parceiros podem deletar variantes" ON product_variants
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = product_variants.product_id
      AND products.partner_id = (SELECT partner_id FROM auth.users WHERE id = auth.uid())
    )
  );

-- RLS Policies for product_suppliers
CREATE POLICY "Parceiros podem ver fornecedores de seus produtos" ON product_suppliers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = product_suppliers.product_id
      AND products.partner_id = (SELECT partner_id FROM auth.users WHERE id = auth.uid())
    )
  );

CREATE POLICY "Parceiros podem vincular fornecedores" ON product_suppliers
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = product_suppliers.product_id
      AND products.partner_id = (SELECT partner_id FROM auth.users WHERE id = auth.uid())
    )
  );

CREATE POLICY "Parceiros podem atualizar fornecedores" ON product_suppliers
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = product_suppliers.product_id
      AND products.partner_id = (SELECT partner_id FROM auth.users WHERE id = auth.uid())
    )
  );

CREATE POLICY "Parceiros podem deletar fornecedores de produtos" ON product_suppliers
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = product_suppliers.product_id
      AND products.partner_id = (SELECT partner_id FROM auth.users WHERE id = auth.uid())
    )
  );
