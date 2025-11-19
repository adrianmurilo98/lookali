import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getPayment, mapMPStatusToOrderStatus, validateWebhookSignature } from '@/lib/mercadopago'

export async function POST(request: NextRequest) {
  try {
    console.log('[v0] MP Webhook received')
    
    // 1. Extract headers
    const xSignature = request.headers.get('x-signature')
    const xRequestId = request.headers.get('x-request-id')
    
    // 2. Parse request body
    const body = await request.json()
    
    console.log('[v0] Webhook payload:', {
      action: body.action,
      type: body.type,
      dataId: body.data?.id,
    })

    // 3. Handle different webhook types
    const { action, type, data } = body
    
    // Only process payment events
    if (type !== 'payment') {
      console.log('[v0] Ignoring non-payment webhook:', type)
      return NextResponse.json({ status: 'ignored', reason: 'not a payment event' }, { status: 200 })
    }

    const paymentId = data?.id
    if (!paymentId) {
      console.error('[v0] No payment ID in webhook')
      return NextResponse.json({ error: 'No payment ID' }, { status: 400 })
    }

    // 4. Create Supabase client
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('[v0] Missing Supabase credentials')
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey)

    // 5. Find the order by preference or payment ID
    let order: any = null
    let paymentDetails: any = null
    let partnerSecret: string | null = null

    // First try to find by payment ID
    const { data: orderByPayment } = await supabase
      .from('orders')
      .select(`
        id,
        order_number,
        mp_payment_id,
        mp_preference_id,
        partner_id,
        total_amount,
        situation,
        partners(mp_access_token, mp_webhook_secret)
      `)
      .eq('mp_payment_id', paymentId)
      .single()

    if (orderByPayment) {
      order = orderByPayment
      partnerSecret = order.partners?.mp_webhook_secret || null
    } else {
      // If not found, search recent pending orders and match by preference
      const { data: recentOrders } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          mp_preference_id,
          partner_id,
          total_amount,
          situation,
          partners(mp_access_token, mp_webhook_secret)
        `)
        .is('mp_payment_id', null)
        .eq('situation', 'pending')
        .order('created_at', { ascending: false })
        .limit(50)

      if (recentOrders && recentOrders.length > 0) {
        // Try to get payment details and match with preference
        for (const recentOrder of recentOrders) {
          if (recentOrder.partners?.mp_access_token) {
            try {
              const payment = await getPayment(
                recentOrder.partners.mp_access_token,
                paymentId
              )

              // Match by preference_id or external_reference
              if (
                payment.preference_id === recentOrder.mp_preference_id ||
                payment.external_reference === recentOrder.id
              ) {
                paymentDetails = payment
                order = recentOrder
                partnerSecret = recentOrder.partners.mp_webhook_secret
                break
              }
            } catch (err) {
              console.error('[v0] Error fetching payment for order:', recentOrder.id, err)
              continue
            }
          }
        }
      }
    }

    if (!order) {
      console.error('[v0] Order not found for payment:', paymentId)
      // Return 200 to prevent MP from retrying
      return NextResponse.json({ 
        status: 'order_not_found',
        message: 'Order not found but webhook acknowledged'
      }, { status: 200 })
    }

    // 6. Get payment details if not already fetched
    if (!paymentDetails && order.partners?.mp_access_token) {
      paymentDetails = await getPayment(
        order.partners.mp_access_token,
        paymentId
      )
    }

    if (!paymentDetails) {
      console.error('[v0] Could not fetch payment details:', paymentId)
      return NextResponse.json({ error: 'Could not fetch payment' }, { status: 500 })
    }

    // 7. Validate webhook signature if secret is available
    if (xSignature && xRequestId && partnerSecret) {
      const isValid = validateWebhookSignature(
        xSignature,
        xRequestId,
        paymentId,
        partnerSecret
      )
      
      if (!isValid) {
        console.error('[v0] Invalid webhook signature for payment:', paymentId)
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
      }
    }

    // 8. Validate payment amount matches order
    const orderTotal = Number(order.total_amount)
    const paymentAmount = Number(paymentDetails.transaction_amount)
    
    if (Math.abs(orderTotal - paymentAmount) > 0.01) {
      console.error('[v0] Payment amount mismatch:', {
        orderId: order.id,
        expected: orderTotal,
        received: paymentAmount,
      })
      return NextResponse.json({ error: 'Amount mismatch' }, { status: 400 })
    }

    // 9. Map MP status to order status
    const newStatus = mapMPStatusToOrderStatus(paymentDetails.status)

    const { error: updateError } = await supabase
      .from('orders')
      .update({
        mp_payment_id: paymentId,
        mp_status: paymentDetails.status,
        mp_status_detail: paymentDetails.status_detail || null,
        situation: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', order.id)

    if (updateError) {
      console.error('[v0] Error updating order:', updateError)
      return NextResponse.json({ error: 'Database update failed' }, { status: 500 })
    }

    console.log('[v0] Order updated successfully:', {
      orderId: order.id,
      orderNumber: order.order_number,
      paymentId,
      mpStatus: paymentDetails.status,
      orderStatus: newStatus,
      action,
    })

    return NextResponse.json({ 
      success: true,
      orderId: order.id,
      paymentId,
      status: newStatus
    }, { status: 200 })
    
  } catch (error: any) {
    console.error('[v0] Webhook error:', error)
    return NextResponse.json({ 
      error: 'Internal error',
      message: error.message 
    }, { status: 200 })
  }
}

// Handle GET requests for webhook verification
export async function GET(request: NextRequest) {
  return NextResponse.json({ status: 'ok', service: 'mercadopago-webhook' })
}
