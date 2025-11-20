"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { updateCartQuantityAction, removeFromCartAction, toggleCartSelectionAction } from "@/app/actions/cart"
import { Trash2 } from "lucide-react"
import { UnifiedCheckoutModal } from "@/components/unified-checkout-modal"
import { checkoutCartAction } from "@/app/actions/cart"

export function CartList({ itemsByPartner, userId }: { itemsByPartner: any; userId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [checkoutPartner, setCheckoutPartner] = useState<string | null>(null)

  const handleUpdateQuantity = async (cartItemId: string, quantity: number) => {
    if (loading) return
    setLoading(cartItemId)
    const result = await updateCartQuantityAction(cartItemId, quantity)
    setLoading(null)
    if (!result.error) {
      router.refresh()
    }
  }

  const handleRemove = async (cartItemId: string) => {
    if (loading) return
    setLoading(cartItemId)
    const result = await removeFromCartAction(cartItemId)
    setLoading(null)
    if (!result.error) {
      router.refresh()
    }
  }

  const handleToggleSelection = async (cartItemId: string) => {
    if (loading) return
    setLoading(cartItemId)
    const result = await toggleCartSelectionAction(cartItemId)
    setLoading(null)
    if (!result.error) {
      router.refresh()
    }
  }

  const handleOpenCheckout = (partnerId: string) => {
    setCheckoutPartner(partnerId)
  }

  const handleCheckout = async (data: {
    deliveryType: "delivery" | "pickup"
    deliveryAddress: string
    paymentMethod: string
    notes: string
    quantities: Record<string, number>
  }) => {
    if (!checkoutPartner) return

    const partnerData = itemsByPartner[checkoutPartner]
    const selectedItems = partnerData.items.filter((item: any) => item.selected !== false)

    const partnerItems = selectedItems.map((item: any) => ({
      cartItemId: item.id,
      productId: item.product_id,
      quantity: data.quantities[item.product_id] || item.quantity,
    }))

    const result = await checkoutCartAction(
      partnerItems,
      data.deliveryType,
      data.deliveryAddress,
      data.paymentMethod,
      data.notes,
    )

    if (result.error) {
      alert(result.error)
    } else {
      setCheckoutPartner(null)
      alert(`Pedido realizado com sucesso! Número: ${result.orderNumber}`)
      router.push("/my-orders")
      router.refresh()
    }
  }

  return (
    <div className="space-y-6">
      {Object.entries(itemsByPartner).map(([partnerId, data]: [string, any]) => {
        const selectedItems = data.items.filter((item: any) => item.selected !== false)
        const total = selectedItems.reduce(
          (sum: number, item: any) => sum + Number(item.products.price) * item.quantity,
          0,
        )

        return (
          <Card key={partnerId}>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>{data.partner.store_name}</span>
                <span className="text-lg">Total: R$ {total.toFixed(2)}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.items.map((item: any) => (
                <div key={item.id} className="flex items-center gap-4 pb-4 border-b last:border-0">
                  <Checkbox
                    checked={item.selected !== false}
                    onCheckedChange={() => handleToggleSelection(item.id)}
                    disabled={loading === item.id}
                  />

                  <div className="flex-1">
                    <h3 className="font-semibold">{item.products.name}</h3>
                    <p className="text-sm text-muted-foreground">R$ {Number(item.products.price).toFixed(2)}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                      disabled={loading === item.id || item.quantity <= 1}
                    >
                      -
                    </Button>
                    <Input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => {
                        const newQty = Number.parseInt(e.target.value) || 1
                        if (newQty !== item.quantity) {
                          handleUpdateQuantity(item.id, newQty)
                        }
                      }}
                      className="w-16 text-center"
                      min="1"
                      disabled={loading === item.id}
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                      disabled={loading === item.id}
                    >
                      +
                    </Button>
                  </div>

                  <div className="text-right min-w-24">
                    <p className="font-semibold">R$ {(Number(item.products.price) * item.quantity).toFixed(2)}</p>
                  </div>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRemove(item.id)}
                    disabled={loading === item.id}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}

              <Button
                size="lg"
                className="w-full"
                onClick={() => handleOpenCheckout(partnerId)}
                disabled={selectedItems.length === 0}
              >
                Finalizar Compra - R$ {total.toFixed(2)}
              </Button>
            </CardContent>
          </Card>
        )
      })}

      {checkoutPartner && itemsByPartner[checkoutPartner] && (
        <UnifiedCheckoutModal
          open={true}
          onClose={() => setCheckoutPartner(null)}
          products={itemsByPartner[checkoutPartner].items
            .filter((item: any) => item.selected !== false)
            .map((item: any) => ({
              id: item.product_id,
              name: item.products.name,
              price: Number(item.products.price),
              quantity: item.quantity,
            }))}
          partnerInfo={{
            address: itemsByPartner[checkoutPartner].partner.address,
            paymentMethods: itemsByPartner[checkoutPartner].paymentMethods,
          }}
          onSubmit={handleCheckout}
        />
      )}
    </div>
  )
}
