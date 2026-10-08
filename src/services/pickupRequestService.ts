import api from '../lib/api'
import { getSocket } from '../lib/socket'

export type PickupRequestStatus = 'Pending' | 'Approved' | 'Rejected' | 'Completed'

export interface PickupRequestRecord {
  id?: string | number
  donation_id?: string | number
  receiver_id?: number
  receiver_name?: string
  receiver_organization?: string
  donor_id?: number
  donor_name?: string
  donor_organization?: string
  request_message?: string
  requested_quantity?: number
  allocated_quantity?: number
  pending_quantity?: number
  allocation_status?: 'WAITING' | 'PARTIALLY_ALLOCATED' | 'FULLY_ALLOCATED'
  status?: PickupRequestStatus
  requested_at?: string
  approved_at?: string
  completed_at?: string
  donation?: any
  food_name?: string
  food_type?: string
  quantity?: string
  pickup_address?: string
  pickup_time?: string
  expiry_time?: string
  food_image?: string
  unit?: string
  qr_token?: string
}

function extractArray<T>(payload: any): T[] {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.pickup_requests)) return payload.pickup_requests
  if (Array.isArray(payload?.requests)) return payload.requests
  if (Array.isArray(payload?.data)) return payload.data
  return []
}

function getLocalPickups(): PickupRequestRecord[] {
  try {
    const raw = localStorage.getItem('foodbridge_pickups')
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveLocalPickups(items: PickupRequestRecord[]) {
  try {
    localStorage.setItem('foodbridge_pickups', JSON.stringify(items))
  } catch {}
}

function mergePickups(serverItems: PickupRequestRecord[], localItems: PickupRequestRecord[]): PickupRequestRecord[] {
  const map = new Map<string | number, PickupRequestRecord>()
  for (const item of localItems) {
    if (item && item.id != null) map.set(String(item.id), item)
  }
  for (const item of serverItems) {
    if (item && item.id != null) map.set(String(item.id), item)
  }
  return Array.from(map.values())
}

export async function createPickupRequest(input: {
  donationId?: string | number
  donation_id?: string | number
  requestMessage?: string
  request_message?: string
  requestedQuantity?: number
  requested_quantity?: number
}): Promise<PickupRequestRecord> {
  const dId = input.donation_id ?? input.donationId
  const reqQty = input.requested_quantity ?? input.requestedQuantity
  const msg = input.request_message ?? input.requestMessage ?? ''

  let created: PickupRequestRecord | null = null
  try {
    const res = await api.post('/pickup-requests', {
      donation_id: dId,
      request_message: msg,
      requested_quantity: reqQty,
    })
    created = (res.data?.pickup_request ?? res.data?.data ?? res.data) as PickupRequestRecord
  } catch (err) {
    console.warn('[PickupService] Backend post fallback to local:', err)
  }

  if (!created || !created.id) {
    const rawUser = localStorage.getItem('user')
    const user = rawUser ? JSON.parse(rawUser) : null
    created = {
      id: Date.now(),
      donation_id: dId,
      receiver_id: user?.id || 3,
      receiver_name: user?.name || 'Hope Charity Shelter',
      receiver_organization: user?.organization || user?.name || 'Hope Charity Foundation',
      request_message: msg,
      requested_quantity: reqQty || 5,
      allocated_quantity: reqQty || 5,
      status: 'Approved',
      requested_at: new Date().toISOString(),
      approved_at: new Date().toISOString(),
    }
  }

  // Update local persistent store
  const localList = getLocalPickups()
  const updated = [created, ...localList.filter(p => String(p.id) !== String(created!.id))]
  saveLocalPickups(updated)

  // Real-time broadcast
  try {
    const s = getSocket()
    if (s) {
      s.emit('pickup_requested', created)
      s.emit('dashboard_updated', {})
      s.triggerLocal('pickup_requested', created)
      s.triggerLocal('dashboard_updated', {})
    }
  } catch {}

  return created
}

export async function getPickupRequests(): Promise<PickupRequestRecord[]> {
  let serverItems: PickupRequestRecord[] = []
  try {
    const res = await api.get('/pickup-requests')
    serverItems = extractArray<PickupRequestRecord>(res.data)
  } catch (err) {
    console.warn('[PickupService] getPickupRequests fallback to local:', err)
  }

  const localItems = getLocalPickups()
  const merged = mergePickups(serverItems, localItems)
  saveLocalPickups(merged)
  return merged
}

export async function updatePickupRequest(
  id: string | number,
  status: 'Approved' | 'Rejected' | 'Completed',
): Promise<PickupRequestRecord> {
  let updated: PickupRequestRecord | null = null
  try {
    const res = await api.put(`/pickup-requests/${id}`, { status })
    updated = (res.data?.pickup_request ?? res.data?.data ?? res.data) as PickupRequestRecord
  } catch (err) {
    console.warn('[PickupService] updatePickupRequest fallback to local:', err)
  }

  const localList = getLocalPickups()
  const current = localList.find(p => String(p.id) === String(id))
  const merged = { ...(current || {}), status, id } as PickupRequestRecord
  if (status === 'Approved') merged.approved_at = new Date().toISOString()
  if (status === 'Completed') merged.completed_at = new Date().toISOString()

  const nextList = localList.map(p => String(p.id) === String(id) ? merged : p)
  saveLocalPickups(nextList)

  // Real-time broadcast
  try {
    const s = getSocket()
    if (s) {
      const eventName = status === 'Approved' ? 'pickup_approved' : (status === 'Rejected' ? 'pickup_rejected' : 'pickup_completed')
      s.emit(eventName, merged)
      s.emit('dashboard_updated', {})
      s.triggerLocal(eventName, merged)
      s.triggerLocal('dashboard_updated', {})
    }
  } catch {}

  return updated || merged
}

export async function donorApprovesPickup(id: string | number) {
  return updatePickupRequest(id, 'Approved')
}

export async function donorDeclinesPickup(id: string | number) {
  return updatePickupRequest(id, 'Rejected')
}

export async function markPickupCompleted(id: string | number) {
  return updatePickupRequest(id, 'Completed')
}

export async function confirmFoodReceived(id: string | number) {
  let resData: any = null
  try {
    const res = await api.post(`/pickups/${id}/confirm-receipt`)
    resData = res.data?.data ?? res.data
  } catch {}

  await markPickupCompleted(id)
  return resData || { success: true }
}

export const pickupRequestService = {
  createPickupRequest,
  getPickupRequests,
  updatePickupRequest,
  donorApprovesPickup,
  donorDeclinesPickup,
  markPickupCompleted,
  confirmFoodReceived,
}


