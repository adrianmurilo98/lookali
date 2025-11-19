import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const state = searchParams.get('state')

  if (!code) {
    return NextResponse.redirect(
      new URL('/erp/settings?error=no_code', request.url)
    )
  }

  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.redirect(
        new URL('/login?error=unauthorized', request.url)
      )
    }

    // (Opcional mas recomendado para segurança)
    
    // Exchange code for access token
    const tokenResponse = await fetch('https://api.mercadopago.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.MP_CLIENT_ID!,
        client_secret: process.env.MP_CLIENT_SECRET!,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: `${request.nextUrl.origin}/api/mercadopago/oauth-callback`,
      }),
    })

    if (!tokenResponse.ok) {
      const error = await tokenResponse.json()
      console.error('[v0] MP OAuth error:', error)
      return NextResponse.redirect(
        new URL('/erp/settings?error=oauth_failed', request.url)
      )
    }

    const tokenData = await tokenResponse.json()

    // Get partner record
    const { data: partner } = await supabase
      .from('partners')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!partner) {
      return NextResponse.redirect(
        new URL('/erp/settings?error=no_partner', request.url)
      )
    }

    const { error: updateError } = await supabase
      .from('partners')
      .update({
        mp_user_id: tokenData.user_id,
        mp_access_token: tokenData.access_token,
        mp_refresh_token: tokenData.refresh_token,
        mp_public_key: tokenData.public_key,
        mp_connected_at: new Date().toISOString(),
      })
      .eq('id', partner.id)

    if (updateError) {
      console.error('[v0] Error updating partner:', updateError)
      return NextResponse.redirect(
        new URL('/erp/settings?error=update_failed', request.url)
      )
    }

    console.log('[v0] MP OAuth successful for partner:', partner.id)
    
    return NextResponse.redirect(
      new URL('/erp/settings?mp_connected=true', request.url)
    )
  } catch (error: any) {
    console.error('[v0] OAuth callback error:', error)
    return NextResponse.redirect(
      new URL('/erp/settings?error=exception', request.url)
    )
  }
}
