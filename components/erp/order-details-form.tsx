"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { updateOrderAction, deleteOrderAction } from "@/app/actions/orders"

export function OrderDetailsForm({ order }: { order: any }) {
  const router = useRouter()
  const [situation, setSituation] = useState(order.situation || "pending")
  const [internalNotes, setInternalNotes] = useState(order.internal_notes || "")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const result = await updateOrderAction(order.id, {
        situation,
        internal_notes: internalNotes,
      })

      if (result?.error) {
        alert(result.error)
      } else {
        alert("Pedido atualizado com sucesso!")
        router.push("/erp/orders")
      }
    } catch (error) {
      console.error("[v0] Error updating order:", error)
      alert("Erro ao atualizar pedido. Tente novamente.")
    }

    setLoading(false)
  }

  const handleDelete = async () => {
    if (!confirm("Tem certeza que deseja excluir este pedido?")) return

    setLoading(true)

    try {
      const result = await deleteOrderAction(order.id)

      if (result?.error) {
        alert(result.error)
      } else {
        alert("Pedido excluído com sucesso!")
        router.push("/erp/orders")
      }
    } catch (error) {
      console.error("[v0] Error deleting order:", error)
      alert("Erro ao excluir pedido. Tente novamente.")
    }

    setLoading(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gerenciar Pedido</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Situação do Pedido</Label>
            <Select value={situation} onValueChange={setSituation}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="paid">Pago</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Ao marcar como "Pago", o estoque será automaticamente atualizado
            </p>
          </div>

          {order.notes && (
            <div className="space-y-2">
              <Label>Observações do Cliente</Label>
              <div className="p-3 bg-muted rounded-md">
                <p className="text-sm">{order.notes}</p>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>Observações Internas</Label>
            <Textarea
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
              placeholder="Adicione observações internas sobre este pedido (não visível para o cliente)..."
              rows={4}
            />
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : "Salvar Alterações"}
            </Button>
            <Button type="button" variant="destructive" onClick={handleDelete} disabled={loading}>
              Excluir Pedido
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
