"use client"

import type React from "react"
import { useEffect } from "react"
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, Trash2 } from 'lucide-react'
import { createKitAction, updateKitAction } from "@/app/actions/kits"
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes"
import { UnsavedChangesDialog } from "@/components/reusable/UnsavedChangesDialog"

interface Product {
  id: string
  name: string
  price: number
  stock_quantity: number
}

interface KitItem {
  product_id: string
  quantity: number
}

interface Kit {
  id: string
  name: string
  description: string | null
  sku: string | null
  kit_price: number
  is_active: boolean
  kit_items: {
    products: {
      id: string
      name: string
      price: number
    }
    quantity: number
  }[]
}

interface KitFormProps {
  partnerId: string
  products: Product[]
  kit?: Kit
}

export function KitForm({ partnerId, products, kit }: KitFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isDirty, setIsDirty] = useState(false)
  const {
    showConfirmDialog,
    confirmNavigation,
    cancelNavigation,
    handleNavigation,
  } = useUnsavedChanges(isDirty)

  const [name, setName] = useState(kit?.name || "")
  const [description, setDescription] = useState(kit?.description || "")
  const [kitPrice, setKitPrice] = useState(kit?.kit_price.toString() || "")
  const [isActive, setIsActive] = useState(kit?.is_active ?? true)
  const [items, setItems] = useState<KitItem[]>(
    kit?.kit_items.map((item) => ({
      product_id: item.products.id,
      quantity: item.quantity,
    })) || [],
  )

  useEffect(() => {
    const hasChanges =
      name !== (kit?.name || "") ||
      description !== (kit?.description || "") ||
      kitPrice !== (kit?.kit_price.toString() || "") ||
      items.length > 0
    setIsDirty(hasChanges)
  }, [name, description, kitPrice, items, kit])

  const addItem = () => {
    if (products.length > 0) {
      setItems([...items, { product_id: products[0].id, quantity: 1 }])
    }
  }

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const updateItem = (index: number, field: "product_id" | "quantity", value: string | number) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    setItems(newItems)
  }

  const calculateTotalPrice = () => {
    return items.reduce((total, item) => {
      const product = products.find((p) => p.id === item.product_id)
      return total + (product?.price || 0) * item.quantity
    }, 0)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    const data = {
      name,
      description,
      kitPrice: Number.parseFloat(kitPrice),
      isActive,
      items: items.map((item) => ({
        productId: item.product_id,
        quantity: item.quantity,
      })),
    }

    const result = kit ? await updateKitAction(kit.id, data) : await createKitAction({ ...data, partnerId })

    if (result.error) {
      alert("Erro: " + result.error)
      setIsLoading(false)
    } else {
      router.push("/erp/kits")
    }
  }

  const totalProductsPrice = calculateTotalPrice()
  const savings = totalProductsPrice - Number.parseFloat(kitPrice || "0")

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Informações do Kit</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Nome do Kit*</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="kitPrice">Preço do Kit (R$)*</Label>
            <Input
              id="kitPrice"
              type="number"
              step="0.01"
              min="0"
              value={kitPrice}
              onChange={(e) => setKitPrice(e.target.value)}
              required
            />
            {totalProductsPrice > 0 && (
              <p className="text-sm text-muted-foreground">
                Preço total dos produtos: R$ {totalProductsPrice.toFixed(2)}
                {savings > 0 && <span className="text-green-600 ml-2">(Economia: R$ {savings.toFixed(2)})</span>}
              </p>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox id="isActive" checked={isActive} onCheckedChange={(checked) => setIsActive(checked === true)} />
            <Label htmlFor="isActive" className="cursor-pointer">
              Kit ativo
            </Label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Produtos do Kit</CardTitle>
            <Button type="button" onClick={addItem} size="sm" disabled={products.length === 0}>
              <Plus className="mr-1 h-4 w-4" />
              Adicionar Produto
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Nenhum produto adicionado ainda</p>
          ) : (
            <div className="space-y-4">
              {items.map((item, index) => {
                const product = products.find((p) => p.id === item.product_id)
                return (
                  <div key={index} className="flex gap-4 items-start p-4 border rounded-lg">
                    <div className="flex-1 grid gap-4 md:grid-cols-3">
                      <div className="md:col-span-2">
                        <Label>Produto</Label>
                        <Select
                          value={item.product_id}
                          onValueChange={(value) => updateItem(index, "product_id", value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {products.map((p) => (
                              <SelectItem key={p.id} value={p.id}>
                                {p.name} - R$ {p.price.toFixed(2)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Quantidade</Label>
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateItem(index, "quantity", Number.parseInt(e.target.value))}
                        />
                        {product && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Subtotal: R$ {(product.price * item.quantity).toFixed(2)}
                          </p>
                        )}
                      </div>
                    </div>
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(index)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-4 justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={() => handleNavigation()}
          disabled={isLoading}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading || items.length === 0}>
          {isLoading ? "Salvando..." : kit ? "Atualizar Kit" : "Criar Kit"}
        </Button>
      </div>

      <UnsavedChangesDialog
        open={showConfirmDialog}
        onConfirm={confirmNavigation}
        onCancel={cancelNavigation}
      />
    </form>
  )
}
