import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { redirect } from "next/navigation"
import { ServicePurchaseSection } from "@/components/marketplace/service-purchase-section"
import { Star } from "lucide-react"

export default async function ServiceDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: service } = await supabase
    .from("services")
    .select("*, partners(id, store_name, store_description, address, rating)")
    .eq("id", id)
    .eq("is_active", true)
    .single()

  if (!service) {
    redirect("/marketplace")
  }

  const { data: paymentMethods } = await supabase
    .from("partner_payment_methods")
    .select("*")
    .eq("partner_id", service.partners.id)

  const { data: userData } = await supabase.auth.getUser()

  return (
    <div className="min-h-svh p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <Button asChild variant="outline">
          <Link href="/marketplace">Voltar ao marketplace</Link>
        </Button>

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">{service.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {service.description && <p className="text-sm">{service.description}</p>}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Preço:</span>
                  <span className="text-3xl font-bold">R$ {Number(service.price).toFixed(2)}</span>
                </div>
                {service.duration_minutes && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Duração:</span>
                    <span>{service.duration_minutes} minutos</span>
                  </div>
                )}
              </div>

              {userData?.user ? (
                <ServicePurchaseSection
                  service={{
                    id: service.id,
                    name: service.name,
                    price: Number(service.price),
                    partner_id: service.partners.id,
                  }}
                  partnerAddress={service.partners.address}
                  paymentMethods={paymentMethods?.map((pm) => pm.payment_method) || []}
                  userId={userData.user.id}
                />
              ) : (
                <Button asChild className="w-full" size="lg">
                  <Link href="/auth/login">Faça login para solicitar</Link>
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sobre o Prestador</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Link href={`/marketplace/partners/${service.partners.id}`} className="hover:underline">
                  <h3 className="font-semibold text-lg">{service.partners.store_name}</h3>
                </Link>
                {service.partners.rating > 0 && (
                  <div className="flex items-center gap-1 mt-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-medium">{Number(service.partners.rating).toFixed(1)}</span>
                    <span className="text-sm text-muted-foreground">- Avaliação do parceiro</span>
                  </div>
                )}
              </div>
              {service.partners.store_description && <p className="text-sm">{service.partners.store_description}</p>}
              <div>
                <p className="text-sm text-muted-foreground">Endereço:</p>
                <p className="text-sm">{service.partners.address}</p>
              </div>
              <Button asChild variant="outline" className="w-full bg-transparent">
                <Link href={`/marketplace/partners/${service.partners.id}`}>Ver loja do parceiro</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
