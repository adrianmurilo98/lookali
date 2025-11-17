"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from 'next/navigation'
import { getCurrentUser, verifyPartnerOwnership } from "@/lib/auth/authorization"
import { z } from "zod"

const ServiceSchema = z.object({
  partnerId: z.string().uuid(),
  name: z.string().min(1).max(200),
  description: z.string().max(5000).optional().nullable(),
  price: z.number().min(0.01).max(999999),
})

function generateServiceCode(): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length))
  }
  return code
}

async function generateUniqueServiceCode(supabase: any): Promise<string> {
  let code = generateServiceCode()
  let attempt = 0
  
  while (attempt < 10) {
    const { data: existing } = await supabase
      .from("services")
      .select("id")
      .eq("service_code", code)
      .maybeSingle()

    if (!existing) {
      return code
    }

    code = generateServiceCode()
    attempt++
  }

  return `${code}${Date.now().toString().slice(-4)}`
}

export async function createServiceAction(data: {
  partnerId: string
  name: string
  description: string
  price: number
}) {
  const user = await getCurrentUser()
  if (!user) {
    return { error: "Não autenticado" }
  }

  const isOwner = await verifyPartnerOwnership(data.partnerId)
  if (!isOwner) {
    return { error: "Você não tem permissão para criar serviços neste parceiro" }
  }

  const validation = ServiceSchema.safeParse(data)
  if (!validation.success) {
    return { error: validation.error.errors[0].message }
  }

  const supabase = await createClient()
  
  const serviceCode = await generateUniqueServiceCode(supabase)

  const { error } = await supabase.from("services").insert({
    partner_id: data.partnerId,
    name: data.name,
    description: data.description || null,
    price: data.price,
    service_code: serviceCode,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/erp/services")
  revalidatePath("/marketplace")

  redirect("/erp/services")
}

export async function deleteServiceAction(serviceId: string) {
  const user = await getCurrentUser()
  if (!user) {
    return { error: "Não autenticado" }
  }

  const supabase = await createClient()
  const { data: service } = await supabase
    .from("services")
    .select("partner_id, partners!inner(user_id)")
    .eq("id", serviceId)
    .single()

  if (!service || service.partners?.user_id !== user.id) {
    return { error: "Você não tem permissão para excluir este serviço" }
  }

  const { error } = await supabase.from("services").delete().eq("id", serviceId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/erp/services")
  revalidatePath("/marketplace")

  redirect("/erp/services")
}

export async function duplicateServiceAction(serviceId: string) {
  const user = await getCurrentUser()
  if (!user) {
    return { error: "Não autenticado" }
  }

  const supabase = await createClient()
  const { data: service } = await supabase
    .from("services")
    .select("*, partners!inner(user_id)")
    .eq("id", serviceId)
    .single()

  if (!service || service.partners?.user_id !== user.id) {
    return { error: "Você não tem permissão para duplicar este serviço" }
  }

  const newServiceCode = await generateUniqueServiceCode(supabase)

  const { data: newService, error: createError } = await supabase
    .from("services")
    .insert({
      partner_id: service.partner_id,
      name: `${service.name} (copia)`,
      description: service.description,
      price: service.price,
      duration_minutes: service.duration_minutes,
      images: service.images, // Copy all images
      service_code: newServiceCode, // New unique code
      is_active: service.is_active,
    })
    .select()
    .single()

  if (createError) {
    return { error: createError.message }
  }

  revalidatePath("/erp/services")
  revalidatePath("/marketplace")

  return { success: true, newServiceId: newService.id }
}
