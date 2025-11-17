"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { ProductSchema } from "@/lib/validation/schemas"
import { getCurrentUser, verifyProductOwnership, verifyPartnerOwnership } from "@/lib/auth/authorization"

function generateProductCode(): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length))
  }
  return code
}

async function generateUniqueSKU(partnerId: string, supabase: any): Promise<string> {
  let sku = generateProductCode()
  let attempt = 0
  
  // Try up to 10 times to generate a unique SKU
  while (attempt < 10) {
    const { data: existing } = await supabase
      .from("products")
      .select("id")
      .eq("sku", sku)
      .maybeSingle()

    if (!existing) {
      return sku
    }

    sku = generateProductCode()
    attempt++
  }

  // If still not unique after 10 attempts, add timestamp
  return `${sku}${Date.now().toString().slice(-4)}`
}

export async function createProductAction(data: {
  partnerId: string
  name: string
  description: string
  price: number
  stockQuantity: number
  category: string
  isActive: boolean
}) {
  const user = await getCurrentUser()
  if (!user) {
    return { error: "Não autenticado" }
  }

  const isOwner = await verifyPartnerOwnership(data.partnerId)
  if (!isOwner) {
    return { error: "Você não tem permissão para criar produtos neste parceiro" }
  }

  const validation = ProductSchema.safeParse({
    partnerId: data.partnerId,
    name: data.name,
    description: data.description || null,
    price: data.price,
    stockQuantity: data.stockQuantity,
    category: data.category,
    isActive: data.isActive,
  })

  if (!validation.success) {
    return { error: validation.error.errors[0].message }
  }

  const supabase = await createClient()

  const { error } = await supabase.from("products").insert({
    partner_id: data.partnerId,
    name: data.name,
    description: data.description || null,
    price: data.price,
    stock_quantity: data.stockQuantity,
    category: data.category || null,
    is_active: data.isActive,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/erp/products")
  revalidatePath("/marketplace")

  return { success: true }
}

export async function updateProductAction(data: {
  productId: string
  name: string
  description: string | null
  category: string | null
  subcategory: string | null
  brand: string | null
  sku: string | null
  gtin: string | null
  unit: string | null
  product_type: string
  condition: string
  cost_price: number | null
  price: number
  stock_quantity: number
  min_stock: number | null
  location: string | null
  images: string[] | null
  visibility_status: string
  is_active: boolean
}) {
  const user = await getCurrentUser()
  if (!user) {
    return { error: "Não autenticado" }
  }

  const isOwner = await verifyProductOwnership(data.productId)
  if (!isOwner) {
    return { error: "Você não tem permissão para editar este produto" }
  }

  const supabase = await createClient()

  const additionalInfo = {
    costPrice: data.cost_price,
    minStock: data.min_stock,
    sku: data.sku,
    gtin: data.gtin,
    subcategory: data.subcategory,
    brand: data.brand,
    unit: data.unit,
    productType: data.product_type,
    condition: data.condition,
    location: data.location,
    visibilityStatus: data.visibility_status,
  }

  const fullDescription = data.description
    ? `${data.description}\n\n---\n${JSON.stringify(additionalInfo)}`
    : JSON.stringify(additionalInfo)

  const { error } = await supabase
    .from("products")
    .update({
      name: data.name,
      description: fullDescription,
      category: data.category,
      subcategory: data.subcategory,
      brand: data.brand,
      sku: data.sku,
      gtin: data.gtin,
      unit: data.unit,
      product_type: data.product_type,
      condition: data.condition,
      cost_price: data.cost_price,
      price: data.price,
      stock_quantity: data.stock_quantity,
      min_stock: data.min_stock,
      location: data.location,
      images: data.images,
      visibility_status: data.visibility_status,
      is_active: data.is_active,
      updated_at: new Date().toISOString(),
    })
    .eq("id", data.productId)

  if (error) {
    console.error("[v0] Error updating product:", error)
    return { error: error.message }
  }

  revalidatePath("/erp/products")
  revalidatePath(`/erp/products/${data.productId}`)
  revalidatePath("/marketplace")

  return { success: true }
}

export async function deleteProductAction(productId: string) {
  const user = await getCurrentUser()
  if (!user) {
    return { error: "Não autenticado" }
  }

  const isOwner = await verifyProductOwnership(productId)
  if (!isOwner) {
    return { error: "Você não tem permissão para excluir este produto" }
  }

  const supabase = await createClient()

  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", productId)

  if (error) {
    console.error("[v0] Error deleting product:", error)
    return { error: error.message }
  }

  revalidatePath("/erp/products")
  revalidatePath("/marketplace")

  return { success: true }
}

export async function createProductComprehensiveAction(data: {
  partnerId: string
  name: string
  description: string | null
  price: number
  costPrice: number | null
  stockQuantity: number
  minStock: number | null
  sku: string | null
  gtin: string | null
  category: string | null
  subcategory: string | null
  brand: string | null
  unit: string | null
  productType: string
  condition: string
  location: string | null
  visibilityStatus: string
  showPriceInStore: boolean
  isOnPromotion: boolean
  promotionType: string | null
  promotionValue: number | null
  images: string[] | null
}) {
  const user = await getCurrentUser()
  if (!user) {
    return { error: "Não autenticado" }
  }

  const isOwner = await verifyPartnerOwnership(data.partnerId)
  if (!isOwner) {
    return { error: "Você não tem permissão para criar produtos neste parceiro" }
  }

  const supabase = await createClient()

  let finalSku = data.sku
  if (!finalSku) {
    finalSku = await generateUniqueSKU(data.partnerId, supabase)
  } else {
    const { data: existing } = await supabase.from("products").select("id").eq("sku", finalSku).maybeSingle()

    if (existing) {
      return { error: `SKU ${finalSku} já está em uso` }
    }
  }

  const { data: product, error } = await supabase
    .from("products")
    .insert({
      partner_id: data.partnerId,
      name: data.name,
      description: data.description,
      price: data.price,
      cost_price: data.costPrice,
      stock_quantity: data.stockQuantity,
      min_stock: data.minStock || 0,
      sku: finalSku,
      gtin: data.gtin,
      category: data.category,
      subcategory: data.subcategory,
      brand: data.brand,
      unit: data.unit,
      product_type: data.productType,
      condition: data.condition,
      location: data.location,
      images: data.images,
      visibility_status: data.visibilityStatus,
      show_price_in_store: data.showPriceInStore,
      is_on_promotion: data.isOnPromotion,
      promotion_type: data.promotionType,
      promotion_value: data.promotionValue,
      is_active: true,
    })
    .select()
    .single()

  if (error) {
    console.error("[v0] Error creating product:", error)
    return { error: error.message }
  }

  revalidatePath("/erp/products")
  revalidatePath("/marketplace")

  return { success: true, productId: product.id, sku: finalSku }
}

export async function createProductVariantAction(data: {
  productId: string
  variantType: string
  variantName: string
  sku: string | null
  priceAdjustment: number
  stockQuantity: number
}) {
  const user = await getCurrentUser()
  if (!user) {
    return { error: "Não autenticado" }
  }

  const isOwner = await verifyProductOwnership(data.productId)
  if (!isOwner) {
    return { error: "Você não tem permissão para adicionar variantes a este produto" }
  }

  const supabase = await createClient()

  // Get parent product SKU
  const { data: product } = await supabase.from("products").select("sku").eq("id", data.productId).single()

  if (!product) {
    return { error: "Produto não encontrado" }
  }

  let variantSku = data.sku
  if (!variantSku && product.sku) {
    variantSku = `${product.sku}${data.variantName.substring(0, 3).toUpperCase()}`
  }

  const { error } = await supabase.from("product_variants").insert({
    product_id: data.productId,
    variant_type: data.variantType,
    variant_name: data.variantName,
    sku: variantSku,
    price_adjustment: data.priceAdjustment,
    stock_quantity: data.stockQuantity,
    is_active: true,
  })

  if (error) {
    console.error("[v0] Error creating variant:", error)
    return { error: error.message }
  }

  revalidatePath("/erp/products")

  return { success: true, variantSku }
}

export async function linkProductSupplierAction(
  productId: string,
  supplierId: string,
  supplierData?: {
    costPrice?: number
    supplierSku?: string
    leadTimeDays?: number
  },
) {
  const user = await getCurrentUser()
  if (!user) {
    return { error: "Não autenticado" }
  }

  const isOwner = await verifyProductOwnership(productId)
  if (!isOwner) {
    return { error: "Você não tem permissão para vincular fornecedores a este produto" }
  }

  const supabase = await createClient()

  const { error: linkError } = await supabase.from("product_suppliers").insert({
    product_id: productId,
    supplier_id: supplierId,
    cost_price: supplierData?.costPrice || null,
    supplier_sku: supplierData?.supplierSku || null,
    lead_time_days: supplierData?.leadTimeDays || null,
  })

  if (linkError && !linkError.message.includes("duplicate")) {
    console.error("[v0] Error linking supplier:", linkError)
    return { error: linkError.message }
  }

  revalidatePath("/erp/products")
  revalidatePath(`/erp/products/${productId}`)

  return { success: true }
}

export async function unlinkProductSupplierAction(productId: string, supplierId: string) {
  const user = await getCurrentUser()
  if (!user) {
    return { error: "Não autenticado" }
  }

  const isOwner = await verifyProductOwnership(productId)
  if (!isOwner) {
    return { error: "Você não tem permissão para desvincular fornecedores deste produto" }
  }

  const supabase = await createClient()

  const { error } = await supabase
    .from("product_suppliers")
    .delete()
    .eq("product_id", productId)
    .eq("supplier_id", supplierId)

  if (error) {
    console.error("[v0] Error unlinking supplier:", error)
    return { error: error.message }
  }

  revalidatePath("/erp/products")
  revalidatePath(`/erp/products/${productId}`)

  return { success: true }
}

export async function toggleProductStatusAction(productId: string) {
  const user = await getCurrentUser()
  if (!user) {
    return { error: "Não autenticado" }
  }

  const isOwner = await verifyProductOwnership(productId)
  if (!isOwner) {
    return { error: "Você não tem permissão para alterar este produto" }
  }

  const supabase = await createClient()
  const { data: product } = await supabase.from("products").select("is_active").eq("id", productId).single()

  if (!product) {
    return { error: "Produto não encontrado" }
  }

  const { error } = await supabase.from("products").update({ is_active: !product.is_active }).eq("id", productId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/erp/products")
  revalidatePath("/marketplace")

  return { success: true }
}

export async function checkProductInOrdersAction(productId: string) {
  const user = await getCurrentUser()
  if (!user) {
    return { count: 0, error: "Não autenticado" }
  }

  const isOwner = await verifyProductOwnership(productId)
  if (!isOwner) {
    return { count: 0, error: "Você não tem permissão para verificar este produto" }
  }

  const supabase = await createClient()

  console.log("[v0] Checking product in orders:", productId)

  // First get all order items for this product
  const { data: orderItems, error: itemsError } = await supabase
    .from("order_items")
    .select("order_id")
    .eq("product_id", productId)

  if (itemsError) {
    console.error("[v0] Error fetching order items:", itemsError)
    return { count: 0, error: itemsError.message }
  }

  console.log("[v0] Found order items:", orderItems?.length || 0)

  if (!orderItems || orderItems.length === 0) {
    return { count: 0 }
  }

  // Get unique order IDs
  const orderIds = [...new Set(orderItems.map((item) => item.order_id))]
  console.log("[v0] Unique order IDs:", orderIds)

  const { data: pendingOrders, error: ordersError } = await supabase
    .from("orders")
    .select("id")
    .in("id", orderIds)
    .in("situation", ["pending", "processing"])

  if (ordersError) {
    console.error("[v0] Error fetching orders:", ordersError.message)
    return { count: 0, error: ordersError.message }
  }

  console.log("[v0] Pending/processing orders:", pendingOrders?.length || 0)

  return { count: pendingOrders?.length || 0 }
}

export async function duplicateProductAction(productId: string) {
  const user = await getCurrentUser()
  if (!user) {
    return { error: "Não autenticado" }
  }

  const isOwner = await verifyProductOwnership(productId)
  if (!isOwner) {
    return { error: "Você não tem permissão para duplicar este produto" }
  }

  const supabase = await createClient()

  // Get all product data including relationships
  const { data: originalProduct, error: fetchError } = await supabase
    .from("products")
    .select("*")
    .eq("id", productId)
    .single()

  if (fetchError || !originalProduct) {
    return { error: "Produto não encontrado" }
  }

  const { data: newProduct, error: createError } = await supabase
    .from("products")
    .insert({
      partner_id: originalProduct.partner_id,
      name: `${originalProduct.name} (copia)`,
      description: originalProduct.description,
      price: originalProduct.price,
      cost_price: originalProduct.cost_price,
      stock_quantity: originalProduct.stock_quantity,
      min_stock: originalProduct.min_stock,
      category: originalProduct.category,
      subcategory: originalProduct.subcategory,
      brand: originalProduct.brand,
      sku: '', // Blank SKU - will be filled by user or auto-generated
      gtin: originalProduct.gtin,
      unit: originalProduct.unit,
      product_type: originalProduct.product_type,
      condition: originalProduct.condition,
      location: originalProduct.location,
      images: originalProduct.images, // Copy all images from original
      visibility_status: originalProduct.visibility_status,
      show_price_in_store: originalProduct.show_price_in_store,
      is_on_promotion: originalProduct.is_on_promotion,
      promotion_type: originalProduct.promotion_type,
      promotion_value: originalProduct.promotion_value,
      is_active: originalProduct.is_active,
    })
    .select()
    .single()

  if (createError) {
    return { error: createError.message }
  }

  // Copy product_suppliers relationships
  const { data: productSuppliers } = await supabase.from("product_suppliers").select("*").eq("product_id", productId)

  if (productSuppliers && productSuppliers.length > 0) {
    const newSupplierLinks = productSuppliers.map((ps) => ({
      product_id: newProduct.id,
      supplier_id: ps.supplier_id,
      cost_price: ps.cost_price,
      supplier_sku: ps.supplier_sku,
      lead_time_days: ps.lead_time_days,
    }))

    await supabase.from("product_suppliers").insert(newSupplierLinks)
  }

  revalidatePath("/erp/products")
  revalidatePath("/marketplace")

  return { success: true, newProductId: newProduct.id, redirectTo: `/erp/products/${newProduct.id}/edit` }
}

export async function getProductWithDetailsAction(productId: string) {
  const user = await getCurrentUser()
  if (!user) {
    return { error: "Não autenticado" }
  }

  const isOwner = await verifyProductOwnership(productId)
  if (!isOwner) {
    return { error: "Você não tem permissão para visualizar este produto" }
  }

  const supabase = await createClient()

  const { data: product, error } = await supabase
    .from("products")
    .select(`
      *,
      variants:product_variants(*)
    `)
    .eq("id", productId)
    .single()

  if (error) {
    return { error: error.message }
  }

  return { success: true, product }
}
