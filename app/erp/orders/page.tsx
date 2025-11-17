import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import Link from "next/link"

export default async function OrdersPage() {
  const supabase = await createClient()

  const { data: userData, error } = await supabase.auth.getUser()
  if (error || !userData?.user) {
    redirect("/auth/login")
  }

  const { data: partner } = await supabase.from("partners").select("*").eq("user_id", userData.user.id).single()

  if (!partner) {
    redirect("/dashboard")
  }

  const { data: orders } = await supabase
    .from("orders")
    .select(`
      *,
      profiles(full_name, email),
      order_items(quantity, product_name)
    `)
    .eq("partner_id", partner.id)
    .order("created_at", { ascending: false })

  return (
    <div className="min-h-svh p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Pedidos</h1>
            <p className="text-muted-foreground">Gerencie os pedidos recebidos</p>
          </div>
          <Button asChild variant="outline">
            <Link href="/erp/dashboard">Voltar</Link>
          </Button>
        </div>

        {orders && orders.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Lista de Pedidos</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Itens</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Situação</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order: any) => {
                    const totalItems =
                      order.order_items?.reduce((sum: number, item: any) => sum + item.quantity, 0) || order.quantity

                    return (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">{order.order_number}</TableCell>
                        <TableCell>
                          {order.customer_name || order.profiles?.full_name || order.profiles?.email || "-"}
                        </TableCell>
                        <TableCell>
                          {totalItems} {totalItems === 1 ? "item" : "itens"}
                        </TableCell>
                        <TableCell>R$ {Number(order.total_amount).toFixed(2)}</TableCell>
                        <TableCell>
                          <span
                            className={
                              order.situation === "paid"
                                ? "text-green-600"
                                : order.situation === "cancelled"
                                  ? "text-red-600"
                                  : "text-yellow-600"
                            }
                          >
                            {order.situation === "paid"
                              ? "Pago"
                              : order.situation === "cancelled"
                                ? "Cancelado"
                                : "Pendente"}
                          </span>
                        </TableCell>
                        <TableCell>{new Date(order.created_at).toLocaleDateString("pt-BR")}</TableCell>
                        <TableCell>
                          <Button asChild variant="outline" size="sm">
                            <Link href={`/erp/orders/${order.id}`}>Ver detalhes</Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">Nenhum pedido ainda</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
