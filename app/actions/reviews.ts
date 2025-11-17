"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

async function checkFraudulentReview(
  supabase: any,
  userId: string,
  partnerId: string,
  productId: string | null,
): Promise<{ isSuspicious: boolean; reason?: string }> {
  // 1. Verificar se o usuário é o próprio dono do parceiro
  const { data: partner } = await supabase.from("partners").select("user_id").eq("id", partnerId).single()

  if (partner && partner.user_id === userId) {
    return { isSuspicious: true, reason: "Você não pode avaliar seus próprios produtos" }
  }

  // 2. Verificar se o usuário tem algum pedido pago deste produto/parceiro
  const { data: orders } = await supabase
    .from("orders")
    .select("id")
    .eq("buyer_id", userId)
    .eq("partner_id", partnerId)
    .eq("situation", "paid")

  if (!orders || orders.length === 0) {
    return { isSuspicious: true, reason: "Você precisa comprar este produto antes de avaliá-lo" }
  }

  // 3. Verificar se já avaliou este produto antes
  if (productId) {
    const { data: existingReview } = await supabase
      .from("reviews")
      .select("id")
      .eq("user_id", userId)
      .eq("product_id", productId)
      .maybeSingle()

    if (existingReview) {
      return { isSuspicious: true, reason: "Você já avaliou este produto" }
    }
  }

  // 4. Verificar padrão suspeito: muitas avaliações positivas do mesmo usuário para o mesmo parceiro
  const { data: userReviews } = await supabase
    .from("reviews")
    .select("rating")
    .eq("user_id", userId)
    .eq("partner_id", partnerId)

  if (userReviews && userReviews.length >= 3) {
    const allHighRatings = userReviews.every((r: any) => r.rating >= 4)
    if (allHighRatings) {
      // Registrar atividade suspeita
      await supabase.from("fraud_checks").insert({
        user_id: userId,
        action_type: "suspicious_multiple_high_ratings",
        related_user_id: partner.user_id,
        metadata: {
          partner_id: partnerId,
          review_count: userReviews.length,
        },
      })
    }
  }

  // 5. Verificar se o usuário fez muitas compras recentes (possível conta fake)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const { data: recentOrders } = await supabase
    .from("orders")
    .select("id, created_at")
    .eq("buyer_id", userId)
    .gte("created_at", thirtyDaysAgo.toISOString())

  if (recentOrders && recentOrders.length >= 5) {
    // Registrar atividade suspeita
    await supabase.from("fraud_checks").insert({
      user_id: userId,
      action_type: "high_frequency_orders",
      metadata: {
        order_count: recentOrders.length,
        period_days: 30,
      },
    })
  }

  return { isSuspicious: false }
}

async function updateProductRating(supabase: any, productId: string) {
  const { data: reviews } = await supabase
    .from("reviews")
    .select("rating")
    .eq("product_id", productId)
    .not("rating", "is", null)

  if (!reviews || reviews.length === 0) {
    return
  }

  const averageRating = reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length

  await supabase.from("products").update({ rating: averageRating }).eq("id", productId)
}

async function updatePartnerRating(supabase: any, partnerId: string) {
  // Get all products from this partner
  const { data: products } = await supabase.from("products").select("id").eq("partner_id", partnerId)

  if (!products || products.length === 0) {
    return
  }

  const productIds = products.map((p) => p.id)

  // Get all reviews for all products of this partner
  const { data: reviews } = await supabase
    .from("reviews")
    .select("rating")
    .in("product_id", productIds)
    .not("rating", "is", null)

  if (!reviews || reviews.length === 0) {
    return
  }

  const averageRating = reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length

  await supabase.from("partners").update({ rating: averageRating }).eq("id", partnerId)
}

