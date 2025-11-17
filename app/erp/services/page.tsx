import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export default async function ServicesPage() {
  const supabase = await createClient()

  const { data: userData, error } = await supabase.auth.getUser()
  if (error || !userData?.user) {
    redirect("/auth/login")
  }

  const { data: partner } = await supabase.from("partners").select("*").eq("user_id", userData.user.id).single()

  if (!partner) {
    redirect("/dashboard")
  }

  const { data: services } = await supabase
    .from("services")
    .select("*")
    .eq("partner_id", partner.id)
    .order("created_at", { ascending: false })

  return (
    <div className="min-h-svh p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Serviços</h1>
            <p className="text-muted-foreground">Gerencie seus serviços</p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href="/erp/dashboard">Voltar</Link>
            </Button>
            <Button asChild>
              <Link href="/erp/services/new">Adicionar serviço</Link>
            </Button>
          </div>
        </div>

        {services && services.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <Card key={service.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{service.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {service.description && <p className="text-sm line-clamp-2">{service.description}</p>}
                  <div className="flex justify-between text-sm">
                    <span>Preço:</span>
                    <span className="font-semibold">R$ {Number(service.price).toFixed(2)}</span>
                  </div>
                  <Button asChild variant="outline" size="sm" className="w-full bg-transparent">
                    <Link href={`/erp/services/${service.id}`}>Editar</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground mb-4">Nenhum serviço cadastrado ainda</p>
              <Button asChild>
                <Link href="/erp/services/new">Adicionar primeiro serviço</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
