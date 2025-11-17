"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, ExternalLink } from 'lucide-react'

interface MercadoPagoConnectButtonProps {
  isConnected: boolean
  connectedAt?: string | null
}

export function MercadoPagoConnectButton({ 
  isConnected, 
  connectedAt 
}: MercadoPagoConnectButtonProps) {
  const [isConnecting, setIsConnecting] = useState(false)

  const handleConnect = () => {
    setIsConnecting(true)
    
    const clientId = process.env.NEXT_PUBLIC_MP_CLIENT_ID
    const redirectUri = `${window.location.origin}/api/mercadopago/oauth-callback`
    
    // Redirect to Mercado Pago OAuth
    const authUrl = `https://auth.mercadopago.com.br/authorization?client_id=${clientId}&response_type=code&platform_id=mp&redirect_uri=${redirectUri}&force_login=true`
    
    window.location.href = authUrl
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Mercado Pago
          {isConnected && <CheckCircle className="h-5 w-5 text-green-500" />}
        </CardTitle>
        <CardDescription>
          Conecte sua conta do Mercado Pago para receber pagamentos online
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isConnected ? (
          <div className="space-y-2">
            <div className="p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-700 font-medium">
                Conta conectada com sucesso!
              </p>
              {connectedAt && (
                <p className="text-xs text-green-600 mt-1">
                  Conectado em: {new Date(connectedAt).toLocaleDateString('pt-BR')}
                </p>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Seus clientes podem pagar com cartão, PIX, boleto e outras formas de pagamento.
              100% do valor vai para sua conta (menos as taxas do Mercado Pago).
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Para receber pagamentos online, você precisa conectar sua conta do Mercado Pago.
            </p>
            <ul className="text-sm space-y-2 text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Receba 100% dos pagamentos direto na sua conta</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Seus clientes podem pagar com cartão, PIX, boleto</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Processo seguro e rápido</span>
              </li>
            </ul>
            <Button 
              onClick={handleConnect} 
              disabled={isConnecting}
              className="w-full"
            >
              {isConnecting ? "Conectando..." : "Conectar Mercado Pago"}
              <ExternalLink className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
