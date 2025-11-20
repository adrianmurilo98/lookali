"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { addToCartAction } from "@/app/actions/cart"
import { ShoppingCart, ShoppingBag, Minus, Plus } from "lucide-react"
import { UnifiedCheckoutModal } from "@/components/unified-checkout-modal"
import { createOrderAction } from "@/app/actions/orders"

export function ProductPurchaseSection({ product, userId }: { product: any; userId: string }) {
  const router = useRouter()
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(false)
  const [showCheckoutModal, setShowCheckoutModal] = useState(false)

  const handleAddToCart = async () => {
    if (quantity < 1 || quantity > product.stock_quantity) {
      alert("Quantidade inválida")
      return
    }

    setLoading(true)
    const result = await addToCartAction(product.id, quantity)

    if (result.error) {
      alert(result.error)
    } else {
      alert("Produto adicionado ao carrinho!")
      router.refresh()
    }

    setLoading(false)
  }

  const handleBuyNow = () => {
    if (quantity < 1 || quantity > product.stock_quantity) {
      alert("Quantidade inválida")
      return
    }
    setShowCheckoutModal(true)
  }

  const handleCheckout = async (data: {
    deliveryType: "delivery" | "pickup"
    deliveryAddress: string
    paymentMethod: string
    notes: string
    quantities: Record<string, number>
  }) => {
    const finalQuantity = data.quantities[product.id] || quantity

    const result = await createOrderAction({
      itemId: product.id,
      itemType: "product",
      quantity: finalQuantity,
      totalAmount: Number(product.price) * finalQuantity,
      deliveryType: data.deliveryType,
      deliveryAddress: data.deliveryAddress,
      paymentMethod: data.paymentMethod,
      notes: data.notes,
      partnerId: product.partner_id,
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

  const disabled = loading || product.stock_quantity === 0

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Quantidade</Label>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            disabled={disabled || quantity <= 1}
          >
            <Minus className="h-4 w-4" />
          </Button>
          <Input
            type="number"
            value={quantity}
            onChange={(e) => {
              const val = Number.parseInt(e.target.value) || 1
              setQuantity(Math.max(1, Math.min(product.stock_quantity, val)))
            }}
            className="w-20 text-center"
            min="1"
            max={product.stock_quantity}
            disabled={disabled}
          />
          <Button
            size="sm"
            variant="outline"
            onClick={() => setQuantity(Math.min(product.stock_quantity, quantity + 1))}
            disabled={disabled || quantity >= product.stock_quantity}
          >
            <Plus className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground ml-2">(máx: {product.stock_quantity})</span>
        </div>
      </div>

      <div className="space-y-2">
        <Button onClick={handleBuyNow} disabled={disabled} className="w-full" size="lg">
          <ShoppingBag className="mr-2 h-5 w-5" />
          Comprar Agora - R$ {(Number(product.price) * quantity).toFixed(2)}
        </Button>

        <Button
          onClick={handleAddToCart}
          disabled={disabled}
          variant="outline"
          className="w-full bg-transparent"
          size="lg"
        >
          <ShoppingCart className="mr-2 h-5 w-5" />
          {loading ? "Adicionando..." : "Adicionar ao Carrinho"}
        </Button>
      </div>

      {showCheckoutModal && (
        <UnifiedCheckoutModal
          open={true}
          onClose={() => setShowCheckoutModal(false)}
          products={[
            {
              id: product.id,
              name: product.name,
              price: Number(product.price),
              quantity: quantity,
            },
          ]}
          partnerInfo={{
            address: product.partners.address,
            paymentMethods: product.partners.paymentMethods || [],
          }}
          onSubmit={handleCheckout}
        />
      )}
    </div>
  )
}
