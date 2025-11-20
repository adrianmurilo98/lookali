"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function addToCartAction(productId: string, quantity = 1) {
  const supabase = await createClient()

  const { data: userData } = await supabase.auth.getUser()
  if (!userData?.user) {
    return { error: "Usuário não autenticado" }
  }

  // Buscar informações do produto
  const { data: product, error: productError } = await supabase
    .from("products")
    .select("*, partners(user_id)")
    .eq("id", productId)
    .single()

  if (productError || !product) {
    return { error: "Produto não encontrado" }
  }

  // Verificar se o usuário não está tentando comprar seu próprio produto
  if (product.partners.user_id === userData.user.id) {
    return { error: "Você não pode comprar produtos da sua própria loja" }
  }

  // Verificar se já existe no carrinho
  const { data: existingItem } = await supabase
    .from("cart_items")
    .select("*")
    .eq("user_id", userData.user.id)
    .eq("product_id", productId)
    .maybeSingle()

  if (existingItem) {
    // Atualizar quantidade
    const { error } = await supabase
      .from("cart_items")
      .update({
        quantity: existingItem.quantity + quantity,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existingItem.id)

    if (error) return { error: error.message }
  } else {
    // Adicionar novo item
    const { error } = await supabase.from("cart_items").insert({
      user_id: userData.user.id,
      partner_id: product.partner_id,
      product_id: productId,
      quantity,
      selected: true, // Assuming new items are selected by default
    })

    if (error) return { error: error.message }
  }

  revalidatePath("/cart")
  revalidatePath("/marketplace")
  return { success: true }
}

export async function updateCartQuantityAction(cartItemId: string, quantity: number) {
  const supabase = await createClient()

  if (quantity <= 0) {
    const { error } = await supabase.from("cart_items").delete().eq("id", cartItemId)
    if (error) return { error: error.message }
  } else {
    const { error } = await supabase
      .from("cart_items")
      .update({ quantity, updated_at: new Date().toISOString() })
      .eq("id", cartItemId)

    if (error) return { error: error.message }
  }

  revalidatePath("/cart")
  return { success: true }
}

export async function removeFromCartAction(cartItemId: string) {
  const supabase = await createClient()

  const { error } = await supabase.from("cart_items").delete().eq("id", cartItemId)

  if (error) return { error: error.message }

  revalidatePath("/cart")
  return { success: true }
}

export async function toggleCartSelectionAction(cartItemId: string) {
  const supabase = await createClient()

  const { data: userData } = await supabase.auth.getUser()
  if (!userData?.user) {
    return { error: "Usuário não autenticado" }
  }

  // Buscar item atual
  const { data: item } = await supabase.from("cart_items").select("selected").eq("id", cartItemId).single()

  if (!item) {
    return { error: "Item não encontrado" }
  }

  // Toggle da seleção
  const { error } = await supabase
    .from("cart_items")
    .update({ selected: item.selected === false ? true : false })
    .eq("id", cartItemId)

  if (error) return { error: error.message }

  revalidatePath("/cart")
  return { success: true }
}

export async function checkoutCartAction(
  partnerItems: { cartItemId: string; productId: string; quantity: number }[],
  deliveryType: "delivery" | "pickup",
  deliveryAddress: string,
  paymentMethod: string,
  notes?: string,
) {
  const supabase = await createClient()

  const { data: userData } = await supabase.auth.getUser()
  if (!userData?.user) {
    return { error: "Usuário não autenticado" }
  }

  const { data: buyerProfile } = await supabase.from("profiles").select("full_name").eq("id", userData.user.id).single()

  const productIds = partnerItems.map((item) => item.productId)
  const { data: products, error: productsError } = await supabase.from("products").select("*").in("id", productIds)

  if (productsError || !products || products.length === 0) {
    return { error: "Produtos não encontrados" }
  }

  let totalAmount = 0
  const orderItems = []

  for (const item of partnerItems) {
    const product = products.find((p) => p.id === item.productId)
    if (!product) continue

    const subtotal = Number(product.price) * item.quantity
    totalAmount += subtotal

    orderItems.push({
      product_id: product.id,
      product_name: product.name,
      product_price: product.price,
      quantity: item.quantity,
      subtotal,
    })
  }

  const partnerId = products[0].partner_id

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      buyer_id: userData.user.id,
      customer_name: buyerProfile?.full_name || null,
      partner_id: partnerId,
      product_id: products[0].id,
      quantity: partnerItems.reduce((sum, item) => sum + item.quantity, 0),
      total_amount: totalAmount,
      delivery_type: deliveryType,
      delivery_address: deliveryAddress,
      payment_method: paymentMethod,
      situation: "pending",
      notes,
    })
    .select()
    .single()

  if (orderError || !order) {
    return { error: orderError?.message || "Erro ao criar pedido" }
  }

  const itemsToInsert = orderItems.map((item) => ({
    ...item,
    order_id: order.id,
  }))

  const { error: itemsError } = await supabase.from("order_items").insert(itemsToInsert)

  if (itemsError) {
    await supabase.from("orders").delete().eq("id", order.id)
    return { error: "Erro ao adicionar itens ao pedido" }
  }

  const cartItemIds = partnerItems.map((item) => item.cartItemId)
  await supabase.from("cart_items").delete().in("id", cartItemIds)

  revalidatePath("/cart")
  revalidatePath("/my-orders")
  revalidatePath("/erp/orders")

  return { success: true, orderId: order.id }
}
