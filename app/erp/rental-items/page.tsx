import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"

export default async function RentalItemsPage() {
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
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Itens para Alugar</h1>
            <p className="text-muted-foreground">Gerencie itens disponíveis para aluguel</p>
          </div>
          <Button asChild variant="outline">
            <Link href="/erp/dashboard">Voltar</Link>
          </Button>
        </div>

        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">Funcionalidade em desenvolvimento</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
