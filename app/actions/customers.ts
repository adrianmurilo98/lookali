"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { getCurrentUser, verifyPartnerOwnership, verifyCustomerOwnership } from "@/lib/auth/authorization"

export async function createComprehensiveCustomerAction(data: {
  partnerId: string
  name: string
  email: string
  phone: string
  personType: "pf" | "pj" | "foreign"
  cpf?: string | null
  contribuinte?: string | null
  cnpj?: string | null
  nomeFantasia?: string | null
  inscricaoEstadual?: string | null
  regimeTributario?: string | null
  contribuinteIcms?: string | null
  country?: string | null
  zipCode: string
  street: string
  number: string
  complement?: string
  neighborhood: string
  city: string
  state: string
  municipioCodigoIbge?: string | null
}) {
  const user = await getCurrentUser()
  if (!user) {
    return { error: "Não autenticado" }
  }

  const isOwner = await verifyPartnerOwnership(data.partnerId)
  if (!isOwner) {
    return { error: "Você não tem permissão para criar clientes neste parceiro" }
  }

  if (!data.name.trim()) {
    return { error: "Nome é obrigatório" }
  }

  const supabase = await createClient()

  const { error } = await supabase.from("customers").insert({
    partner_id: data.partnerId,
    name: data.name,
    email: data.email || null,
    phone: data.phone || null,
    address: [data.street, data.number, data.complement, data.neighborhood, data.city, data.state]
      .filter(Boolean)
      .join(", "),
    person_type: data.personType,
    cpf: data.cpf || null,
    contribuinte: data.contribuinte || null,
    cnpj: data.cnpj || null,
    nome_fantasia: data.nomeFantasia || null,
    inscricao_estadual: data.inscricaoEstadual || null,
    regime_tributario: data.regimeTributario || null,
    contribuinte_icms: data.contribuinteIcms || null,
    country: data.country || null,
    zip_code: data.zipCode || null,
    street: data.street || null,
    number: data.number || null,
    complement: data.complement || null,
    neighborhood: data.neighborhood || null,
    city: data.city || null,
    state: data.state || null,
    municipio_codigo_ibge: data.municipioCodigoIbge || null,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/erp/customers")
  redirect("/erp/customers")
}

export async function createCustomerAction(data: {
  partnerId: string
  name: string
  email: string
  phone: string
  address: string
  notes: string
}) {
  const user = await getCurrentUser()
  if (!user) {
    return { error: "Não autenticado" }
  }

  const isOwner = await verifyPartnerOwnership(data.partnerId)
  if (!isOwner) {
    return { error: "Você não tem permissão para criar clientes neste parceiro" }
  }

  const supabase = await createClient()

  const { error } = await supabase.from("customers").insert({
    partner_id: data.partnerId,
    name: data.name,
    email: data.email || null,
    phone: data.phone || null,
    address: data.address || null,
    notes: data.notes || null,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/erp/customers")

  redirect("/erp/customers")
}

export async function updateCustomerAction(
  customerId: string,
  data: {
    name: string
    email: string
    phone: string
    address: string
    notes: string
  },
) {
  const user = await getCurrentUser()
  if (!user) {
    return { error: "Não autenticado" }
  }

  const isOwner = await verifyCustomerOwnership(customerId)
  if (!isOwner) {
    return { error: "Você não tem permissão para editar este cliente" }
  }

  const supabase = await createClient()

  const { error } = await supabase
    .from("customers")
    .update({
      name: data.name,
      email: data.email || null,
      phone: data.phone || null,
      address: data.address || null,
      notes: data.notes || null,
    })
    .eq("id", customerId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/erp/customers")

  redirect("/erp/customers")
}

export async function deleteCustomerAction(customerId: string) {
  const user = await getCurrentUser()
  if (!user) {
    return { error: "Não autenticado" }
  }

  const isOwner = await verifyCustomerOwnership(customerId)
  if (!isOwner) {
    return { error: "Você não tem permissão para excluir este cliente" }
  }

  const supabase = await createClient()

  const { error } = await supabase.from("customers").delete().eq("id", customerId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/erp/customers")

  redirect("/erp/customers")
}

export async function updateComprehensiveCustomerAction(data: {
  customerId: string
  partnerId: string
  name: string
  email: string
  phone: string
  personType: "pf" | "pj" | "foreign"
  cpf?: string | null
  contribuinte?: string | null
  cnpj?: string | null
  nomeFantasia?: string | null
  inscricaoEstadual?: string | null
  regimeTributario?: string | null
  contribuinteIcms?: string | null
  country?: string | null
  zipCode: string
  street: string
  number: string
  complement?: string
  neighborhood: string
  city: string
  state: string
  municipioCodigoIbge?: string | null
}) {
  const user = await getCurrentUser()
  if (!user) {
    return { error: "Não autenticado" }
  }

  const isOwner = await verifyCustomerOwnership(data.customerId)
  if (!isOwner) {
    return { error: "Você não tem permissão para editar este cliente" }
  }

  const supabase = await createClient()

  const { error } = await supabase
    .from("customers")
    .update({
      partner_id: data.partnerId,
      name: data.name,
      email: data.email || null,
      phone: data.phone || null,
      address: [data.street, data.number, data.complement, data.neighborhood, data.city, data.state]
        .filter(Boolean)
        .join(", "),
      person_type: data.personType,
      cpf: data.cpf || null,
      contribuinte: data.contribuinte || null,
      cnpj: data.cnpj || null,
      nome_fantasia: data.nomeFantasia || null,
      inscricao_estadual: data.inscricaoEstadual || null,
      regime_tributario: data.regimeTributario || null,
      contribuinte_icms: data.contribuinteIcms || null,
      country: data.country || null,
      zip_code: data.zipCode || null,
      street: data.street || null,
      number: data.number || null,
      complement: data.complement || null,
      neighborhood: data.neighborhood || null,
      city: data.city || null,
      state: data.state || null,
      municipio_codigo_ibge: data.municipioCodigoIbge || null,
    })
    .eq("id", data.customerId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/erp/customers")
  return { success: true }
}
