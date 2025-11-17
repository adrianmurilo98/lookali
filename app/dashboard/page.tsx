import { redirect } from "next/navigation"

export default async function DashboardPage() {
  // Redirecionar para o perfil do usuário
  redirect("/profile")
}
