import { createClient } from "@/lib/supabase/server"

export async function getCurrentUser() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return null
  }

  return user
}

export async function getCurrentPartner() {
  const user = await getCurrentUser()
  if (!user) return null

  const supabase = await createClient()
  const { data: partner } = await supabase.from("partners").select("*").eq("user_id", user.id).single()

  return partner
}

export async function verifyProductOwnership(productId: string): Promise<boolean> {
  const user = await getCurrentUser()
  if (!user) return false

  const supabase = await createClient()
  const { data: product } = await supabase
    .from("products")
    .select("partner_id, partners!inner(user_id)")
    .eq("id", productId)
    .single()

  return product?.partners?.user_id === user.id
}

export async function verifyPartnerOwnership(partnerId: string): Promise<boolean> {
  const user = await getCurrentUser()
  if (!user) return false

  const supabase = await createClient()
  const { data: partner } = await supabase.from("partners").select("user_id").eq("id", partnerId).single()

  return partner?.user_id === user.id
}

export async function verifyOrderAccess(
  orderId: string,
): Promise<{ canAccess: boolean; role: "buyer" | "seller" | null }> {
  const user = await getCurrentUser()
  if (!user) return { canAccess: false, role: null }

  const supabase = await createClient()
  const { data: order } = await supabase
    .from("orders")
    .select("buyer_id, partner_id, partners!inner(user_id)")
    .eq("id", orderId)
    .single()

  if (!order) return { canAccess: false, role: null }

  // Verificar se é o comprador
  if (order.buyer_id === user.id) {
    return { canAccess: true, role: "buyer" }
  }

  // Verificar se é o vendedor (dono do parceiro)
  if (order.partners?.user_id === user.id) {
    return { canAccess: true, role: "seller" }
  }

  return { canAccess: false, role: null }
}

export async function verifyCustomerOwnership(customerId: string): Promise<boolean> {
  const user = await getCurrentUser()
  if (!user) return false

  const supabase = await createClient()
  const { data: customer } = await supabase
    .from("customers")
    .select("partner_id, partners!inner(user_id)")
    .eq("id", customerId)
    .single()

  return customer?.partners?.user_id === user.id
}

export async function verifySupplierOwnership(supplierId: string): Promise<boolean> {
  const user = await getCurrentUser()
  if (!user) return false

  const supabase = await createClient()
  const { data: supplier } = await supabase
    .from("suppliers")
    .select("partner_id, partners!inner(user_id)")
    .eq("id", supplierId)
    .single()

  return supplier?.partners?.user_id === user.id
}
