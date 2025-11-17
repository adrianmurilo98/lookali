"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { createPaymentMethodAction, updatePaymentMethodAction } from "@/app/actions/payment-methods"

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

interface PaymentMethodDialogProps {
  open: boolean
  onClose: (shouldReload?: boolean) => void
  partnerId: string
  editingMethod: PaymentMethod | null
}

const cardBrands = [
  { value: "visa", label: "Visa" },
  { value: "mastercard", label: "Mastercard" },
  { value: "american_express", label: "American Express" },
  { value: "elo", label: "Elo" },
  { value: "hipercard", label: "Hipercard" },
  { value: "diners_club", label: "Diners Club" },
  { value: "aura", label: "Aura" },
  { value: "cabal", label: "Cabal" },
  { value: "sorocredi", label: "Sorocredi" },
  { value: "outros", label: "Outros" },
]

export function PaymentMethodDialog({ open, onClose, partnerId, editingMethod }: PaymentMethodDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: "",
    payment_type: "dinheiro",
    card_brand: "",
    is_active: true,
    max_installments: 12,
    fee_type: "percentage",
    percentage_rate: 0,
    fixed_amount: 0,
    receiving_days: 0,
    discount_percent: 0,
  })

  useEffect(() => {
    if (editingMethod && open) {
      setFormData({
        name: editingMethod.name,
        payment_type: editingMethod.payment_type,
        card_brand: editingMethod.card_brand || "",
        is_active: editingMethod.is_active,
        max_installments: editingMethod.max_installments || 12,
        fee_type: editingMethod.fee_type || "percentage",
        percentage_rate: editingMethod.percentage_rate || 0,
        fixed_amount: editingMethod.fixed_amount || 0,
        receiving_days: editingMethod.receiving_days || 0,
        discount_percent: editingMethod.discount_percent || 0,
      })
    } else if (!editingMethod && open) {
      setFormData({
        name: "",
        payment_type: "dinheiro",
        card_brand: "",
        is_active: true,
        max_installments: 12,
        fee_type: "percentage",
        percentage_rate: 0,
        fixed_amount: 0,
        receiving_days: 0,
        discount_percent: 0,
      })
    }
    setError(null)
  }, [editingMethod, open])

  const showCardFields = formData.payment_type === "credito" || formData.payment_type === "debito"

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    if (!formData.name.trim()) {
      setError("Nome é obrigatório")
      setIsLoading(false)
      return
    }

    if (showCardFields && !formData.card_brand) {
      setError("Selecione a bandeira do cartão")
      setIsLoading(false)
      return
    }

    try {
      if (editingMethod) {
        const result = await updatePaymentMethodAction(editingMethod.id, {
          name: formData.name,
          isActive: formData.is_active,
          cardBrand: showCardFields ? formData.card_brand : null,
          maxInstallments: formData.payment_type === "credito" ? formData.max_installments : null,
          feeType: formData.fee_type,
          percentageRate: formData.percentage_rate,
          fixedAmount: formData.fixed_amount,
          receivingDays: formData.receiving_days,
          discountPercent: formData.discount_percent,
        })

        if (result.error) {
          setError(result.error)
        } else {
          onClose(true)
        }
      } else {
        const result = await createPaymentMethodAction({
          partnerId,
          name: formData.name,
          paymentType: formData.payment_type,
          cardBrand: showCardFields ? formData.card_brand : null,
          maxInstallments: formData.payment_type === "credito" ? formData.max_installments : null,
          feeType: formData.fee_type,
          percentageRate: formData.percentage_rate,
          fixedAmount: formData.fixed_amount,
          receivingDays: formData.receiving_days,
          discountPercent: formData.discount_percent,
        })

        if (result.error) {
          setError(result.error)
        } else {
          onClose(true)
        }
      }
    } catch (err) {
      setError("Erro ao salvar método de pagamento")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={() => onClose(false)}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingMethod ? "Editar" : "Adicionar"} Método de Pagamento</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome / Descrição*</Label>
              <Input
                id="name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Cartão Visa, PIX, etc"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="payment_type">Tipo de Pagamento*</Label>
              <Select
                value={formData.payment_type}
                onValueChange={(value) => setFormData({ ...formData, payment_type: value, card_brand: "" })}
                disabled={!!editingMethod}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dinheiro">Dinheiro</SelectItem>
                  <SelectItem value="pix">PIX</SelectItem>
                  <SelectItem value="credito">Cartão de Crédito</SelectItem>
                  <SelectItem value="debito">Cartão de Débito</SelectItem>
                  <SelectItem value="vale_alimentacao">Vale Alimentação</SelectItem>
                  <SelectItem value="vale_refeicao">Vale Refeição</SelectItem>
                  <SelectItem value="outros">Outros</SelectItem>
                </SelectContent>
              </Select>
              {editingMethod && (
                <p className="text-xs text-muted-foreground">O tipo não pode ser alterado após a criação</p>
              )}
            </div>

            {showCardFields && (
              <div className="grid gap-2">
                <Label htmlFor="card_brand">Bandeira do Cartão*</Label>
                <Select
                  value={formData.card_brand}
                  onValueChange={(value) => setFormData({ ...formData, card_brand: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a bandeira" />
                  </SelectTrigger>
                  <SelectContent>
                    {cardBrands.map((brand) => (
                      <SelectItem key={brand.value} value={brand.value}>
                        {brand.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {formData.payment_type === "credito" && (
              <div className="grid gap-2">
                <Label htmlFor="max_installments">Máximo de Parcelas</Label>
                <Input
                  id="max_installments"
                  type="number"
                  min="1"
                  max="24"
                  value={formData.max_installments}
                  onChange={(e) => setFormData({ ...formData, max_installments: Number.parseInt(e.target.value) })}
                />
              </div>
            )}

            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked as boolean })}
              />
              <Label htmlFor="is_active">Método ativo</Label>
            </div>
          </div>

          <div className="space-y-4 border-t pt-4">
            <h3 className="font-semibold">Desconto do Cliente</h3>
            <div className="grid gap-2">
              <Label htmlFor="discount_percent">Desconto (%)</Label>
              <Input
                id="discount_percent"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={formData.discount_percent}
                onChange={(e) => setFormData({ ...formData, discount_percent: Number.parseFloat(e.target.value) || 0 })}
                placeholder="0,00"
              />
              <p className="text-xs text-muted-foreground">Desconto automático aplicado ao cliente para este método</p>
            </div>
          </div>

          <div className="space-y-4 border-t pt-4">
            <h3 className="font-semibold">Informações de Taxas</h3>
            <p className="text-sm text-muted-foreground">
              Configure as taxas que serão aplicadas neste método de pagamento
            </p>

            <div className="grid gap-2">
              <Label>Tipo da taxa</Label>
              <RadioGroup
                value={formData.fee_type}
                onValueChange={(value) => setFormData({ ...formData, fee_type: value })}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="percentage" id="percentage" />
                  <Label htmlFor="percentage">Alíquota (%)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="fixed" id="fixed" />
                  <Label htmlFor="fixed">Fixa (R$)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="both" id="both" />
                  <Label htmlFor="both">Alíquota + Fixa</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(formData.fee_type === "percentage" || formData.fee_type === "both") && (
                <div className="grid gap-2">
                  <Label htmlFor="percentage_rate">Valor alíquota (%)</Label>
                  <Input
                    id="percentage_rate"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={formData.percentage_rate}
                    onChange={(e) =>
                      setFormData({ ...formData, percentage_rate: Number.parseFloat(e.target.value) || 0 })
                    }
                    placeholder="0,00"
                  />
                </div>
              )}

              {(formData.fee_type === "fixed" || formData.fee_type === "both") && (
                <div className="grid gap-2">
                  <Label htmlFor="fixed_amount">Valor fixo (R$)</Label>
                  <Input
                    id="fixed_amount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.fixed_amount}
                    onChange={(e) => setFormData({ ...formData, fixed_amount: Number.parseFloat(e.target.value) || 0 })}
                    placeholder="0,00"
                  />
                </div>
              )}

              <div className="grid gap-2">
                <Label htmlFor="receiving_days">Prazo de recebimento (dias)</Label>
                <Input
                  id="receiving_days"
                  type="number"
                  min="0"
                  value={formData.receiving_days}
                  onChange={(e) => setFormData({ ...formData, receiving_days: Number.parseInt(e.target.value) || 0 })}
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 bg-transparent"
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={isLoading}>
              {isLoading ? "Salvando..." : editingMethod ? "Atualizar" : "Adicionar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
