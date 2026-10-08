import api from '../lib/api'
import { getSocket } from '../lib/socket'

export type DonationVegType = 'veg' | 'nonveg' | 'vegan'
export type DonationUnit = 'meals' | 'kg'

export interface DonationRecord {
  id?: string | number
  donor_id?: number
  donor_name?: string
  donor_organization?: string
  food_name: string
  food_type: string
  quantity: string
  category?: string
  veg_type?: string
  remaining_quantity?: number
  allocated_quantity?: number
  description?: string
  food_image?: string
  pickup_address: string
  pickup_time: string
  expiry_time: string
  latitude?: number
  longitude?: number
  status?: string
  created_at?: string
  unit?: DonationUnit
  quantity_number?: number
  total_quantity?: number
}

export interface CreateDonationInput {
  foodName: string
  foodType: string
  quantity: string
  pickupAddress: string
  pickupTime: string
  expiryTime: string
  description?: string
  category?: string
  vegType?: DonationVegType
  preferredPickupTime?: string
  specialInstructions?: string
  storageMethod?: string
  currentTemperature?: number
  latitude?: number
  longitude?: number
  imageFile: File
  unit?: DonationUnit
}

function extractArray<T>(payload: any): T[] {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.donations)) return payload.donations
  if (Array.isArray(payload?.data)) return payload.data
  return []
}

