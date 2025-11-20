-- Update existing orders to use mp_merchant_order_id as order_number
UPDATE orders
SET order_number = mp_merchant_order_id
WHERE mp_merchant_order_id IS NOT NULL
  AND (order_number IS NULL OR order_number != mp_merchant_order_id);

-- Add comment to order_number column
COMMENT ON COLUMN orders.order_number IS 'Order number from Mercado Pago (merchant_order_id)';
