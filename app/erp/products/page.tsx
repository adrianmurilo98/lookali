import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ProductsList } from "@/components/erp/products-list"

export default async function ProductsPage() {
  const supabase = await createClient()

  const { data: userData, error } = await supabase.auth.getUser()
  if (error || !userData?.user) {
    redirect("/auth/login")
  }

  const { data: partner } = await supabase.from("partners").select("*").eq("user_id", userData.user.id).single()

  if (!partner) {
    redirect("/dashboard")
  }

  const { data: products } = await supabase
    .from("products")
    .select("*")
    .eq("partner_id", partner.id)
    .order("created_at", { ascending: false })

  return (
    <div className="min-h-svh p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Produtos</h1>
            <p className="text-muted-foreground">Gerencie seu estoque de produtos</p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href="/erp/dashboard">Voltar</Link>
            </Button>
            <Button asChild>
              <Link href="/erp/products/new">Adicionar produto</Link>
            </Button>
          </div>
        </div>

        <ProductsList products={products || []} partnerId={partner.id} />
      </div>
    </div>
  )
}
