"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { createProductAction, updateProductAction } from "@/app/actions/products"

interface ProductFormProps {
  partnerId: string
  product?: {
    id: string
    name: string
    description: string | null
    price: number
    stock_quantity: number
    category: string | null
    is_active: boolean
  }
}

export function ProductForm({ partnerId, product }: ProductFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: product?.name || "",
    description: product?.description || "",
    price: product?.price || 0,
    stockQuantity: product?.stock_quantity || 0,
    category: product?.category || "",
    isActive: product?.is_active ?? true,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const result = product
        ? await updateProductAction(product.id, formData)
        : await createProductAction({ ...formData, partnerId })

      if (result?.error) {
        setError(result.error)
      } else if (result?.success) {
        router.push("/erp/products")
        router.refresh()
      }
    } catch (err) {
      console.error("Erro ao salvar produto:", err)
      setError("Erro ao salvar produto")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Nome do produto*</Label>
            <Input
              id="name"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="category">Categoria</Label>
            <Input
              id="category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="price">Preço (R$)*</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                required
                value={formData.price}
                onChange={(e) =>
                  setFormData({ ...formData, price: e.target.value === "" ? 0 : Number.parseFloat(e.target.value) })
                }
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="stockQuantity">Quantidade em estoque*</Label>
              <Input
                id="stockQuantity"
                type="number"
                min="0"
                required
                value={formData.stockQuantity}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    stockQuantity: e.target.value === "" ? 0 : Number.parseInt(e.target.value),
                  })
                }
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked as boolean })}
            />
            <Label htmlFor="isActive">Produto ativo (visível no marketplace)</Label>
          </div>

          {error && <div className="p-4 bg-red-50 text-red-600 rounded-md text-sm">{error}</div>}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Salvando..." : product ? "Atualizar produto" : "Criar produto"}
          </Button>
        </CardContent>
      </Card>
    </form>
  )
}
