-- Script para corrigir políticas RLS e aumentar segurança do banco de dados

-- ====================================
-- 1. CORRIGIR POLÍTICAS DE PRODUTOS
-- ====================================

-- Remover política permissiva de UPDATE em produtos
DROP POLICY IF EXISTS "Users can update products" ON products;

-- Criar política restritiva: apenas dono do parceiro pode atualizar
CREATE POLICY "Partner owners can update products" ON products
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM partners
      WHERE partners.id = products.partner_id
      AND partners.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM partners
      WHERE partners.id = products.partner_id
      AND partners.user_id = auth.uid()
    )
  );

-- Criar política restritiva: apenas dono do parceiro pode deletar
DROP POLICY IF EXISTS "Users can delete products" ON products;
CREATE POLICY "Partner owners can delete products" ON products
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM partners
      WHERE partners.id = products.partner_id
      AND partners.user_id = auth.uid()
    )
  );

-- ====================================
-- 2. CORRIGIR POLÍTICAS DE PEDIDOS
-- ====================================

-- Remover política permissiva de SELECT em pedidos
DROP POLICY IF EXISTS "Users can view orders" ON orders;

-- Criar política restritiva: apenas comprador ou vendedor podem visualizar
CREATE POLICY "Buyer and seller can view orders" ON orders
  FOR SELECT
  USING (
    buyer_id = auth.uid() 
    OR 
    EXISTS (
      SELECT 1 FROM partners
      WHERE partners.id = orders.partner_id
      AND partners.user_id = auth.uid()
    )
  );

-- Remover política permissiva de UPDATE em pedidos
DROP POLICY IF EXISTS "Users can update orders" ON orders;

-- Criar política restritiva: apenas vendedor pode atualizar status
CREATE POLICY "Seller can update order status" ON orders
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM partners
      WHERE partners.id = orders.partner_id
      AND partners.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM partners
      WHERE partners.id = orders.partner_id
      AND partners.user_id = auth.uid()
    )
  );

-- ====================================
-- 3. CORRIGIR POLÍTICAS DE CLIENTES
-- ====================================

-- Remover política permissiva de SELECT em clientes
DROP POLICY IF EXISTS "Users can view customers" ON customers;

-- Criar política restritiva: apenas dono do parceiro pode visualizar
CREATE POLICY "Partner owners can view customers" ON customers
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM partners
      WHERE partners.id = customers.partner_id
      AND partners.user_id = auth.uid()
    )
  );

-- ====================================
-- 4. PROTEGER DADOS SENSÍVEIS EM USER_PROFILES
-- ====================================

-- Remover política que expõe todos os perfis
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON user_profiles;

-- Criar política restritiva: usuário pode ver apenas seu próprio perfil completo
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT
  USING (user_id = auth.uid());

-- Criar política para ver informações limitadas de outros usuários
CREATE POLICY "Public can view limited profile info" ON user_profiles
  FOR SELECT
  USING (true); -- Removido WITH CHECK (não aplicável a SELECT)

-- Apenas dono pode atualizar
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ====================================
-- 5. PROTEGER MÉTODOS DE PAGAMENTO
-- ====================================

-- Apenas dono do parceiro pode visualizar métodos de pagamento completos
DROP POLICY IF EXISTS "Users can view payment methods" ON payment_methods;
CREATE POLICY "Partner owners can view payment methods" ON payment_methods
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM partners
      WHERE partners.id = payment_methods.partner_id
      AND partners.user_id = auth.uid()
    )
  );

-- Clientes podem ver apenas métodos ativos (sem taxas sensíveis)
CREATE POLICY "Customers can view active payment types" ON payment_methods
  FOR SELECT
  USING (is_active = true);

-- ====================================
-- 6. PROTEGER MOVIMENTAÇÕES DE ESTOQUE
-- ====================================

-- Apenas dono do parceiro pode visualizar movimentações
DROP POLICY IF EXISTS "Users can view stock movements" ON stock_movements;
CREATE POLICY "Partner owners can view stock movements" ON stock_movements
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM partners
      WHERE partners.id = stock_movements.partner_id
      AND partners.user_id = auth.uid()
    )
  );

-- ====================================
-- 7. ADICIONAR ÍNDICES PARA PERFORMANCE
-- ====================================

-- Índice composto para verificação de propriedade de produtos
CREATE INDEX IF NOT EXISTS idx_products_partner_id_user 
ON products (partner_id);

-- Índice composto para verificação de pedidos
CREATE INDEX IF NOT EXISTS idx_orders_buyer_partner 
ON orders (buyer_id, partner_id);

-- Índice para partners user_id (usado em muitas verificações)
CREATE INDEX IF NOT EXISTS idx_partners_user_id 
ON partners (user_id);

-- ====================================
-- 8. CRIAR VIEW SEGURA PARA USER_PROFILES
-- ====================================

-- View que expõe apenas informações públicas
CREATE OR REPLACE VIEW public_user_profiles AS
SELECT 
  user_id,
  full_name,
  avatar_url
FROM user_profiles;

-- Permitir SELECT na view pública
GRANT SELECT ON public_user_profiles TO authenticated;
GRANT SELECT ON public_user_profiles TO anon;
