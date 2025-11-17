-- Add Mercado Pago fields to partners table for OAuth integration
ALTER TABLE partners 
ADD COLUMN IF NOT EXISTS mp_user_id TEXT,
ADD COLUMN IF NOT EXISTS mp_access_token TEXT,
ADD COLUMN IF NOT EXISTS mp_refresh_token TEXT,
ADD COLUMN IF NOT EXISTS mp_public_key TEXT,
ADD COLUMN IF NOT EXISTS mp_connected_at TIMESTAMP;

-- Add Mercado Pago fields to orders table
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS mp_payment_id TEXT,
ADD COLUMN IF NOT EXISTS mp_preference_id TEXT,
ADD COLUMN IF NOT EXISTS mp_status TEXT,
ADD COLUMN IF NOT EXISTS mp_status_detail TEXT;

-- Create index for faster webhook lookups
CREATE INDEX IF NOT EXISTS orders_mp_payment_id_idx ON orders(mp_payment_id);
CREATE INDEX IF NOT EXISTS orders_mp_preference_id_idx ON orders(mp_preference_id);

-- Add comment explaining the fields
COMMENT ON COLUMN partners.mp_user_id IS 'Mercado Pago user ID after OAuth connection';
COMMENT ON COLUMN partners.mp_access_token IS 'Mercado Pago access token for API calls';
COMMENT ON COLUMN partners.mp_refresh_token IS 'Token to refresh access when expired';
COMMENT ON COLUMN orders.mp_payment_id IS 'Mercado Pago payment ID';
COMMENT ON COLUMN orders.mp_preference_id IS 'Mercado Pago preference ID for checkout';
COMMENT ON COLUMN orders.mp_status IS 'Mercado Pago payment status (approved, pending, rejected, etc)';
