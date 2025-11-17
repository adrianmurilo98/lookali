"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { getCurrentUser } from "@/lib/auth/authorization"

export async function getUserAddressesAction() {
  const user = await getCurrentUser()
  if (!user) {
    return { error: "Não autenticado", addresses: [] }
  }

  const supabase = await createClient()

  const { data: addresses, error } = await supabase
    .from("user_addresses")
    .select("*")
    .eq("user_id", user.id)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false })

  if (error) {
    return { error: error.message, addresses: [] }
  }

  return { addresses: addresses || [] }
}

export async function createUserAddressAction(data: {
  street: string
  number: string
  complement?: string
  neighborhood: string
  city: string
  state: string
  zipCode: string
  isDefault?: boolean
}) {
  const user = await getCurrentUser()
  if (!user) {
    return { error: "Não autenticado" }
  }

  const supabase = await createClient()

  const { data: existingAddresses } = await supabase
    .from("user_addresses")
    .select("id")
    .eq("user_id", user.id)

  if (existingAddresses && existingAddresses.length >= 2) {
    return { error: "Você só pode ter no máximo 2 endereços cadastrados" }
  }

  // If setting as default, unset other default addresses
  if (data.isDefault) {
    await supabase
      .from("user_addresses")
      .update({ is_default: false })
      .eq("user_id", user.id)
  }

  const { data: address, error } = await supabase
    .from("user_addresses")
    .insert({
      user_id: user.id,
      street: data.street,
      number: data.number,
      complement: data.complement || null,
      neighborhood: data.neighborhood,
      city: data.city,
      state: data.state,
      zip_code: data.zipCode,
      is_default: data.isDefault || false,
    })
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/cart")
  revalidatePath("/marketplace")

  return { success: true, address }
}

export async function deleteUserAddressAction(addressId: string) {
  const user = await getCurrentUser()
  if (!user) {
    return { error: "Não autenticado" }
  }

  const supabase = await createClient()

  const { error } = await supabase
    .from("user_addresses")
    .delete()
    .eq("id", addressId)
    .eq("user_id", user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/cart")
  revalidatePath("/marketplace")

  return { success: true }
}

export async function setDefaultAddressAction(addressId: string) {
  const user = await getCurrentUser()
  if (!user) {
    return { error: "Não autenticado" }
  }

  const supabase = await createClient()

  // Unset all default addresses
  await supabase
    .from("user_addresses")
    .update({ is_default: false })
    .eq("user_id", user.id)

  // Set the selected address as default
  const { error } = await supabase
    .from("user_addresses")
    .update({ is_default: true })
    .eq("id", addressId)
    .eq("user_id", user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/cart")
  revalidatePath("/marketplace")

  return { success: true }
}
