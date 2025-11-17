import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import Link from "next/link"

export default async function StockMovementsPage() {
  const supabase = await createClient()

  const { data: userData, error } = await supabase.auth.getUser()
  if (error || !userData?.user) {
    redirect("/auth/login")
  }

  const { data: partner } = await supabase.from("partners").select("*").eq("user_id", userData.user.id).maybeSingle()

  if (!partner) {
    redirect("/dashboard")
  }

  const { data: movements } = await supabase
    .from("stock_movements")
    .select(`
      *,
      products(name),
      rental_items(name),
      orders(order_number)
    `)
    .eq("partner_id", partner.id)
    .order("created_at", { ascending: false })

  const movementTypeLabels: Record<string, string> = {
    sale: "Venda",
    return: "Devolução",
    adjustment: "Ajuste",
    purchase: "Compra",
    damage: "Avaria",
    loss: "Perda",
  }

  return (
    <div className="min-h-svh p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Movimentação de Estoque</h1>
            <p className="text-muted-foreground">Histórico de todas as movimentações</p>
          </div>
          <Button asChild variant="outline">
            <Link href="/erp/dashboard">Voltar</Link>
          </Button>
        </div>

        {movements && movements.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Movimentações</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Produto/Item</TableHead>
                    <TableHead>Quantidade</TableHead>
                    <TableHead>Estoque Anterior</TableHead>
                    <TableHead>Estoque Novo</TableHead>
                    <TableHead>Referência</TableHead>
                    <TableHead>Observações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movements.map((movement: any) => (
                    <TableRow key={movement.id}>
                      <TableCell>{new Date(movement.created_at).toLocaleString("pt-BR")}</TableCell>
                      <TableCell>
                        <span
                          className={
                            movement.movement_type === "sale"
                              ? "text-red-600"
                              : movement.movement_type === "purchase" || movement.movement_type === "return"
                                ? "text-green-600"
                                : ""
                          }
                        >
                          {movementTypeLabels[movement.movement_type] || movement.movement_type}
                        </span>
                      </TableCell>
                      <TableCell>{movement.products?.name || movement.rental_items?.name || "N/A"}</TableCell>
                      <TableCell>
                        <span className={movement.quantity < 0 ? "text-red-600" : "text-green-600"}>
                          {movement.quantity > 0 ? "+" : ""}
                          {movement.quantity}
                        </span>
                      </TableCell>
                      <TableCell>{movement.previous_quantity}</TableCell>
                      <TableCell>{movement.new_quantity}</TableCell>
                      <TableCell>
                        {movement.orders?.order_number ? (
                          <Link href={`/erp/orders/${movement.order_id}`} className="text-blue-600 hover:underline">
                            Pedido #{movement.orders.order_number}
                          </Link>
                        ) : (
                          movement.reference_name || "-"
                        )}
                      </TableCell>
                      <TableCell>{movement.notes || "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">Nenhuma movimentação registrada ainda</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
