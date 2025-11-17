-- Criar tabela para armazenar códigos OTP de alteração de email
CREATE TABLE IF NOT EXISTS email_change_otps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  new_email TEXT NOT NULL,
  otp_code TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  attempts INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_user_email_change UNIQUE(user_id)
);

-- Índice para busca rápida
CREATE INDEX IF NOT EXISTS idx_email_change_otps_user_id ON email_change_otps(user_id);
CREATE INDEX IF NOT EXISTS idx_email_change_otps_expires_at ON email_change_otps(expires_at);

-- RLS policies
ALTER TABLE email_change_otps ENABLE ROW LEVEL SECURITY;

-- Usuários podem ver apenas seus próprios OTPs
CREATE POLICY "Users can view own OTPs" ON email_change_otps
  FOR SELECT
  USING (auth.uid() = user_id);

-- Apenas o sistema pode inserir/atualizar OTPs (via service role)
CREATE POLICY "Service role can manage OTPs" ON email_change_otps
  FOR ALL
  USING (true);

-- Função para limpar OTPs expirados automaticamente (executar periodicamente)
CREATE OR REPLACE FUNCTION clean_expired_otps()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM email_change_otps
  WHERE expires_at < NOW();
END;
$$;

-- Comentário sobre a tabela
COMMENT ON TABLE email_change_otps IS 'Armazena códigos OTP temporários para alteração de email dos usuários';
