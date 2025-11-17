import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { SettingsTabs } from "@/components/erp/settings-tabs"

export default async function SettingsPage() {
  const supabase = await createClient()

  const { data: userData, error } = await supabase.auth.getUser()
  if (error || !userData?.user) {
    redirect("/auth/login")
  }

  const { data: partner } = await supabase.from("partners").select("*").eq("user_id", userData.user.id).single()

  if (!partner) {
    redirect("/dashboard")
  }

  const { data: paymentMethods } = await supabase
    .from("partner_payment_methods")
    .select("*")
    .eq("partner_id", partner.id)

  return (
    <div className="min-h-svh p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Configurações da Loja</h1>
            <p className="text-muted-foreground">Gerencie as informações e configurações da sua loja</p>
          </div>
          <Button asChild variant="outline">
            <Link href="/erp/dashboard">Voltar</Link>
          </Button>
        </div>

        <SettingsTabs partner={partner} paymentMethods={paymentMethods?.map((pm) => pm.payment_method) || []} />
      </div>
    </div>
  )
}
