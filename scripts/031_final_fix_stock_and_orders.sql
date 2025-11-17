-- Added drop for order_payment_stock_trigger
-- Remove ALL existing stock triggers to start fresh
DROP TRIGGER IF EXISTS order_payment_stock_trigger ON orders;
DROP TRIGGER IF EXISTS order_status_stock_movement ON orders;
DROP TRIGGER IF EXISTS update_stock_on_payment ON orders;
DROP TRIGGER IF EXISTS on_order_payment ON orders;
DROP TRIGGER IF EXISTS on_order_status_change ON orders;

-- Drop all existing functions related to stock movements
DROP FUNCTION IF EXISTS handle_order_payment_stock() CASCADE;
DROP FUNCTION IF EXISTS register_stock_movement() CASCADE;
DROP FUNCTION IF EXISTS update_stock_on_payment() CASCADE;
DROP FUNCTION IF EXISTS handle_order_payment() CASCADE;
DROP FUNCTION IF EXISTS handle_order_status_change() CASCADE;

-- Create ONE single function to handle stock movements when order is paid
CREATE OR REPLACE FUNCTION handle_order_payment_stock()
RETURNS TRIGGER AS $$
DECLARE
  order_item RECORD;
BEGIN
  -- Only process if order was just marked as paid
  IF NEW.situation = 'paid' AND (OLD.situation IS NULL OR OLD.situation != 'paid') THEN
    
    -- Loop through all items in the order
    FOR order_item IN 
      SELECT product_id, quantity
      FROM order_items
      WHERE order_id = NEW.id
    LOOP
      -- Update product stock
      UPDATE products
      SET stock_quantity = stock_quantity - order_item.quantity,
          updated_at = NOW()
      WHERE id = order_item.product_id;

      -- Create ONE stock movement record with proper description
      INSERT INTO public.stock_movements (
        partner_id,
        product_id,
        order_id,
        movement_type,
        quantity,
        previous_quantity,
        new_quantity,
        notes,
        created_at
      )
      SELECT
        p.partner_id,
        p.id,
        NEW.id,
        'sale',
        -order_item.quantity,
        p.stock_quantity + order_item.quantity, -- previous stock (before deduction)
        p.stock_quantity, -- new stock (after deduction)
        'Venda realizada via pedido',
        NOW()
      FROM products p
      WHERE p.id = order_item.product_id;
      
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create ONE single trigger
CREATE TRIGGER order_payment_stock_trigger
AFTER UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION handle_order_payment_stock();

-- Clean up duplicate stock movements
-- Keep only the ones with "Venda realizada via pedido" description
WITH duplicates AS (
  SELECT
    id,
    order_id,
    product_id,
    ROW_NUMBER() OVER (
      PARTITION BY order_id, product_id
      ORDER BY CASE WHEN notes = 'Venda realizada via pedido' THEN 0 ELSE 1 END,
               created_at DESC
    ) as rn
  FROM stock_movements
  WHERE order_id IS NOT NULL
    AND movement_type = 'sale'
)
DELETE FROM stock_movements
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);
