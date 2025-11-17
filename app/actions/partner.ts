"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

interface CreatePartnerData {
  userId: string
  storeName: string
  storeDescription: string
  zipCode: string
  street: string
  number: string
  complement: string | null
  neighborhood: string
  city: string
  state: string
  businessType: "pf" | "pj"
  cnpj: string | null
  openingHours: any
  storeImageUrl: string | null
  sellsProducts: boolean
  providesServices: boolean
  rentsItems: boolean
  hasReservableSpaces: boolean
}

export async function createPartnerAction(data: CreatePartnerData) {
  const supabase = await createClient()

  console.log("[v0] Criando parceiro com dados:", data)

  try {
    const { data: existingPartner } = await supabase
      .from("partners")
      .select("id")
      .eq("user_id", data.userId)
      .maybeSingle()

    if (existingPartner) {
      return { error: "Você já possui uma conta de parceiro" }
    }

    const { data: duplicateName } = await supabase
      .from("partners")
      .select("id")
      .ilike("store_name", data.storeName)
      .maybeSingle()

    if (duplicateName) {
      return { error: "Já existe uma loja com este nome. Escolha outro nome." }
    }

    const fullAddress = `${data.street}, ${data.number}${data.complement ? `, ${data.complement}` : ""} - ${data.neighborhood}, ${data.city} - ${data.state}, ${data.zipCode}`

    const { data: partner, error: partnerError } = await supabase
      .from("partners")
      .insert({
        user_id: data.userId,
        store_name: data.storeName,
        store_description: data.storeDescription,
        address: fullAddress,
        zip_code: data.zipCode,
        street: data.street,
        number: data.number,
        complement: data.complement,
        neighborhood: data.neighborhood,
        city: data.city,
        state: data.state,
        business_type: data.businessType,
        cnpj: data.cnpj,
        opening_hours: data.openingHours,
        store_image_url: data.storeImageUrl,
        sells_products: data.sellsProducts,
        provides_services: data.providesServices,
        rents_items: data.rentsItems,
        has_reservable_spaces: data.hasReservableSpaces,
      })
      .select()
      .single()

    if (partnerError) {
      console.error("[v0] Erro ao criar parceiro:", partnerError)
      return { error: "Erro ao criar parceria: " + partnerError.message }
    }

    await supabase.from("payment_methods").insert([
      {
        partner_id: partner.id,
        name: "Dinheiro",
        payment_type: "dinheiro",
        is_active: true,
      },
      {
        partner_id: partner.id,
        name: "PIX",
        payment_type: "pix",
        is_active: true,
      },
    ])

    revalidatePath("/", "layout")
    revalidatePath("/become-partner")
    revalidatePath("/erp/dashboard")
    revalidatePath("/erp")

    console.log("[v0] Parceiro criado com sucesso:", partner.id)
    return { success: true, partnerId: partner.id }
  } catch (err) {
    console.error("[v0] Exceção ao criar parceiro:", err)
    return { error: "Erro inesperado ao criar parceria" }
  }
}

export async function updatePartnerAction(partnerId: string, data: Partial<CreatePartnerData>) {
  const supabase = await createClient()

  const updateData: any = {}
  if (data.storeName) updateData.store_name = data.storeName
  if (data.storeDescription !== undefined) updateData.store_description = data.storeDescription
  if (data.businessType) updateData.business_type = data.businessType
  if (data.cnpj !== undefined) updateData.cnpj = data.cnpj
  if (data.openingHours !== undefined) updateData.opening_hours = data.openingHours
  if (data.storeImageUrl !== undefined) updateData.store_image_url = data.storeImageUrl
  if (data.sellsProducts !== undefined) updateData.sells_products = data.sellsProducts
  if (data.providesServices !== undefined) updateData.provides_services = data.providesServices
  if (data.rentsItems !== undefined) updateData.rents_items = data.rentsItems
  if (data.hasReservableSpaces !== undefined) updateData.has_reservable_spaces = data.hasReservableSpaces

  if (data.zipCode) updateData.zip_code = data.zipCode
  if (data.street) updateData.street = data.street
  if (data.number) updateData.number = data.number
  if (data.complement !== undefined) updateData.complement = data.complement
  if (data.neighborhood) updateData.neighborhood = data.neighborhood
  if (data.city) updateData.city = data.city
  if (data.state) updateData.state = data.state

  // Atualizar endereço completo se algum campo foi modificado
  if (data.street || data.number || data.neighborhood || data.city || data.state || data.zipCode) {
    const { data: currentPartner } = await supabase.from("partners").select("*").eq("id", partnerId).single()

    if (currentPartner) {
      const street = data.street || currentPartner.street
      const number = data.number || currentPartner.number
      const complement = data.complement !== undefined ? data.complement : currentPartner.complement
      const neighborhood = data.neighborhood || currentPartner.neighborhood
      const city = data.city || currentPartner.city
      const state = data.state || currentPartner.state
      const zipCode = data.zipCode || currentPartner.zip_code

      updateData.address = `${street}, ${number}${complement ? `, ${complement}` : ""} - ${neighborhood}, ${city} - ${state}, ${zipCode}`
    }
  }

  const { error } = await supabase.from("partners").update(updateData).eq("id", partnerId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/erp/settings")

  return { success: true }
}
