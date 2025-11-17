import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { redirect } from 'next/navigation'
import { ProductPurchaseSection } from "@/components/marketplace/product-purchase-section"
import { ProductReviewForm } from "@/components/marketplace/product-review-form"
import { ProductReviewsList } from "@/components/marketplace/product-reviews-list"
import { canUserReviewProduct } from "@/app/actions/reviews"
import { Star } from 'lucide-react'

export default async function ProductDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: product } = await supabase
    .from("products")
    .select("*, partners(id, store_name, store_description, address, rating, user_id)")
    .eq("id", id)
    .eq("is_active", true)
    .single()

  if (!product) {
    redirect("/marketplace")
  }

  const { data: paymentMethods } = await supabase
    .from("payment_methods")
    .select("payment_type")
    .eq("partner_id", product.partners.id)
    .eq("is_active", true)

  const { data: reviews } = await supabase
    .from("reviews")
    .select(`
      id,
      rating,
      comment,
      created_at,
      user_id,
      product_id,
      profiles!reviews_user_id_fkey(full_name, profile_image_url)
    `)
    .eq("product_id", id)
    .order("created_at", { ascending: false })

  console.log("[v0] Reviews fetched:", reviews)
  console.log("[v0] First review data:", reviews?.[0])

  const { data: userData } = await supabase.auth.getUser()

  const isOwnProduct = userData?.user && product.partners.user_id === userData.user.id

  let canReview = false
  let userPurchaseOrder = null
  let hasReviewed = false
  if (userData?.user && !isOwnProduct) {
    canReview = await canUserReviewProduct(userData.user.id, id)
    
    // Check if user already has a review
    const { data: existingReview } = await supabase
      .from("reviews")
      .select("id")
      .eq("user_id", userData.user.id)
      .eq("product_id", id)
      .maybeSingle()
    
    hasReviewed = !!existingReview

    if (canReview) {
      const { data: order } = await supabase
        .from("orders")
        .select("id, order_items!inner(product_id)")
        .eq("buyer_id", userData.user.id)
        .eq("order_items.product_id", id)
        .eq("situation", "paid")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()
      
      userPurchaseOrder = order
    }
  }

  return (
    <div className="min-h-svh p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <Button asChild variant="outline">
            <Link href="/marketplace">Voltar ao marketplace</Link>
          </Button>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">{product.name}</CardTitle>
              {product.category && <p className="text-muted-foreground">{product.category}</p>}
            </CardHeader>
            <CardContent className="space-y-4">
              {product.description && <p className="text-sm">{product.description}</p>}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Preço:</span>
                  <span className="text-3xl font-bold">R$ {Number(product.price).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Estoque disponível:</span>
                  <span className="font-semibold">{product.stock_quantity} unidades</span>
                </div>
                {product.rating > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Avaliação:</span>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-semibold">{Number(product.rating).toFixed(1)}</span>
                      <span className="text-muted-foreground text-sm">({reviews?.length || 0})</span>
                    </div>
                  </div>
                )}
              </div>

              {userData?.user ? (
                isOwnProduct ? (
                  <div className="p-4 bg-muted rounded-lg text-center">
                    <p className="text-sm text-muted-foreground">Este é um produto da sua loja</p>
                  </div>
                ) : (
                  <ProductPurchaseSection
                    product={{
                      ...product,
                      partners: {
                        ...product.partners,
                        paymentMethods: paymentMethods?.map((pm) => pm.payment_type) || [],
                      },
                    }}
                    userId={userData.user.id}
                  />
                )
              ) : (
                <Button asChild className="w-full" size="lg">
                  <Link href={`/auth/login?returnTo=/marketplace/products/${id}`}>Faça login para comprar</Link>
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sobre o Vendedor</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Link href={`/marketplace/partners/${product.partners.id}`} className="hover:underline">
                  <h3 className="font-semibold text-lg">{product.partners.store_name}</h3>
                </Link>
                {product.partners.rating > 0 && (
                  <div className="flex items-center gap-1 mt-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-medium">{Number(product.partners.rating).toFixed(1)}</span>
                    <span className="text-sm text-muted-foreground">- Avaliação do parceiro</span>
                  </div>
                )}
              </div>
              {product.partners.store_description && <p className="text-sm">{product.partners.store_description}</p>}
              <div>
                <p className="text-sm text-muted-foreground">Endereço:</p>
                <p className="text-sm">{product.partners.address}</p>
              </div>
              <Button asChild variant="outline" className="w-full bg-transparent">
                <Link href={`/marketplace/partners/${product.partners.id}`}>Ver loja do parceiro</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {canReview && userPurchaseOrder && !hasReviewed && (
          <Card>
            <CardHeader>
              <CardTitle>Avaliar Produto</CardTitle>
              <p className="text-sm text-muted-foreground">
                Você comprou este produto. Compartilhe sua experiência!
              </p>
            </CardHeader>
            <CardContent>
              <ProductReviewForm
                productId={id}
                partnerId={product.partners.id}
                userId={userData.user!.id}
                orderId={userPurchaseOrder.id}
              />
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Avaliações dos Clientes</CardTitle>
            <p className="text-sm text-muted-foreground">
              {reviews?.length || 0} {(reviews?.length || 0) === 1 ? "avaliação" : "avaliações"}
            </p>
          </CardHeader>
          <CardContent>
            <ProductReviewsList 
              reviews={reviews || []} 
              currentUserId={userData?.user?.id}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
