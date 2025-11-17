"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { PaymentMethodSchema } from "@/lib/validation/schemas"
import { getCurrentUser, verifyPartnerOwnership } from "@/lib/auth/authorization"

export async function getPaymentMethodsAction(partnerId: string) {
  const user = await getCurrentUser()
  if (!user) {
    return { error: "Não autenticado" }
  }

  const isOwner = await verifyPartnerOwnership(partnerId)
  if (!isOwner) {
    return { error: "Você não tem permissão para visualizar métodos de pagamento deste parceiro" }
  }

  const supabase = await createClient()

  const { data: methods, error } = await supabase
    .from("payment_methods")
    .select("*")
    .eq("partner_id", partnerId)
    .order("created_at", { ascending: true })

  if (error) {
    return { error: error.message }
  }

  return { methods: methods || [] }
}

export async function createPaymentMethodAction(data: {
  partnerId: string
  name: string
  paymentType: string
  cardBrand?: string | null
  maxInstallments?: number | null
  feeType: string
  percentageRate: number
  fixedAmount: number
  receivingDays: number
  discountPercent: number
}) {
  const user = await getCurrentUser()
  if (!user) {
    return { error: "Não autenticado" }
  }

  const isOwner = await verifyPartnerOwnership(data.partnerId)
  if (!isOwner) {
    return { error: "Você não tem permissão para criar métodos de pagamento neste parceiro" }
  }

  const validation = PaymentMethodSchema.safeParse({
    partnerId: data.partnerId,
    name: data.name,
    paymentType: data.paymentType,
    cardBrand: data.cardBrand,
    isActive: true,
    feeType: data.feeType,
    percentageRate: data.percentageRate,
    fixedAmount: data.fixedAmount,
    receivingDays: data.receivingDays,
    maxInstallments: data.maxInstallments,
    discountPercent: data.discountPercent,
  })

  if (!validation.success) {
    return { error: validation.error.errors[0].message }
  }

  const supabase = await createClient()

  const { data: method, error: methodError } = await supabase
    .from("payment_methods")
    .insert({
      partner_id: data.partnerId,
      name: data.name,
      payment_type: data.paymentType,
      card_brand: data.cardBrand,
      is_active: true,
      max_installments: data.maxInstallments,
      fee_type: data.feeType,
      percentage_rate: data.percentageRate,
      fixed_amount: data.fixedAmount,
      receiving_days: data.receivingDays,
      discount_percent: data.discountPercent,
    })
    .select()
    .single()

  if (methodError) {
    return { error: methodError.message }
  }

  revalidatePath("/erp/settings")

  return { success: true, method }
}

export async function updatePaymentMethodAction(
  methodId: string,
  data: {
    name?: string
    isActive?: boolean
    cardBrand?: string | null
    maxInstallments?: number | null
    feeType?: string
    percentageRate?: number
    fixedAmount?: number
    receivingDays?: number
    discountPercent?: number
  },
) {
  const user = await getCurrentUser()
  if (!user) {
    return { error: "Não autenticado" }
  }

  const supabase = await createClient()
  const { data: method } = await supabase
    .from("payment_methods")
    .select("partner_id, partners!inner(user_id)")
    .eq("id", methodId)
    .single()

  if (!method || method.partners?.user_id !== user.id) {
    return { error: "Você não tem permissão para editar este método de pagamento" }
  }

  const updateData: any = {}
  if (data.name !== undefined) updateData.name = data.name
  if (data.isActive !== undefined) updateData.is_active = data.isActive
  if (data.cardBrand !== undefined) updateData.card_brand = data.cardBrand
  if (data.maxInstallments !== undefined) updateData.max_installments = data.maxInstallments
  if (data.feeType !== undefined) updateData.fee_type = data.feeType
  if (data.percentageRate !== undefined) updateData.percentage_rate = data.percentageRate
  if (data.fixedAmount !== undefined) updateData.fixed_amount = data.fixedAmount
  if (data.receivingDays !== undefined) updateData.receiving_days = data.receivingDays
  if (data.discountPercent !== undefined) updateData.discount_percent = data.discountPercent

  const { error: methodError } = await supabase.from("payment_methods").update(updateData).eq("id", methodId)

  if (methodError) {
    return { error: methodError.message }
  }

  revalidatePath("/erp/settings")

  return { success: true }
}

export async function deletePaymentMethodAction(methodId: string) {
  const user = await getCurrentUser()
  if (!user) {
    return { error: "Não autenticado" }
  }

  const supabase = await createClient()
  const { data: method } = await supabase
    .from("payment_methods")
    .select("partner_id, partners!inner(user_id)")
    .eq("id", methodId)
    .single()

  if (!method || method.partners?.user_id !== user.id) {
    return { error: "Você não tem permissão para excluir este método de pagamento" }
  }

  await supabase.from("payment_method_fees").delete().eq("payment_method_id", methodId)

  const { error } = await supabase.from("payment_methods").delete().eq("id", methodId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/erp/settings")

  return { success: true }
}
