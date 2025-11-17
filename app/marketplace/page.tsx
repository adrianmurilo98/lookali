import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Header } from "@/components/header"
import { Star } from 'lucide-react'
import Image from "next/image"

export default async function MarketplacePage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; category?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()

  let productsQuery = supabase.from("products").select("*, partners(id, store_name, rating)").eq("is_active", true)

  if (params.search) {
    productsQuery = productsQuery.ilike("name", `%${params.search}%`)
  }

  const { data: products } = await productsQuery.order("created_at", { ascending: false })

  let servicesQuery = supabase.from("services").select("*, partners(id, store_name, rating)").eq("is_active", true)

  if (params.search) {
    servicesQuery = servicesQuery.ilike("name", `%${params.search}%`)
  }

  const { data: services } = await servicesQuery.order("created_at", { ascending: false })

  const { data: rentalItems } = await supabase
    .from("rental_items")
    .select("*, partners(id, store_name, rating)")
    .eq("is_active", true)
    .order("created_at", { ascending: false })

  const { data: spaces } = await supabase
    .from("reservable_spaces")
    .select("*, partners(id, store_name, rating)")
    .eq("is_active", true)
    .order("created_at", { ascending: false })

  return (
    <div className="min-h-svh">
      <Header />

      <div className="p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold">Marketplace Lookali</h1>
              <p className="text-muted-foreground">Descubra produtos, serviços e muito mais</p>
            </div>
            <div className="flex gap-2">
              <Button asChild variant="outline">
                <Link href="/">Início</Link>
              </Button>
              <Button asChild>
                <Link href="/auth/login">Entrar</Link>
              </Button>
            </div>
          </div>

          <form action="/marketplace" method="get" className="flex gap-2">
            <Input
              name="search"
              placeholder="Buscar produtos, serviços..."
              defaultValue={params.search}
              className="max-w-md"
            />
            <Button type="submit">Buscar</Button>
          </form>

          {products && products.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold mb-4">Produtos</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {products.map((product: any) => (
                  <Card key={product.id}>
                    {product.images && product.images.length > 0 && (
                      <div className="relative w-full h-48">
                        <Image
                          src={product.images[0] || "/placeholder.svg"}
                          alt={product.name}
                          fill
                          className="object-cover rounded-t-lg"
                        />
                      </div>
                    )}
                    <CardHeader>
                      <CardTitle className="text-lg line-clamp-2">{product.name}</CardTitle>
                      <Link
                        href={`/marketplace/partners/${product.partners?.id}`}
                        className="text-sm text-muted-foreground hover:underline"
                      >
                        {product.partners?.store_name}
                      </Link>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {product.description && <p className="text-sm line-clamp-2">{product.description}</p>}
                      <div className="flex justify-between items-center">
                        <span className="text-2xl font-bold">R$ {Number(product.price).toFixed(2)}</span>
                        {product.rating > 0 && (
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm font-medium">{Number(product.rating).toFixed(1)}</span>
                          </div>
                        )}
                      </div>
                      <Button asChild className="w-full">
                        <Link href={`/marketplace/products/${product.id}`}>Ver detalhes</Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {services && services.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold mb-4">Serviços</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {services.map((service: any) => (
                  <Card key={service.id}>
                    <CardHeader>
                      <CardTitle className="text-lg line-clamp-2">{service.name}</CardTitle>
                      <Link
                        href={`/marketplace/partners/${service.partners?.id}`}
                        className="text-sm text-muted-foreground hover:underline"
                      >
                        {service.partners?.store_name}
                      </Link>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {service.description && <p className="text-sm line-clamp-2">{service.description}</p>}
                      <div className="flex justify-between items-center">
                        <span className="text-2xl font-bold">R$ {Number(service.price).toFixed(2)}</span>
                        {service.rating > 0 && (
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm font-medium">{Number(service.rating).toFixed(1)}</span>
                          </div>
                        )}
                      </div>
                      <Button asChild className="w-full">
                        <Link href={`/marketplace/services/${service.id}`}>Ver detalhes</Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {rentalItems && rentalItems.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold mb-4">Itens para Alugar</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {rentalItems.map((item: any) => (
                  <Card key={item.id}>
                    <CardHeader>
                      <CardTitle className="text-lg line-clamp-2">{item.name}</CardTitle>
                      <Link
                        href={`/marketplace/partners/${item.partners?.id}`}
                        className="text-sm text-muted-foreground hover:underline"
                      >
                        {item.partners?.store_name}
                      </Link>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {item.description && <p className="text-sm line-clamp-2">{item.description}</p>}
                      <div className="flex justify-between items-center">
                        <span className="text-xl font-bold">R$ {Number(item.price_per_day).toFixed(2)}/dia</span>
                        {item.rating > 0 && (
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm font-medium">{Number(item.rating).toFixed(1)}</span>
                          </div>
                        )}
                      </div>
                      <Button asChild className="w-full">
                        <Link href={`/marketplace/rental-items/${item.id}`}>Ver detalhes</Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {spaces && spaces.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold mb-4">Espaços Reserváveis</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {spaces.map((space: any) => (
                  <Card key={space.id}>
                    <CardHeader>
                      <CardTitle className="text-lg line-clamp-2">{space.name}</CardTitle>
                      <Link
                        href={`/marketplace/partners/${space.partners?.id}`}
                        className="text-sm text-muted-foreground hover:underline"
                      >
                        {space.partners?.store_name}
                      </Link>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {space.description && <p className="text-sm line-clamp-2">{space.description}</p>}
                      <div className="flex justify-between items-center">
                        <span className="text-xl font-bold">R$ {Number(space.price_per_hour).toFixed(2)}/hora</span>
                        {space.rating > 0 && (
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm font-medium">{Number(space.rating).toFixed(1)}</span>
                          </div>
                        )}
                      </div>
                      <Button asChild className="w-full">
                        <Link href={`/marketplace/spaces/${space.id}`}>Ver detalhes</Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {(!products || products.length === 0) &&
            (!services || services.length === 0) &&
            (!rentalItems || rentalItems.length === 0) &&
            (!spaces || spaces.length === 0) && (
              <Card>
                <CardContent className="p-12 text-center">
                  <p className="text-muted-foreground">Nenhum item encontrado no marketplace ainda</p>
                </CardContent>
              </Card>
            )}
        </div>
      </div>
    </div>
  )
}
