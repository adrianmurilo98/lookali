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
  back_urls?: {
    success?: string
    failure?: string
    pending?: string
  }
  auto_return?: 'approved' | 'all'
  external_reference?: string
  notification_url?: string
  marketplace_fee?: number
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
  const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify(preferenceData),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to create preference')
  }

  return response.json()
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
    'approved': 'paid',
    'pending': 'pending',
    'in_process': 'pending',
    'rejected': 'cancelled',
    'cancelled': 'cancelled',
    'refunded': 'cancelled',
    'charged_back': 'cancelled',
  }
  
  return statusMap[mpStatus] || 'pending'
}
