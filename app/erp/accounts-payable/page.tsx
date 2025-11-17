import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import Link from "next/link"

export default async function AccountsPayablePage() {
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
    .from("accounts_payable")
    .select("*, suppliers(name)")
    .eq("partner_id", partner.id)
    .order("due_date", { ascending: true })

  return (
    <div className="min-h-svh p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Contas a Pagar</h1>
            <p className="text-muted-foreground">Gerencie suas contas a pagar</p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href="/erp/dashboard">Voltar</Link>
            </Button>
            <Button asChild>
              <Link href="/erp/accounts-payable/new">Adicionar conta</Link>
            </Button>
          </div>
        </div>

        {accounts && accounts.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Contas a Pagar</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Fornecedor</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accounts.map((account: any) => (
                    <TableRow key={account.id}>
                      <TableCell className="font-medium">{account.description}</TableCell>
                      <TableCell>{account.suppliers?.name || "-"}</TableCell>
                      <TableCell>R$ {Number(account.amount).toFixed(2)}</TableCell>
                      <TableCell>{new Date(account.due_date).toLocaleDateString("pt-BR")}</TableCell>
                      <TableCell>
                        <span
                          className={
                            account.status === "paid"
                              ? "text-green-600"
                              : account.status === "overdue"
                                ? "text-red-600"
                                : ""
                          }
                        >
                          {account.status === "paid" ? "Paga" : account.status === "overdue" ? "Vencida" : "Pendente"}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground mb-4">Nenhuma conta a pagar cadastrada</p>
              <Button asChild>
                <Link href="/erp/accounts-payable/new">Adicionar primeira conta</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
