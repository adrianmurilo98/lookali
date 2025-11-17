"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Pencil, Trash2 } from "lucide-react"
import { PaymentMethodDialog } from "./payment-method-dialog"

interface PaymentMethod {
  id: string
  name: string
  payment_type: string
  card_brand?: string
  is_active: boolean
}

interface PaymentMethodsManagerProps {
  partnerId: string
  paymentMethods: PaymentMethod[]
}

const paymentTypeLabels: Record<string, string> = {
  dinheiro: "Dinheiro",
  pix: "PIX",
  cartao_credito: "Cartão de Crédito",
  cartao_debito: "Cartão de Débito",
  vale_alimentacao: "Vale Alimentação",
  vale_refeicao: "Vale Refeição",
  outros: "Outros",
}

export function PaymentMethodsManager({ partnerId, paymentMethods: initial }: PaymentMethodsManagerProps) {
  const [paymentMethods, setPaymentMethods] = useState(initial)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null)

  const handleEdit = (method: PaymentMethod) => {
    setEditingMethod(method)
    setDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Deseja realmente excluir este método de pagamento?")) return

    // TODO: Implementar ação de delete
    setPaymentMethods(paymentMethods.filter((m) => m.id !== id))
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Métodos de Pagamento</h3>
        <Button
          onClick={() => {
            setEditingMethod(null)
            setDialogOpen(true)
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Adicionar
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {paymentMethods.map((method) => (
          <Card key={method.id}>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-base">{method.name}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {paymentTypeLabels[method.payment_type] || method.payment_type}
                  </p>
                  {method.card_brand && (
                    <p className="text-xs text-muted-foreground mt-1">Bandeira: {method.card_brand}</p>
                  )}
                </div>
                <Badge variant={method.is_active ? "default" : "secondary"}>
                  {method.is_active ? "Ativa" : "Inativa"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 bg-transparent"
                  onClick={() => handleEdit(method)}
                >
                  <Pencil className="h-3 w-3 mr-1" />
                  Editar
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleDelete(method.id)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <PaymentMethodDialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false)
          setEditingMethod(null)
        }}
        partnerId={partnerId}
        editingMethod={editingMethod}
        onSuccess={(newMethod) => {
          if (editingMethod) {
            setPaymentMethods(paymentMethods.map((m) => (m.id === newMethod.id ? newMethod : m)))
          } else {
            setPaymentMethods([...paymentMethods, newMethod])
          }
          setDialogOpen(false)
          setEditingMethod(null)
        }}
      />
    </div>
  )
}
