"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Minus, Plus, MapPin } from 'lucide-react'
import { getUserAddressesAction, createUserAddressAction } from "@/app/actions/addresses"

interface ProductItem {
  id: string
  name: string
  price: number
  quantity: number
}

interface UnifiedCheckoutModalProps {
  open: boolean
  onClose: () => void
  products: ProductItem[]
  partnerInfo: {
    address: string
    paymentMethods: string[]
    installmentsWithoutInterest?: number
    interestRatePercent?: number
    maxInstallments?: number
    pixDiscountPercent?: number
  }
  onSubmit: (data: {
    deliveryType: "delivery" | "pickup"
    deliveryAddress: string
    paymentMethod: string
    notes: string
    quantities: Record<string, number>
    installments: number
    useMercadoPago: boolean
  }) => Promise<void>
}

interface UserAddress {
  id: string
  street: string
  number: string
  complement: string | null
  neighborhood: string
  city: string
  state: string
  zip_code: string
  is_default: boolean
}

export function UnifiedCheckoutModal({ open, onClose, products, partnerInfo, onSubmit }: UnifiedCheckoutModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [quantities, setQuantities] = useState<Record<string, number>>(
    products.reduce((acc, p) => ({ ...acc, [p.id]: p.quantity }), {}),
  )

  const [userAddresses, setUserAddresses] = useState<UserAddress[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState<string>("")
  const [showAddressForm, setShowAddressForm] = useState(false)
  const [loadingAddresses, setLoadingAddresses] = useState(false)
  const [loadingCep, setLoadingCep] = useState(false)

  const [newAddressData, setNewAddressData] = useState({
    zipCode: "",
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
  })

  const [formData, setFormData] = useState({
    deliveryType: "pickup" as "delivery" | "pickup",
    deliveryAddress: "",
    paymentMethod: partnerInfo.paymentMethods[0] || "Dinheiro",
    notes: "",
    installments: 1,
  })

  const [useMercadoPago, setUseMercadoPago] = useState(false)

  useEffect(() => {
    if (open && formData.deliveryType === "delivery") {
      loadUserAddresses()
    }
  }, [open, formData.deliveryType])

  const loadUserAddresses = async () => {
    setLoadingAddresses(true)
    const result = await getUserAddressesAction()
    if (result.addresses) {
      setUserAddresses(result.addresses)
      
      // Auto-select default address
      const defaultAddress = result.addresses.find(addr => addr.is_default)
      if (defaultAddress) {
        setSelectedAddressId(defaultAddress.id)
        const fullAddress = `${defaultAddress.street}, ${defaultAddress.number}${defaultAddress.complement ? `, ${defaultAddress.complement}` : ""} - ${defaultAddress.neighborhood}, ${defaultAddress.city} - ${defaultAddress.state}, ${defaultAddress.zip_code}`
        setFormData(prev => ({ ...prev, deliveryAddress: fullAddress }))
      }
    }
    setLoadingAddresses(false)
  }

  const handleCepBlur = async () => {
    const cep = newAddressData.zipCode.replace(/\D/g, "")
    if (cep.length !== 8) return

    setLoadingCep(true)
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
      const data = await response.json()

      if (!data.erro) {
        setNewAddressData((prev) => ({
          ...prev,
          street: data.logradouro || prev.street,
          neighborhood: data.bairro || prev.neighborhood,
          city: data.localidade || prev.city,
          state: data.uf || prev.state,
        }))
      }
    } catch (err) {
      console.error("Erro ao buscar CEP:", err)
    } finally {
      setLoadingCep(false)
    }
  }

  const handleAddressSelect = (addressId: string) => {
    setSelectedAddressId(addressId)
    const address = userAddresses.find(addr => addr.id === addressId)
    if (address) {
      const fullAddress = `${address.street}, ${address.number}${address.complement ? `, ${address.complement}` : ""} - ${address.neighborhood}, ${address.city} - ${address.state}, ${address.zip_code}`
      setFormData(prev => ({ ...prev, deliveryAddress: fullAddress }))
    }
  }

  const handleSaveNewAddress = async () => {
    if (
      !newAddressData.zipCode ||
      !newAddressData.street ||
      !newAddressData.number ||
      !newAddressData.neighborhood ||
      !newAddressData.city ||
      !newAddressData.state
    ) {
      setError("Preencha todos os campos obrigatórios do endereço")
      return
    }

    setIsLoading(true)
    const result = await createUserAddressAction({
      street: newAddressData.street,
      number: newAddressData.number,
      complement: newAddressData.complement,
      neighborhood: newAddressData.neighborhood,
      city: newAddressData.city,
      state: newAddressData.state,
      zipCode: newAddressData.zipCode,
      isDefault: userAddresses.length === 0, // Set as default if it's the first address
    })

    if (result.error) {
      setError(result.error)
    } else {
      // Reload addresses and select the new one
      await loadUserAddresses()
      if (result.address) {
        setSelectedAddressId(result.address.id)
        const fullAddress = `${result.address.street}, ${result.address.number}${result.address.complement ? `, ${result.address.complement}` : ""} - ${result.address.neighborhood}, ${result.address.city} - ${result.address.state}, ${result.address.zip_code}`
        setFormData(prev => ({ ...prev, deliveryAddress: fullAddress }))
      }
      setShowAddressForm(false)
      setNewAddressData({
        zipCode: "",
        street: "",
        number: "",
        complement: "",
        neighborhood: "",
        city: "",
        state: "",
      })
    }
    setIsLoading(false)
  }

  const totalAmount = products.reduce((sum, p) => sum + p.price * (quantities[p.id] || p.quantity), 0)

  const calculateInstallmentValue = (installments: number) => {
    if (formData.paymentMethod !== "Cartão de Crédito") return totalAmount

    if (installments <= (partnerInfo.installmentsWithoutInterest || 1)) {
      return totalAmount
    }

    const monthlyRate = (partnerInfo.interestRatePercent || 0) / 100
    const totalWithInterest = totalAmount * Math.pow(1 + monthlyRate, installments)
    return totalWithInterest
  }

  const installmentValue = calculateInstallmentValue(formData.installments) / formData.installments
  const totalWithInterest = calculateInstallmentValue(formData.installments)
  const hasInterest = totalWithInterest > totalAmount

  const pixDiscount = formData.paymentMethod === "PIX" ? (partnerInfo.pixDiscountPercent || 0) / 100 : 0
  const finalAmount = formData.paymentMethod === "PIX" ? totalAmount * (1 - pixDiscount) : totalWithInterest

  const handleQuantityChange = (productId: string, newQty: number) => {
    if (newQty >= 1) {
      setQuantities((prev) => ({ ...prev, [productId]: newQty }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    if (formData.deliveryType === "delivery") {
      if (!selectedAddressId && !showAddressForm) {
        setError("Por favor, selecione ou adicione um endereço de entrega")
        setIsLoading(false)
        return
      }
      
      if (showAddressForm) {
        setError("Por favor, salve o endereço antes de finalizar o pedido")
        setIsLoading(false)
        return
      }
      
      if (formData.deliveryAddress.trim().length < 10) {
        setError("Endereço de entrega muito curto. Por favor, forneça um endereço completo.")
        setIsLoading(false)
        return
      }
    }

    try {
      await onSubmit({ ...formData, quantities, useMercadoPago })
    } catch (err) {
      setError("Erro ao processar pedido")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Finalizar pedido</DialogTitle>
          <DialogDescription>Revise os detalhes antes de confirmar</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Produtos</Label>
            <div className="border rounded-md divide-y">
              {products.map((product) => (
                <div key={product.id} className="p-3 space-y-2">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{product.name}</p>
                      <p className="text-xs text-muted-foreground">R$ {product.price.toFixed(2)}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => handleQuantityChange(product.id, quantities[product.id] - 1)}
                        disabled={quantities[product.id] <= 1}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <Input
                        type="number"
                        value={quantities[product.id]}
                        onChange={(e) => handleQuantityChange(product.id, Number.parseInt(e.target.value) || 1)}
                        className="w-16 text-center h-8"
                        min="1"
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => handleQuantityChange(product.id, quantities[product.id] + 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <p className="text-sm font-semibold">R$ {(product.price * quantities[product.id]).toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-between items-center p-3 bg-muted/50 rounded-md text-sm">
            <p className="font-medium">Subtotal:</p>
            <span className="font-semibold">R$ {totalAmount.toFixed(2)}</span>
          </div>

          <div className="grid gap-2">
            <Label>Tipo de entrega</Label>
            <RadioGroup
              value={formData.deliveryType}
              onValueChange={(value) => setFormData({ ...formData, deliveryType: value as "delivery" | "pickup" })}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="pickup" id="pickup-unified" />
                <Label htmlFor="pickup-unified">Buscar no local</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="delivery" id="delivery-unified" />
                <Label htmlFor="delivery-unified">Entrega</Label>
              </div>
            </RadioGroup>
          </div>

          {formData.deliveryType === "delivery" ? (
            <div className="grid gap-3">
              <Label>Endereço de entrega</Label>
              
              {loadingAddresses ? (
                <p className="text-sm text-muted-foreground">Carregando endereços...</p>
              ) : userAddresses.length > 0 ? (
                <div className="space-y-2">
                  <RadioGroup value={selectedAddressId} onValueChange={handleAddressSelect}>
                    {userAddresses.map((address) => (
                      <div key={address.id} className="flex items-start space-x-2 p-2 border rounded-md">
                        <RadioGroupItem value={address.id} id={`address-${address.id}`} className="mt-1" />
                        <Label htmlFor={`address-${address.id}`} className="flex-1 cursor-pointer">
                          <div className="flex items-start gap-2">
                            <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                            <div className="text-sm">
                              <p className="font-medium">
                                {address.street}, {address.number}
                                {address.complement && `, ${address.complement}`}
                              </p>
                              <p className="text-muted-foreground">
                                {address.neighborhood} - {address.city}/{address.state}
                              </p>
                              <p className="text-muted-foreground">CEP: {address.zip_code}</p>
                              {address.is_default && (
                                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded mt-1 inline-block">
                                  Padrão
                                </span>
                              )}
                            </div>
                          </div>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              ) : null}

              {!showAddressForm && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddressForm(true)}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar novo endereço
                </Button>
              )}

              {showAddressForm && (
                <div className="space-y-3 border rounded-md p-3 bg-muted/30">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-semibold">Novo Endereço</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAddressForm(false)}
                    >
                      Cancelar
                    </Button>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="newZipCode" className="text-xs">CEP *</Label>
                    <Input
                      id="newZipCode"
                      placeholder="00000-000"
                      value={newAddressData.zipCode}
                      onChange={(e) => setNewAddressData({ ...newAddressData, zipCode: e.target.value })}
                      onBlur={handleCepBlur}
                      disabled={loadingCep}
                      className="h-9 text-sm"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="newStreet" className="text-xs">Rua *</Label>
                    <Input
                      id="newStreet"
                      value={newAddressData.street}
                      onChange={(e) => setNewAddressData({ ...newAddressData, street: e.target.value })}
                      className="h-9 text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="grid gap-2">
                      <Label htmlFor="newNumber" className="text-xs">Número *</Label>
                      <Input
                        id="newNumber"
                        value={newAddressData.number}
                        onChange={(e) => setNewAddressData({ ...newAddressData, number: e.target.value })}
                        className="h-9 text-sm"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="newComplement" className="text-xs">Complemento</Label>
                      <Input
                        id="newComplement"
                        value={newAddressData.complement}
                        onChange={(e) => setNewAddressData({ ...newAddressData, complement: e.target.value })}
                        className="h-9 text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="newNeighborhood" className="text-xs">Bairro *</Label>
                    <Input
                      id="newNeighborhood"
                      value={newAddressData.neighborhood}
                      onChange={(e) => setNewAddressData({ ...newAddressData, neighborhood: e.target.value })}
                      className="h-9 text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="grid gap-2">
                      <Label htmlFor="newCity" className="text-xs">Cidade *</Label>
                      <Input
                        id="newCity"
                        value={newAddressData.city}
                        onChange={(e) => setNewAddressData({ ...newAddressData, city: e.target.value })}
                        className="h-9 text-sm"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="newState" className="text-xs">Estado *</Label>
                      <Input
                        id="newState"
                        maxLength={2}
                        placeholder="SP"
                        value={newAddressData.state}
                        onChange={(e) => setNewAddressData({ ...newAddressData, state: e.target.value.toUpperCase() })}
                        className="h-9 text-sm"
                      />
                    </div>
                  </div>

                  <Button
                    type="button"
                    size="sm"
                    onClick={handleSaveNewAddress}
                    disabled={isLoading}
                    className="w-full"
                  >
                    {isLoading ? "Salvando..." : "Salvar endereço"}
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 bg-muted rounded-md">
              <p className="text-sm font-semibold mb-1">Local de retirada:</p>
              <p className="text-sm">{partnerInfo.address}</p>
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="paymentMethod">Meio de pagamento</Label>
            
            {/* Mercado Pago option */}
            <div className="border rounded-md p-3 mb-2">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="use-mercadopago"
                  checked={useMercadoPago}
                  onChange={(e) => setUseMercadoPago(e.target.checked)}
                  className="rounded"
                />
                <Label htmlFor="use-mercadopago" className="cursor-pointer flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Pagar com Mercado Pago</span>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                      Recomendado
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Pague com cartão, PIX, boleto e mais opções de forma segura
                  </p>
                </Label>
              </div>
            </div>

            {!useMercadoPago && (
              <RadioGroup
                value={formData.paymentMethod}
                onValueChange={(value) => setFormData({ ...formData, paymentMethod: value, installments: 1 })}
              >
                {partnerInfo.paymentMethods.map((method: string) => (
                  <div key={method} className="flex items-center space-x-2">
                    <RadioGroupItem value={method} id={`unified-${method}`} />
                    <Label htmlFor={`unified-${method}`}>{method}</Label>
                  </div>
                ))}
              </RadioGroup>
            )}
          </div>

          {!useMercadoPago && formData.paymentMethod === "Cartão de Crédito" && (
            <div className="grid gap-2">
              <Label htmlFor="installments">Parcelas</Label>
              <Select
                value={formData.installments.toString()}
                onValueChange={(value) => setFormData({ ...formData, installments: Number.parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: partnerInfo.maxInstallments || 12 }, (_, i) => i + 1).map((num) => {
                    const value = calculateInstallmentValue(num)
                    const installmentVal = value / num
                    const withInterest = num > (partnerInfo.installmentsWithoutInterest || 1)

                    return (
                      <SelectItem key={num} value={num.toString()}>
                        {num}x de R$ {installmentVal.toFixed(2)}
                        {withInterest ? ` (com juros)` : ` (sem juros)`}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>

              {hasInterest && (
                <p className="text-xs text-muted-foreground">
                  Juros de {partnerInfo.interestRatePercent}% ao mês aplicados
                </p>
              )}
            </div>
          )}

          {!useMercadoPago && formData.paymentMethod === "PIX" && pixDiscount > 0 && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-md text-sm space-y-1">
              <p className="text-green-700 font-medium">Desconto de {(pixDiscount * 100).toFixed(0)}% no PIX!</p>
              <p className="text-green-600">Economia de R$ {(totalAmount * pixDiscount).toFixed(2)}</p>
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Adicione observações sobre seu pedido..."
            />
          </div>

          {error && <div className="p-4 bg-red-50 text-red-600 rounded-md text-sm">{error}</div>}

          <div className="flex justify-between items-center p-4 bg-primary/10 rounded-md">
            <div>
              <p className="font-semibold text-lg">Total:</p>
              {!useMercadoPago && formData.paymentMethod === "Cartão de Crédito" && formData.installments > 1 && (
                <p className="text-xs text-muted-foreground">
                  {formData.installments}x de R$ {installmentValue.toFixed(2)}
                </p>
              )}
            </div>
            <span className="text-2xl font-bold">
              R$ {useMercadoPago ? totalAmount.toFixed(2) : finalAmount.toFixed(2)}
            </span>
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 bg-transparent"
            >
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={isLoading}>
              {isLoading ? "Processando..." : useMercadoPago ? "Ir para pagamento" : "Confirmar pedido"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
