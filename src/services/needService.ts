import api from '../lib/api'

export interface FoodNeed {
  id: number
  receiver_id: number
  receiver_name: string
  receiver_organization?: string
  receiver_avatar?: string
  food_type: string
  food_name: string
  required_quantity: string
  quantity_number: number
  remaining_quantity: number
  unit: string
  urgency: 'Low' | 'Medium' | 'High' | 'Critical'
  location: string
  latitude?: number
  longitude?: number
  required_time: string
  additional_notes?: string
  status: 'Open' | 'Partially Fulfilled' | 'Fulfilled' | 'Cancelled'
  created_at: string
  responses_count: number
  responses?: FoodNeedResponse[]
}

export interface FoodNeedResponse {
  id: number
  need_id: number
  donor_id: number
  donor_name: string
  donor_organization?: string
  donor_avatar?: string
  offered_quantity: number
  unit: string
  delivery_type: string
  message?: string
  status: 'Pending' | 'Accepted' | 'Declined' | 'Completed'
  created_at: string
}

function extractArray<T>(payload: any): T[] {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload?.users)) return payload.users
  if (Array.isArray(payload?.needs)) return payload.needs
  return []
}

export const needService = {
  async getNeeds(params?: { urgency?: string; food_type?: string; search?: string; status?: string }) {
    const res = await api.get('/needs', { params })
    return extractArray<FoodNeed>(res.data)
  },

  async getMyNeeds() {
    const res = await api.get('/needs/my')
    return extractArray<FoodNeed>(res.data)
  },

  async getNeed(id: number) {
    const res = await api.get(`/needs/${id}`)
    const payload = res.data
    return (payload?.data ?? payload) as FoodNeed
  },

  async createNeed(payload: {
    food_type: string
    food_name?: string
    required_quantity: string
    quantity_number?: number
    unit?: string
    urgency?: string
    location?: string
    latitude?: number
    longitude?: number
    required_time?: string
    additional_notes?: string
  }) {
    const res = await api.post('/needs', payload)
    return res.data
  },

  async respondToNeed(needId: number, payload: {
    offered_quantity: number
    delivery_type?: string
    message?: string
  }) {
    const res = await api.post(`/needs/${needId}/respond`, payload)
    return res.data
  },

  async acceptResponse(responseId: number) {
    const res = await api.post(`/needs/responses/${responseId}/accept`)
    return res.data
  },

  async declineResponse(responseId: number) {
    const res = await api.post(`/needs/responses/${responseId}/decline`)
    return res.data
  },

  async confirmNeedReceipt(responseId: number) {
    const res = await api.post(`/needs/responses/${responseId}/confirm-receipt`)
    return res.data
  },

  async cancelNeed(needId: number) {
    const res = await api.delete(`/needs/${needId}`)
    return res.data
  }
}
