-- Add comprehensive product fields to products table

-- Add cost price and profit margin fields
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS cost_price numeric(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS profit_margin numeric(5,2);

-- Add product type and condition
ADD COLUMN IF NOT EXISTS product_type text DEFAULT 'Físico' CHECK (product_type IN ('Físico', 'Digital')),
ADD COLUMN IF NOT EXISTS condition text DEFAULT 'Novo' CHECK (condition IN ('Novo', 'Usado'));

-- Add product details
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS sku text UNIQUE,
ADD COLUMN IF NOT EXISTS gtin text,
ADD COLUMN IF NOT EXISTS unit text,
ADD COLUMN IF NOT EXISTS subcategory text,
ADD COLUMN IF NOT EXISTS brand text;

-- Add stock management
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS min_stock integer DEFAULT 10,
ADD COLUMN IF NOT EXISTS location text;

-- Add promotion fields
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS is_on_promotion boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS promotion_type text,
ADD COLUMN IF NOT EXISTS promotion_value numeric(10,2),
ADD COLUMN IF NOT EXISTS promotional_price numeric(10,2);

-- Add display settings
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS show_price_in_store boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS visibility_status text DEFAULT 'Publicado' CHECK (visibility_status IN ('Publicado', 'Oculto'));

-- Create product_suppliers junction table for many-to-many relationship
CREATE TABLE IF NOT EXISTS public.product_suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  supplier_id uuid REFERENCES public.suppliers(id) ON DELETE CASCADE NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(product_id, supplier_id)
);

ALTER TABLE public.product_suppliers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "product_suppliers_select_own"
  ON public.product_suppliers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM products p
      JOIN partners pt ON p.partner_id = pt.id
      WHERE p.id = product_id AND pt.user_id = auth.uid()
    )
  );

CREATE POLICY "product_suppliers_insert_own"
  ON public.product_suppliers FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM products p
      JOIN partners pt ON p.partner_id = pt.id
      WHERE p.id = product_id AND pt.user_id = auth.uid()
    )
  );

CREATE POLICY "product_suppliers_delete_own"
  ON public.product_suppliers FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM products p
      JOIN partners pt ON p.partner_id = pt.id
      WHERE p.id = product_id AND pt.user_id = auth.uid()
    )
  );

-- Create product_variants table
CREATE TABLE IF NOT EXISTS public.product_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  variant_name text NOT NULL,
  variant_options jsonb NOT NULL,
  sku text UNIQUE,
  price_adjustment numeric(10,2) DEFAULT 0,
  stock_quantity integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "product_variants_select_all"
  ON public.product_variants FOR SELECT
  USING (true);

CREATE POLICY "product_variants_insert_own"
  ON public.product_variants FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM products p
      JOIN partners pt ON p.partner_id = pt.id
      WHERE p.id = product_id AND pt.user_id = auth.uid()
    )
  );

CREATE POLICY "product_variants_update_own"
  ON public.product_variants FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM products p
      JOIN partners pt ON p.partner_id = pt.id
      WHERE p.id = product_id AND pt.user_id = auth.uid()
    )
  );

CREATE POLICY "product_variants_delete_own"
  ON public.product_variants FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM products p
      JOIN partners pt ON p.partner_id = pt.id
      WHERE p.id = product_id AND pt.user_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_sku ON public.products(sku);
CREATE INDEX IF NOT EXISTS idx_products_gtin ON public.products(gtin);
CREATE INDEX IF NOT EXISTS idx_products_brand ON public.products(brand);
CREATE INDEX IF NOT EXISTS idx_products_subcategory ON public.products(subcategory);
CREATE INDEX IF NOT EXISTS idx_product_suppliers_product ON public.product_suppliers(product_id);
CREATE INDEX IF NOT EXISTS idx_product_suppliers_supplier ON public.product_suppliers(supplier_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_product ON public.product_variants(product_id);
