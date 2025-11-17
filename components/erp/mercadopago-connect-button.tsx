"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, ExternalLink, AlertTriangle } from 'lucide-react'
import { disconnectMercadoPagoAction } from "@/app/actions/partner"
import { useRouter } from 'next/navigation'
import { useToast } from "@/hooks/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface MercadoPagoConnectButtonProps {
  isConnected: boolean
  connectedAt?: string | null
  partnerId: string
}

export function MercadoPagoConnectButton({ 
  isConnected, 
  connectedAt,
  partnerId
}: MercadoPagoConnectButtonProps) {
  const [isConnecting, setIsConnecting] = useState(false)
  const [isDisconnecting, setIsDisconnecting] = useState(false)
  const [showDisconnectDialog, setShowDisconnectDialog] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

const handleConnect = () => {
  setIsConnecting(true)
  
  const clientId = process.env.NEXT_PUBLIC_MP_CLIENT_ID
  const redirectUri = `${window.location.origin}/api/mercadopago/oauth-callback`
  
  const state = Math.random().toString(36).substring(7)
  
  // Redirect to Mercado Pago OAuth with force_login
  const authUrl = new URL('https://auth.mercadopago.com.br/authorization')
  authUrl.searchParams.set('client_id', clientId!)
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('platform_id', 'mp')
  authUrl.searchParams.set('redirect_uri', redirectUri)
  authUrl.searchParams.set('state', state)
  authUrl.searchParams.set('force_login', 'true')  // ← FORÇA LOGIN SEMPRE
  
  // Store state for validation
  sessionStorage.setItem('mp_oauth_state', state)
  
  window.location.href = authUrl.toString()
}

  const handleDisconnect = async () => {
    setIsDisconnecting(true)
    
    try {
      const result = await disconnectMercadoPagoAction(partnerId)
      
      if (result.error) {
        toast({
          title: "Erro",
          description: result.error,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Sucesso!",
          description: "Mercado Pago desconectado com sucesso",
        })
        router.refresh()
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao desconectar. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsDisconnecting(false)
      setShowDisconnectDialog(false)
    }
  }

  return (
    <>
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
            <div className="space-y-4">
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
              <Button 
                variant="destructive"
                onClick={() => setShowDisconnectDialog(true)}
                disabled={isDisconnecting}
                className="w-full"
              >
                {isDisconnecting ? "Desconectando..." : "Desconectar Mercado Pago"}
              </Button>
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

      <AlertDialog open={showDisconnectDialog} onOpenChange={setShowDisconnectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Desconectar Mercado Pago?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Tem certeza que deseja desconectar sua conta do Mercado Pago?
              </p>
              <p className="font-semibold text-destructive">
                Após desconectar:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Seus clientes não poderão mais pagar com Mercado Pago</li>
                <li>Pedidos pendentes não serão atualizados automaticamente</li>
                <li>Você precisará reconectar para receber pagamentos novamente</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDisconnect}
              disabled={isDisconnecting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDisconnecting ? "Desconectando..." : "Sim, desconectar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