export async function createReviewAction(data: {
  orderId: string
  userId: string
  partnerId: string
  productId: string | null
  serviceId: string | null
  rentalItemId: string | null
  spaceId: string | null
  rating: number
  comment: string
}) {
  const supabase = await createClient()

  const fraudCheck = await checkFraudulentReview(supabase, data.userId, data.partnerId, data.productId)

  if (fraudCheck.isSuspicious) {
    return { error: fraudCheck.reason || "Não foi possível criar a avaliação" }
  }

  const { error } = await supabase.from("reviews").insert({
    order_id: data.orderId,
    user_id: data.userId,
    partner_id: data.partnerId,
    product_id: data.productId,
    service_id: data.serviceId,
    rental_item_id: data.rentalItemId,
    space_id: data.spaceId,
    rating: data.rating,
    comment: data.comment || null,
  })

  if (error) {
    return { error: error.message }
  }

  if (data.productId) {
    await updateProductRating(supabase, data.productId)
  }
  await updatePartnerRating(supabase, data.partnerId)

  revalidatePath("/my-orders")
  revalidatePath("/marketplace")
  revalidatePath(`/marketplace/products/${data.productId}`)

  return { success: true }
}

export async function updateReviewAction(reviewId: string, data: {
  rating: number
  comment: string
}) {
  const supabase = await createClient()
  
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) {
    return { error: "Não autenticado" }
  }

  // Verify user owns this review
  const { data: review } = await supabase
    .from("reviews")
    .select("user_id")
    .eq("id", reviewId)
    .single()

  if (!review || review.user_id !== userData.user.id) {
    return { error: "Você não tem permissão para editar esta avaliação" }
  }

  const { error } = await supabase
    .from("reviews")
    .update({
      rating: data.rating,
      comment: data.comment || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", reviewId)

  if (error) {
    return { error: error.message }
  }

  // Trigger will automatically update partner and product ratings
  revalidatePath("/marketplace")

  return { success: true }
}

export async function deleteReviewAction(reviewId: string) {
  const supabase = await createClient()
  
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) {
    return { error: "Não autenticado" }
  }

  // Verify user owns this review
  const { data: review } = await supabase
    .from("reviews")
    .select("user_id, product_id")
    .eq("id", reviewId)
    .single()

  if (!review || review.user_id !== userData.user.id) {
    return { error: "Você não tem permissão para deletar esta avaliação" }
  }

  const { error } = await supabase
    .from("reviews")
    .delete()
    .eq("id", reviewId)

  if (error) {
    return { error: error.message }
  }

  // Trigger will automatically update partner and product ratings
  revalidatePath("/marketplace")
  if (review.product_id) {
    revalidatePath(`/marketplace/products/${review.product_id}`)
  }

  return { success: true }
}

export async function reportReviewAction(reviewId: string, reason: string) {
  const supabase = await createClient()
  
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) {
    return { error: "Não autenticado" }
  }

  // Check if already reported by this user
  const { data: existingReport } = await supabase
    .from("review_reports")
    .select("id")
    .eq("review_id", reviewId)
    .eq("reporter_id", userData.user.id)
    .maybeSingle()

  if (existingReport) {
    return { error: "Você já denunciou esta avaliação" }
  }

  const { error } = await supabase
    .from("review_reports")
    .insert({
      review_id: reviewId,
      reporter_id: userData.user.id,
      reason,
    })

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

export async function canUserReviewProduct(userId: string, productId: string): Promise<boolean> {
  const supabase = await createClient()

  // Check if user has purchased this product with paid order
  const { data: orders } = await supabase
    .from("orders")
    .select(`
      id,
      order_items!inner(product_id)
    `)
    .eq("buyer_id", userId)
    .eq("situation", "paid")
    .eq("order_items.product_id", productId)

  if (!orders || orders.length === 0) {
    return false
  }

  // Check if user already reviewed this product
  const { data: existingReview } = await supabase
    .from("reviews")
    .select("id")
    .eq("user_id", userId)
    .eq("product_id", productId)
    .maybeSingle()

  return !existingReview
}

export async function getProductReviews(productId: string) {
  const supabase = await createClient()
  
  const { data: reviews } = await supabase
    .from("reviews")
    .select(`
      *,
      profiles:user_id(full_name, profile_image_url)
    `)
    .eq("product_id", productId)
    .order("created_at", { ascending: false })

  return reviews || []
}

export async function getPartnerReviews(partnerId: string) {
  const supabase = await createClient()
  
  const { data: reviews } = await supabase
    .from("reviews")
    .select(`
      *,
      profiles:user_id(full_name, profile_image_url),
      products(name, images),
      services(name, images)
    `)
    .eq("partner_id", partnerId)
    .order("created_at", { ascending: false })

  return reviews || []
}
