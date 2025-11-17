"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Pencil, Trash2 } from "lucide-react"
import { PaymentMethodDialog } from "./payment-method-dialog"
import { deletePaymentMethodAction } from "@/app/actions/payment-methods"

interface PaymentMethod {
  id: string
  name: string
  payment_type: string
  card_brand?: string | null
  is_active: boolean
  max_installments?: number
  fee_type?: string
  percentage_rate?: number
  fixed_amount?: number
  receiving_days?: number
  discount_percent?: number | null
}

interface PaymentMethodsGridProps {
  partnerId: string
  methods: PaymentMethod[]
  onUpdate: () => Promise<void>
}

export function PaymentMethodsGrid({ partnerId, methods, onUpdate }: PaymentMethodsGridProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

  const handleEdit = (method: PaymentMethod) => {
    setEditingMethod(method)
    setIsDialogOpen(true)
  }

  const handleDelete = async (methodId: string) => {
    if (!confirm("Tem certeza que deseja excluir este método de pagamento?")) return

    setIsDeleting(methodId)
    const result = await deletePaymentMethodAction(methodId)

    if (result.error) {
      alert("Erro ao excluir método: " + result.error)
    } else {
      await onUpdate()
    }

    setIsDeleting(null)
  }

  const handleCloseDialog = async (shouldReload?: boolean) => {
    setIsDialogOpen(false)
    setTimeout(() => {
      setEditingMethod(null)
    }, 200)

    if (shouldReload) {
      await onUpdate()
    }
  }

  const getPaymentTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      dinheiro: "Dinheiro",
      pix: "PIX",
      credito: "Cartão de Crédito",
      debito: "Cartão de Débito",
      vale_alimentacao: "Vale Alimentação",
      vale_refeicao: "Vale Refeição",
      outros: "Outros",
    }
    return types[type] || type
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Métodos de Pagamento Cadastrados</h3>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Adicionar Método
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {methods.map((method) => (
          <Card key={method.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-base">{method.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{getPaymentTypeLabel(method.payment_type)}</p>
                </div>
                <Badge variant={method.is_active ? "default" : "secondary"}>
                  {method.is_active ? "Ativa" : "Inativa"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {method.card_brand && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Bandeira</p>
                  <p className="text-sm font-medium capitalize">{method.card_brand.replace("_", " ")}</p>
                </div>
              )}

              {method.max_installments && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Máx. parcelas</p>
                  <p className="text-sm font-medium">{method.max_installments}x</p>
                </div>
              )}

              {method.discount_percent && method.discount_percent > 0 && (
                <div className="bg-green-50 rounded p-2">
                  <p className="text-xs text-muted-foreground mb-1">Desconto do cliente</p>
                  <p className="text-sm font-semibold text-green-600">{method.discount_percent.toFixed(2)}%</p>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => handleEdit(method)} className="flex-1">
                  <Pencil className="mr-1 h-3 w-3" />
                  Editar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(method.id)}
                  disabled={isDeleting === method.id}
                  className="flex-1"
                >
                  <Trash2 className="mr-1 h-3 w-3" />
                  {isDeleting === method.id ? "..." : "Excluir"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {methods.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">Nenhum método de pagamento cadastrado</p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Primeiro Método
            </Button>
          </CardContent>
        </Card>
      )}

      <PaymentMethodDialog
        open={isDialogOpen}
        onClose={handleCloseDialog}
        partnerId={partnerId}
        editingMethod={editingMethod}
      />
    </div>
  )
}
