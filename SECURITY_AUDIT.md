# Auditoria de Segurança - Mini ERP

## Data: Janeiro 2025
## Status: **CRÍTICO** - Vulnerabilidades encontradas requerem ação imediata

---

## 🔴 VULNERABILIDADES CRÍTICAS

### 1. **Falta de Validação de Propriedade (IDOR - Insecure Direct Object References)**

**Severidade:** CRÍTICA  
**Localização:** Todas as actions (`app/actions/*.ts`)

**Problema:**
As actions não verificam se o usuário autenticado é o dono dos recursos antes de permitir modificações. Exemplo:

\`\`\`typescript
// Em products.ts - VULNERÁVEL
export async function deleteProductAction(productId: string) {
  const supabase = await createClient()
  // ❌ Não verifica se o produto pertence ao usuário!
  const { error } = await supabase.from("products").delete().eq("id", productId)
}
\`\`\`

**Impacto:**
- Qualquer usuário autenticado pode deletar/editar produtos de outros parceiros
- Pedidos podem ser manipulados por usuários não autorizados
- Dados financeiros (contas a pagar/receber) podem ser acessados/modificados

**Exploração:**
\`\`\`typescript
// Atacante pode deletar produto de outro parceiro apenas conhecendo o ID
await deleteProductAction("uuid-de-produto-alheio")
\`\`\`

---

### 2. **Políticas RLS Incompletas**

**Severidade:** CRÍTICA  
**Localização:** Tabela `orders`

**Problema:**
A tabela `orders` permite que compradores ATUALIZEM seus próprios pedidos, mas não há política `orders_update_buyer`. Apenas `orders_update_partner` existe.

**Impacto:**
- Compradores não podem atualizar status de cancelamento
- Mas se a política for adicionada incorretamente, podem mudar o status para "paid" sem pagar

---

### 3. **Falta de Validação de Inputs**

**Severidade:** ALTA  
**Localização:** Todas as actions

**Problema:**
Nenhuma action valida tipos, limites ou formatos de dados:

\`\`\`typescript
// ❌ VULNERÁVEL
export async function createProductAction(data: {
  price: number  // Aceita negativos!
  stockQuantity: number  // Aceita negativos!
  name: string  // Sem limite de caracteres!
})
\`\`\`

**Impacto:**
- Preços negativos podem ser inseridos
- Estoques negativos
- Nomes com milhares de caracteres causam DoS no banco
- SQL injection via campos text (mitigado pelo Supabase, mas não validado)

---

### 4. **Exposição de Dados Sensíveis**

**Severidade:** ALTA  
**Localização:** Múltiplas tabelas

**Problema:**
Políticas RLS permitem SELECT de dados sensíveis:

\`\`\`sql
-- partners_select_all permite QUALQUER USUÁRIO ver TODOS os parceiros
CREATE POLICY "partners_select_all" ON partners FOR SELECT USING (true);

-- Expõe: CNPJ, endereço completo, configurações de pagamento
\`\`\`

**Impacto:**
- CNPJs de todos os parceiros são visíveis
- Endereços completos expostos
- Concorrentes podem ver estratégias de preço

---

## 🟡 VULNERABILIDADES MÉDIAS

### 5. **Falta de Rate Limiting**

**Severidade:** MÉDIA  
**Localização:** Todas as actions e API routes

**Problema:**
Nenhum rate limiting implementado. Usuário pode:
- Criar 1000 produtos em 1 segundo
- Fazer 1000 pedidos em 1 segundo
- Enviar 1000 códigos OTP

**Impacto:**
- Ataques de negação de serviço (DoS)
- Spam de emails (OTP)
- Sobrecarga do banco de dados

---

### 6. **Sistema Anti-Fraude Básico em Reviews**

**Severidade:** MÉDIA  
**Localização:** `app/actions/reviews.ts`

**Problema:**
O sistema anti-fraude detecta fraudes mas apenas REGISTRA. Não bloqueia a ação.

\`\`\`typescript
// Detecta fraude mas CONTINUA e cria a review
await supabase.from("fraud_checks").insert({ /* ... */ })
// ❌ Review ainda é criada!
\`\`\`

**Impacto:**
- Reviews fraudulentas continuam sendo criadas
- Tabela `fraud_checks` cresce mas não tem ação

---

### 7. **Falta de Validação de Email Única no Cadastro**

**Severidade:** MÉDIA  
**Status:** PARCIALMENTE CORRIGIDO

**Problema:**
A validação de email duplicado foi implementada, mas depende apenas da tabela `profiles`. Se houver dessincronização com `auth.users`, pode permitir duplicatas.

---

### 8. **Middleware Não Protege Rotas Sensíveis**

**Severidade:** MÉDIA  
**Localização:** `lib/supabase/middleware.ts`

**Problema:**
\`\`\`typescript
if (
  !user &&
  !request.nextUrl.pathname.startsWith("/auth") &&
  !request.nextUrl.pathname.startsWith("/marketplace") &&
  request.nextUrl.pathname !== "/"
) {
  // Redireciona apenas se NÃO for auth, marketplace ou home
}
\`\`\`

**Impacto:**
- `/marketplace` é acessível sem autenticação (OK para visualização)
- Mas `/marketplace/products/[id]` permite compras sem verificação adicional
- `/erp/*` deve ter verificação extra de que o usuário É um parceiro

---

## 🟢 BOAS PRÁTICAS IMPLEMENTADAS

✅ RLS ativado em todas as tabelas  
✅ Uso correto de `createServerClient` e `createBrowserClient`  
✅ Middleware para refresh de tokens  
✅ Sistema básico de detecção de fraudes em reviews  
✅ Separação de client/server Supabase  
✅ Uso de `"use server"` em actions  
✅ Revalidação de paths após mutações

---

## 📋 RECOMENDAÇÕES PRIORITÁRIAS

### 1. **URGENTE: Implementar Verificação de Propriedade**

Adicionar em TODAS as actions de update/delete:

\`\`\`typescript
export async function deleteProductAction(productId: string) {
  const supabase = await createClient()
  
  // ✅ Verificar usuário autenticado
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Não autenticado" }
  
  // ✅ Buscar produto e verificar partner_id
  const { data: product } = await supabase
    .from("products")
    .select("partner_id, partners!inner(user_id)")
    .eq("id", productId)
    .single()
  
  // ✅ Verificar se o usuário é o dono
  if (product?.partners?.user_id !== user.id) {
    return { error: "Não autorizado" }
  }
  
  // Agora pode deletar
  const { error } = await supabase.from("products").delete().eq("id", productId)
}
\`\`\`

### 2. **URGENTE: Adicionar Validação de Inputs**

Usar Zod para validação:

\`\`\`typescript
import { z } from "zod"

const ProductSchema = z.object({
  name: z.string().min(1).max(200),
  price: z.number().min(0.01).max(999999),
  stockQuantity: z.number().int().min(0).max(999999),
  description: z.string().max(5000).optional(),
})

export async function createProductAction(data: unknown) {
  // Validar antes de usar
  const validated = ProductSchema.safeParse(data)
  if (!validated.success) {
    return { error: "Dados inválidos", details: validated.error.issues }
  }
  // Usar validated.data
}
\`\`\`

### 3. **URGENTE: Restringir Políticas RLS**

\`\`\`sql
-- Remover política que expõe todos os parceiros
DROP POLICY "partners_select_all" ON partners;

-- Criar políticas específicas
CREATE POLICY "partners_select_own" ON partners
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "partners_select_public_info" ON partners
  FOR SELECT USING (is_active = true)
  -- Criar uma view pública que expõe apenas campos seguros
\`\`\`

### 4. **ALTA PRIORIDADE: Implementar Rate Limiting**

Usar Upstash Redis ou Vercel KV:

\`\`\`typescript
import { Ratelimit } from "@upstash/ratelimit"
import { kv } from '@vercel/kv'

const ratelimit = new Ratelimit({
  redis: kv,
  limiter: Ratelimit.slidingWindow(10, "10 s"), // 10 requisições por 10 segundos
})

export async function createProductAction(data: any) {
  const { data: { user } } = await supabase.auth.getUser()
  
  const { success } = await ratelimit.limit(user!.id)
  if (!success) {
    return { error: "Muitas requisições. Tente novamente em alguns segundos." }
  }
  
  // Continuar...
}
\`\`\`

### 5. **MÉDIA PRIORIDADE: Melhorar Sistema Anti-Fraude**

\`\`\`typescript
// Se fraude detectada, BLOQUEAR e não apenas registrar
if (fraudCheck.isSuspicious) {
  // Registrar
  await supabase.from("fraud_checks").insert(...)
  
  // E RETORNAR ERRO (já implementado)
  return { error: fraudCheck.reason }
}
\`\`\`

### 6. **MÉDIA PRIORIDADE: Adicionar Verificação de Parceiro no Middleware**

\`\`\`typescript
// Verificar se rotas /erp/* requerem ser parceiro
if (request.nextUrl.pathname.startsWith("/erp")) {
  const { data: partner } = await supabase
    .from("partners")
    .select("id")
    .eq("user_id", user.id)
    .single()
  
  if (!partner) {
    return NextResponse.redirect(new URL("/become-partner", request.url))
  }
}
\`\`\`

### 7. **BAIXA PRIORIDADE: Adicionar Logs de Auditoria**

Criar tabela para rastrear ações críticas:

\`\`\`sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id UUID,
  metadata JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
\`\`\`

---

## 🛡️ CHECKLIST DE SEGURANÇA

- [ ] Verificação de propriedade em todas as actions
- [ ] Validação de inputs com Zod
- [ ] Rate limiting em actions críticas
- [ ] Políticas RLS revisadas e restritas
- [ ] Middleware verificando permissões de parceiro
- [ ] Sistema anti-fraude bloqueando ações
- [ ] Logs de auditoria implementados
- [ ] Testes de penetração básicos
- [ ] Sanitização de outputs (XSS)
- [ ] CSRF tokens (Next.js já protege)

---

## 📊 SCORE DE SEGURANÇA

**Atual:** 4/10 (CRÍTICO)  
**Após correções urgentes:** 7/10 (BOM)  
**Após todas as correções:** 9/10 (EXCELENTE)

---

## 🚨 AÇÃO IMEDIATA REQUERIDA

As vulnerabilidades críticas (1-4) devem ser corrigidas ANTES de ir para produção. Um atacante pode:
- Deletar todos os produtos do sistema
- Modificar pedidos de outros usuários
- Acessar dados financeiros de todos os parceiros
- Causar negação de serviço

**Tempo estimado para correções críticas:** 4-6 horas  
**Tempo estimado para correções completas:** 12-16 horas
