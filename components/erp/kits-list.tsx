"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { deleteKitAction } from "@/app/actions/kits"
import Link from "next/link"
import { Trash2, Edit2 } from "lucide-react"

interface Kit {
  id: string
  name: string
  description: string | null
  sku: string | null
  kit_price: number
  is_active: boolean
  kit_items: {
    id: string
    quantity: number
    products: {
      name: string
      price: number
    }
  }[]
}

export function KitsList({ kits, partnerId }: { kits: Kit[]; partnerId: string }) {
  const [deleting, setDeleting] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja deletar este kit?")) return

    setDeleting(id)
    const result = await deleteKitAction(id)

    if (result.error) {
      alert("Erro: " + result.error)
    } else {
      window.location.reload()
    }

    setDeleting(null)
  }

  if (kits.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <p className="text-muted-foreground mb-4">Nenhum kit cadastrado ainda</p>
          <Button asChild>
            <Link href="/erp/kits/new">Criar primeiro kit</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {kits.map((kit) => (
        <Card key={kit.id}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <CardTitle className="text-lg">{kit.name}</CardTitle>
                <p className="text-xs text-muted-foreground">SKU: {kit.sku}</p>
              </div>
              <Badge variant={kit.is_active ? "default" : "secondary"}>{kit.is_active ? "Ativo" : "Inativo"}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {kit.description && <p className="text-sm line-clamp-2">{kit.description}</p>}

            <div>
              <p className="text-xs text-muted-foreground mb-2">Produtos ({kit.kit_items.length})</p>
              <ul className="text-xs space-y-1">
                {kit.kit_items.map((item) => (
                  <li key={item.id} className="text-muted-foreground">
                    {item.quantity}x {item.products.name}
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-2 border-t">
              <p className="text-sm font-semibold">R$ {Number(kit.kit_price).toFixed(2)}</p>
            </div>

            <div className="flex gap-2 pt-2">
              <Button asChild variant="outline" size="sm" className="flex-1 bg-transparent">
                <Link href={`/erp/kits/${kit.id}`}>
                  <Edit2 className="mr-1 h-3 w-3" />
                  Editar
                </Link>
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleDelete(kit.id)}
                disabled={deleting === kit.id}
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
