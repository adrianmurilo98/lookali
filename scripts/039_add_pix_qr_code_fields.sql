-- Add PIX QR Code fields to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS mp_merchant_order_id TEXT,
ADD COLUMN IF NOT EXISTS mp_qr_code TEXT,
ADD COLUMN IF NOT EXISTS mp_qr_code_base64 TEXT,
ADD COLUMN IF NOT EXISTS mp_ticket_url TEXT;

-- Add comment explaining the fields
COMMENT ON COLUMN orders.mp_merchant_order_id IS 'Mercado Pago merchant order ID - this becomes the order_number';
COMMENT ON COLUMN orders.mp_qr_code IS 'PIX QR code string (copy-paste code)';
COMMENT ON COLUMN orders.mp_qr_code_base64 IS 'PIX QR code in base64 format for display';
COMMENT ON COLUMN orders.mp_ticket_url IS 'URL for boleto/ticket payment';
