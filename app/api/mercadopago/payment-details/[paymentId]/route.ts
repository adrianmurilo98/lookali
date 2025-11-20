import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getPaymentDetails } from "@/lib/mercadopago"

export async function GET(request: NextRequest, { params }: { params: { paymentId: string } }) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const { paymentId } = params

    // Find order with this payment ID
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*, partners(mp_access_token)")
      .eq("mp_payment_id", paymentId)
      .eq("buyer_id", user.id)
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: "Pedido não encontrado ou sem permissão" }, { status: 404 })
    }

    if (!order.partners.mp_access_token) {
      return NextResponse.json({ error: "Vendedor não possui Mercado Pago configurado" }, { status: 400 })
    }

    // Get payment details with QR code
    const paymentDetails = await getPaymentDetails(order.partners.mp_access_token, paymentId)

    return NextResponse.json({
      success: true,
      payment: {
        id: paymentDetails.id,
        status: paymentDetails.status,
        status_detail: paymentDetails.status_detail,
        payment_method_id: paymentDetails.payment_method_id,
        payment_type_id: paymentDetails.payment_type_id,
        transaction_amount: paymentDetails.transaction_amount,
        qr_code: paymentDetails.qr_code,
        qr_code_base64: paymentDetails.qr_code_base64,
        ticket_url: paymentDetails.ticket_url,
        date_created: paymentDetails.date_created,
        date_approved: paymentDetails.date_approved,
      },
    })
  } catch (error: any) {
    console.error("[v0] Error fetching payment details:", error)
    return NextResponse.json({ error: error.message || "Erro ao buscar detalhes do pagamento" }, { status: 500 })
  }
}
