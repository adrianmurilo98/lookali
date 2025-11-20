"use client"

import { useState } from "react"
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { ShoppingBag } from 'lucide-react'
import { UnifiedCheckoutModal } from "@/components/unified-checkout-modal"
import { createOrderAction } from "@/app/actions/orders"
import { useToast } from "@/hooks/use-toast"

interface ServicePurchaseSectionProps {
  service: {
    id: string
    name: string
    price: number
    partner_id: string
  }
  partnerAddress: string
  paymentMethods: string[]
  userId: string
}

export function ServicePurchaseSection({
  service,
  partnerAddress,
  paymentMethods,
  userId,
}: ServicePurchaseSectionProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [showCheckoutModal, setShowCheckoutModal] = useState(false)
  const [isCheckingOut, setIsCheckingOut] = useState(false)

  const handleCheckout = async (data: {
    deliveryType: "delivery" | "pickup"
    deliveryAddress: string
    paymentMethod: string
    notes: string
    quantities: Record<string, number>
    installments: number
    useMercadoPago?: boolean
  }) => {
    setIsCheckingOut(true)

    // Create order first
    const result = await createOrderAction({
      itemId: service.id,
      itemType: "service",
      quantity: 1,
      totalAmount: Number(service.price),
      deliveryType: data.deliveryType,
      deliveryAddress: data.deliveryAddress,
      paymentMethod: data.useMercadoPago ? "Mercado Pago" : data.paymentMethod,
      notes: data.notes,
      partnerId: service.partner_id,
      buyerId: userId,
    })

    if (result.error) {
      toast({
        title: "Erro",
        description: result.error,
        variant: "destructive",
      })
      setIsCheckingOut(false)
      return
    }

    // If using Mercado Pago, redirect to checkout
    if (data.useMercadoPago) {
      try {
        const response = await fetch('/api/mercadopago/create-preference', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            orderId: result.orderId,
          }),
        })

        const mpResult = await response.json()

        if (mpResult.success && mpResult.initPoint) {
          // Redirect to Mercado Pago checkout
          window.location.href = mpResult.initPoint
        } else {
          toast({
            title: "Erro",
            description: mpResult.error || "Erro ao criar checkout",
            variant: "destructive",
          })
          setIsCheckingOut(false)
        }
      } catch (error) {
        toast({
          title: "Erro",
          description: "Erro ao processar pagamento",
          variant: "destructive",
        })
        setIsCheckingOut(false)
      }
    } else {
      // Regular checkout flow
      setShowCheckoutModal(false)
      toast({
        title: "Sucesso",
        description: `Pedido ${result.orderNumber} criado com sucesso!`,
      })
      router.push("/my-orders")
      router.refresh()
      setIsCheckingOut(false)
    }
  }

  return (
    <>
      <Button 
        onClick={() => setShowCheckoutModal(true)} 
        className="w-full" 
        size="lg"
        disabled={isCheckingOut}
      >
        <ShoppingBag className="mr-2 h-5 w-5" />
        {isCheckingOut ? "Processando..." : `Solicitar Serviço - R$ ${Number(service.price).toFixed(2)}`}
      </Button>

      {showCheckoutModal && (
        <UnifiedCheckoutModal
          open={true}
          onClose={() => setShowCheckoutModal(false)}
          products={[
            {
              id: service.id,
              name: service.name,
              price: Number(service.price),
              quantity: 1,
            },
          ]}
          partnerInfo={{
            address: partnerAddress,
            paymentMethods:
              paymentMethods.length > 0 ? paymentMethods : ["Dinheiro", "PIX", "Cartão de Débito", "Cartão de Crédito"],
          }}
          onSubmit={handleCheckout}
        />
      )}
    </>
  )
}
