-- Create 2FA secrets table for storing TOTP secrets
CREATE TABLE IF NOT EXISTS user_2fa_secrets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  secret TEXT NOT NULL, -- Base32 encoded TOTP secret
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  activated_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- Create 2FA backup codes table
CREATE TABLE IF NOT EXISTS user_2fa_backup_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  used BOOLEAN DEFAULT false,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create 2FA settings table
CREATE TABLE IF NOT EXISTS user_2fa_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  is_enabled BOOLEAN DEFAULT false,
  method TEXT DEFAULT 'totp', -- 'totp' or 'sms'
  backup_codes_count INT DEFAULT 10,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE user_2fa_secrets ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_2fa_backup_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_2fa_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_2fa_secrets (users can only see their own)
CREATE POLICY "Users can view own 2FA secret" ON user_2fa_secrets
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own 2FA secret" ON user_2fa_secrets
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own 2FA secret" ON user_2fa_secrets
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own 2FA secret" ON user_2fa_secrets
  FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for user_2fa_backup_codes
CREATE POLICY "Users can view own backup codes" ON user_2fa_backup_codes
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert backup codes" ON user_2fa_backup_codes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update backup codes" ON user_2fa_backup_codes
  FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for user_2fa_settings
CREATE POLICY "Users can view own 2FA settings" ON user_2fa_settings
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own 2FA settings" ON user_2fa_settings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own 2FA settings" ON user_2fa_settings
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_user_2fa_secrets_user_id ON user_2fa_secrets(user_id);
CREATE INDEX idx_user_2fa_backup_codes_user_id ON user_2fa_backup_codes(user_id);
CREATE INDEX idx_user_2fa_backup_codes_used ON user_2fa_backup_codes(used) WHERE used = false;
CREATE INDEX idx_user_2fa_settings_user_id ON user_2fa_settings(user_id);
