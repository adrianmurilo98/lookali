import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, action, data, id } = body

    console.log("[v0] MP Webhook received:", {
      type,
      action,
      dataId: data?.id,
      merchantOrderId: id,
    })

    const response = NextResponse.json({ received: true }, { status: 200 })

    processWebhookAsync(body).catch((error) => {
      console.error("[v0] Background webhook processing error:", error)
    })

    return response
  } catch (error: any) {
    console.error("[v0] Webhook parse error:", error)
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }
}

async function processWebhookAsync(body: any) {
  const { createClient } = await import("@supabase/supabase-js")
  const { getPaymentDetails, mapMPStatusToOrderStatus } = await import("@/lib/mercadopago")

  const { type, action, data, id: merchantOrderId } = body

  if (!data?.id && !merchantOrderId) {
    console.log("[v0] No data to process")
    return
  }

  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  if (type === "topic_merchant_order_wh" || type === "merchant_order") {
    const orderId = merchantOrderId || data.id // Declare id variable before using it

    console.log("[v0] Processing merchant_order:", orderId)

    const { data: recentOrders } = await supabase
      .from("orders")
      .select("id, order_number, mp_preference_id, partner_id, partners(mp_access_token)")
      .is("mp_merchant_order_id", null)
      .order("created_at", { ascending: false })
      .limit(20)

    if (recentOrders && recentOrders.length > 0) {
      const order = recentOrders[0]

      const { error: updateError } = await supabase
        .from("orders")
        .update({
          mp_merchant_order_id: orderId,
          order_number: orderId, // Use MP merchant order ID as order number
          updated_at: new Date().toISOString(),
        })
        .eq("id", order.id)

      if (updateError) {
        console.error("[v0] Error updating order with merchant_order_id:", updateError)
      } else {
        console.log("[v0] Order updated with merchant_order_id:", orderId)
      }
    }

    return
  }

  if (type === "payment") {
    const paymentId = data.id

    console.log("[v0] Processing payment:", paymentId)

    // Find order by mp_payment_id
    const { data: existingOrder } = await supabase
      .from("orders")
      .select(
        "id, mp_payment_id, order_number, mp_merchant_order_id, partner_id, total_amount, partners(mp_access_token)",
      )
      .eq("mp_payment_id", paymentId)
      .single()

    let order = existingOrder

    if (!order) {
      // Search recent orders
      const { data: recentOrders } = await supabase
        .from("orders")
        .select(
          "id, order_number, mp_preference_id, mp_merchant_order_id, partner_id, total_amount, partners(mp_access_token)",
        )
        .is("mp_payment_id", null)
        .order("created_at", { ascending: false })
        .limit(50)

      if (recentOrders) {
        for (const recentOrder of recentOrders) {
          if (recentOrder.partners?.mp_access_token) {
            try {
              const paymentDetails = await getPaymentDetails(recentOrder.partners.mp_access_token, paymentId)

              if (paymentDetails.external_reference === recentOrder.id) {
                order = recentOrder
                break
              }
            } catch (err) {
              continue
            }
          }
        }
      }
    }

    if (!order) {
      console.log("[v0] Order not found for payment:", paymentId)
      return
    }

    // Get payment details
    if (!order.partners?.mp_access_token) {
      console.error("[v0] No access token for partner")
      return
    }

    const paymentDetails = await getPaymentDetails(order.partners.mp_access_token, paymentId)

    // Validate amount
    const orderTotal = Number(order.total_amount)
    const paymentAmount = Number(paymentDetails.transaction_amount)

    if (Math.abs(orderTotal - paymentAmount) > 0.01) {
      console.error("[v0] Payment amount mismatch:", {
        orderId: order.id,
        expected: orderTotal,
        received: paymentAmount,
      })
      return
    }

    const newStatus = mapMPStatusToOrderStatus(paymentDetails.status)
    const merchantOrderId = paymentDetails.order?.id?.toString() || paymentDetails.merchant_order_id?.toString()

    console.log("[v0] Updating order with payment data:", {
      orderId: order.id,
      merchantOrderId,
      paymentId,
      status: paymentDetails.status,
    })

    const updateData: any = {
      mp_payment_id: paymentId,
      mp_status: paymentDetails.status,
      mp_status_detail: paymentDetails.status_detail,
      situation: newStatus,
      updated_at: new Date().toISOString(),
    }

    if (merchantOrderId && !order.mp_merchant_order_id) {
      updateData.mp_merchant_order_id = merchantOrderId
      updateData.order_number = merchantOrderId
    }

    // Add PIX/Boleto data
    if (paymentDetails.point_of_interaction?.transaction_data) {
      const txData = paymentDetails.point_of_interaction.transaction_data
      if (txData.qr_code) updateData.mp_qr_code = txData.qr_code
      if (txData.qr_code_base64) updateData.mp_qr_code_base64 = txData.qr_code_base64
      if (txData.ticket_url) updateData.mp_ticket_url = txData.ticket_url
    }

    if (paymentDetails.barcode?.content) {
      updateData.mp_barcode = paymentDetails.barcode.content
    }

    if (paymentDetails.date_of_expiration) {
      updateData.mp_expiration_date = paymentDetails.date_of_expiration
    }

    const { error: updateError } = await supabase.from("orders").update(updateData).eq("id", order.id)

    if (updateError) {
      console.error("[v0] Error updating order:", updateError)
    } else {
      console.log("[v0] Order updated successfully")
    }
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({ status: "ok" })
}
