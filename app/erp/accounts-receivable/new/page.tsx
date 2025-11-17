import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

export default async function NewAccountReceivablePage() {
  const supabase = await createClient()

  const { data: userData, error } = await supabase.auth.getUser()
  if (error || !userData?.user) {
    redirect("/auth/login")
  }

  const { data: partner } = await supabase.from("partners").select("*").eq("user_id", userData.user.id).single()

  if (!partner) {
    redirect("/dashboard")
  }

  return (
    <div className="min-h-svh p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Nova Conta a Receber</h1>
          </div>
          <Button asChild variant="outline">
            <Link href="/erp/accounts-receivable">Voltar</Link>
          </Button>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="description">Descrição*</Label>
              <Input id="description" required />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="amount">Valor (R$)*</Label>
              <Input id="amount" type="number" step="0.01" required />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="dueDate">Data de vencimento*</Label>
              <Input id="dueDate" type="date" required />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea id="notes" rows={3} />
            </div>

            <Button className="w-full">Criar conta</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
