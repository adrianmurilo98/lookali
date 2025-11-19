import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createPreference } from '@/lib/mercadopago'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { orderId } = body

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID é obrigatório' },
        { status: 400 }
      )
    }

    // Get order details
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*, partners(*), order_items(*)')
      .eq('id', orderId)
      .eq('buyer_id', user.id)
      .single()

    if (orderError || !order) {
      return NextResponse.json(
        { error: 'Pedido não encontrado' },
        { status: 404 }
      )
    }

    // Check if partner has Mercado Pago connected
    if (!order.partners.mp_access_token) {
      return NextResponse.json(
        { error: 'Vendedor não possui Mercado Pago configurado' },
        { status: 400 }
      )
    }

    // Prepare items for preference
    const items = order.order_items.map((item: any) => ({
      id: item.product_id,
      title: item.product_name || 'Produto',
      quantity: item.quantity,
      unit_price: Number(item.product_price),
    }))

    // Get buyer profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, email, phone')
      .eq('id', user.id)
      .single()

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin

    // Create preference with 0% marketplace fee (100% goes to seller)
    const preferenceData = {
      items,
      payer: {
        name: profile?.full_name || undefined,
        email: profile?.email || user.email || undefined,
        phone: profile?.phone ? {
          area_code: profile.phone.substring(0, 2),
          number: profile.phone.substring(2),
        } : undefined,
      },
      back_urls: {
        success: `${baseUrl}/payment-success?order_id=${orderId}`,
        failure: `${baseUrl}/payment-failure?order_id=${orderId}`,
        pending: `${baseUrl}/payment-pending?order_id=${orderId}`,
      },
      auto_return: 'approved' as const,
      external_reference: orderId,
      notification_url: `${baseUrl}/api/mercadopago/webhook`,
      marketplace_fee: 0, // 0% fee - 100% goes to seller
      metadata: {
        order_id: orderId,
        order_number: order.order_number,
        partner_id: order.partner_id,
        buyer_id: user.id,
      },
    }

    const preference = await createPreference(
      order.partners.mp_access_token,
      preferenceData
    )

    // Update order with preference ID
    await supabase
      .from('orders')
      .update({
        mp_preference_id: preference.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)

    return NextResponse.json({
      success: true,
      preferenceId: preference.id,
      initPoint: preference.init_point,
      sandboxInitPoint: preference.sandbox_init_point,
    })
  } catch (error: any) {
    console.error('[v0] Error creating Mercado Pago preference:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao criar preferência de pagamento' },
      { status: 500 }
    )
  }
}
