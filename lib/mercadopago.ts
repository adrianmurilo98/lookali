// Mercado Pago API helper functions

export interface MPPaymentData {
  transaction_amount: number
  description: string
  payment_method_id: string
  token?: string
  installments: number
  payer: {
    email: string
    identification?: {
      type: string
      number: string
    }
  }
  application_fee?: number
  metadata?: Record<string, any>
}

export interface MPPreferenceData {
  items: Array<{
    id?: string
    title: string
    description?: string
    quantity: number
    unit_price: number
  }>
  payer?: {
    name?: string
    email?: string
    phone?: {
      area_code?: string
      number?: string
    }
    identification?: {
      type?: string
      number?: string
    }
  }
  payment_methods?: {
    excluded_payment_methods?: Array<{ id: string }>
    excluded_payment_types?: Array<{ id: string }>
    installments?: number
    default_installments?: number
  }
  back_urls?: {
    success?: string
    failure?: string
    pending?: string
  }
  auto_return?: 'approved' | 'all'
  external_reference?: string
  notification_url?: string
  marketplace_fee?: number
  statement_descriptor?: string
  metadata?: Record<string, any>
}

export async function createPayment(
  accessToken: string,
  paymentData: MPPaymentData
) {
  const response = await fetch('https://api.mercadopago.com/v1/payments', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
      'X-Idempotency-Key': `${Date.now()}-${Math.random()}`,
    },
    body: JSON.stringify(paymentData),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to create payment')
  }

  return response.json()
}

export async function createPreference(
  accessToken: string,
  preferenceData: MPPreferenceData
) {
  const fullPreferenceData = {
    ...preferenceData,
    payment_methods: {
      excluded_payment_methods: [],
      excluded_payment_types: [],
      installments: 12,
      default_installments: 1,
    },
  }

  const isSandbox = accessToken.startsWith('TEST-')
  console.log('[v0] MP Environment:', isSandbox ? 'SANDBOX' : 'PRODUCTION')
  console.log('[v0] Creating preference with payment_methods:', fullPreferenceData.payment_methods)

  const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify(fullPreferenceData),
  })

  if (!response.ok) {
    const error = await response.json()
    console.error('[v0] MP API Error:', error)
    throw new Error(error.message || 'Failed to create preference')
  }

  const result = await response.json()
  console.log('[v0] MP Preference created:', {
    id: result.id,
    init_point: result.init_point,
    sandbox_init_point: result.sandbox_init_point,
  })

  return result
}

export async function getPayment(accessToken: string, paymentId: string) {
  const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to get payment')
  }

  return response.json()
}

export function mapMPStatusToOrderStatus(mpStatus: string): string {
  const statusMap: Record<string, string> = {
    'approved': 'paid',           // Payment approved and credited
    'pending': 'pending',          // Waiting for payment
    'authorized': 'pending',       // Payment authorized but not captured
    'in_process': 'pending',       // Payment in process
    'in_mediation': 'pending',     // In dispute/mediation
    'rejected': 'cancelled',       // Payment rejected
    'cancelled': 'cancelled',      // Payment cancelled
    'refunded': 'cancelled',       // Payment refunded
    'charged_back': 'cancelled',   // Chargeback issued
  }
  
  return statusMap[mpStatus] || 'pending'
}

export function validateWebhookSignature(
  xSignature: string,
  xRequestId: string,
  dataId: string,
  secret: string
): boolean {
  try {
    const parts = xSignature.split(',')
    
    let ts: string | undefined
    let hash: string | undefined
    
    for (const part of parts) {
      const [key, value] = part.split('=')
      if (key?.trim() === 'ts') {
        ts = value?.trim()
      } else if (key?.trim() === 'v1') {
        hash = value?.trim()
      }
    }
    
    if (!ts || !hash) {
      console.error('[v0] Missing ts or hash in x-signature')
      return false
    }
    
    const notificationTime = parseInt(ts) * 1000
    const currentTime = Date.now()
    const timeDiff = Math.abs(currentTime - notificationTime)
    const fiveMinutes = 5 * 60 * 1000
    
    if (timeDiff > fiveMinutes) {
      console.error('[v0] Notification too old:', { notificationTime, currentTime, timeDiff })
      return false
    }
    
    const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`
    
    const crypto = require('crypto')
    const hmac = crypto.createHmac('sha256', secret)
    hmac.update(manifest)
    const calculatedHash = hmac.digest('hex')
    
    const isValid = calculatedHash === hash
    
    if (!isValid) {
      console.error('[v0] Signature validation failed:', {
        expected: hash,
        calculated: calculatedHash,
        manifest,
      })
    }
    
    return isValid
  } catch (error) {
    console.error('[v0] Error validating webhook signature:', error)
    return false
  }
}

export async function revokeAccessToken(
  clientId: string,
  clientSecret: string,
  accessToken: string
): Promise<boolean> {
  try {
    const response = await fetch('https://api.mercadopago.com/oauth/token', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      },
      body: JSON.stringify({
        token: accessToken,
      }),
    })

    return response.ok
  } catch (error) {
    console.error('[v0] Error revoking MP token:', error)
    return false
  }
}
