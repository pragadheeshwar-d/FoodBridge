import api from '../lib/api'

export interface QrRecord {
  id: number
  pickup_request_id: number
  qr_token: string
  generated_at: string
  expires_at: string
  scanned_at?: string | null
  status: 'Active' | 'Used' | 'Expired'
  qr_image?: string
}

export async function generateQrCode(pickupRequestId: string | number) {
  const res = await api.post('/qr/generate', { pickup_request_id: pickupRequestId })
  return res.data as {
    valid: boolean
    message: string
    token?: string
    qr_image?: string
    pickup_request_id?: number
    expires_at?: string
    status?: string
  }
}

export async function verifyQrCode(token: string) {
  const res = await api.post('/qr/verify', { token })
  return res.data as {
    valid: boolean
    message: string
    pickup_request?: unknown
    donation?: unknown
    qr?: unknown
  }
}

export async function getPickupQr(pickupRequestId: string | number) {
  const res = await api.get(`/qr/${pickupRequestId}`)
  return res.data as {
    pickup_request: unknown
    qr: QrRecord
  }
}
