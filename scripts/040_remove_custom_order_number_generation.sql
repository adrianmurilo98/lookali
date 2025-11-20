-- Remove custom order number generation - use MP merchant_order_id instead
DROP TRIGGER IF EXISTS before_order_insert ON orders;
DROP FUNCTION IF EXISTS set_order_number();
DROP FUNCTION IF EXISTS generate_order_number();

-- Make order_number nullable since it will be set by webhook
ALTER TABLE orders ALTER COLUMN order_number DROP NOT NULL;

COMMENT ON COLUMN orders.order_number IS 'Mercado Pago merchant_order_id - set by webhook after payment creation';
