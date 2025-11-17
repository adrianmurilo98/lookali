"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { deleteProductAction, duplicateProductAction } from "@/app/actions/products"
import Link from "next/link"
import { Copy, Trash2 } from 'lucide-react'
import Image from "next/image"

interface Product {
  id: string
  name: string
  description: string | null
  price: number
  stock_quantity: number
  category: string | null
  is_active: boolean
  sku: string | null
  rating: number
  images: string[] | null
}

export function ProductsList({ products, partnerId }: { products: Product[]; partnerId: string }) {
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja deletar este produto?")) return

    setDeletingId(id)
    await deleteProductAction(id)
    setDeletingId(null)
  }

  const handleDuplicate = async (id: string) => {
    setDuplicatingId(id)
    const result = await duplicateProductAction(id)

    if (result.error) {
      alert("Erro ao duplicar: " + result.error)
    } else {
      alert(`Produto duplicado com sucesso! Código: ${result.newSku}`)
      window.location.reload()
    }

    setDuplicatingId(null)
  }

  if (products.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <p className="text-muted-foreground mb-4">Nenhum produto cadastrado ainda</p>
          <Button asChild>
            <Link href="/erp/products/new">Adicionar primeiro produto</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {products.map((product) => (
        <Card key={product.id}>
          {product.images && product.images.length > 0 && (
            <div className="relative w-full h-48">
              <Image
                src={product.images[0] || "/placeholder.svg"}
                alt={product.name}
                fill
                className="object-cover rounded-t-lg"
              />
            </div>
          )}
          <CardHeader>
            <CardTitle className="text-lg">{product.name}</CardTitle>
            {product.category && <p className="text-sm text-muted-foreground">{product.category}</p>}
            {product.sku && <p className="text-xs text-muted-foreground">Código: {product.sku}</p>}
          </CardHeader>
          <CardContent className="space-y-2">
            {product.description && <p className="text-sm line-clamp-2">{product.description}</p>}
            <div className="flex justify-between text-sm">
              <span>Preço:</span>
              <span className="font-semibold">R$ {Number(product.price).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Estoque:</span>
              <span className={product.stock_quantity < 10 ? "text-red-500" : ""}>{product.stock_quantity} un</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Status:</span>
              <span className={product.is_active ? "text-green-600" : "text-gray-500"}>
                {product.is_active ? "Ativo" : "Inativo"}
              </span>
            </div>
            <div className="flex gap-2 pt-2 flex-wrap">
              <Button asChild variant="outline" size="sm" className="flex-1 bg-transparent">
                <Link href={`/erp/products/${product.id}`}>Editar</Link>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDuplicate(product.id)}
                disabled={duplicatingId === product.id}
                title="Duplicar produto"
              >
                <Copy className="h-3 w-3" />
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleDelete(product.id)}
                disabled={deletingId === product.id}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
