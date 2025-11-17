import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Header } from "@/components/header"
import { ProfileTabs } from "@/components/profile-tabs"

export default async function ProfilePage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", data.user.id).maybeSingle()

  return (
    <div className="min-h-svh">
      <Header />
      <div className="p-6">
        <div className="max-w-3xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Meu Perfil</h1>
            <p className="text-muted-foreground">Gerencie suas informações pessoais e configurações</p>
          </div>

          <ProfileTabs
            userId={data.user.id}
            profile={profile}
            initialFullName={data.user.user_metadata?.full_name}
            email={data.user.email!}
          />
        </div>
      </div>
    </div>
  )
}
