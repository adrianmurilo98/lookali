"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { createComprehensiveCustomerAction, updateComprehensiveCustomerAction } from "@/app/actions/customers"
import { fetchCNPJDataAction } from "@/app/actions/cnpj"
import type { PersonType } from "@/types/person-type" // Declare or import PersonType
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes"
import { UnsavedChangesDialog } from "@/components/reusable/UnsavedChangesDialog"

interface ComprehensiveCustomerFormProps {
  partnerId: string
  customer?: any
}

const contribuinteOptions = [
  { value: "1", label: "1 - Contribuinte ICMS" },
  { value: "2", label: "2 - Contribuinte Isento de Inscrição no Cadastro de Contribuintes" },
  { value: "9", label: "9 - Não Contribuinte" },
]

const regimeTributarioOptions = [
  { value: "Não definido", label: "Não definido" },
  { value: "Simples nacional", label: "Simples Nacional" },
  {
    value: "Simples nacional - Excesso de sublimite de receita bruta",
    label: "Simples Nacional - Excesso de Sublimite",
  },
  { value: "Regime normal", label: "Regime Normal" },
  { value: "MEI", label: "MEI" },
]

export function ComprehensiveCustomerForm({ partnerId, customer }: ComprehensiveCustomerFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [personType, setPersonType] = useState(customer?.person_type || ("pf" as PersonType))
  const [cnpjLoading, setCnpjLoading] = useState(false)

  const [formData, setFormData] = useState({
    // Dados Gerais
    name: customer?.name || "",
    email: customer?.email || "",
    phone: customer?.phone || "",
    personType: customer?.person_type || ("pf" as PersonType),

    // Pessoa Física
    cpf: customer?.cpf || "",
    contribuinte: customer?.contribuinte || "9",

    // Pessoa Jurídica
    cnpj: customer?.cnpj || "",
    nomeFantasia: customer?.nome_fantasia || "",
    inscricaoEstadual: customer?.inscricao_estadual || "",
    regimeTributario: customer?.regime_tributario || "Não definido",
    contribuinteIcms: customer?.contribuinte_icms || "9",

    // Estrangeiro
    country: customer?.country || "",

    // Endereço
    zipCode: customer?.zip_code || "",
    street: customer?.street || "",
    number: customer?.number || "",
    complement: customer?.complement || "",
    neighborhood: customer?.neighborhood || "",
    city: customer?.city || "",
    state: customer?.state || "",
    municipioCodigoIbge: customer?.municipio_codigo_ibge || "",
  })

  const [isDirty, setIsDirty] = useState(false)
  const {
    showConfirmDialog,
    confirmNavigation,
    cancelNavigation,
    handleNavigation,
  } = useUnsavedChanges(isDirty)

  useEffect(() => {
    const hasChanges =
      formData.name !== (customer?.name || "") ||
      formData.email !== (customer?.email || "") ||
      formData.phone !== (customer?.phone || "") ||
      formData.personType !== (customer?.person_type || "pf")
    setIsDirty(hasChanges)
  }, [formData, customer])

  const handleCepBlur = async () => {
    const cep = formData.zipCode.replace(/\D/g, "")
    if (cep.length === 8) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
        const data = await response.json()
        if (!data.erro) {
          setFormData((prev) => ({
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

  const handleCNPJBlur = async () => {
    const cnpj = formData.cnpj
    if (!cnpj || cnpj.length < 14) return

    setCnpjLoading(true)
    try {
      const result = await fetchCNPJDataAction(cnpj)
      if (result.success && result.data) {
        setFormData((prev) => ({
          ...prev,
          name: result.data.razao_social || "",
          nomeFantasia: result.data.nome_fantasia || "",
          email: result.data.email || prev.email,
          phone: result.data.telefone || prev.phone,
          inscricaoEstadual: result.data.inscricao_estadual || "",
          regimeTributario: result.data.tributacao_regime || "Não definido",
          street: result.data.logradouro || "",
          number: result.data.numero || "",
          complement: result.data.complemento || "",
          neighborhood: result.data.bairro || "",
          city: result.data.municipio || "",
          state: result.data.uf || "",
          zipCode: result.data.cep || "",
          municipioCodigoIbge: result.data.codigo_municipio || "",
        }))
      } else if (result.error) {
        setError(result.error)
      }
    } finally {
      setCnpjLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    if (!formData.name.trim()) {
      setError("Nome é obrigatório")
      setIsLoading(false)
      return
    }

    if (!formData.email && !formData.phone) {
      setError("Email ou telefone é obrigatório")
      setIsLoading(false)
      return
    }

    try {
      const action = customer ? updateComprehensiveCustomerAction : createComprehensiveCustomerAction

      const payload = customer
        ? {
            customerId: customer.id,
            partnerId,
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            personType: formData.personType,
            cpf: formData.personType === "pf" ? formData.cpf : null,
            contribuinte: formData.personType === "pf" ? formData.contribuinte : null,
            cnpj: formData.personType === "pj" ? formData.cnpj : null,
            nomeFantasia: formData.personType === "pj" ? formData.nomeFantasia : null,
            inscricaoEstadual: formData.personType === "pj" ? formData.inscricaoEstadual : null,
            regimeTributario: formData.personType === "pj" ? formData.regimeTributario : null,
            contribuinteIcms: formData.personType === "pj" ? formData.contribuinteIcms : null,
            country: formData.personType === "foreign" ? formData.country : null,
            zipCode: formData.zipCode,
            street: formData.street,
            number: formData.number,
            complement: formData.complement,
            neighborhood: formData.neighborhood,
            city: formData.city,
            state: formData.state,
            municipioCodigoIbge: formData.personType === "pj" ? formData.municipioCodigoIbge : null,
          }
        : {
            partnerId,
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            personType: formData.personType,
            cpf: formData.personType === "pf" ? formData.cpf : null,
            contribuinte: formData.personType === "pf" ? formData.contribuinte : null,
            cnpj: formData.personType === "pj" ? formData.cnpj : null,
            nomeFantasia: formData.personType === "pj" ? formData.nomeFantasia : null,
            inscricaoEstadual: formData.personType === "pj" ? formData.inscricaoEstadual : null,
            regimeTributario: formData.personType === "pj" ? formData.regimeTributario : null,
            contribuinteIcms: formData.personType === "pj" ? formData.contribuinteIcms : null,
            country: formData.personType === "foreign" ? formData.country : null,
            zipCode: formData.zipCode,
            street: formData.street,
            number: formData.number,
            complement: formData.complement,
            neighborhood: formData.neighborhood,
            city: formData.city,
            state: formData.state,
            municipioCodigoIbge: formData.personType === "pj" ? formData.municipioCodigoIbge : null,
          }

      const result = await action(payload)

      if (result.error) {
        setError(result.error)
      } else {
        router.push("/erp/customers")
        router.refresh()
      }
    } catch (err) {
      setError(`Erro ao ${customer ? "atualizar" : "salvar"} cliente`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Tabs defaultValue="dados-gerais" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="dados-gerais">Dados Gerais</TabsTrigger>
          <TabsTrigger value="endereco">Endereço</TabsTrigger>
          <TabsTrigger value="documentacao">Documentação</TabsTrigger>
        </TabsList>

        {/* Aba Dados Gerais */}
        <TabsContent value="dados-gerais">
          <Card>
            <CardHeader>
              <CardTitle>Informações Básicas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label>Tipo de Pessoa*</Label>
                <RadioGroup
                  value={formData.personType}
                  onValueChange={(value) => {
                    setFormData({
                      ...formData,
                      personType: value as PersonType,
                    })
                  }}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="pf" id="pf" />
                    <Label htmlFor="pf">Pessoa Física</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="pj" id="pj" />
                    <Label htmlFor="pj">Pessoa Jurídica</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="foreign" id="foreign" />
                    <Label htmlFor="foreign">Estrangeiro</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="name">Nome*</Label>
                <Input
                  id="name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={formData.personType === "pj" ? "Razão Social" : "Nome completo"}
                />
              </div>

              {formData.personType === "pj" && (
                <div className="grid gap-2">
                  <Label htmlFor="nomeFantasia">Nome Fantasia</Label>
                  <Input
                    id="nomeFantasia"
                    value={formData.nomeFantasia}
                    onChange={(e) => setFormData({ ...formData, nomeFantasia: e.target.value })}
                    placeholder="Nome fantasia da empresa"
                  />
                </div>
              )}

              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@example.com"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="(11) 99999-9999"
                />
              </div>

              {formData.personType === "foreign" && (
                <div className="grid gap-2">
                  <Label htmlFor="country">País*</Label>
                  <Input
                    id="country"
                    required
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    placeholder="Ex: Estados Unidos"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba Endereço */}
        <TabsContent value="endereco">
          <Card>
            <CardHeader>
              <CardTitle>Endereço</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="zipCode">CEP</Label>
                <Input
                  id="zipCode"
                  value={formData.zipCode}
                  onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                  onBlur={handleCepBlur}
                  placeholder="00000-000"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2 grid gap-2">
                  <Label htmlFor="street">Rua</Label>
                  <Input
                    id="street"
                    value={formData.street}
                    onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="number">Número</Label>
                  <Input
                    id="number"
                    value={formData.number}
                    onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="complement">Complemento</Label>
                <Input
                  id="complement"
                  value={formData.complement}
                  onChange={(e) => setFormData({ ...formData, complement: e.target.value })}
                  placeholder="Apartamento, sala, etc"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="neighborhood">Bairro</Label>
                <Input
                  id="neighborhood"
                  value={formData.neighborhood}
                  onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="city">Cidade</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="state">Estado</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    maxLength={2}
                    placeholder="SP"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba Documentação */}
        <TabsContent value="documentacao">
          <Card>
            <CardHeader>
              <CardTitle>Documentação</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.personType === "pf" && (
                <>
                  <div className="grid gap-2">
                    <Label htmlFor="cpf">CPF</Label>
                    <Input
                      id="cpf"
                      value={formData.cpf}
                      onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                      placeholder="000.000.000-00"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="contribuinte">Contribuinte*</Label>
                    <Select
                      value={formData.contribuinte}
                      onValueChange={(value) => setFormData({ ...formData, contribuinte: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {contribuinteOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              {formData.personType === "pj" && (
                <>
                  <div className="grid gap-2">
                    <Label htmlFor="cnpj">CNPJ*</Label>
                    <Input
                      id="cnpj"
                      required
                      value={formData.cnpj}
                      onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                      onBlur={handleCNPJBlur}
                      placeholder="00.000.000/0000-00"
                    />
                    {cnpjLoading && <p className="text-xs text-blue-500">Carregando dados...</p>}
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="inscricaoEstadual">Inscrição Estadual</Label>
                    <Input
                      id="inscricaoEstadual"
                      value={formData.inscricaoEstadual}
                      onChange={(e) => setFormData({ ...formData, inscricaoEstadual: e.target.value })}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="regimeTributario">Código de Regime Tributário*</Label>
                    <Select
                      value={formData.regimeTributario}
                      onValueChange={(value) => setFormData({ ...formData, regimeTributario: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {regimeTributarioOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="contribuinteIcms">Contribuinte ICMS*</Label>
                    <Select
                      value={formData.contribuinteIcms}
                      onValueChange={(value) => setFormData({ ...formData, contribuinteIcms: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {contribuinteOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {error && <div className="p-4 bg-red-50 text-red-600 rounded-md text-sm">{error}</div>}

      <div className="flex gap-2 mt-6">
        <Button
          type="button"
          variant="outline"
          className="flex-1 bg-transparent"
          onClick={() => handleNavigation()}
        >
          Cancelar
        </Button>
        <Button type="submit" className="flex-1" disabled={isLoading}>
          {isLoading
            ? customer
              ? "Atualizando..."
              : "Salvando..."
            : customer
              ? "Atualizar Cliente"
              : "Salvar Cliente"}
        </Button>
      </div>

      <UnsavedChangesDialog
        open={showConfirmDialog}
        onConfirm={confirmNavigation}
        onCancel={cancelNavigation}
      />
    </form>
  )
}
