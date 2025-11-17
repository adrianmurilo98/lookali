"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createCustomerAction, updateCustomerAction } from "@/app/actions/customers"

interface CustomerFormProps {
  partnerId: string
  customer?: {
    id: string
    name: string
    email: string | null
    phone: string | null
    address: string | null
    notes: string | null
  }
}

export function CustomerForm({ partnerId, customer }: CustomerFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: customer?.name || "",
    email: customer?.email || "",
    phone: customer?.phone || "",
    address: customer?.address || "",
    notes: customer?.notes || "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log("[v0] CustomerForm: Iniciando submit do formulário")
    setIsLoading(true)
    setError(null)

    try {
      console.log("[v0] CustomerForm: Dados do formulário:", formData)
      const result = customer
        ? await updateCustomerAction(customer.id, formData)
        : await createCustomerAction({ ...formData, partnerId })

      console.log("[v0] CustomerForm: Resultado da action:", result)

      if (result.error) {
        console.log("[v0] CustomerForm: Erro ao salvar:", result.error)
        setError(result.error)
      } else {
        console.log("[v0] CustomerForm: Sucesso! Redirecionando para /erp/customers")
        router.push("/erp/customers")
        router.refresh()
      }
    } catch (err) {
      console.error("[v0] CustomerForm: Erro na exception:", err)
      setError("Erro ao salvar cliente")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Nome*</Label>
            <Input
              id="name"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="phone">Telefone</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="address">Endereço</Label>
            <Textarea
              id="address"
              rows={3}
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              rows={4}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          {error && <div className="p-4 bg-red-50 text-red-600 rounded-md text-sm">{error}</div>}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Salvando..." : customer ? "Atualizar cliente" : "Criar cliente"}
          </Button>
        </CardContent>
      </Card>
    </form>
  )
}
