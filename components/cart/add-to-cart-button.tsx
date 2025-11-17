"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { addToCartAction } from "@/app/actions/cart"
import { ShoppingCart } from "lucide-react"

export function AddToCartButton({ productId, disabled }: { productId: string; disabled?: boolean }) {
  const [loading, setLoading] = useState(false)

  const handleAddToCart = async () => {
    setLoading(true)
    const result = await addToCartAction(productId, 1)

    if (result.error) {
      alert(result.error)
    } else {
      alert("Produto adicionado ao carrinho!")
    }

    setLoading(false)
  }

  return (
    <Button onClick={handleAddToCart} disabled={loading || disabled} className="w-full" size="lg">
      <ShoppingCart className="mr-2 h-5 w-5" />
      {loading ? "Adicionando..." : "Adicionar ao Carrinho"}
    </Button>
  )
}
