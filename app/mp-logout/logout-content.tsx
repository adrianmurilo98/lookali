"use client"

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Spinner } from '@/components/ui/spinner'

export function MercadoPagoLogoutContent() {
  const searchParams = useSearchParams()
  const partnerId = searchParams.get('partner_id')

  useEffect(() => {
    // Limpar qualquer estado do MP no sessionStorage/localStorage
    sessionStorage.removeItem('mp_device_session_id')
    sessionStorage.removeItem('mp_session_id')
    localStorage.removeItem('mp_device_session_id')
    
    const clientId = process.env.NEXT_PUBLIC_MP_CLIENT_ID
    const redirectUri = `${window.location.origin}/api/mercadopago/oauth-callback`
    const state = `${partnerId}_${Date.now()}`
    
    // Salvar state para validação
    sessionStorage.setItem('mp_oauth_state', state)
    
    // Construir URL OAuth com parâmetros para forçar nova seleção de conta
    const authUrl = new URL('https://auth.mercadopago.com.br/authorization')
    authUrl.searchParams.set('client_id', clientId!)
    authUrl.searchParams.set('response_type', 'code')
    authUrl.searchParams.set('platform_id', 'mp')
    authUrl.searchParams.set('redirect_uri', redirectUri)
    authUrl.searchParams.set('state', state)
    
    // Adicionar timestamp para evitar cache
    authUrl.searchParams.set('_t', Date.now().toString())
    
    console.log('[v0] Redirecting to MP OAuth with fresh session')
    
    // Redirecionar após pequeno delay para garantir limpeza
    setTimeout(() => {
      window.location.replace(authUrl.toString())
    }, 100)
  }, [partnerId])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <Spinner className="h-8 w-8 mx-auto" />
        <p className="text-muted-foreground">Redirecionando para o Mercado Pago...</p>
      </div>
    </div>
  )
}
