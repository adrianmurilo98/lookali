import { redirect } from 'next/navigation'
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { OrderDetailsForm } from "@/components/erp/order-details-form"
import Image from "next/image"

export default async function OrderDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: userData, error } = await supabase.auth.getUser()
  if (error || !userData?.user) {
    redirect("/auth/login")
  }

  const { data: partner } = await supabase.from("partners").select("*").eq("user_id", userData.user.id).maybeSingle()

  if (!partner) {
    redirect("/dashboard")
  }

  const { data: order } = await supabase
    .from("orders")
    .select(`
      *,
      order_items(*, products(name, price, images)),
      profiles(email, full_name)
    `)
    .eq("id", id)
    .eq("partner_id", partner.id)
    .single()

  if (!order) {
    redirect("/erp/orders")
  }

  const buyerName = order.customer_name || order.profiles?.full_name || "N/A"
  const buyerEmail = order.profiles?.email || "N/A"

  return (
    <div className="min-h-svh p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Detalhes do Pedido</h1>
            <p className="text-muted-foreground">Pedido {order.order_number}</p>
          </div>
          <Button asChild variant="outline">
            <Link href="/erp/orders">Voltar</Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Informações do Pedido</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Número do Pedido</p>
                <p className="font-medium">{order.order_number}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Data</p>
                <p className="font-medium">{new Date(order.created_at).toLocaleString("pt-BR")}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Cliente</p>
                <p className="font-medium">{buyerName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email do Cliente</p>
                <p className="font-medium">{buyerEmail}</p>
              </div>
            </div>

            {order.order_items && order.order_items.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-semibold">Itens do Pedido:</p>
                <div className="border rounded-lg divide-y">
                  {order.order_items.map((item: any) => {
                    const productImage = item.products?.images?.[0]
                    return (
                      <div key={item.id} className="p-3 flex gap-4 items-center">
                        {productImage ? (
                          <div className="relative w-16 h-16 flex-shrink-0 rounded-md overflow-hidden bg-muted">
                            <Image
                              src={productImage || "/placeholder.svg"}
                              alt={item.products?.name || item.product_name}
                              fill
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-16 h-16 flex-shrink-0 rounded-md bg-muted flex items-center justify-center">
                            <span className="text-xs text-muted-foreground">Sem foto</span>
                          </div>
                        )}
                        
                        {/* Informações do produto */}
                        <div className="flex-1">
                          <p className="font-medium">{item.products?.name || item.product_name}</p>
                          <p className="text-sm text-muted-foreground">
                            Quantidade: {item.quantity} x R$ {Number(item.product_price).toFixed(2)}
                          </p>
                        </div>
                        
                        {/* Subtotal */}
                        <p className="font-semibold">R$ {Number(item.subtotal).toFixed(2)}</p>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <p className="text-sm text-muted-foreground">Quantidade Total</p>
                <p className="font-medium">{order.quantity}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Valor Total</p>
                <p className="font-medium text-2xl">R$ {Number(order.total_amount).toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Forma de Pagamento</p>
                <p className="font-medium">{order.payment_method}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tipo de Entrega</p>
                <p className="font-medium">{order.delivery_type === "delivery" ? "Entrega" : "Retirada"}</p>
              </div>
              {order.delivery_type === "delivery" && order.delivery_address && (
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground">Endereço de Entrega</p>
                  <p className="font-medium">{order.delivery_address}</p>
                </div>
              )}
              {order.notes && (
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground">Observações do Cliente</p>
                  <p className="font-medium">{order.notes}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <OrderDetailsForm order={order} />
      </div>
    </div>
  )
}
