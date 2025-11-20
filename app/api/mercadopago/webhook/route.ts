import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { getPayment, mapMPStatusToOrderStatus, validateWebhookSignature } from "@/lib/mercadopago"

export async function POST(request: NextRequest) {
  try {
    const xSignature = request.headers.get("x-signature")
    const xRequestId = request.headers.get("x-request-id")

    if (!xSignature || !xRequestId) {
      console.error("[v0] Missing required headers")
      return NextResponse.json({ error: "Missing security headers" }, { status: 401 })
    }

    const body = await request.json()

    console.log("[v0] MP Webhook received:", {
      type: body.type,
      action: body.action,
      dataId: body.data?.id,
    })

    const { type, data, action } = body

    if (!data?.id) {
      return NextResponse.json({ received: true })
    }

    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    if (type === "payment") {
      const paymentId = data.id

      // Find order by mp_payment_id or search recent orders
      const { data: existingOrder } = await supabase
        .from("orders")
        .select(
          "id, mp_payment_id, order_number, partner_id, total_amount, partners(mp_access_token, mp_webhook_secret)",
        )
        .eq("mp_payment_id", paymentId)
        .single()

      let order = existingOrder
      let paymentDetails: any
      let partnerSecret: string | null = null

      if (!order) {
        const { data: recentOrders } = await supabase
          .from("orders")
          .select(
            "id, order_number, mp_preference_id, partner_id, total_amount, partners(mp_access_token, mp_webhook_secret)",
          )
          .is("mp_payment_id", null)
          .order("created_at", { ascending: false })
          .limit(50)

        if (recentOrders) {
          for (const recentOrder of recentOrders) {
            if (recentOrder.partners?.mp_access_token) {
              try {
                paymentDetails = await getPayment(recentOrder.partners.mp_access_token, paymentId)

                if (paymentDetails.external_reference === recentOrder.id) {
                  order = recentOrder
                  partnerSecret = recentOrder.partners.mp_webhook_secret
                  break
                }
              } catch (err) {
                console.error("[v0] Error fetching payment for order:", recentOrder.id, err)
                continue
              }
            }
          }
        }
      } else {
        partnerSecret = order.partners?.mp_webhook_secret || null

        if (order.partners?.mp_access_token) {
          paymentDetails = await getPayment(order.partners.mp_access_token, paymentId)
        }
      }

      if (!order || !paymentDetails) {
        console.log("[v0] Order not found for payment:", paymentId)
        return NextResponse.json({ error: "Order not found" }, { status: 404 })
      }

      if (partnerSecret) {
        const isValid = validateWebhookSignature(xSignature, xRequestId, paymentId, partnerSecret)

        if (!isValid) {
          console.error("[v0] Invalid webhook signature")
          return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
        }
      }

      // Validate payment amount
      const orderTotal = Number(order.total_amount)
      const paymentAmount = Number(paymentDetails.transaction_amount)

      if (Math.abs(orderTotal - paymentAmount) > 0.01) {
        console.error("[v0] Payment amount mismatch:", {
          orderId: order.id,
          expected: orderTotal,
          received: paymentAmount,
        })
        return NextResponse.json({ error: "Payment amount mismatch" }, { status: 400 })
      }

      const newStatus = mapMPStatusToOrderStatus(paymentDetails.status)

      const mpOrderNumber =
        paymentDetails.order?.id?.toString() || paymentDetails.merchant_order_id?.toString() || order.order_number

      console.log("[v0] Updating order with MP data:", {
        orderId: order.id,
        mpOrderNumber,
        paymentId,
        status: paymentDetails.status,
      })

      const { error: updateError } = await supabase
        .from("orders")
        .update({
          mp_payment_id: paymentId,
          mp_status: paymentDetails.status,
          mp_status_detail: paymentDetails.status_detail,
          situation: newStatus,
          order_number: mpOrderNumber,
          updated_at: new Date().toISOString(),
        })
        .eq("id", order.id)

      if (updateError) {
        console.error("[v0] Error updating order:", updateError)
        return NextResponse.json({ error: "Error updating order" }, { status: 500 })
      }

      console.log("[v0] Order updated successfully")
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error("[v0] Webhook error:", error)
    return NextResponse.json({ error: error.message || "Webhook processing failed" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({ status: "ok" })
}
