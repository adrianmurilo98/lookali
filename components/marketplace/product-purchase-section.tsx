"use client"

import { useState } from "react"
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { addToCartAction } from "@/app/actions/cart"
import { ShoppingCart, ShoppingBag, Minus, Plus } from 'lucide-react'
import { UnifiedCheckoutModal } from "@/components/unified-checkout-modal"
import { createOrderAction } from "@/app/actions/orders"
import { useToast } from "@/hooks/use-toast"

export function ProductPurchaseSection({ product, userId }: { product: any; userId: string }) {
  const router = useRouter()
  const { toast } = useToast()
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(false)
  const [showCheckoutModal, setShowCheckoutModal] = useState(false)
  const [isCheckingOut, setIsCheckingOut] = useState(false)

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
    installments: number
    useMercadoPago?: boolean
  }) => {
    console.log("[v0] Starting checkout with data:", data)
    const finalQuantity = data.quantities[product.id] || quantity
    setIsCheckingOut(true)

    console.log("[v0] Creating order for product:", product.id, "quantity:", finalQuantity)
    
    // Create order first
    const result = await createOrderAction({
      itemId: product.id,
      itemType: "product",
      quantity: finalQuantity,
      totalAmount: Number(product.price) * finalQuantity,
      deliveryType: data.deliveryType,
      deliveryAddress: data.deliveryAddress,
      paymentMethod: data.useMercadoPago ? "Mercado Pago" : data.paymentMethod,
      notes: data.notes,
      partnerId: product.partner_id,
      buyerId: userId,
    })

    console.log("[v0] Order creation result:", result)

    if (result.error) {
      console.error("[v0] Error creating order:", result.error)
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
      console.log("[v0] Using Mercado Pago, creating preference for order:", result.orderId)
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

        console.log("[v0] MP API response status:", response.status)
        const mpResult = await response.json()
        console.log("[v0] MP API result:", mpResult)

        if (mpResult.success && mpResult.initPoint) {
          console.log("[v0] Redirecting to Mercado Pago:", mpResult.initPoint)
          window.location.href = mpResult.initPoint
        } else {
          console.error("[v0] MP checkout failed:", mpResult.error)
          toast({
            title: "Erro",
            description: mpResult.error || "Erro ao criar checkout",
            variant: "destructive",
          })
          setIsCheckingOut(false)
        }
      } catch (error) {
        console.error("[v0] Exception during MP checkout:", error)
        toast({
          title: "Erro",
          description: "Erro ao processar pagamento",
          variant: "destructive",
        })
        setIsCheckingOut(false)
      }
    } else {
      // Regular checkout flow
      console.log("[v0] Regular checkout completed, order:", result.orderNumber)
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
        <Button onClick={handleBuyNow} disabled={disabled || isCheckingOut} className="w-full" size="lg">
          <ShoppingBag className="mr-2 h-5 w-5" />
          {isCheckingOut ? "Processando..." : `Comprar Agora - R$ ${(Number(product.price) * quantity).toFixed(2)}`}
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
