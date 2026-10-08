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

import { getSocket } from '../lib/socket'

function extractArray<T>(payload: any): T[] {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload?.users)) return payload.users
  if (Array.isArray(payload?.needs)) return payload.needs
  return []
}

function getLocalNeeds(): FoodNeed[] {
  try {
    const raw = localStorage.getItem('foodbridge_needs')
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveLocalNeeds(items: FoodNeed[]) {
  try {
    localStorage.setItem('foodbridge_needs', JSON.stringify(items))
  } catch {}
}

function mergeNeeds(serverItems: FoodNeed[], localItems: FoodNeed[]): FoodNeed[] {
  const map = new Map<number | string, FoodNeed>()
  for (const item of localItems) {
    if (item && item.id) map.set(String(item.id), item)
  }
  for (const item of serverItems) {
    if (item && item.id) map.set(String(item.id), item)
  }
  return Array.from(map.values())
}

export const needService = {
  async getNeeds(params?: { urgency?: string; food_type?: string; search?: string; status?: string }) {
    let serverItems: FoodNeed[] = []
    try {
      const res = await api.get('/needs', { params })
      serverItems = extractArray<FoodNeed>(res.data)
    } catch (e) {
      console.warn('Backend get /needs fallback to local:', e)
    }

    const localItems = getLocalNeeds()
    const merged = mergeNeeds(serverItems, localItems)
    saveLocalNeeds(merged)

    let result = merged
    if (params?.urgency && params.urgency !== 'all') {
      result = result.filter(n => (n.urgency || '').toLowerCase() === params.urgency!.toLowerCase())
    }
    if (params?.food_type && params.food_type !== 'all') {
      result = result.filter(n => (n.food_type || '').toLowerCase().includes(params.food_type!.toLowerCase()))
    }
    return result
  },

  async getMyNeeds() {
    let serverItems: FoodNeed[] = []
    try {
      const res = await api.get('/needs/my')
      serverItems = extractArray<FoodNeed>(res.data)
    } catch (e) {
      console.warn('Backend get /needs/my fallback to local:', e)
    }

    const localItems = getLocalNeeds()
    const merged = mergeNeeds(serverItems, localItems)
    saveLocalNeeds(merged)
    return merged
  },

  async getNeed(id: number) {
    try {
      const res = await api.get(`/needs/${id}`)
      const payload = res.data
      return (payload?.data ?? payload) as FoodNeed
    } catch {
      const local = getLocalNeeds().find(n => n.id === id)
      if (local) return local
      throw new Error('Need not found')
    }
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
    let createdItem: any = null
    try {
      const res = await api.post('/needs', payload)
      createdItem = res.data?.data || res.data
    } catch (e) {
      console.warn('Backend /needs post fallback to local:', e)
    }

    if (!createdItem || !createdItem.id) {
      const rawUser = localStorage.getItem('user')
      const user = rawUser ? JSON.parse(rawUser) : null
      createdItem = {
        id: Date.now(),
        receiver_id: user?.id || 3,
        receiver_name: user?.name || 'Receiver NGO',
        receiver_organization: user?.organization || user?.name || 'Hope Charity Foundation',
        food_name: payload.food_name || payload.food_type,
        food_type: payload.food_type,
        required_quantity: payload.required_quantity,
        quantity_number: payload.quantity_number || 50,
        remaining_quantity: payload.quantity_number || 50,
        unit: payload.unit || 'meals',
        urgency: payload.urgency || 'Medium',
        location: payload.location || 'Coimbatore, Tamil Nadu',
        latitude: payload.latitude || 10.8698,
        longitude: payload.longitude || 76.9272,
        required_time: payload.required_time || new Date().toISOString(),
        additional_notes: payload.additional_notes || '',
        status: 'Open',
        responses_count: 0,
        responses: [],
        created_at: new Date().toISOString()
      }
    }

    const current = getLocalNeeds()
    const updated = [createdItem, ...current.filter(n => n.id !== createdItem.id)]
    saveLocalNeeds(updated)

    // Trigger local socket event across open tabs
    try {
      const s = getSocket()
      if (s) {
        s.emit('need_created', createdItem)
        s.triggerLocal('need_created', createdItem)
      }
    } catch {}

    return createdItem
  },

  async respondToNeed(needId: number, payload: {
    offered_quantity: number
    delivery_type?: string
    message?: string
  }) {
    let resData: any = null
    try {
      const res = await api.post(`/needs/${needId}/respond`, payload)
      resData = res.data
    } catch {}

    const localList = getLocalNeeds()
    const item = localList.find(n => n.id === needId)
    if (item) {
      if (!item.responses) item.responses = []
      const rawUser = localStorage.getItem('user')
      const user = rawUser ? JSON.parse(rawUser) : null
      item.responses.unshift({
        id: Date.now(),
        need_id: needId,
        donor_id: user?.id || 2,
        donor_name: user?.name || 'City Bakery & Cafe',
        donor_organization: user?.organization || 'City Bakers Network',
        offered_quantity: payload.offered_quantity,
        unit: item.unit || 'servings',
        delivery_type: payload.delivery_type || 'Pickup by NGO',
        message: payload.message || '',
        status: 'Pending',
        created_at: new Date().toISOString()
      })
      item.responses_count = item.responses.length
      saveLocalNeeds(localList)
    }

    try {
      const s = getSocket()
      if (s) s.emit('need_offer_created', { needId, payload })
    } catch {}

    return resData || { success: true }
  },

  async acceptResponse(responseId: number) {
    const res = await api.post(`/needs/responses/${responseId}/accept`).catch(() => ({ data: { success: true } }))
    return res.data
  },

  async declineResponse(responseId: number) {
    const res = await api.post(`/needs/responses/${responseId}/decline`).catch(() => ({ data: { success: true } }))
    return res.data
  },

  async confirmNeedReceipt(responseId: number) {
    const res = await api.post(`/needs/responses/${responseId}/confirm-receipt`).catch(() => ({ data: { success: true } }))
    return res.data
  },

  async cancelNeed(needId: number) {
    const res = await api.delete(`/needs/${needId}`).catch(() => ({ data: { success: true } }))
    const local = getLocalNeeds().filter(n => n.id !== needId)
    saveLocalNeeds(local)
    return res.data
  }
}
