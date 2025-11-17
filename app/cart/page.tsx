import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Header } from "@/components/header"
import { CartList } from "@/components/cart/cart-list"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function CartPage() {
  const supabase = await createClient()

  const { data: userData, error } = await supabase.auth.getUser()
  if (error || !userData?.user) {
    redirect("/auth/login")
  }

  const { data: cartItems } = await supabase
    .from("cart_items")
    .select(`
      *,
      products(*, partners(id, store_name, address, user_id)),
      partners(store_name)
    `)
    .eq("user_id", userData.user.id)
    .order("created_at", { ascending: false })

  // Buscar meios de pagamento para cada parceiro
  const partnerIds = [...new Set(cartItems?.map((item) => item.partner_id) || [])]
  const { data: paymentMethods } = await supabase
    .from("payment_methods")
    .select("partner_id, payment_type, is_active")
    .in("partner_id", partnerIds)
    .eq("is_active", true)

  // Agrupar itens por parceiro
  const itemsByPartner =
    cartItems?.reduce((acc: any, item: any) => {
      const partnerId = item.partner_id
      if (!acc[partnerId]) {
        acc[partnerId] = {
          partner: item.products.partners,
          items: [],
          paymentMethods:
            paymentMethods?.filter((pm) => pm.partner_id === partnerId && pm.is_active).map((pm) => pm.payment_type) ||
            [],
        }
      }
      acc[partnerId].items.push(item)
      return acc
    }, {}) || {}

  return (
    <div className="min-h-svh">
      <Header />

      <div className="p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Carrinho</h1>
              <p className="text-muted-foreground">Itens separados por loja</p>
            </div>
            <Button asChild variant="outline">
              <Link href="/marketplace">Continuar comprando</Link>
            </Button>
          </div>

          {cartItems && cartItems.length > 0 ? (
            <CartList itemsByPartner={itemsByPartner} userId={userData.user.id} />
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-muted-foreground mb-4">Seu carrinho está vazio</p>
                <Button asChild>
                  <Link href="/marketplace">Ir ao marketplace</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
