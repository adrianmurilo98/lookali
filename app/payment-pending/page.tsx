import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default async function PaymentPendingPage({
  searchParams,
}: {
  searchParams: { order_id?: string }
}) {
  const orderId = searchParams.order_id

  if (!orderId) {
    redirect('/marketplace')
  }

  const supabase = await createClient()

  const { data: order } = await supabase
    .from('orders')
    .select('order_number, total_amount, payment_method')
    .eq('id', orderId)
    .single()

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center space-y-6">
        <div className="flex justify-center">
          <Clock className="h-16 w-16 text-yellow-500" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-gray-900">
            Pagamento Pendente
          </h1>
          <p className="text-gray-600">
            Seu pagamento está sendo processado
          </p>
        </div>

        {order && (
          <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-left">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Número do pedido:</span>
              <span className="font-semibold">{order.order_number}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Valor total:</span>
              <span className="font-semibold">
                R$ {Number(order.total_amount).toFixed(2)}
              </span>
            </div>
          </div>
        )}

        <p className="text-sm text-gray-600">
          Você receberá uma notificação assim que o pagamento for confirmado.
          Isso pode levar alguns minutos.
        </p>

        <div className="space-y-3">
          <Button asChild className="w-full">
            <Link href="/my-orders">Ver meus pedidos</Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href="/marketplace">Voltar ao marketplace</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
