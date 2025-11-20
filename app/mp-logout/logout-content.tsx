"use client"

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Spinner } from '@/components/ui/spinner'

export function MercadoPagoLogoutContent() {
  const searchParams = useSearchParams()
  const partnerId = searchParams.get('partner_id')
  const [countdown, setCountdown] = useState(3)

  useEffect(() => {
    
    // Limpar TODOS os dados relacionados ao MP
    const clearAllMPData = () => {
      // SessionStorage
      const sessionKeys = Object.keys(sessionStorage)
      sessionKeys.forEach(key => {
        if (key.includes('mp') || key.includes('mercado') || key.includes('MP')) {
          sessionStorage.removeItem(key)
        }
      })
      
      // LocalStorage
      const localKeys = Object.keys(localStorage)
      localKeys.forEach(key => {
        if (key.includes('mp') || key.includes('mercado') || key.includes('MP')) {
          localStorage.removeItem(key)
        }
      })
    }

    clearAllMPData()
    
    const logoutFrame = document.createElement('iframe')
    logoutFrame.style.display = 'none'
    logoutFrame.src = 'https://www.mercadopago.com.br/logout'
    document.body.appendChild(logoutFrame)
    
    // Countdown e redirecionamento
    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    
    // Após 3 segundos, redirecionar para OAuth
    const redirectTimer = setTimeout(() => {
      // Remover iframe
      document.body.removeChild(logoutFrame)
      
      const clientId = process.env.NEXT_PUBLIC_MP_CLIENT_ID
      const redirectUri = `${window.location.origin}/api/mercadopago/oauth-callback`
      const state = `${partnerId}_${Date.now()}_${Math.random().toString(36).substring(7)}`
      
      // Salvar state para validação
      sessionStorage.setItem('mp_oauth_state', state)
      
      const authUrl = new URL('https://auth.mercadopago.com.br/authorization')
      authUrl.searchParams.set('client_id', clientId!)
      authUrl.searchParams.set('response_type', 'code')
      authUrl.searchParams.set('platform_id', 'mp')
      authUrl.searchParams.set('redirect_uri', redirectUri)
      authUrl.searchParams.set('state', state)
      
      console.log('[v0] Opening MP OAuth in new context')
      
      window.open(authUrl.toString(), '_self', 'noopener,noreferrer')
    }, 3000)
    
    return () => {
      clearInterval(countdownInterval)
      clearTimeout(redirectTimer)
      if (document.body.contains(logoutFrame)) {
        document.body.removeChild(logoutFrame)
      }
    }
  }, [partnerId])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <Spinner className="h-8 w-8 mx-auto" />
        <div className="space-y-2">
          <p className="text-muted-foreground">Preparando conexão com Mercado Pago...</p>
          {countdown > 0 && (
            <p className="text-sm text-muted-foreground/60">
              Redirecionando em {countdown}s
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
