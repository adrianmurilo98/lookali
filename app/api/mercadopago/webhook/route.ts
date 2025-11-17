import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getPayment, mapMPStatusToOrderStatus, validateWebhookSignature } from '@/lib/mercadopago'

export async function POST(request: NextRequest) {
  try {
    // 1. Extract and validate signature headers
    const xSignature = request.headers.get('x-signature')
    const xRequestId = request.headers.get('x-request-id')
    
    if (!xSignature || !xRequestId) {
      console.error('[v0] Missing required headers')
      return NextResponse.json(
        { error: 'Missing security headers' },
        { status: 401 }
      )
    }

    // 2. Parse request body
    const body = await request.json()
    
    console.log('[v0] Mercado Pago webhook received:', {
      type: body.type,
      dataId: body.data?.id,
      xRequestId,
    })

    // 3. Validate webhook type
    const { type, data } = body
    
    if (type !== 'payment') {
      return NextResponse.json({ received: true })
    }

    const paymentId = data?.id
    if (!paymentId) {
      return NextResponse.json({ error: 'No payment ID' }, { status: 400 })
    }

    // 4. Create Supabase client
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // 5. Find the order and partner
    const { data: existingOrder } = await supabase
      .from('orders')
      .select('id, mp_payment_id, partner_id, partners(mp_access_token, mp_webhook_secret)')
      .eq('mp_payment_id', paymentId)
      .single()

    let order = existingOrder
    let paymentDetails: any
    let partnerSecret: string | null = null

    if (!order) {
      // Payment not yet associated - search recent orders
      const { data: recentOrders } = await supabase
        .from('orders')
        .select('id, order_number, mp_preference_id, partner_id, partners(mp_access_token, mp_webhook_secret)')
        .is('mp_payment_id', null)
        .order('created_at', { ascending: false })
        .limit(50)

      if (recentOrders) {
        for (const recentOrder of recentOrders) {
          if (recentOrder.partners?.mp_access_token) {
            try {
              paymentDetails = await getPayment(
                recentOrder.partners.mp_access_token,
                paymentId
              )

              if (paymentDetails.external_reference === recentOrder.id) {
                order = recentOrder
                partnerSecret = recentOrder.partners.mp_webhook_secret
                break
              }
            } catch (err) {
              continue
            }
          }
        }
      }
    } else {
      partnerSecret = order.partners?.mp_webhook_secret || null
      
      if (order.partners?.mp_access_token) {
        paymentDetails = await getPayment(
          order.partners.mp_access_token,
          paymentId
        )
      }
    }

    if (!order || !paymentDetails) {
      console.log('[v0] Order not found for payment:', paymentId)
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    if (partnerSecret) {
      const isValid = validateWebhookSignature(
        xSignature,
        xRequestId,
        paymentId,
        partnerSecret
      )
      
      if (!isValid) {
        console.error('[v0] Invalid webhook signature for payment:', paymentId)
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 401 }
        )
      }
    } else {
      console.warn('[v0] No webhook secret configured for partner, skipping validation')
    }

    // 7. Validate payment amount matches order
    const orderTotal = Number(order.total_amount || paymentDetails.transaction_amount)
    const paymentAmount = Number(paymentDetails.transaction_amount)
    
    if (Math.abs(orderTotal - paymentAmount) > 0.01) {
      console.error('[v0] Payment amount mismatch:', {
        orderId: order.id,
        expected: orderTotal,
        received: paymentAmount,
      })
      return NextResponse.json(
        { error: 'Payment amount mismatch' },
        { status: 400 }
      )
    }

    // 8. Map status and update order
    const newStatus = mapMPStatusToOrderStatus(paymentDetails.status)

    const { error: updateError } = await supabase
      .from('orders')
      .update({
        mp_payment_id: paymentId,
        mp_status: paymentDetails.status,
        mp_status_detail: paymentDetails.status_detail,
        situation: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', order.id)

    if (updateError) {
      console.error('[v0] Error updating order:', updateError)
      return NextResponse.json(
        { error: 'Error updating order' },
        { status: 500 }
      )
    }

    console.log('[v0] Order updated successfully:', {
      orderId: order.id,
      paymentId,
      status: paymentDetails.status,
      newOrderStatus: newStatus,
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[v0] Webhook error:', error)
    return NextResponse.json(
      { error: error.message || 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

// Handle GET requests for webhook verification
export async function GET(request: NextRequest) {
  return NextResponse.json({ status: 'ok' })
}
