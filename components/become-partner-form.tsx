"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { BusinessHoursSelector } from "@/components/business-hours-selector"
import { createPartnerAction } from "@/app/actions/partner"
import { fetchCNPJDataAction } from "@/app/actions/cnpj"
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes"
import { UnsavedChangesDialog } from "@/components/reusable/UnsavedChangesDialog"

interface BecomePartnerFormProps {
  userId: string
  userName?: string
  userAddress?: string
}

export default function BecomePartnerForm({ userId, userName = "", userAddress = "" }: BecomePartnerFormProps) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cnpjLoading, setCnpjLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState({
    businessType: "pf" as "pf" | "pj",
    cnpj: "",
    sellsProducts: false,
    providesServices: false,
    rentsItems: false,
    hasReservableSpaces: false,
    storeName: userName,
    contactName: userName,
    phone: "",
    zipCode: "",
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
    storeDescription: "",
    storeImageUrl: "",
    businessHours: {
      monday: { enabled: true, from: "09:00", to: "18:00" },
      tuesday: { enabled: true, from: "09:00", to: "18:00" },
      wednesday: { enabled: true, from: "09:00", to: "18:00" },
      thursday: { enabled: true, from: "09:00", to: "18:00" },
      friday: { enabled: true, from: "09:00", to: "18:00" },
      saturday: { enabled: false, from: "09:00", to: "13:00" },
      sunday: { enabled: false, from: "09:00", to: "13:00" },
    },
  })

  const [isDirty, setIsDirty] = useState(false)
  const {
    showConfirmDialog,
    confirmNavigation,
    cancelNavigation,
    handleNavigation,
  } = useUnsavedChanges(isDirty)

  useEffect(() => {
    if (formData.zipCode.replace(/\D/g, "").length === 8) {
      fetchAddressByCep(formData.zipCode)
    }
  }, [formData.zipCode])

  const fetchAddressByCep = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, "")
    if (cleanCep.length !== 8) return

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`)
      const data = await response.json()

      if (!data.erro) {
        setFormData((prev) => ({
          ...prev,
          street: data.logradouro || "",
          neighborhood: data.bairro || "",
          city: data.localidade || "",
          state: data.uf || "",
        }))
      }
    } catch (err) {
      console.error("Erro ao buscar CEP:", err)
    }
  }

  const handleSubmit = async () => {
    setIsLoading(true)
    setError(null)

    if (
      !formData.sellsProducts &&
      !formData.providesServices &&
      !formData.rentsItems &&
      !formData.hasReservableSpaces
    ) {
      setError("Selecione pelo menos um tipo de negócio")
      setIsLoading(false)
      return
    }

    try {
      const result = await createPartnerAction({
        userId,
        storeName: formData.storeName,
        storeDescription: formData.storeDescription,
        zipCode: formData.zipCode,
        street: formData.street,
        number: formData.number,
        complement: formData.complement || null,
        neighborhood: formData.neighborhood,
        city: formData.city,
        state: formData.state,
        businessType: formData.businessType,
        cnpj: formData.cnpj || null,
        openingHours: formData.businessHours,
        storeImageUrl: formData.storeImageUrl || null,
        sellsProducts: formData.sellsProducts,
        providesServices: formData.providesServices,
        rentsItems: formData.rentsItems,
        hasReservableSpaces: formData.hasReservableSpaces,
      })

      if (result?.error) {
        setError(result.error)
        setIsLoading(false)
      } else {
        window.location.href = "/erp/dashboard"
      }
    } catch (err) {
      console.error("Erro ao criar parceria:", err)
      setError("Erro ao criar parceria. Tente novamente.")
      setIsLoading(false)
    }
  }

  const canProceedStep1 =
    formData.sellsProducts || formData.providesServices || formData.rentsItems || formData.hasReservableSpaces
  const canProceedStep2 =
    formData.storeName &&
    formData.contactName &&
    formData.zipCode &&
    formData.street &&
    formData.number &&
    formData.neighborhood &&
    formData.city &&
    formData.state

  const handleCNPJBlur = async () => {
    const cnpj = formData.cnpj
    if (!cnpj || cnpj.replace(/\D/g, "").length !== 14) return

    setCnpjLoading(true)
    setError(null)
    try {
      const result = await fetchCNPJDataAction(cnpj)
      if (result.success && result.data) {
        setFormData((prev) => ({
          ...prev,
          storeName: result.data.nome_fantasia || result.data.razao_social || prev.storeName,
          contactName: result.data.razao_social || prev.contactName,
          phone: result.data.telefone || prev.phone,
          zipCode: result.data.cep || prev.zipCode,
          street: result.data.logradouro || prev.street,
          number: result.data.numero || prev.number,
          complement: result.data.complemento || prev.complement,
          neighborhood: result.data.bairro || prev.neighborhood,
          city: result.data.municipio || prev.city,
          state: result.data.uf || prev.state,
          email: result.data.email || prev.email,
        }))
      } else if (result.error) {
        setError(result.error)
      }
    } finally {
      setCnpjLoading(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return

    const file = e.target.files[0]
    const setImageUploading = (loading: boolean) => {}; // Placeholder for setImageUploading function
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

  useEffect(() => {
    const hasChanges =
      formData.storeName !== userName ||
      formData.cnpj ||
      formData.sellsProducts ||
      formData.providesServices ||
      formData.rentsItems ||
      formData.hasReservableSpaces ||
      formData.zipCode
    setIsDirty(hasChanges)
  }, [formData, userName])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-center gap-4">
        <div className="flex items-center gap-2">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${currentStep === 1 ? "bg-primary text-primary-foreground" : currentStep > 1 ? "bg-green-500 text-white" : "bg-muted text-muted-foreground"}`}
          >
            1
          </div>
          <span className={`text-sm ${currentStep === 1 ? "font-medium" : "text-muted-foreground"}`}>
            Escolha o Tipo de Loja
          </span>
        </div>

        <div className={`h-px w-16 ${currentStep > 1 ? "bg-green-500" : "bg-border"}`} />

        <div className="flex items-center gap-2">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${currentStep === 2 ? "bg-primary text-primary-foreground" : currentStep > 2 ? "bg-green-500 text-white" : "bg-muted text-muted-foreground"}`}
          >
            2
          </div>
          <span className={`text-sm ${currentStep === 2 ? "font-medium" : "text-muted-foreground"}`}>
            Fornecer Informação
          </span>
        </div>

        <div className={`h-px w-16 ${currentStep > 2 ? "bg-green-500" : "bg-border"}`} />

        <div className="flex items-center gap-2">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${currentStep === 3 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
          >
            3
          </div>
          <span className={`text-sm ${currentStep === 3 ? "font-medium" : "text-muted-foreground"}`}>Finalizar</span>
        </div>
      </div>

      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Escolha o Tipo de Loja</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label>Pessoa Física ou Jurídica</Label>
                <RadioGroup
                  value={formData.businessType}
                  onValueChange={(value) => setFormData({ ...formData, businessType: value as "pf" | "pj" })}
                >
                  <Card className={formData.businessType === "pf" ? "border-primary" : ""}>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3">
                        <RadioGroupItem value="pf" id="pf" />
                        <Label htmlFor="pf" className="flex-1 cursor-pointer">
                          <div className="font-medium">Loja Pessoal (CPF)</div>
                          <div className="text-sm text-muted-foreground">Para vendedores individuais</div>
                        </Label>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className={formData.businessType === "pj" ? "border-primary" : ""}>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3">
                        <RadioGroupItem value="pj" id="pj" />
                        <Label htmlFor="pj" className="flex-1 cursor-pointer">
                          <div className="font-medium">Loja Empresarial (CNPJ)</div>
                          <div className="text-sm text-muted-foreground">Para empresas registradas</div>
                        </Label>
                      </div>
                    </CardContent>
                  </Card>
                </RadioGroup>
              </div>

              {formData.businessType === "pj" && (
                <div className="grid gap-2">
                  <Label htmlFor="cnpj">CNPJ</Label>
                  <Input
                    id="cnpj"
                    placeholder="00.000.000/0000-00"
                    value={formData.cnpj}
                    onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                    onBlur={handleCNPJBlur}
                  />
                  {cnpjLoading && <p className="text-xs text-blue-500">Buscando dados do CNPJ...</p>}
                </div>
              )}
            </div>

            <div className="space-y-4">
              <Label>O que você oferece? (selecione pelo menos 1)</Label>
              <div className="space-y-3">
                <Card className={formData.sellsProducts ? "border-primary bg-primary/5" : ""}>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        id="sellsProducts"
                        checked={formData.sellsProducts}
                        onCheckedChange={(checked) => setFormData({ ...formData, sellsProducts: checked as boolean })}
                      />
                      <Label htmlFor="sellsProducts" className="flex-1 cursor-pointer">
                        Vende produtos
                      </Label>
                    </div>
                  </CardContent>
                </Card>

                <Card className={formData.providesServices ? "border-primary bg-primary/5" : ""}>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        id="providesServices"
                        checked={formData.providesServices}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, providesServices: checked as boolean })
                        }
                      />
                      <Label htmlFor="providesServices" className="flex-1 cursor-pointer">
                        Presta serviços
                      </Label>
                    </div>
                  </CardContent>
                </Card>

                <Card className={formData.rentsItems ? "border-primary bg-primary/5" : ""}>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        id="rentsItems"
                        checked={formData.rentsItems}
                        onCheckedChange={(checked) => setFormData({ ...formData, rentsItems: checked as boolean })}
                      />
                      <Label htmlFor="rentsItems" className="flex-1 cursor-pointer">
                        Aluga itens
                      </Label>
                    </div>
                  </CardContent>
                </Card>

                <Card className={formData.hasReservableSpaces ? "border-primary bg-primary/5" : ""}>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        id="hasReservableSpaces"
                        checked={formData.hasReservableSpaces}
                        onCheckedChange={(checked) =>
                          setFormData({
                            ...formData,
                            hasReservableSpaces: checked as boolean,
                          })
                        }
                      />
                      <Label htmlFor="hasReservableSpaces" className="flex-1 cursor-pointer">
                        Tem lugares para reservar (chácaras, estúdios, salões)
                      </Label>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            <Button onClick={() => setCurrentStep(2)} size="lg" className="w-full" disabled={!canProceedStep1}>
              Próximo
            </Button>
          </CardContent>
        </Card>
      )}

      {currentStep === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Informações da Loja</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="storeName">Nome da Loja</Label>
              <Input
                id="storeName"
                required
                maxLength={35}
                placeholder="Ex: Loja do João"
                value={formData.storeName}
                onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">{formData.storeName.length}/35</p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="contactName">Contato (Nome e Endereço)</Label>
              <Input
                id="contactName"
                required
                placeholder="Nome Completo"
                value={formData.contactName}
                onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="(00) 00000-0000"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="zipCode">CEP</Label>
              <Input
                id="zipCode"
                required
                placeholder="00000-000"
                value={formData.zipCode}
                onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2 grid gap-2">
                <Label htmlFor="street">Rua</Label>
                <Input
                  id="street"
                  required
                  value={formData.street}
                  onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="number">Número</Label>
                <Input
                  id="number"
                  required
                  value={formData.number}
                  onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="complement">Complemento (Opcional)</Label>
              <Input
                id="complement"
                placeholder="Apto, Bloco, etc"
                value={formData.complement}
                onChange={(e) => setFormData({ ...formData, complement: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="neighborhood">Bairro</Label>
                <Input
                  id="neighborhood"
                  required
                  value={formData.neighborhood}
                  onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="city">Cidade</Label>
                <Input
                  id="city"
                  required
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="state">Estado</Label>
              <Input
                id="state"
                required
                maxLength={2}
                placeholder="SP"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value.toUpperCase() })}
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => handleNavigation()}
                variant="outline"
                size="lg"
                className="flex-1"
              >
                Voltar
              </Button>
              <Button onClick={() => setCurrentStep(3)} size="lg" className="flex-1" disabled={!canProceedStep2}>
                Próximo
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {currentStep === 3 && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Descrição da loja</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="storeDescription">Sobre a loja</Label>
                <Textarea
                  id="storeDescription"
                  placeholder="Conte sobre sua loja, produtos e serviços..."
                  rows={4}
                  value={formData.storeDescription}
                  onChange={(e) => setFormData({ ...formData, storeDescription: e.target.value })}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="storeImage">Imagem da loja</Label>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  hidden
                  accept="image/*"
                />
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1"
                  >
                    Escolher imagem
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
                      alt="Prévia da imagem da loja"
                      className="w-full h-48 object-cover rounded-md"
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Horários de funcionamento</CardTitle>
            </CardHeader>
            <CardContent>
              <BusinessHoursSelector
                value={formData.businessHours}
                onChange={(hours) => setFormData({ ...formData, businessHours: hours })}
              />
            </CardContent>
          </Card>

          {error && <div className="p-4 bg-red-50 text-red-600 rounded-md text-sm">{error}</div>}

          <div className="flex gap-2">
            <Button onClick={() => setCurrentStep(2)} variant="outline" size="lg" className="flex-1">
              Voltar
            </Button>
            <Button onClick={handleSubmit} size="lg" className="flex-1" disabled={isLoading}>
              {isLoading ? "Cadastrando..." : "Enviar"}
            </Button>
          </div>
        </div>
      )}

      <UnsavedChangesDialog
        open={showConfirmDialog}
        onConfirm={confirmNavigation}
        onCancel={cancelNavigation}
      />
    </div>
  )
}
