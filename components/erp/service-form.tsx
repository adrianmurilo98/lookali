"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createServiceAction } from "@/app/actions/services"
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes"
import { UnsavedChangesDialog } from "@/components/reusable/UnsavedChangesDialog"

interface ServiceFormProps {
  partnerId: string
}

export function ServiceForm({ partnerId }: ServiceFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDirty, setIsDirty] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: 0,
  })

  const {
    showConfirmDialog,
    confirmNavigation,
    cancelNavigation,
    handleNavigation,
  } = useUnsavedChanges(isDirty)

  useEffect(() => {
    const hasChanges = formData.name || formData.description || formData.price > 0
    setIsDirty(hasChanges)
  }, [formData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const result = await createServiceAction({ ...formData, partnerId })

      if (result.error) {
        setError(result.error)
      } else {
        router.push("/erp/services")
        router.refresh()
      }
    } catch (err) {
      console.error("[v0] ServiceForm: Erro na exception:", err)
      setError("Erro ao salvar serviço")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    handleNavigation(() => {
      router.push("/erp/services")
    })
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Nome do serviço*</Label>
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
            <Label htmlFor="price">Preço (R$)*</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              min="0"
              required
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: Number.parseFloat(e.target.value) })}
            />
          </div>

          {error && <div className="p-4 bg-red-50 text-red-600 rounded-md text-sm">{error}</div>}

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={handleCancel}
            >
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={isLoading}>
              {isLoading ? "Salvando..." : "Criar serviço"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <UnsavedChangesDialog
        open={showConfirmDialog}
        onConfirm={confirmNavigation}
        onCancel={cancelNavigation}
      />
    </form>
  )
}
