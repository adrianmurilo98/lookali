"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Trash2, Store } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

interface Supplier {
  id: string
  name: string
  email: string | null
  phone: string | null
}

interface ProductSupplier {
  supplierId: string
  supplierName?: string
  costPrice?: number
  supplierSku?: string
  leadTimeDays?: number
}

interface ProductSuppliersSectionProps {
  suppliers: Supplier[]
  selectedSuppliers: ProductSupplier[]
  onChange: (suppliers: ProductSupplier[]) => void
  disabled?: boolean
}

export function ProductSuppliersSection({
  suppliers,
  selectedSuppliers,
  onChange,
  disabled = false,
}: ProductSuppliersSectionProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentSupplierId, setCurrentSupplierId] = useState("")
  const [costPrice, setCostPrice] = useState("")
  const [supplierSku, setSupplierSku] = useState("")
  const [leadTimeDays, setLeadTimeDays] = useState("")

  const handleAdd = () => {
    if (!currentSupplierId) return

    const supplier = suppliers.find((s) => s.id === currentSupplierId)
    if (!supplier) return

    const newSupplier: ProductSupplier = {
      supplierId: currentSupplierId,
      supplierName: supplier.name,
      costPrice: costPrice ? Number.parseFloat(costPrice) : undefined,
      supplierSku: supplierSku || undefined,
      leadTimeDays: leadTimeDays ? Number.parseInt(leadTimeDays) : undefined,
    }

    onChange([...selectedSuppliers, newSupplier])

    // Reset form
    setCurrentSupplierId("")
    setCostPrice("")
    setSupplierSku("")
    setLeadTimeDays("")
    setIsOpen(false)
  }

  const handleRemove = (supplierId: string) => {
    onChange(selectedSuppliers.filter((s) => s.supplierId !== supplierId))
  }

  const availableSuppliers = suppliers.filter((s) => !selectedSuppliers.some((ps) => ps.supplierId === s.id))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Fornecedores</h3>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button type="button" size="sm" variant="outline" disabled={disabled || availableSuppliers.length === 0}>
              <Plus className="mr-1 h-4 w-4" />
              Adicionar Fornecedor
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Fornecedor</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="grid gap-2">
                <Label>Fornecedor*</Label>
                <Select value={currentSupplierId} onValueChange={setCurrentSupplierId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um fornecedor" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSuppliers.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="costPrice">Preço de Compra (R$)</Label>
                <Input
                  id="costPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={costPrice}
                  onChange={(e) => setCostPrice(e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="supplierSku">SKU do Fornecedor</Label>
                <Input
                  id="supplierSku"
                  placeholder="Código do produto no fornecedor"
                  value={supplierSku}
                  onChange={(e) => setSupplierSku(e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="leadTime">Prazo de Entrega (dias)</Label>
                <Input
                  id="leadTime"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={leadTimeDays}
                  onChange={(e) => setLeadTimeDays(e.target.value)}
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                  Cancelar
                </Button>
                <Button type="button" onClick={handleAdd} disabled={!currentSupplierId}>
                  Adicionar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {selectedSuppliers.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed border-border rounded-lg">
          <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
            <Store className="w-6 h-6 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">Nenhum fornecedor vinculado</p>
          <p className="text-xs text-muted-foreground mt-1">Adicione fornecedores para este produto</p>
        </div>
      ) : (
        <div className="space-y-2">
          {selectedSuppliers.map((supplier) => (
            <div key={supplier.supplierId} className="flex items-center justify-between p-3 border rounded-lg bg-card">
              <div className="flex-1">
                <p className="font-medium text-sm">{supplier.supplierName}</p>
                <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
                  {supplier.costPrice && <span>R$ {supplier.costPrice.toFixed(2)}</span>}
                  {supplier.supplierSku && <span>SKU: {supplier.supplierSku}</span>}
                  {supplier.leadTimeDays && <span>{supplier.leadTimeDays} dias</span>}
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => handleRemove(supplier.supplierId)}
                disabled={disabled}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
