import { redirect } from 'next/navigation'
import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ServiceForm } from "@/components/erp/service-form"

export default async function NewServicePage() {
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
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Novo Serviço</h1>
          </div>
          <Button asChild variant="outline">
            <Link href="/erp/services">Voltar</Link>
          </Button>
        </div>

        <ServiceForm partnerId={partner.id} />
      </div>
    </div>
  )
}
