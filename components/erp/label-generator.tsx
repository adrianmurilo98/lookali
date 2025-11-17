"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { LabelPreview } from "./label-preview"
import { Printer } from "lucide-react"

interface Product {
  id: string
  name: string
  sku: string | null
  gtin: string | null
  price: number
  description: string | null
}

interface SelectedProduct {
  productId: string
  quantity: number
}

export function LabelGenerator({ products }: { products: Product[] }) {
  const [search, setSearch] = useState("")
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([])
  const [layout, setLayout] = useState("25")
  const [showPreview, setShowPreview] = useState(false)

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku?.toLowerCase().includes(search.toLowerCase()) ||
      p.gtin?.toLowerCase().includes(search.toLowerCase()),
  )

  const toggleProductSelection = (productId: string) => {
    setSelectedProducts((prev) => {
      const existing = prev.find((p) => p.productId === productId)
      if (existing) {
        return prev.filter((p) => p.productId !== productId)
      } else {
        return [...prev, { productId, quantity: 1 }]
      }
    })
  }

  const updateQuantity = (productId: string, quantity: number) => {
    setSelectedProducts((prev) =>
      prev.map((p) => (p.productId === productId ? { ...p, quantity: Math.max(1, quantity) } : p)),
    )
  }

  const selectedProductsData = selectedProducts
    .map((sp) => {
      const product = products.find((p) => p.id === sp.productId)
      return product ? { ...product, labelQuantity: sp.quantity } : null
    })
    .filter(Boolean) as (Product & { labelQuantity: number })[]

  const totalLabels = selectedProducts.reduce((sum, p) => sum + p.quantity, 0)

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Seleção de Produtos */}
      <div className="lg:col-span-1 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Buscar Produtos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Input
                placeholder="Buscar por nome, SKU ou GTIN..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredProducts.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhum produto encontrado</p>
              ) : (
                filteredProducts.map((product) => {
                  const isSelected = selectedProducts.some((p) => p.productId === product.id)
                  return (
                    <div key={product.id} className="flex items-start space-x-2 p-2 hover:bg-accent rounded">
                      <Checkbox
                        id={product.id}
                        checked={isSelected}
                        onCheckedChange={() => toggleProductSelection(product.id)}
                      />
                      <label htmlFor={product.id} className="flex-1 cursor-pointer text-sm">
                        <p className="font-medium">{product.name}</p>
                        <p className="text-xs text-muted-foreground">
                          SKU: {product.sku || "—"} | R$ {Number(product.price).toFixed(2)}
                        </p>
                      </label>
                    </div>
                  )
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Configurações e Preview */}
      <div className="lg:col-span-2 space-y-4">
        {selectedProducts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quantidade de Etiquetas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {selectedProductsData.map((product) => (
                <div key={product.id} className="flex items-center justify-between gap-2">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{product.name}</p>
                    <p className="text-xs text-muted-foreground">SKU: {product.sku}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const current = selectedProducts.find((p) => p.productId === product.id)?.quantity || 1
                        updateQuantity(product.id, current - 1)
                      }}
                    >
                      −
                    </Button>
                    <Input
                      type="number"
                      min="1"
                      max="100"
                      value={selectedProducts.find((p) => p.productId === product.id)?.quantity || 1}
                      onChange={(e) => updateQuantity(product.id, Number.parseInt(e.target.value) || 1)}
                      className="w-16 text-center"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const current = selectedProducts.find((p) => p.productId === product.id)?.quantity || 1
                        updateQuantity(product.id, current + 1)
                      }}
                    >
                      +
                    </Button>
                  </div>
                </div>
              ))}

              <div className="pt-3 border-t">
                <p className="text-sm font-semibold">Total de etiquetas: {totalLabels}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {selectedProducts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Configurações de Impressão</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="layout">Formato da Página A4</Label>
                <Select value={layout} onValueChange={setLayout}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="18">18 etiquetas por página (3×6)</SelectItem>
                    <SelectItem value="21">21 etiquetas por página (3×7)</SelectItem>
                    <SelectItem value="25">25 etiquetas por página (5×5)</SelectItem>
                    <SelectItem value="65">65 etiquetas por página (5×13)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={() => setShowPreview(true)} className="w-full" size="lg">
                <Printer className="mr-2 h-4 w-4" />
                Visualizar e Imprimir
              </Button>
            </CardContent>
          </Card>
        )}

        {selectedProducts.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">Selecione produtos para gerar etiquetas</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modal de Preview */}
      {showPreview && (
        <LabelPreview products={selectedProductsData} layout={layout} onClose={() => setShowPreview(false)} />
      )}
    </div>
  )
}
