"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from 'next/navigation'
import { getCurrentUser, verifyPartnerOwnership, verifySupplierOwnership } from "@/lib/auth/authorization"

function generateSupplierCode(): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length))
  }
  return code
}

async function generateUniqueSupplierCode(supabase: any): Promise<string> {
  let code = generateSupplierCode()
  let attempt = 0
  
  while (attempt < 10) {
    const { data: existing } = await supabase
      .from("suppliers")
      .select("id")
      .eq("supplier_code", code)
      .maybeSingle()

    if (!existing) {
      return code
    }

    code = generateSupplierCode()
    attempt++
  }

  return `${code}${Date.now().toString().slice(-4)}`
}

export async function createComprehensiveSupplierAction(data: {
  partnerId: string
  name: string
  email?: string
  phone?: string
  personType: string
  cpf?: string
  contribuinte?: string
  cnpj?: string
  nomeFantasia?: string
  inscricaoEstadual?: string
  regimeTributario?: string
  contribuinteIcms?: string
  country?: string
  zipCode?: string
  street?: string
  number?: string
  complement?: string
  neighborhood?: string
  city?: string
  state?: string
  municipioCodigoIbge?: string
  notes?: string
}) {
  const user = await getCurrentUser()
  if (!user) {
    return { error: "Não autenticado" }
  }

  const isOwner = await verifyPartnerOwnership(data.partnerId)
  if (!isOwner) {
    return { error: "Você não tem permissão para criar fornecedores neste parceiro" }
  }

  if (!data.name.trim()) {
    return { error: "Nome é obrigatório" }
  }

  const supabase = await createClient()
  
  const supplierCode = await generateUniqueSupplierCode(supabase)

  const { error } = await supabase.from("suppliers").insert({
    partner_id: data.partnerId,
    name: data.name,
    email: data.email || null,
    phone: data.phone || null,
    person_type: data.personType || null,
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
    notes: data.notes || null,
    supplier_code: supplierCode,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/erp/suppliers")
  redirect("/erp/suppliers")
}

export async function createSupplierAction(data: {
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
    return { error: "Você não tem permissão para criar fornecedores neste parceiro" }
  }

  const supabase = await createClient()
  
  const supplierCode = await generateUniqueSupplierCode(supabase)

  const { error } = await supabase.from("suppliers").insert({
    partner_id: data.partnerId,
    name: data.name,
    email: data.email || null,
    phone: data.phone || null,
    address: data.address || null,
    notes: data.notes || null,
    supplier_code: supplierCode,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/erp/suppliers")

  redirect("/erp/suppliers")
}

export async function updateSupplierAction(
  supplierId: string,
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

  const isOwner = await verifySupplierOwnership(supplierId)
  if (!isOwner) {
    return { error: "Você não tem permissão para editar este fornecedor" }
  }

  const supabase = await createClient()

  const { error } = await supabase
    .from("suppliers")
    .update({
      name: data.name,
      email: data.email || null,
      phone: data.phone || null,
      address: data.address || null,
      notes: data.notes || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", supplierId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/erp/suppliers")

  redirect("/erp/suppliers")
}

export async function deleteSupplierAction(supplierId: string) {
  const user = await getCurrentUser()
  if (!user) {
    return { error: "Não autenticado" }
  }

  const isOwner = await verifySupplierOwnership(supplierId)
  if (!isOwner) {
    return { error: "Você não tem permissão para excluir este fornecedor" }
  }

  const supabase = await createClient()

  const { error } = await supabase.from("suppliers").delete().eq("id", supplierId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/erp/suppliers")

  redirect("/erp/suppliers")
}

export async function updateComprehensiveSupplierAction(data: {
  supplierId: string
  partnerId: string
  name: string
  email?: string
  phone?: string
  personType: string
  cpf?: string
  contribuinte?: string
  cnpj?: string
  nomeFantasia?: string
  inscricaoEstadual?: string
  regimeTributario?: string
  contribuinteIcms?: string
  country?: string
  zipCode?: string
  street?: string
  number?: string
  complement?: string
  neighborhood?: string
  city?: string
  state?: string
  municipioCodigoIbge?: string
  notes?: string
}) {
  const user = await getCurrentUser()
  if (!user) {
    return { error: "Não autenticado" }
  }

  const isOwner = await verifySupplierOwnership(data.supplierId)
  if (!isOwner) {
    return { error: "Você não tem permissão para editar este fornecedor" }
  }

  const supabase = await createClient()

  const { error } = await supabase
    .from("suppliers")
    .update({
      partner_id: data.partnerId,
      name: data.name,
      email: data.email || null,
      phone: data.phone || null,
      person_type: data.personType || null,
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
      notes: data.notes || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", data.supplierId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/erp/suppliers")
  return { success: true }
}

export async function duplicateSupplierAction(supplierId: string) {
  const user = await getCurrentUser()
  if (!user) {
    return { error: "Não autenticado" }
  }

  const isOwner = await verifySupplierOwnership(supplierId)
  if (!isOwner) {
    return { error: "Você não tem permissão para duplicar este fornecedor" }
  }

  const supabase = await createClient()

  const { data: originalSupplier, error: fetchError } = await supabase
    .from("suppliers")
    .select("*")
    .eq("id", supplierId)
    .single()

  if (fetchError || !originalSupplier) {
    return { error: "Fornecedor não encontrado" }
  }

  const newSupplierCode = await generateUniqueSupplierCode(supabase)

  const { error: createError } = await supabase
    .from("suppliers")
    .insert({
      partner_id: originalSupplier.partner_id,
      name: `${originalSupplier.name} (copia)`,
      email: originalSupplier.email,
      phone: originalSupplier.phone,
      person_type: originalSupplier.person_type,
      cpf: originalSupplier.cpf,
      contribuinte: originalSupplier.contribuinte,
      cnpj: originalSupplier.cnpj,
      nome_fantasia: originalSupplier.nome_fantasia,
      inscricao_estadual: originalSupplier.inscricao_estadual,
      regime_tributario: originalSupplier.regime_tributario,
      contribuinte_icms: originalSupplier.contribuinte_icms,
      country: originalSupplier.country,
      zip_code: originalSupplier.zip_code,
      street: originalSupplier.street,
      number: originalSupplier.number,
      complement: originalSupplier.complement,
      neighborhood: originalSupplier.neighborhood,
      city: originalSupplier.city,
      state: originalSupplier.state,
      municipio_codigo_ibge: originalSupplier.municipio_codigo_ibge,
      notes: originalSupplier.notes,
      supplier_code: newSupplierCode, // New unique code
    })

  if (createError) {
    return { error: createError.message }
  }

  revalidatePath("/erp/suppliers")
  return { success: true }
}
