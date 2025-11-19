import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getPayment, mapMPStatusToOrderStatus } from '@/lib/mercadopago'

export async function POST(request: NextRequest) {
  try {
    // Create Supabase client inside the function
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const body = await request.json()
    
    console.log('[v0] Mercado Pago webhook received:', body)

    // Mercado Pago sends notifications in this format
    const { type, data } = body

    // We only care about payment notifications
    if (type !== 'payment') {
      return NextResponse.json({ received: true })
    }

    const paymentId = data?.id
    if (!paymentId) {
      return NextResponse.json({ error: 'No payment ID' }, { status: 400 })
    }

    // Find order by external_reference or search through metadata
    // First, we need to get the payment details to extract the order info
    // We'll do this in batches to find the right partner's access token

    // Try to find order with this payment ID first
    const { data: existingOrder } = await supabase
      .from('orders')
      .select('id, mp_payment_id, partner_id, partners(mp_access_token)')
      .eq('mp_payment_id', paymentId)
      .single()

    let order = existingOrder
    let paymentDetails: any

    if (!order) {
      // Payment not yet associated - need to fetch payment details
      // Try to find by querying recent orders and checking each partner's token
      const { data: recentOrders } = await supabase
        .from('orders')
        .select('id, order_number, mp_preference_id, partner_id, partners(mp_access_token)')
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

              // Check if this payment matches this order
              if (paymentDetails.external_reference === recentOrder.id) {
                order = recentOrder
                break
              }
            } catch (err) {
              // Token might not have access to this payment, continue
              continue
            }
          }
        }
      }
    } else {
      // Fetch updated payment details
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

    // Map Mercado Pago status to our order status
    const newStatus = mapMPStatusToOrderStatus(paymentDetails.status)

    // Update order with payment information
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

// Also handle GET requests from Mercado Pago webhook verification
export async function GET(request: NextRequest) {
  return NextResponse.json({ status: 'ok' })
}