function getLocalDonations(): DonationRecord[] {
  try {
    const raw = localStorage.getItem('foodbridge_donations')
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveLocalDonations(items: DonationRecord[]) {
  try {
    localStorage.setItem('foodbridge_donations', JSON.stringify(items))
  } catch {}
}

function mergeDonations(serverItems: DonationRecord[], localItems: DonationRecord[]): DonationRecord[] {
  const map = new Map<string | number, DonationRecord>()
  for (const item of localItems) {
    if (item && item.id != null) map.set(String(item.id), item)
  }
  for (const item of serverItems) {
    if (item && item.id != null) map.set(String(item.id), item)
  }
  return Array.from(map.values())
}

export async function addDonation(input: CreateDonationInput): Promise<DonationRecord> {
  const formData = new FormData()
  formData.append('food_name', input.foodName)
  formData.append('food_type', input.foodType)
  formData.append('quantity', input.quantity)
  formData.append('pickup_address', input.pickupAddress)
  formData.append('pickup_time', input.pickupTime)
  formData.append('expiry_time', input.expiryTime)
  formData.append('description', input.description || '')
  if (input.category) formData.append('category', input.category)
  if (input.vegType) formData.append('veg_type', input.vegType)
  if (input.preferredPickupTime) formData.append('preferred_pickup_time', input.preferredPickupTime)
  if (input.specialInstructions) formData.append('special_instructions', input.specialInstructions)
  if (input.storageMethod) formData.append('storage_method', input.storageMethod)
  if (input.currentTemperature !== undefined) formData.append('current_temperature', String(input.currentTemperature))
  formData.append('unit', input.unit || 'meals')
  if (input.latitude !== undefined) formData.append('latitude', String(input.latitude))
  if (input.longitude !== undefined) formData.append('longitude', String(input.longitude))
  formData.append('food_image', input.imageFile)

  let created: DonationRecord | null = null
  try {
    const res = await api.post('/donations', formData)
    created = (res.data?.donation ?? res.data?.data ?? res.data) as DonationRecord
  } catch (err) {
    console.warn('[DonationService] Backend post fallback to local:', err)
  }

  if (!created || !created.id) {
    const rawUser = localStorage.getItem('user')
    const user = rawUser ? JSON.parse(rawUser) : null
    const qtyNum = parseFloat(input.quantity) || 10
    created = {
      id: Date.now(),
      donor_id: user?.id || 2,
      donor_name: user?.name || 'City Bakery & Cafe',
      donor_organization: user?.organization || user?.name || 'City Bakers Network',
      food_name: input.foodName,
      food_type: input.foodType,
      quantity: input.quantity,
      quantity_number: qtyNum,
      remaining_quantity: qtyNum,
      allocated_quantity: 0,
      pickup_address: input.pickupAddress,
      pickup_time: input.pickupTime,
      expiry_time: input.expiryTime,
      description: input.description || '',
      category: input.category || 'Veg',
      veg_type: input.vegType || 'veg',
      unit: input.unit || 'meals',
      latitude: input.latitude || 13.0827,
      longitude: input.longitude || 80.2707,
      status: 'Available',
      created_at: new Date().toISOString(),
    }
  }

  // Update local persistent store
  const localList = getLocalDonations()
  const updated = [created, ...localList.filter(d => String(d.id) !== String(created!.id))]
  saveLocalDonations(updated)

  // Real-time broadcast
  try {
    const s = getSocket()
    if (s) {
      s.emit('new_donation', created)
      s.emit('donation_created', created)
      s.emit('dashboard_updated', {})
      s.triggerLocal('new_donation', created)
      s.triggerLocal('donation_created', created)
      s.triggerLocal('dashboard_updated', {})
    }
  } catch {}

  return created
}

export async function getDonations(params?: {
  status?: string
  donor_id?: string | number
}): Promise<DonationRecord[]> {
  let serverItems: DonationRecord[] = []
  try {
    const res = await api.get('/donations', { params })
    serverItems = extractArray<DonationRecord>(res.data)
  } catch (err) {
    console.warn('[DonationService] getDonations fallback to local:', err)
  }

  const localItems = getLocalDonations()
  const merged = mergeDonations(serverItems, localItems)
  saveLocalDonations(merged)

  let result = merged
  if (params?.donor_id) {
    result = result.filter(d => String(d.donor_id) === String(params.donor_id))
  }
  if (params?.status && params.status !== 'all') {
    result = result.filter(d => (d.status || '').toLowerCase() === params.status!.toLowerCase())
  }
  return result
}

export async function getAvailableDonations(): Promise<DonationRecord[]> {
  let serverItems: DonationRecord[] = []
  try {
    const res = await api.get('/donations/available')
    serverItems = extractArray<DonationRecord>(res.data)
  } catch (err) {
    console.warn('[DonationService] getAvailableDonations fallback to local:', err)
  }

  const localItems = getLocalDonations()
  const merged = mergeDonations(serverItems, localItems)
  saveLocalDonations(merged)

  return merged.filter(d => (d.status || 'Available') === 'Available' || d.status === 'Partially Claimed')
}

export async function getDonationById(id: string | number): Promise<DonationRecord> {
  try {
    const res = await api.get(`/donations/${id}`)
    const item = (res.data?.donation ?? res.data?.data ?? res.data) as DonationRecord
    if (item && item.id) return item
  } catch {}

  const local = getLocalDonations().find(d => String(d.id) === String(id))
  if (local) return local
  throw new Error('Donation not found')
}

export async function updateDonation(
  id: string | number,
  updates: Partial<DonationRecord> & { imageFile?: File | null },
): Promise<DonationRecord> {
  const hasFile = Boolean(updates.imageFile)
  const payload = hasFile ? new FormData() : {}

  if (hasFile && payload instanceof FormData) {
    Object.entries(updates).forEach(([key, value]) => {
      if (key === 'imageFile') return
      if (value === undefined || value === null) return
      payload.append(key, value instanceof Date ? value.toISOString() : String(value))
    })
    payload.append('food_image', updates.imageFile as File)
  }

  let updated: DonationRecord | null = null
  try {
    const res = hasFile
      ? await api.put(`/donations/${id}`, payload)
      : await api.put(`/donations/${id}`, updates)
    updated = (res.data?.donation ?? res.data?.data ?? res.data) as DonationRecord
  } catch {}

  const localList = getLocalDonations()
  const current = localList.find(d => String(d.id) === String(id))
  const merged = { ...(current || {}), ...updates, id } as DonationRecord
  const nextList = localList.map(d => String(d.id) === String(id) ? merged : d)
  saveLocalDonations(nextList)

  try {
    const s = getSocket()
    if (s) {
      s.emit('dashboard_updated', {})
      s.triggerLocal('dashboard_updated', {})
    }
  } catch {}

  return updated || merged
}

export async function deleteDonation(id: string | number): Promise<void> {
  try {
    await api.delete(`/donations/${id}`)
  } catch {}

  const localList = getLocalDonations().filter(d => String(d.id) !== String(id))
  saveLocalDonations(localList)

  try {
    const s = getSocket()
    if (s) {
      s.emit('dashboard_updated', {})
      s.triggerLocal('dashboard_updated', {})
    }
  } catch {}
}

export type Donation = DonationRecord

export const donationService = {
  addDonation,
  getDonations,
  getAvailableDonations,
  getDonationById,
  updateDonation,
  deleteDonation,
}


