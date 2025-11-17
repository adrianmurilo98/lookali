import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/header"

export default async function ERPDashboardPage() {
  const supabase = await createClient()

  const { data: userData, error } = await supabase.auth.getUser()
  if (error || !userData?.user) {
    redirect("/auth/login")
  }

  const { data: partner } = await supabase.from("partners").select("*").eq("user_id", userData.user.id).maybeSingle()

  if (!partner) {
    redirect("/become-partner")
  }

  const [{ count: productsCount }, { count: servicesCount }, { count: customersCount }, { count: ordersCount }] =
    await Promise.all([
      supabase.from("products").select("*", { count: "exact", head: true }).eq("partner_id", partner.id),
      supabase.from("services").select("*", { count: "exact", head: true }).eq("partner_id", partner.id),
      supabase.from("customers").select("*", { count: "exact", head: true }).eq("partner_id", partner.id),
      supabase.from("orders").select("*", { count: "exact", head: true }).eq("partner_id", partner.id),
    ])

  return (
    <div className="min-h-svh">
      <Header />

      <div className="p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">{partner.store_name}</h1>
              <p className="text-muted-foreground">Central do Parceiro Lookali</p>
            </div>
            <Button asChild variant="outline">
              <Link href="/marketplace">Ver Marketplace</Link>
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Produtos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{productsCount || 0}</div>
                <Button asChild variant="link" className="p-0 h-auto">
                  <Link href="/erp/products">Gerenciar</Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Serviços</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{servicesCount || 0}</div>
                <Button asChild variant="link" className="p-0 h-auto">
                  <Link href="/erp/services">Gerenciar</Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Clientes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{customersCount || 0}</div>
                <Button asChild variant="link" className="p-0 h-auto">
                  <Link href="/erp/customers">Gerenciar</Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Pedidos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{ordersCount || 0}</div>
                <Button asChild variant="link" className="p-0 h-auto">
                  <Link href="/erp/orders">Gerenciar</Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Kits de Produtos</CardTitle>
                <CardDescription>Combos de produtos para vender juntos</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <Link href="/erp/kits">Acessar</Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Movimentação de Estoque</CardTitle>
                <CardDescription>Histórico de entradas e saídas</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <Link href="/erp/stock-movements">Acessar</Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Itens para Alugar</CardTitle>
                <CardDescription>Gerencie itens disponíveis para aluguel</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <Link href="/erp/rental-items">Acessar</Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Locais Reserváveis</CardTitle>
                <CardDescription>Gerencie espaços para reserva</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <Link href="/erp/reservable-spaces">Acessar</Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Fornecedores</CardTitle>
                <CardDescription>Cadastro e gestão de fornecedores</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <Link href="/erp/suppliers">Acessar</Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Contas a Pagar</CardTitle>
                <CardDescription>Gestão financeira de pagamentos</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <Link href="/erp/accounts-payable">Acessar</Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Contas a Receber</CardTitle>
                <CardDescription>Gestão financeira de recebimentos</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <Link href="/erp/accounts-receivable">Acessar</Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Configurações</CardTitle>
                <CardDescription>Dados da loja e preferências</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <Link href="/erp/settings">Acessar</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
