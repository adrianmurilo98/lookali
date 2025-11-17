import { redirect } from 'next/navigation'
import { createClient } from "@/lib/supabase/server"
import AddProductPageWrapper from "@/components/erp/add-product-page-wrapper"

export default async function NewProductPage() {
  const supabase = await createClient()

  const { data: userData, error } = await supabase.auth.getUser()
  if (error || !userData?.user) {
    redirect("/auth/login")
  }

  const { data: partner } = await supabase.from("partners").select("*").eq("user_id", userData.user.id).maybeSingle()

  if (!partner) {
    redirect("/dashboard")
  }

  const { data: suppliers } = await supabase
    .from("suppliers")
    .select("id, name, email, phone")
    .eq("partner_id", partner.id)
    .order("name")

  return (
    <div className="min-h-svh bg-gray-50 dark:bg-dark-background">
      <AddProductPageWrapper partnerId={partner.id} suppliers={suppliers || []} />
    </div>
  )
}
