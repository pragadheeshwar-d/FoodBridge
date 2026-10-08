import api from '../lib/api'

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

  const res = await api.post('/donations', formData)
  return res.data.donation as DonationRecord
}

export async function getDonations(params?: {
  status?: string
  donor_id?: string | number
}): Promise<DonationRecord[]> {
  const res = await api.get('/donations', { params })
  return res.data.donations ?? res.data ?? []
}

export async function getAvailableDonations(): Promise<DonationRecord[]> {
  const res = await api.get('/donations/available')
  return res.data.donations ?? res.data ?? []
}

export async function getDonationById(id: string | number): Promise<DonationRecord> {
  const res = await api.get(`/donations/${id}`)
  return res.data.donation as DonationRecord
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

  const res = hasFile
    ? await api.put(`/donations/${id}`, payload)
    : await api.put(`/donations/${id}`, updates)

  return res.data.donation as DonationRecord
}

export async function deleteDonation(id: string | number): Promise<void> {
  await api.delete(`/donations/${id}`)
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

