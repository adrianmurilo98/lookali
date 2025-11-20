"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ShoppingBag } from "lucide-react"
import { UnifiedCheckoutModal } from "@/components/unified-checkout-modal"
import { createOrderAction } from "@/app/actions/orders"

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
  const [showCheckoutModal, setShowCheckoutModal] = useState(false)

  const handleCheckout = async (data: {
    deliveryType: "delivery" | "pickup"
    deliveryAddress: string
    paymentMethod: string
    notes: string
    quantities: Record<string, number>
  }) => {
    const result = await createOrderAction({
      itemId: service.id,
      itemType: "service",
      quantity: 1,
      totalAmount: Number(service.price),
      deliveryType: data.deliveryType,
      deliveryAddress: data.deliveryAddress,
      paymentMethod: data.paymentMethod,
      notes: data.notes,
      partnerId: service.partner_id,
      buyerId: userId,
    })

    if (result.error) {
      alert(result.error)
    } else {
      setShowCheckoutModal(false)
      alert(`Pedido realizado com sucesso! Número: ${result.orderNumber}`)
      router.push("/my-orders")
      router.refresh()
    }
  }

  return (
    <>
      <Button onClick={() => setShowCheckoutModal(true)} className="w-full" size="lg">
        <ShoppingBag className="mr-2 h-5 w-5" />
        Solicitar Serviço - R$ {Number(service.price).toFixed(2)}
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
