import { createClient } from "@/lib/supabase/server"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Star, MapPin, Clock, ShoppingBag, Package, Users, Search, Flag } from 'lucide-react'
import Link from "next/link"
import { notFound } from 'next/navigation'
import { getPartnerReviews } from "@/app/actions/reviews"

export default async function PartnerProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ search?: string; category?: string; filter?: string; tab?: string }>
}) {
  const { id } = await params
  const urlParams = await searchParams
  const supabase = await createClient()

  // Fetch partner data
  const { data: partner } = await supabase.from("partners").select("*").eq("id", id).eq("is_active", true).single()

  if (!partner) {
    notFound()
  }

  // Fetch partner's products
  let productsQuery = supabase.from("products").select("*").eq("partner_id", id).eq("is_active", true)

  if (urlParams.search) {
    productsQuery = productsQuery.ilike("name", `%${urlParams.search}%`)
  }

  if (urlParams.category) {
    productsQuery = productsQuery.eq("category", urlParams.category)
  }

  const { data: products, count: productsCount } = await productsQuery
    .order("created_at", { ascending: false })
    .limit(100)

  // Fetch partner's services
  const { data: services, count: servicesCount } = await supabase
    .from("services")
    .select("*")
    .eq("partner_id", id)
    .eq("is_active", true)
    .order("created_at", { ascending: false })

  // Fetch partner's rental items
  const { data: rentalItems, count: rentalItemsCount } = await supabase
    .from("rental_items")
    .select("*")
    .eq("partner_id", id)
    .eq("is_active", true)
    .order("created_at", { ascending: false })

  // Fetch partner's spaces
  const { data: spaces, count: spacesCount } = await supabase
    .from("reservable_spaces")
    .select("*")
    .eq("partner_id", id)
    .eq("is_active", true)
    .order("created_at", { ascending: false })

  // Count total sales (completed orders)
  const { count: salesCount } = await supabase
    .from("orders")
    .select("*", { count: "exact", head: true })
    .eq("partner_id", id)
    .eq("situation", "completed")

  // Count total reviews
  const { count: reviewsCount } = await supabase
    .from("reviews")
    .select("*", { count: "exact", head: true })
    .eq("partner_id", id)

  const partnerReviews = await getPartnerReviews(id)

  const totalItems = (productsCount || 0) + (servicesCount || 0) + (rentalItemsCount || 0) + (spacesCount || 0)
  const allItems = [
    ...(products || []).map((p) => ({ ...p, type: "product" })),
    ...(services || []).map((s) => ({ ...s, type: "service" })),
    ...(rentalItems || []).map((r) => ({ ...r, type: "rental" })),
    ...(spaces || []).map((sp) => ({ ...sp, type: "space" })),
  ]

  // Get unique categories
  const categories = Array.from(new Set(products?.map((p) => p.category).filter(Boolean) || []))

  // Apply additional filters
  let filteredItems = allItems
  if (urlParams.filter === "products") filteredItems = allItems.filter((i) => i.type === "product")
  if (urlParams.filter === "services") filteredItems = allItems.filter((i) => i.type === "service")
  if (urlParams.filter === "rentals") filteredItems = allItems.filter((i) => i.type === "rental")
  if (urlParams.filter === "spaces") filteredItems = allItems.filter((i) => i.type === "space")

  const partnerInitials = partner.store_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="min-h-svh bg-background">
      <Header />

      {/* Banner decorativo */}
      <div className="relative h-48 bg-gradient-to-br from-purple-600 via-purple-700 to-yellow-400 overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          {/* Pattern de retângulos radiantes */}
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="partner-pattern" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
                {Array.from({ length: 30 }).map((_, i) => {
                  const angle = (i * 360) / 30
                  const length = 40 + (i % 3) * 20
                  const x1 = 50
                  const y1 = 50
                  const x2 = 50 + length * Math.cos((angle * Math.PI) / 180)
                  const y2 = 50 + length * Math.sin((angle * Math.PI) / 180)
                  return (
                    <line
                      key={i}
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke="#fbbf24"
                      strokeWidth={i % 2 === 0 ? "8" : "5"}
                      opacity="0.7"
                    />
                  )
                })}
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#partner-pattern)" />
          </svg>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16">
        {/* Profile Section */}
        <div className="bg-card rounded-lg shadow-lg p-6 mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
            <Avatar className="w-24 h-24 border-4 border-background">
              <AvatarImage src={partner.store_image_url || undefined} alt={partner.store_name} />
              <AvatarFallback className="text-2xl font-bold">{partnerInitials}</AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <h1 className="text-3xl font-bold">{partner.store_name}</h1>
                <Badge variant="secondary" className="bg-lime-500 text-black hover:bg-lime-600">
                  Loja Oficial
                </Badge>
              </div>

              <div className="flex items-center gap-1 mb-2">
                {partner.rating != null && partner.rating > 0 ? (
                  <>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-5 h-5 ${
                          i < Math.floor(partner.rating) ? "fill-yellow-400 text-yellow-400" : "fill-muted text-muted"
                        }`}
                      />
                    ))}
                    <span className="ml-2 text-sm text-muted-foreground">
                      {Number(partner.rating).toFixed(1)} ({reviewsCount} {(reviewsCount || 0) === 1 ? 'avaliação' : 'avaliações'})
                    </span>
                  </>
                ) : (
                  <span className="text-sm text-muted-foreground">Sem avaliações</span>
                )}
              </div>

              <p className="text-sm text-muted-foreground">
                {partner.created_at
                  ? `Na plataforma desde ${new Date(partner.created_at).getFullYear()}`
                  : "Parceiro verificado"}
              </p>
            </div>

            <Button size="lg" className="w-full sm:w-auto">
              <Users className="w-4 h-4 mr-2" />
              Seguir
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 py-4 border-t border-border">
            <div className="text-center">
              <p className="text-2xl font-bold">{totalItems}</p>
              <p className="text-sm text-muted-foreground">à venda</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{salesCount || 0}</p>
              <p className="text-sm text-muted-foreground">vendidos</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{reviewsCount || 0}</p>
              <p className="text-sm text-muted-foreground">{(reviewsCount || 0) === 1 ? 'avaliação' : 'avaliações'}</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">-</p>
              <p className="text-sm text-muted-foreground">seguidores</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">-</p>
              <p className="text-sm text-muted-foreground">seguindo</p>
            </div>
          </div>

          {/* Description */}
          {partner.store_description && (
            <div className="pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground">{partner.store_description}</p>
            </div>
          )}

          {/* Location */}
          {partner.city && partner.state && (
            <div className="flex items-center gap-2 mt-4 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4" />
              <span>
                {partner.city}, {partner.state}
              </span>
            </div>
          )}
        </div>

        {/* Search and Filters */}
        <div className="bg-card rounded-lg shadow p-4 mb-6">
          <div className="flex gap-2 mb-4 border-b">
            <Button
              variant={urlParams.tab !== "reviews" ? "ghost" : "ghost"}
              className={urlParams.tab !== "reviews" ? "border-b-2 border-primary" : ""}
              asChild
            >
              <Link href={`/marketplace/partners/${id}`}>
                <ShoppingBag className="w-4 h-4 mr-2" />
                Produtos e Serviços
              </Link>
            </Button>
            <Button
              variant={urlParams.tab === "reviews" ? "ghost" : "ghost"}
              className={urlParams.tab === "reviews" ? "border-b-2 border-primary" : ""}
              asChild
            >
              <Link href={`/marketplace/partners/${id}?tab=reviews`}>
                <Star className="w-4 h-4 mr-2" />
                Avaliações ({(reviewsCount || 0)})
              </Link>
            </Button>
          </div>

          {urlParams.tab === "reviews" ? (
            <div className="space-y-6">
              {partnerReviews.length > 0 ? (
                partnerReviews.map((review: any) => (
                  <div key={review.id} className="border-b pb-6 last:border-0 last:pb-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={review.profiles?.profile_image_url || undefined} />
                          <AvatarFallback>
                            {review.profiles?.full_name?.[0]?.toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <p className="font-semibold">{review.profiles?.full_name || "Usuário"}</p>
                            <div className="flex items-center gap-1">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-4 h-4 ${
                                    i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                                  }`}
                                />
                              ))}
                            </div>
                          </div>

                          <p className="text-xs text-muted-foreground mb-2">
                            {new Date(review.created_at).toLocaleDateString("pt-BR", {
                              day: "2-digit",
                              month: "long",
                              year: "numeric",
                            })}
                          </p>

                          {review.products && (
                            <Link
                              href={`/marketplace/products/${review.product_id}`}
                              className="text-sm text-primary hover:underline mb-2 block"
                            >
                              Produto: {review.products.name}
                            </Link>
                          )}
                          {review.services && (
                            <Link
                              href={`/marketplace/services/${review.service_id}`}
                              className="text-sm text-primary hover:underline mb-2 block"
                            >
                              Serviço: {review.services.name}
                            </Link>
                          )}

                          {review.comment && <p className="text-sm mt-2">{review.comment}</p>}
                        </div>
                      </div>

                      <Button variant="ghost" size="sm">
                        <Flag className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Este parceiro ainda não recebeu avaliações.
                </div>
              )}
            </div>
          ) : (
            <>
              <form className="flex gap-2 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    name="search"
                    placeholder="Buscar nessa loja..."
                    defaultValue={urlParams.search}
                    className="pl-10"
                  />
                </div>
                <Button type="submit">Buscar</Button>
              </form>

              <div className="flex flex-wrap gap-2">
                <Button variant={!urlParams.filter ? "default" : "outline"} size="sm" asChild>
                  <Link href={`/marketplace/partners/${id}`}>Todos</Link>
                </Button>
                {productsCount && productsCount > 0 ? (
                  <Button variant={urlParams.filter === "products" ? "default" : "outline"} size="sm" asChild>
                    <Link href={`/marketplace/partners/${id}?filter=products`}>
                      <ShoppingBag className="w-4 h-4 mr-2" />
                      Produtos ({productsCount})
                    </Link>
                  </Button>
                ) : null}
                {servicesCount && servicesCount > 0 ? (
                  <Button variant={urlParams.filter === "services" ? "default" : "outline"} size="sm" asChild>
                    <Link href={`/marketplace/partners/${id}?filter=services`}>
                      <Clock className="w-4 h-4 mr-2" />
                      Serviços ({servicesCount})
                    </Link>
                  </Button>
                ) : null}
                {rentalItemsCount && rentalItemsCount > 0 ? (
                  <Button variant={urlParams.filter === "rentals" ? "default" : "outline"} size="sm" asChild>
                    <Link href={`/marketplace/partners/${id}?filter=rentals`}>
                      <Package className="w-4 h-4 mr-2" />
                      Aluguéis ({rentalItemsCount})
                    </Link>
                  </Button>
                ) : null}
                {spacesCount && spacesCount > 0 ? (
                  <Button variant={urlParams.filter === "spaces" ? "default" : "outline"} size="sm" asChild>
                    <Link href={`/marketplace/partners/${id}?filter=spaces`}>
                      <MapPin className="w-4 h-4 mr-2" />
                      Espaços ({spacesCount})
                    </Link>
                  </Button>
                ) : null}

                {categories.length > 0 && (
                  <div className="w-full mt-2 flex flex-wrap gap-2">
                    <span className="text-sm text-muted-foreground self-center">Categorias:</span>
                    {categories.map((cat) => (
                      <Button key={cat} variant={urlParams.category === cat ? "default" : "outline"} size="sm" asChild>
                        <Link
                          href={`/marketplace/partners/${id}?${urlParams.filter ? `filter=${urlParams.filter}&` : ""}category=${cat}`}
                        >
                          {cat}
                        </Link>
                      </Button>
                    ))}
                    {urlParams.category && (
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/marketplace/partners/${id}${urlParams.filter ? `?filter=${urlParams.filter}` : ""}`}>
                          Limpar filtros
                        </Link>
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {/* Items Grid */}
              <div className="pb-12">
                {filteredItems.length > 0 ? (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {filteredItems.map((item: any) => {
                      const itemUrl =
                        item.type === "product"
                          ? `/marketplace/products/${item.id}`
                          : item.type === "service"
                            ? `/marketplace/services/${item.id}`
                            : item.type === "rental"
                              ? `/marketplace/rental-items/${item.id}`
                              : `/marketplace/spaces/${item.id}`

                      const itemPrice =
                        item.type === "product"
                          ? item.price
                          : item.type === "service"
                            ? item.price
                            : item.type === "rental"
                              ? item.price_per_day
                              : item.price_per_hour

                      const priceLabel = item.type === "rental" ? "/dia" : item.type === "space" ? "/hora" : ""

                      return (
                        <Card key={`${item.type}-${item.id}`} className="overflow-hidden hover:shadow-lg transition-shadow">
                          <div className="aspect-square bg-muted relative">
                            {item.images && item.images[0] ? (
                              <img
                                src={item.images[0] || "/placeholder.svg"}
                                alt={item.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package className="w-16 h-16 text-muted-foreground" />
                              </div>
                            )}
                            <Badge className="absolute top-2 right-2" variant="secondary">
                              {item.type === "product"
                                ? "Produto"
                                : item.type === "service"
                                  ? "Serviço"
                                  : item.type === "rental"
                                    ? "Aluguel"
                                    : "Espaço"}
                            </Badge>
                          </div>
                          <CardHeader>
                            <CardTitle className="text-base line-clamp-2">{item.name}</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-2">
                            {item.description && (
                              <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
                            )}
                            <div className="flex justify-between items-center">
                              <span className="text-xl font-bold">
                                R$ {Number(itemPrice).toFixed(2)}
                                {priceLabel}
                              </span>
                              {item.rating > 0 && (
                                <div className="flex items-center gap-1">
                                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                  <span className="text-sm font-medium">{Number(item.rating).toFixed(1)}</span>
                                </div>
                              )}
                            </div>
                            <Button asChild className="w-full">
                              <Link href={itemUrl}>Ver detalhes</Link>
                            </Button>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-lg font-semibold mb-2">Nenhum item encontrado</p>
                      <p className="text-muted-foreground">
                        {urlParams.search || urlParams.category
                          ? "Tente ajustar os filtros de busca"
                          : "Este parceiro ainda não possui itens disponíveis"}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
