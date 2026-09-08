import api from '../lib/api'

export type PickupRequestStatus = 'Pending' | 'Approved' | 'Rejected' | 'Completed'

export interface PickupRequestRecord {
  id?: string | number
  donation_id?: string | number
  receiver_id?: number
  receiver_name?: string
  receiver_organization?: string
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
  donor_name?: string
  donor_organization?: string
  food_image?: string
}

export async function createPickupRequest(input: {
  donationId?: string | number
  donation_id?: string | number
  requestMessage?: string
  request_message?: string
  requestedQuantity?: number
  requested_quantity?: number
}): Promise<PickupRequestRecord> {
  const res = await api.post('/pickup-requests', {
    donation_id: input.donation_id ?? input.donationId,
    request_message: input.request_message ?? input.requestMessage ?? '',
    requested_quantity: input.requested_quantity ?? input.requestedQuantity,
  })
  return res.data.pickup_request as PickupRequestRecord
}

export async function getPickupRequests(): Promise<PickupRequestRecord[]> {
  const res = await api.get('/pickup-requests')
  return res.data.pickup_requests ?? res.data ?? []
}

export async function updatePickupRequest(
  id: string | number,
  status: 'Approved' | 'Rejected' | 'Completed',
): Promise<PickupRequestRecord> {
  const res = await api.put(`/pickup-requests/${id}`, { status })
  return res.data.pickup_request as PickupRequestRecord
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
  const res = await api.post(`/pickups/${id}/confirm-receipt`)
  return res.data
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

