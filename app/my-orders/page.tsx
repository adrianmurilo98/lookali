import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { ReviewButton } from "@/components/marketplace/review-button"
import { Header } from "@/components/header"
import { PaymentDetailsDialog } from "@/components/marketplace/payment-details-dialog"

export default async function MyOrdersPage() {
  const supabase = await createClient()

  const { data: userData, error } = await supabase.auth.getUser()
  if (error || !userData?.user) {
    redirect("/auth/login")
  }

  const { data: orders } = await supabase
    .from("orders")
    .select(`
      *,
      partners(store_name, address),
      order_items(*, products(name))
    `)
    .eq("buyer_id", userData.user.id)
    .order("created_at", { ascending: false })

  const { data: reviews } = await supabase.from("reviews").select("order_id").eq("user_id", userData.user.id)

  const reviewedOrderIds = new Set(reviews?.map((r) => r.order_id) || [])

  return (
    <div className="min-h-svh">
      <Header />

      <div className="p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Meus Pedidos</h1>
              <p className="text-muted-foreground">Acompanhe seus pedidos</p>
            </div>
            <div className="flex gap-2">
              <Button asChild variant="outline">
                <Link href="/marketplace">Marketplace</Link>
              </Button>
            </div>
          </div>

          {orders && orders.length > 0 ? (
            <div className="space-y-4">
              {orders.map((order: any) => (
                <Card key={order.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">
                          {order.mp_merchant_order_id
                            ? `Pedido #${order.mp_merchant_order_id}`
                            : "Pedido (Aguardando pagamento)"}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {order.partners?.store_name || "Loja"} •{" "}
                          {new Date(order.created_at).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold">R$ {Number(order.total_amount).toFixed(2)}</p>
                        <p
                          className={`text-sm ${
                            order.situation === "paid"
                              ? "text-green-600"
                              : order.situation === "cancelled"
                                ? "text-red-600"
                                : "text-yellow-600"
                          }`}
                        >
                          {order.situation === "paid"
                            ? "Pago"
                            : order.situation === "cancelled"
                              ? "Cancelado"
                              : "Pendente"}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm">Itens do Pedido:</h4>
                      {order.order_items?.map((item: any) => (
                        <div key={item.id} className="flex justify-between text-sm border-b pb-2">
                          <span>{item.products?.name || item.product_name}</span>
                          <div className="text-right">
                            <span className="text-muted-foreground">
                              {item.quantity}x R$ {Number(item.product_price).toFixed(2)}
                            </span>
                            <span className="ml-4 font-semibold">R$ {Number(item.subtotal).toFixed(2)}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Forma de Pagamento</p>
                        <p className="font-medium">{order.payment_method}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Tipo de Entrega</p>
                        <p className="font-medium">
                          {order.delivery_type === "delivery" ? "Entrega" : "Retirar no local"}
                        </p>
                      </div>
                      {order.delivery_type === "delivery" && order.delivery_address && (
                        <div className="col-span-2">
                          <p className="text-muted-foreground">Endereço de Entrega</p>
                          <p className="font-medium">{order.delivery_address}</p>
                        </div>
                      )}
                      {order.delivery_type === "pickup" && order.partners?.address && (
                        <div className="col-span-2">
                          <p className="text-muted-foreground">Endereço para Retirada</p>
                          <p className="font-medium">{order.partners.address}</p>
                        </div>
                      )}
                      {order.notes && (
                        <div className="col-span-2">
                          <p className="text-muted-foreground">Observações</p>
                          <p className="font-medium">{order.notes}</p>
                        </div>
                      )}
                    </div>

                    {order.mp_payment_id && order.situation === "pending" && (
                      <div className="pt-2">
                        <PaymentDetailsDialog paymentId={order.mp_payment_id} paymentMethod={order.payment_method} />
                      </div>
                    )}

                    {order.situation === "paid" && !reviewedOrderIds.has(order.id) && order.order_items?.[0] && (
                      <ReviewButton
                        orderId={order.id}
                        partnerId={order.partner_id}
                        productId={order.order_items[0].product_id}
                        serviceId={null}
                        rentalItemId={null}
                        spaceId={null}
                        userId={userData.user.id}
                        itemName={order.order_items[0].products?.name || order.order_items[0].product_name}
                      />
                    )}
                    {reviewedOrderIds.has(order.id) && <p className="text-sm text-green-600">✓ Pedido avaliado</p>}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-muted-foreground mb-4">Você ainda não fez nenhum pedido</p>
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
