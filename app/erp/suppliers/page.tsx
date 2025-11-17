import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { SuppliersList } from "@/components/erp/suppliers-list"

export default async function SuppliersPage() {
  const supabase = await createClient()

  const { data: userData, error } = await supabase.auth.getUser()
  if (error || !userData?.user) {
    redirect("/auth/login")
  }

  const { data: partner } = await supabase.from("partners").select("*").eq("user_id", userData.user.id).single()

  if (!partner) {
    redirect("/dashboard")
  }

  const { data: suppliers } = await supabase
    .from("suppliers")
    .select("*")
    .eq("partner_id", partner.id)
    .order("created_at", { ascending: false })

  return (
    <div className="min-h-svh p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Fornecedores</h1>
            <p className="text-muted-foreground">Gerencie seus fornecedores</p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href="/erp/dashboard">Voltar</Link>
            </Button>
            <Button asChild>
              <Link href="/erp/suppliers/new">Adicionar fornecedor</Link>
            </Button>
          </div>
        </div>

        <SuppliersList suppliers={suppliers || []} />
      </div>
    </div>
  )
}
