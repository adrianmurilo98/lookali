import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createPreference } from '@/lib/mercadopago'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
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

    console.log('[v0] Fetching order:', orderId)
    
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        partners!orders_partner_id_fkey(
          id, 
          store_name, 
          mp_access_token, 
          mp_user_id
        ),
        order_items(*)
      `)
      .eq('id', orderId)
      .single()

    console.log('[v0] Order query result:', { order, orderError })

    if (orderError) {
      console.error('[v0] Order query error:', orderError)
      return NextResponse.json(
        { error: `Erro ao buscar pedido: ${orderError.message}` },
        { status: 500 }
      )
    }

    if (!order) {
      return NextResponse.json(
        { error: 'Pedido não encontrado' },
        { status: 404 }
      )
    }

    if (order.buyer_id !== user.id) {
      return NextResponse.json(
        { error: 'Sem permissão para acessar este pedido' },
        { status: 403 }
      )
    }

    if (!order.partners?.mp_access_token) {
      return NextResponse.json(
        { error: 'Vendedor não possui Mercado Pago configurado' },
        { status: 400 }
      )
    }

    if (order.situation !== 'pending') {
      return NextResponse.json(
        { error: 'Pedido não está em estado válido para pagamento' },
        { status: 400 }
      )
    }

    if (order.mp_preference_id && order.mp_payment_id) {
      return NextResponse.json(
        { error: 'Pedido já possui pagamento em andamento' },
        { status: 400 }
      )
    }

    // Prepare items for preference
    const items = order.order_items.map((item: any) => ({
      id: item.product_id || item.service_id || 'item',
      title: item.product_name || item.service_name || 'Produto',
      quantity: item.quantity,
      unit_price: Number(item.product_price || item.service_price),
    }))

    const itemsTotal = items.reduce((sum: number, item: any) => 
      sum + (item.quantity * item.unit_price), 0
    )
    
    if (Math.abs(itemsTotal - Number(order.total_amount)) > 0.01) {
      return NextResponse.json(
        { error: 'Total do pedido não corresponde aos itens' },
        { status: 400 }
      )
    }

    // Get buyer profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, email, phone')
      .eq('id', user.id)
      .single()

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin

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
      payment_methods: {
        excluded_payment_methods: [],
        excluded_payment_types: [],
        installments: 12,
        default_installments: 1,
        default_payment_method_id: null,
      },
      back_urls: {
        success: `${baseUrl}/payment-success?order_id=${orderId}`,
        failure: `${baseUrl}/payment-failure?order_id=${orderId}`,
        pending: `${baseUrl}/payment-pending?order_id=${orderId}`,
      },
      auto_return: 'approved' as const,
      external_reference: orderId,
      notification_url: `${baseUrl}/api/mercadopago/webhook`,
      marketplace_fee: 0,
      statement_descriptor: order.partners.store_name?.substring(0, 22) || 'MARKETPLACE',
      metadata: {
        order_id: orderId,
        order_number: order.order_number,
        partner_id: order.partner_id,
        buyer_id: user.id,
      },
    }

    console.log('[v0] Creating MP preference for order:', orderId)

    const preference = await createPreference(
      order.partners.mp_access_token,
      preferenceData
    )

    console.log('[v0] Preference response completa:', JSON.stringify(preference, null, 2))

    // Update order with preference ID
    await supabase
      .from('orders')
      .update({
        mp_preference_id: preference.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)

    const isSandbox = order.partners.mp_access_token.startsWith('TEST-')
    const webUrl = isSandbox ? preference.sandbox_init_point : preference.init_point
    
    // Force HTTPS and web URL format
    const finalUrl = webUrl?.replace(/^mercadopago:\/\//, 'https://www.mercadopago.com.br/')
    
    return NextResponse.json({
      success: true,
      preferenceId: preference.id,
      initPoint: finalUrl || webUrl,
      isSandbox,
    })
  } catch (error: any) {
    console.error('[v0] Error creating Mercado Pago preference:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao criar preferência de pagamento' },
      { status: 500 }
    )
  }
}
