import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function LabelsPage() {
  const supabase = await createClient()

  const { data: userData, error } = await supabase.auth.getUser()
  if (error || !userData?.user) {
    redirect("/auth/login")
  }

  const { data: partner } = await supabase.from("partners").select("*").eq("user_id", userData.user.id).single()

  if (!partner) {
    redirect("/dashboard")
  }

  return (
    <div className="min-h-svh p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Geração de Etiquetas</h1>
            <p className="text-muted-foreground">Crie e imprima etiquetas de produtos com código de barras</p>
          </div>
          <Button asChild variant="outline">
            <Link href="/erp/dashboard">Voltar</Link>
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="p-6 border rounded-lg hover:bg-accent cursor-pointer">
            <Link href="/erp/labels/generate" className="space-y-2 block h-full">
              <h3 className="font-semibold text-lg">Gerar Etiquetas</h3>
              <p className="text-sm text-muted-foreground">
                Selecione produtos e gere etiquetas com código de barras para impressão
              </p>
              <div className="pt-2">
                <Button variant="outline" size="sm">
                  Começar →
                </Button>
              </div>
            </Link>
          </div>

          <div className="p-6 border rounded-lg hover:bg-accent">
            <h3 className="font-semibold text-lg">Formatos Disponíveis</h3>
            <ul className="text-sm text-muted-foreground mt-2 space-y-1">
              <li>✓ 18 etiquetas por página A4</li>
              <li>✓ 21 etiquetas por página A4</li>
              <li>✓ 25 etiquetas por página A4</li>
              <li>✓ 65 etiquetas por página A4</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
