-- Add webhook secret column to partners table for signature validation
ALTER TABLE partners ADD COLUMN IF NOT EXISTS mp_webhook_secret TEXT;

-- Add index for faster webhook lookups
CREATE INDEX IF NOT EXISTS idx_orders_mp_payment_id ON orders(mp_payment_id) WHERE mp_payment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_mp_preference_id ON orders(mp_preference_id) WHERE mp_preference_id IS NOT NULL;

COMMENT ON COLUMN partners.mp_webhook_secret IS 'Secret key from Mercado Pago for webhook signature validation';
