"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { OrderSchema } from "@/lib/validation/schemas"
import { getCurrentUser, verifyOrderAccess } from "@/lib/auth/authorization"

export async function createOrderAction(data: {
  itemId: string
  itemType: "product" | "service" | "rental_item" | "space"
  quantity: number
  totalAmount: number
  deliveryType: "delivery" | "pickup"
  deliveryAddress: string
  paymentMethod: string
  notes: string
  partnerId: string
  buyerId: string
}) {
  const user = await getCurrentUser()
  if (!user) {
    return { error: "Não autenticado" }
  }

  if (data.buyerId !== user.id) {
    return { error: "Você só pode criar pedidos para si mesmo" }
  }

  const validation = OrderSchema.safeParse({
    itemId: data.itemId,
    itemType: data.itemType,
    quantity: data.quantity,
    totalAmount: data.totalAmount,
    deliveryType: data.deliveryType,
    deliveryAddress: data.deliveryAddress,
    paymentMethod: data.paymentMethod,
    notes: data.notes,
    partnerId: data.partnerId,
    buyerId: data.buyerId,
  })

  if (!validation.success) {
    return { error: validation.error.errors[0].message }
  }

  const supabase = await createClient()

  const { data: buyerProfile } = await supabase.from("profiles").select("full_name").eq("id", data.buyerId).single()

  const orderData: any = {
    buyer_id: data.buyerId,
    customer_name: buyerProfile?.full_name || null,
    partner_id: data.partnerId,
    quantity: data.quantity,
    total_amount: data.totalAmount,
    delivery_type: data.deliveryType,
    delivery_address: data.deliveryAddress,
    payment_method: data.paymentMethod,
    situation: "pending",
    notes: data.notes || null,
  }

  if (data.itemType === "product") {
    orderData.product_id = data.itemId
  } else if (data.itemType === "service") {
    orderData.service_id = data.itemId
  } else if (data.itemType === "rental_item") {
    orderData.rental_item_id = data.itemId
  } else if (data.itemType === "space") {
    orderData.space_id = data.itemId
  }

  const { data: order, error } = await supabase.from("orders").insert(orderData).select().single()

  if (error) {
    return { error: error.message }
  }

  await supabase.from("order_items").insert({
    order_id: order.id,
    product_id: data.itemId,
    product_name: "Produto",
    product_price: data.totalAmount / data.quantity,
    quantity: data.quantity,
    subtotal: data.totalAmount,
  })

  revalidatePath("/erp/orders")
  revalidatePath("/marketplace")
  revalidatePath("/my-orders")

  return { success: true, orderNumber: order.order_number, orderId: order.id }
}

export async function updateOrderAction(
  orderId: string,
  data: {
    situation: string
    internal_notes?: string
  },
) {
  const user = await getCurrentUser()
  if (!user) {
    return { error: "Não autenticado" }
  }

  const access = await verifyOrderAccess(orderId)
  if (!access.canAccess) {
    return { error: "Você não tem permissão para editar este pedido" }
  }

  if (access.role !== "seller") {
    return { error: "Apenas o vendedor pode atualizar o status do pedido" }
  }

  const validSituations = ["pending", "paid", "shipped", "delivered", "cancelled"]
  if (!validSituations.includes(data.situation)) {
    return { error: "Situação inválida" }
  }

  const supabase = await createClient()

  const { error } = await supabase
    .from("orders")
    .update({
      situation: data.situation,
      internal_notes: data.internal_notes,
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/erp/orders")
  revalidatePath(`/erp/orders/${orderId}`)

  redirect("/erp/orders")
}

export async function deleteOrderAction(orderId: string) {
  const user = await getCurrentUser()
  if (!user) {
    return { error: "Não autenticado" }
  }

  const access = await verifyOrderAccess(orderId)
  if (!access.canAccess) {
    return { error: "Você não tem permissão para excluir este pedido" }
  }

  if (access.role !== "seller") {
    return { error: "Apenas o vendedor pode excluir pedidos" }
  }

  const supabase = await createClient()

  await supabase.from("order_items").delete().eq("order_id", orderId)
  await supabase.from("stock_movements").delete().eq("order_id", orderId)

  const { error } = await supabase.from("orders").delete().eq("id", orderId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/erp/orders")

  redirect("/erp/orders")
}
