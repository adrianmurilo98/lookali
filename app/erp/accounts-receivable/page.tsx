import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import Link from "next/link"

export default async function AccountsReceivablePage() {
  const supabase = await createClient()

  const { data: userData, error } = await supabase.auth.getUser()
  if (error || !userData?.user) {
    redirect("/auth/login")
  }

  const { data: partner } = await supabase.from("partners").select("*").eq("user_id", userData.user.id).single()

  if (!partner) {
    redirect("/dashboard")
  }

  const { data: accounts } = await supabase
    .from("accounts_receivable")
    .select("*, customers(name), orders(order_number)")
    .eq("partner_id", partner.id)
    .order("due_date", { ascending: true })

  const getStatusText = (dueDate: string, status: string) => {
    if (status === "received") return "Recebido"

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const due = new Date(dueDate)
    due.setHours(0, 0, 0, 0)
    const diffTime = due.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return "VENCE HOJE"
    if (diffDays < 0) return `VENCEU HÁ ${Math.abs(diffDays)} DIA(S)`
    return `${diffDays} DIA(S) A VENCER`
  }

  const getStatusColor = (dueDate: string, status: string) => {
    if (status === "received") return "text-green-600"

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const due = new Date(dueDate)
    due.setHours(0, 0, 0, 0)
    const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return "text-yellow-600"
    if (diffDays < 0) return "text-red-600"
    return ""
  }

  return (
    <div className="min-h-svh p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Contas a Receber</h1>
            <p className="text-muted-foreground">Gerencie suas contas a receber e parcelas</p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href="/erp/dashboard">Voltar</Link>
            </Button>
            <Button asChild>
              <Link href="/erp/accounts-receivable/new">Adicionar conta</Link>
            </Button>
          </div>
        </div>

        {accounts && accounts.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Contas a Receber</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Pedido</TableHead>
                      <TableHead>Parcela</TableHead>
                      <TableHead>Vencimento</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Juros</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Pagamento</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {accounts.map((account: any) => (
                      <TableRow key={account.id}>
                        <TableCell className="font-medium">{account.orders?.order_number || "-"}</TableCell>
                        <TableCell>
                          {account.installment_number}/{account.total_installments}
                        </TableCell>
                        <TableCell>{new Date(account.due_date).toLocaleDateString("pt-BR")}</TableCell>
                        <TableCell>R$ {Number(account.original_amount || account.amount).toFixed(2)}</TableCell>
                        <TableCell>
                          {account.interest_amount > 0 ? `R$ ${Number(account.interest_amount).toFixed(2)}` : "-"}
                        </TableCell>
                        <TableCell className="font-medium">R$ {Number(account.amount).toFixed(2)}</TableCell>
                        <TableCell>{account.customers?.name || "-"}</TableCell>
                        <TableCell>{account.payment_type || "Venda"}</TableCell>
                        <TableCell>{account.description || "-"}</TableCell>
                        <TableCell className={getStatusColor(account.due_date, account.status)}>
                          {getStatusText(account.due_date, account.status)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground mb-4">Nenhuma conta a receber cadastrada</p>
              <Button asChild>
                <Link href="/erp/accounts-receivable/new">Adicionar primeira conta</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
