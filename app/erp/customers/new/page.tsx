import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ComprehensiveCustomerForm } from "@/components/erp/comprehensive-customer-form"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function NewCustomerPage() {
  const supabase = await createClient()

  const { data: userData, error } = await supabase.auth.getUser()
  if (error || !userData?.user) {
    redirect("/auth/login")
  }

  const { data: partner } = await supabase.from("partners").select("*").eq("user_id", userData.user.id).maybeSingle()

  if (!partner) {
    redirect("/dashboard")
  }

  return (
    <div className="min-h-svh p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Novo Cliente</h1>
            <p className="text-muted-foreground">Adicione um novo cliente à sua loja</p>
          </div>
          <Button asChild variant="outline">
            <Link href="/erp/customers">Voltar</Link>
          </Button>
        </div>

        <ComprehensiveCustomerForm partnerId={partner.id} />
      </div>
    </div>
  )
}
