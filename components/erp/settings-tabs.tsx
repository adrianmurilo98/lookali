"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Button } from "@/components/ui/button"
import { BusinessHoursSelector } from "@/components/business-hours-selector"
import { PaymentMethodsGrid } from "@/components/erp/payment-methods-grid"
import { MercadoPagoConnectButton } from "@/components/erp/mercadopago-connect-button"
import { updatePartnerAction } from "@/app/actions/partner"
import { getPaymentMethodsAction } from "@/app/actions/payment-methods"
import { useRouter, useSearchParams } from 'next/navigation'
import { useToast } from "@/hooks/use-toast"

interface SettingsTabsProps {
  partner: any
}

export function SettingsTabs({ partner }: SettingsTabsProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [paymentMethods, setPaymentMethods] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState("general")

  useEffect(() => {
    const mpConnected = searchParams.get('mp_connected')
    const errorParam = searchParams.get('error')
    
    if (mpConnected === 'true') {
      toast({
        title: "Sucesso!",
        description: "Mercado Pago conectado com sucesso!",
      })
      setActiveTab("integrations")
      // Clean URL
      window.history.replaceState({}, '', '/erp/settings')
    } else if (errorParam) {
      toast({
        title: "Erro",
        description: "Erro ao conectar Mercado Pago. Tente novamente.",
        variant: "destructive",
      })
    }
  }, [searchParams, toast])

  useEffect(() => {
    const loadPaymentMethods = async () => {
      const result = await getPaymentMethodsAction(partner.id)
      if (result.methods) {
        setPaymentMethods(result.methods)
      }
    }
    loadPaymentMethods()
  }, [partner.id])

  const reloadPaymentMethods = async () => {
    const result = await getPaymentMethodsAction(partner.id)
    if (result.methods) {
      setPaymentMethods(result.methods)
    }
  }

  const [generalInfo, setGeneralInfo] = useState({
    storeName: partner.store_name || "",
    storeDescription: partner.store_description || "",
    storeImageUrl: partner.store_image_url || "",
    businessType: partner.business_type || "pf",
    cnpj: partner.cnpj || "",
    sellsProducts: partner.sells_products || false,
    providesServices: partner.provides_services || false,
    rentsItems: partner.rents_items || false,
    hasReservableSpaces: partner.has_reservable_spaces || false,
  })

  const [addresses, setAddresses] = useState({
    zipCode: partner.zip_code || "",
    street: partner.street || "",
    number: partner.number || "",
    complement: partner.complement || "",
    neighborhood: partner.neighborhood || "",
    city: partner.city || "",
    state: partner.state || "",
  })

  const [hours, setHours] = useState(partner.opening_hours || {})

  const handleCepBlur = async () => {
    const cep = addresses.zipCode.replace(/\D/g, "")
    if (cep.length === 8) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
        const data = await response.json()
        if (!data.erro) {
          setAddresses((prev) => ({
            ...prev,
            street: data.logradouro,
            neighborhood: data.bairro,
            city: data.localidade,
            state: data.uf,
          }))
        }
      } catch (err) {
        console.error("Erro ao buscar CEP:", err)
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const result = await updatePartnerAction(partner.id, {
        storeName: generalInfo.storeName,
        storeDescription: generalInfo.storeDescription,
        storeImageUrl: generalInfo.storeImageUrl || null,
        businessType: generalInfo.businessType as "pf" | "pj",
        cnpj: generalInfo.cnpj || null,
        sellsProducts: generalInfo.sellsProducts,
        providesServices: generalInfo.providesServices,
        rentsItems: generalInfo.rentsItems,
        hasReservableSpaces: generalInfo.hasReservableSpaces,
        zipCode: addresses.zipCode,
        street: addresses.street,
        number: addresses.number,
        complement: addresses.complement,
        neighborhood: addresses.neighborhood,
        city: addresses.city,
        state: addresses.state,
        openingHours: hours,
        userId: "",
      })

      if (result?.error) {
        setError(result.error)
      } else {
        setSuccess("Configurações atualizadas com sucesso!")
        router.refresh()
      }
    } catch (err) {
      setError("Erro ao atualizar configurações")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general">Dados Gerais</TabsTrigger>
          <TabsTrigger value="address">Endereços</TabsTrigger>
          <TabsTrigger value="hours">Horários</TabsTrigger>
          <TabsTrigger value="payment">Pagamentos</TabsTrigger>
          <TabsTrigger value="integrations">Integrações</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>Informações Gerais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="storeName">Nome da loja*</Label>
                <Input
                  id="storeName"
                  required
                  value={generalInfo.storeName}
                  onChange={(e) => setGeneralInfo({ ...generalInfo, storeName: e.target.value })}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="storeDescription">Descrição (O que faz)</Label>
                <Textarea
                  id="storeDescription"
                  rows={4}
                  value={generalInfo.storeDescription}
                  onChange={(e) => setGeneralInfo({ ...generalInfo, storeDescription: e.target.value })}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="storeImageUrl">URL da imagem da loja</Label>
                <Input
                  id="storeImageUrl"
                  type="url"
                  value={generalInfo.storeImageUrl}
                  onChange={(e) => setGeneralInfo({ ...generalInfo, storeImageUrl: e.target.value })}
                />
              </div>

              <div className="grid gap-2">
                <Label>Tipo de pessoa</Label>
                <RadioGroup
                  value={generalInfo.businessType}
                  onValueChange={(value) => setGeneralInfo({ ...generalInfo, businessType: value })}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="pf" id="pf" />
                    <Label htmlFor="pf">Loja Pessoal (CPF)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="pj" id="pj" />
                    <Label htmlFor="pj">Loja Empresarial (CNPJ)</Label>
                  </div>
                </RadioGroup>
              </div>

              {generalInfo.businessType === "pj" && (
                <div className="grid gap-2">
                  <Label htmlFor="cnpj">CNPJ</Label>
                  <Input
                    id="cnpj"
                    value={generalInfo.cnpj}
                    onChange={(e) => setGeneralInfo({ ...generalInfo, cnpj: e.target.value })}
                  />
                </div>
              )}

              <div className="grid gap-2">
                <Label>O que você oferece? (Selecione no mínimo 1)</Label>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="sellsProducts"
                      checked={generalInfo.sellsProducts}
                      onCheckedChange={(checked) =>
                        setGeneralInfo({ ...generalInfo, sellsProducts: checked as boolean })
                      }
                    />
                    <Label htmlFor="sellsProducts">Vende produtos</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="providesServices"
                      checked={generalInfo.providesServices}
                      onCheckedChange={(checked) =>
                        setGeneralInfo({ ...generalInfo, providesServices: checked as boolean })
                      }
                    />
                    <Label htmlFor="providesServices">Presta serviços</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="rentsItems"
                      checked={generalInfo.rentsItems}
                      onCheckedChange={(checked) => setGeneralInfo({ ...generalInfo, rentsItems: checked as boolean })}
                    />
                    <Label htmlFor="rentsItems">Aluga itens</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="hasReservableSpaces"
                      checked={generalInfo.hasReservableSpaces}
                      onCheckedChange={(checked) =>
                        setGeneralInfo({ ...generalInfo, hasReservableSpaces: checked as boolean })
                      }
                    />
                    <Label htmlFor="hasReservableSpaces">Tem lugares para reservar (chácaras, estúdios, salões)</Label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="address">
          <Card>
            <CardHeader>
              <CardTitle>Endereço da Loja</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="zipCode">CEP*</Label>
                <Input
                  id="zipCode"
                  required
                  value={addresses.zipCode}
                  onChange={(e) => setAddresses({ ...addresses, zipCode: e.target.value })}
                  onBlur={handleCepBlur}
                  placeholder="00000-000"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2 grid gap-2">
                  <Label htmlFor="street">Rua*</Label>
                  <Input
                    id="street"
                    required
                    value={addresses.street}
                    onChange={(e) => setAddresses({ ...addresses, street: e.target.value })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="number">Número*</Label>
                  <Input
                    id="number"
                    required
                    value={addresses.number}
                    onChange={(e) => setAddresses({ ...addresses, number: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="complement">Complemento</Label>
                <Input
                  id="complement"
                  value={addresses.complement}
                  onChange={(e) => setAddresses({ ...addresses, complement: e.target.value })}
                  placeholder="Opcional"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="neighborhood">Bairro*</Label>
                <Input
                  id="neighborhood"
                  required
                  value={addresses.neighborhood}
                  onChange={(e) => setAddresses({ ...addresses, neighborhood: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="city">Cidade*</Label>
                  <Input
                    id="city"
                    required
                    value={addresses.city}
                    onChange={(e) => setAddresses({ ...addresses, city: e.target.value })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="state">Estado*</Label>
                  <Input
                    id="state"
                    required
                    value={addresses.state}
                    onChange={(e) => setAddresses({ ...addresses, state: e.target.value })}
                    placeholder="SP"
                    maxLength={2}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hours">
          <Card>
            <CardHeader>
              <CardTitle>Horários de Funcionamento</CardTitle>
            </CardHeader>
            <CardContent>
              <BusinessHoursSelector value={hours} onChange={setHours} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payment">
          <PaymentMethodsGrid partnerId={partner.id} methods={paymentMethods} onUpdate={reloadPaymentMethods} />
        </TabsContent>

        <TabsContent value="integrations">
          <div className="space-y-4">
            <MercadoPagoConnectButton
              isConnected={!!partner.mp_access_token}
              connectedAt={partner.mp_connected_at}
            />
          </div>
        </TabsContent>
      </Tabs>
      {activeTab !== "payment" && activeTab !== "integrations" && (
        <form onSubmit={handleSubmit}>
          {error && <div className="p-4 bg-red-50 text-red-600 rounded-md text-sm">{error}</div>}
          {success && <div className="p-4 bg-green-50 text-green-600 rounded-md text-sm">{success}</div>}
          <Button type="submit" size="lg" className="w-full" disabled={isLoading}>
            {isLoading ? "Salvando..." : "Salvar todas as configurações"}
          </Button>
        </form>
      )}
    </div>
  )
}
