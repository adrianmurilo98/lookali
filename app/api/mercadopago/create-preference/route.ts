import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createPreference, getMercadoPagoEnvironment } from '@/lib/mercadopago'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const [{ data: { user } }, body] = await Promise.all([
      supabase.auth.getUser(),
      request.json()
    ])
    
    if (!user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    const { orderId } = body

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID é obrigatório' },
        { status: 400 }
      )
    }

    const [orderResult, profileResult] = await Promise.all([
      supabase
        .from('orders')
        .select('*, partners(*), order_items(*)')
        .eq('id', orderId)
        .eq('buyer_id', user.id)
        .single(),
      supabase
        .from('profiles')
        .select('full_name, email, phone')
        .eq('id', user.id)
        .single()
    ])

    const { data: order, error: orderError } = orderResult
    const { data: profile } = profileResult

    if (orderError || !order) {
      return NextResponse.json(
        { error: 'Pedido não encontrado ou sem permissão' },
        { status: 404 }
      )
    }

    if (!order.partners.mp_access_token) {
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

    if (order.mp_preference_id) {
      return NextResponse.json(
        { error: 'Pedido já possui preferência de pagamento criada' },
        { status: 400 }
      )
    }

    const mpEnv = getMercadoPagoEnvironment(order.partners.mp_access_token)
    console.log('[v0] Mercado Pago environment:', mpEnv)

    // Prepare items for preference
    const items = order.order_items.map((item: any) => ({
      id: item.product_id,
      title: item.product_name || 'Produto',
      quantity: item.quantity,
      unit_price: Number(item.product_price),
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
        excluded_payment_methods: [], // Don't exclude any specific methods
        excluded_payment_types: [], // Don't exclude any payment types (enables credit_card, debit_card, ticket/boleto, bank_transfer/pix)
        installments: 12, // Allow up to 12 installments
        default_installments: 1,
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
      statement_descriptor: order.partners.name?.substring(0, 13) || 'Marketplace', // Appears on card statement
      metadata: {
        order_id: orderId,
        order_number: order.order_number,
        partner_id: order.partner_id,
        buyer_id: user.id,
        environment: mpEnv.environment,
      },
    }

    console.log('[v0] Creating MP preference with payment methods:', preferenceData.payment_methods)

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
      environment: mpEnv.environment,
      isSandbox: mpEnv.isSandbox,
    })
  } catch (error: any) {
    console.error('[v0] Error creating Mercado Pago preference:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao criar preferência de pagamento' },
      { status: 500 }
    )
  }
}
