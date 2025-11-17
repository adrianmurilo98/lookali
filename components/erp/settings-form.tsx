"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { updatePartnerAction } from "@/app/actions/partner"
import { useRouter } from 'next/navigation'

interface SettingsFormProps {
  partner: any
  paymentMethods: string[]
}

export function SettingsForm({ partner, paymentMethods: initialPaymentMethods }: SettingsFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [imageUploading, setImageUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState({
    storeName: partner.store_name || "",
    storeDescription: partner.store_description || "",
    address: partner.address || "",
    businessType: partner.business_type || "pf",
    cnpj: partner.cnpj || "",
    openingHours: partner.opening_hours ? JSON.stringify(partner.opening_hours) : "",
    storeImageUrl: partner.store_image_url || "",
    sellsProducts: partner.sells_products || false,
    providesServices: partner.provides_services || false,
    rentsItems: partner.rents_items || false,
    hasReservableSpaces: partner.has_reservable_spaces || false,
    paymentMethods: initialPaymentMethods || [],
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const result = await updatePartnerAction(partner.id, {
        storeName: formData.storeName,
        storeDescription: formData.storeDescription,
        address: formData.address,
        businessType: formData.businessType as "pf" | "pj",
        cnpj: formData.businessType === "pj" ? formData.cnpj : null,
        openingHours: formData.openingHours ? JSON.parse(formData.openingHours) : null,
        storeImageUrl: formData.storeImageUrl || null,
        sellsProducts: formData.sellsProducts,
        providesServices: formData.providesServices,
        rentsItems: formData.rentsItems,
        hasReservableSpaces: formData.hasReservableSpaces,
        paymentMethods: formData.paymentMethods,
        userId: "",
      })

      if (result.error) {
        setError(result.error)
      } else {
        alert("Configurações atualizadas com sucesso!")
        router.refresh()
      }
    } catch (err) {
      setError("Erro ao atualizar configurações")
    } finally {
      setIsLoading(false)
    }
  }

  const togglePaymentMethod = (method: string) => {
    setFormData((prev) => ({
      ...prev,
      paymentMethods: prev.paymentMethods.includes(method)
        ? prev.paymentMethods.filter((m) => m !== method)
        : [...prev.paymentMethods, method],
    }))
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return

    const file = e.target.files[0]
    setImageUploading(true)
    setError(null)

    try {
      const reader = new FileReader()
      reader.onloadend = async () => {
        setFormData((prev) => ({
          ...prev,
          storeImageUrl: reader.result as string,
        }))
        setImageUploading(false)
      }
      reader.readAsDataURL(file)
    } catch (err) {
      console.error("Erro ao fazer upload da imagem:", err)
      setError("Erro ao fazer upload da imagem. Tente novamente.")
      setImageUploading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Informações da loja</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="storeName">Nome da loja*</Label>
              <Input
                id="storeName"
                required
                value={formData.storeName}
                onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="storeDescription">Descrição</Label>
              <Textarea
                id="storeDescription"
                rows={4}
                value={formData.storeDescription}
                onChange={(e) => setFormData({ ...formData, storeDescription: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="address">Endereço*</Label>
              <Input
                id="address"
                required
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="storeImage">Foto da loja</Label>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                hidden
                accept="image/*"
                disabled={imageUploading}
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={imageUploading}
                  className="flex-1"
                >
                  {imageUploading ? "Enviando..." : "Escolher imagem"}
                </Button>
                {formData.storeImageUrl && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setFormData({ ...formData, storeImageUrl: "" })}
                  >
                    Remover
                  </Button>
                )}
              </div>
              {formData.storeImageUrl && (
                <div className="mt-2">
                  <img
                    src={formData.storeImageUrl || "/placeholder.svg"}
                    alt="Prévia da foto da loja"
                    className="w-full h-48 object-cover rounded-md"
                  />
                </div>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="openingHours">Horários (JSON)</Label>
              <Textarea
                id="openingHours"
                rows={3}
                value={formData.openingHours}
                onChange={(e) => setFormData({ ...formData, openingHours: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tipo de negócio</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <RadioGroup
              value={formData.businessType}
              onValueChange={(value) => setFormData({ ...formData, businessType: value })}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="pf" id="pf" />
                <Label htmlFor="pf">Pessoa Física</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="pj" id="pj" />
                <Label htmlFor="pj">Pessoa Jurídica</Label>
              </div>
            </RadioGroup>

            {formData.businessType === "pj" && (
              <div className="grid gap-2">
                <Label htmlFor="cnpj">CNPJ</Label>
                <Input
                  id="cnpj"
                  value={formData.cnpj}
                  onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>O que você oferece?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="sellsProducts"
                checked={formData.sellsProducts}
                onCheckedChange={(checked) => setFormData({ ...formData, sellsProducts: checked as boolean })}
              />
              <Label htmlFor="sellsProducts">Vende produtos</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="providesServices"
                checked={formData.providesServices}
                onCheckedChange={(checked) => setFormData({ ...formData, providesServices: checked as boolean })}
              />
              <Label htmlFor="providesServices">Presta serviços</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="rentsItems"
                checked={formData.rentsItems}
                onCheckedChange={(checked) => setFormData({ ...formData, rentsItems: checked as boolean })}
              />
              <Label htmlFor="rentsItems">Aluga itens</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="hasReservableSpaces"
                checked={formData.hasReservableSpaces}
                onCheckedChange={(checked) => setFormData({ ...formData, hasReservableSpaces: checked as boolean })}
              />
              <Label htmlFor="hasReservableSpaces">Tem lugares para reservar</Label>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Meios de pagamento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {["Dinheiro", "PIX", "Cartão de Débito", "Cartão de Crédito", "Boleto"].map((method) => (
              <div key={method} className="flex items-center space-x-2">
                <Checkbox
                  id={method}
                  checked={formData.paymentMethods.includes(method)}
                  onCheckedChange={() => togglePaymentMethod(method)}
                />
                <Label htmlFor={method}>{method}</Label>
              </div>
            ))}
          </CardContent>
        </Card>

        {error && <div className="p-4 bg-red-50 text-red-600 rounded-md text-sm">{error}</div>}

        <Button type="submit" size="lg" className="w-full" disabled={isLoading}>
          {isLoading ? "Salvando..." : "Salvar configurações"}
        </Button>
      </div>
    </form>
  )
}
