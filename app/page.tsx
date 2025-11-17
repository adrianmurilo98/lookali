import Link from "next/link"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/server"
import { Header } from "@/components/header"
import { redirect } from "next/navigation"

export default async function Home() {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()

  if (userData?.user) {
    const { data: partner } = await supabase.from("partners").select("id").eq("user_id", userData.user.id).maybeSingle()

    if (partner) {
      redirect("/erp/dashboard")
    } else {
      redirect("/marketplace")
    }
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center p-6">
      <Header />
      <div className="w-full max-w-2xl text-center space-y-6">
        <h1 className="text-5xl font-bold">Lookali</h1>
        <p className="text-xl text-muted-foreground">Marketplace e ERP integrados para parceiros e clientes</p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Button asChild size="lg">
            <Link href="/marketplace">Ver Marketplace</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/auth/login">Entrar</Link>
          </Button>
          <Button asChild size="lg" variant="secondary">
            <Link href="/auth/sign-up">Criar Conta</Link>
          </Button>
        </div>
        <div className="pt-8">
          <h2 className="text-2xl font-semibold mb-4">Como funciona?</h2>
          <div className="grid md:grid-cols-2 gap-6 text-left">
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">Para Compradores</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>Navegue pelo marketplace</li>
                <li>Compre produtos e serviços</li>
                <li>Acompanhe seus pedidos</li>
                <li>Avalie suas compras</li>
              </ul>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">Para Parceiros</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>Cadastre sua loja</li>
                <li>Gerencie produtos e estoque</li>
                <li>Controle financeiro completo</li>
                <li>Apareça no marketplace</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
