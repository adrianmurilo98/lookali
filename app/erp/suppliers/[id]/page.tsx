import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ComprehensiveSupplierForm } from "@/components/erp/comprehensive-supplier-form"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function EditSupplierPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: userData, error } = await supabase.auth.getUser()
  if (error || !userData?.user) {
    redirect("/auth/login")
  }

  const { data: partner } = await supabase.from("partners").select("*").eq("user_id", userData.user.id).single()

  if (!partner) {
    redirect("/dashboard")
  }

  if (id === "new") {
    return (
      <div className="min-h-svh p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Novo Fornecedor</h1>
              <p className="text-muted-foreground">Cadastrar novo fornecedor</p>
            </div>
            <Button asChild variant="outline">
              <Link href="/erp/suppliers">Voltar</Link>
            </Button>
          </div>

          <ComprehensiveSupplierForm partnerId={partner.id} />
        </div>
      </div>
    )
  }

  const { data: supplier } = await supabase
    .from("suppliers")
    .select("*")
    .eq("id", id)
    .eq("partner_id", partner.id)
    .single()

  if (!supplier) {
    redirect("/erp/suppliers")
  }

  return (
    <div className="min-h-svh p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Editar Fornecedor</h1>
            <p className="text-muted-foreground">{supplier.name}</p>
          </div>
          <Button asChild variant="outline">
            <Link href="/erp/suppliers">Voltar</Link>
          </Button>
        </div>

        <ComprehensiveSupplierForm partnerId={partner.id} supplier={supplier} />
      </div>
    </div>
  )
}
