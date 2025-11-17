import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import BecomePartnerForm from "@/components/become-partner-form"
import { Header } from "@/components/header"

export default async function BecomePartnerPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  const { data: partner, error: partnerError } = await supabase
    .from("partners")
    .select("*")
    .eq("user_id", data.user.id)
    .maybeSingle()

  if (partner && !partnerError) {
    redirect("/erp/dashboard")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", data.user.id).maybeSingle()

  return (
    <div className="min-h-svh">
      <Header />
      <div className="p-6">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Tornar-se parceiro Lookali</h1>
            <p className="text-muted-foreground mt-2">Preencha os dados da sua loja para começar a vender</p>
          </div>
          <BecomePartnerForm
            userId={data.user.id}
            userName={data.user.user_metadata?.full_name || profile?.full_name || ""}
            userAddress={profile?.address || ""}
          />
        </div>
      </div>
    </div>
  )
}
