# Configuração do Mercado Pago

Este guia explica como configurar a integração com o Mercado Pago no sistema.

## Visão Geral

A integração permite que:
- Vendedores recebam 100% dos pagamentos diretamente em suas contas
- Compradores paguem com cartão, PIX, boleto e outras formas
- O sistema não cobra comissão (application_fee = 0%)
- Webhooks atualizam automaticamente o status dos pedidos

## Passo 1: Criar Aplicação no Mercado Pago

1. Acesse: https://www.mercadopago.com.br/developers/panel/app
2. Clique em "Criar aplicação"
3. Escolha tipo "Marketplace" ou "Online payments"
4. Preencha as informações solicitadas

## Passo 2: Configurar OAuth Redirect URI

Na sua aplicação do Mercado Pago:

1. Vá em "Configurações" → "OAuth"
2. Adicione a Redirect URI:
   - Desenvolvimento: `http://localhost:3000/api/mercadopago/oauth-callback`
   - Produção: `https://seudominio.com/api/mercadopago/oauth-callback`

## Passo 3: Obter Credenciais

Na aba "Credenciais" da sua aplicação, copie:

- **Public Key** (começa com TEST- para sandbox)
- **Access Token** (começa com TEST- para sandbox)
- **Client ID** (ID numérico)
- **Client Secret** (string alfanumérica)

## Passo 4: Configurar Variáveis de Ambiente

Adicione as seguintes variáveis no Vercel ou no arquivo `.env.local`:

\`\`\`bash
# Mercado Pago Credentials
# Variable 1: Public Key (prefixed with NEXT_PUBLIC_)
# Variable 2: Client ID (prefixed with NEXT_PUBLIC_)
# Variable 3: Client Secret (server-side only, starts with MP_)
# Variable 4: Access Token (server-side only, starts with MP_)

# Site URL
NEXT_PUBLIC_SITE_URL=http://localhost:3000
\`\`\`

**Importante:** Para ambiente de teste, use credenciais que começam com `TEST-`. Para produção, use as credenciais de produção da sua aplicação.

**Nomes das variáveis:** Consulte o arquivo de configuração do sistema ou a documentação do código para os nomes exatos das variáveis de ambiente necessárias.

## Passo 5: Configurar Webhooks (Opcional mas Recomendado)

1. No painel do Mercado Pago, vá em "Webhooks"
2. Adicione a URL:
   - Desenvolvimento: `http://localhost:3000/api/mercadopago/webhook`
   - Produção: `https://seudominio.com/api/mercadopago/webhook`
3. Selecione os eventos: `payment`

**Importante para desenvolvimento local:** Use ngrok ou similar para testar webhooks:
\`\`\`bash
ngrok http 3000
# Use a URL do ngrok como webhook URL
\`\`\`

## Passo 6: Executar Migração do Banco de Dados

Execute o script SQL para adicionar os campos necessários:

\`\`\`sql
-- Este script já está em scripts/037_add_mercadopago_fields.sql
-- Será executado automaticamente
\`\`\`

## Passo 7: Conectar Vendedores

Cada vendedor precisa conectar sua conta:

1. Vendedor acessa: **ERP → Configurações → Aba "Integrações"**
2. Clica em "Conectar Mercado Pago"
3. Autoriza o acesso na página do Mercado Pago
4. É redirecionado de volta com a conta conectada

## Fluxo de Pagamento

### Para o Comprador:

1. Adiciona produtos ao carrinho
2. Clica em "Finalizar pedido"
3. No modal de checkout, marca "Pagar com Mercado Pago"
4. É redirecionado para o checkout do Mercado Pago
5. Escolhe forma de pagamento (cartão, PIX, boleto)
6. Confirma o pagamento
7. É redirecionado de volta para a página de sucesso

### Para o Vendedor:

1. Recebe notificação do pedido
2. Webhook atualiza status automaticamente
3. Dinheiro cai direto na conta do Mercado Pago do vendedor
4. Pode gerenciar o pedido no ERP

## Split de Pagamento

O sistema está configurado com:
- **application_fee: 0** = Vendedor recebe 100%
- Se quiser cobrar comissão no futuro, altere em `lib/mercadopago.ts`:

\`\`\`typescript
marketplace_fee: totalAmount * 0.10 // 10% de comissão
\`\`\`

## Webhooks - Atualização Automática

O webhook recebe notificações do Mercado Pago e atualiza:
- Status do pedido (pending → paid → shipped → delivered)
- ID do pagamento no Mercado Pago
- Detalhes do status para debugging

## Status Mapeados

| Status MP | Status no Sistema |
|-----------|-------------------|
| approved | paid |
| pending | pending |
| in_process | pending |
| rejected | cancelled |
| cancelled | cancelled |
| refunded | cancelled |

## Ambiente de Teste vs Produção

### Teste (Sandbox):
- Use credenciais com prefixo `TEST-`
- Cartões de teste: https://www.mercadopago.com.br/developers/pt/docs/checkout-api/integration-test/test-cards

### Produção:
- Substitua todas as credenciais `TEST-` pelas de produção
- Configure as URLs de produção
- Ative a aplicação no painel do Mercado Pago

## Solução de Problemas

### Erro: "Vendedor não possui Mercado Pago configurado"
- Vendedor precisa conectar sua conta em Configurações → Integrações

### Erro: "Order not found" no webhook
- Verifique se o webhook está configurado corretamente
- Confira os logs com `console.log("[v0] ...")`

### Pagamento não atualiza automaticamente
- Webhook pode não estar configurado
- Verifique se a URL do webhook está acessível
- Use ngrok para desenvolvimento local

### OAuth retorna erro
- Verifique se a Redirect URI está correta
- Confirme que Client ID e Secret estão corretos
- Verifique se a aplicação está ativa no MP

## Segurança

- Access tokens dos vendedores são criptografados no banco
- Webhook usa Service Role Key para bypass RLS
- Validação de propriedade do pedido antes de processar
- HTTPS obrigatório em produção

## Referências

- [Documentação Mercado Pago](https://www.mercadopago.com.br/developers/pt/docs)
- [OAuth Flow](https://www.mercadopago.com.br/developers/pt/docs/security/oauth)
- [Webhooks](https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks)
- [Split de Pagamento](https://www.mercadopago.com.br/developers/pt/docs/split-payments/integration-api)
