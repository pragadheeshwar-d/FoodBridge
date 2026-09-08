import { useCallback, useEffect, useState } from 'react'
import api, { BASE_URL } from '../lib/api'
import { formatBackendTime, parseBackendDate } from '../lib/date'
import { useAuth } from '../context/AuthContext'
import { useRealtimeSync } from './useRealtimeSync'

export interface ReceiverStats {
  availableDonations: number
  activeRequests: number
  todayPickups: number
  totalMealsReceived: number
  mealsReceivedThisMonth: number
  totalKgPrevented: number
  co2Reduced: number
  totalPickups: number
  acceptanceRate: number
}

export interface PickupRequest {
  id: string
  donationId: string
  donorId?: string
  donor_id?: number | string
  donorName: string
  foodType: string
  quantity: number | string
  unit: string
  pickupTime: string
  status: 'pending' | 'accepted' | 'completed' | 'declined' | 'Pending' | 'Approved' | 'Rejected' | 'Completed'
  createdAt: Date
  pickupAddress: string
  requestMessage?: string
  qr_status?: string
  requestedQuantity?: number
  allocatedQuantity?: number
  pendingQuantity?: number
  allocationStatus?: 'WAITING' | 'PARTIALLY_ALLOCATED' | 'FULLY_ALLOCATED'
}

export interface AvailableDonation {
  id: string
  food: string
  restaurant: string
  image: string
  type: 'veg' | 'nonveg'
  meals: number
  pickupTime: string
  distance: string
  status: 'available' | 'pending' | 'claimed'
  timeLeft?: string
  expiryTime?: string
  donorId?: string
  donorName?: string
  donorOrganization?: string
  pickupAddress?: string
  latitude?: number
  longitude?: number
  hygieneStatus?: string
}

function normalizeDonationImageUrl(image?: string | null) {
  if (!image) return 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&h=300&fit=crop'
  if (image.startsWith('http://') || image.startsWith('https://')) return image
  const path = image.startsWith('/') ? image : `/${image}`
  if (path.startsWith('/api/')) return `${BASE_URL}${path}`
  if (path.startsWith('/uploads/')) return `${BASE_URL}/api/donations${path}`
  return `${BASE_URL}${path}`
}

const EMPTY_STATS: ReceiverStats = {
  availableDonations: 0,
  activeRequests: 0,
  todayPickups: 0,
  totalMealsReceived: 0,
  mealsReceivedThisMonth: 0,
  totalKgPrevented: 0,
  co2Reduced: 0,
  totalPickups: 0,
  acceptanceRate: 0,
}

export function useReceiverStats() {
  const { user } = useAuth()
  const [stats, setStats] = useState<ReceiverStats>(EMPTY_STATS)
  const [loading, setLoading] = useState(true)

  const fetchStats = useCallback(async () => {
    if (!user?.id) {
      setLoading(false)
      return
    }

    try {
      const res = await api.get('/dashboard/receiver')
      const s = res.data.stats || {}
      setStats({
        availableDonations: s.available_donations ?? 0,
        activeRequests: s.active_requests ?? 0,
        todayPickups: s.todays_pickups ?? 0,
        totalMealsReceived: s.meals_received ?? 0,
        mealsReceivedThisMonth: s.meals_received_month ?? 0,
        totalKgPrevented: s.food_waste_prevented ?? 0,
        co2Reduced: s.carbon_reduced ?? 0,
        totalPickups: s.total_pickups ?? 0,
        acceptanceRate: s.acceptance_rate ?? 0,
      })
    } catch (error) {
      console.error('useReceiverStats fetch error:', error)
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    void fetchStats()
  }, [fetchStats])

  useRealtimeSync([
    'new_donation',
    'pickup_requested',
    'pickup_approved',
    'pickup_rejected',
    'pickup_completed',
    'qr_generated',
    'qr_verified',
    'dashboard_updated',
  ], fetchStats, Boolean(user?.id))

  return { stats, loading, refetch: fetchStats }
}

export function useReceiverRequests() {
  const { user } = useAuth()
  const [requests, setRequests] = useState<PickupRequest[]>([])
  const [loading, setLoading] = useState(true)

  const fetchRequests = useCallback(async () => {
    if (!user?.id) {
      setLoading(false)
      return
    }

    try {
      const res = await api.get('/pickup-requests')
      const items: PickupRequest[] = (res.data.pickup_requests ?? []).map((pr: any) => {
        const donation = pr.donation || {}
        const rawDonorId = pr.donor_id ?? donation.donor_id ?? pr.donation?.donor_id
        return {
          id: String(pr.id),
          donationId: String(pr.donation_id),
          donorId: rawDonorId != null ? String(rawDonorId) : undefined,
          donor_id: rawDonorId != null ? Number(rawDonorId) : undefined,
          donorName: pr.donor_name || pr.donor_organization || donation.donor_name || 'Unknown Donor',
          foodType: pr.food_type || donation.food_name || 'Food',
          quantity: pr.quantity || donation.quantity || 0,
          unit: donation.unit || 'meals',
          pickupTime: formatBackendTime(pr.pickup_time || donation.pickup_time),
          status: pr.status || 'Pending',
          createdAt: parseBackendDate(pr.requested_at) || new Date(),
          pickupAddress: pr.pickup_address || donation.pickup_address || '—',
          requestMessage: pr.request_message || '',
          qr_status: pr.qr_status || donation.qr_status || '',
          requestedQuantity: pr.requested_quantity ?? Number(pr.quantity || donation.quantity || 0),
          allocatedQuantity: pr.allocated_quantity ?? 0,
          pendingQuantity: pr.pending_quantity ?? 0,
          allocationStatus: pr.allocation_status || 'WAITING',
        }
      })
      setRequests(items)
    } catch (error) {
      console.error('useReceiverRequests fetch error:', error)
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    void fetchRequests()
  }, [fetchRequests])

  useRealtimeSync([
    'pickup_requested',
    'pickup_approved',
    'pickup_rejected',
    'pickup_completed',
    'qr_generated',
    'qr_verified',
    'message_received',
    'dashboard_updated',
  ], fetchRequests, Boolean(user?.id))

  return { requests, loading, refetch: fetchRequests }
}

export function useAvailableDonations() {
  const [donations, setDonations] = useState<AvailableDonation[]>([])
  const [loading, setLoading] = useState(true)

  const fetchDonations = useCallback(async () => {
    try {
      const res = await api.get('/donations/available')
      const now = Date.now()
      const items: AvailableDonation[] = (res.data.donations ?? []).map((d: any) => {
        const expiry = parseBackendDate(d.expiry_time)
        const timeLeftMs = expiry ? expiry.getTime() - now : 0
        const timeLeftMins = Math.max(0, Math.round(timeLeftMs / 60000))
        const timeLeft = timeLeftMins > 60
          ? `${Math.round(timeLeftMins / 60)}h left`
          : `${timeLeftMins}m left`

        return {
          id: String(d.id),
          food: d.food_name || d.food_type || 'Food Donation',
          restaurant: d.donor_organization || d.donor_name || 'Unknown Donor',
          image: normalizeDonationImageUrl(d.food_image || d.image),
          type: d.food_type?.toLowerCase().includes('veg') && !d.food_type?.toLowerCase().includes('non') ? 'veg' : 'nonveg',
          meals: d.unit === 'kg'
            ? Math.round((d.quantity_number || 0) * 2)
            : (d.quantity_number || Number(d.quantity) || 0),
          pickupTime: formatBackendTime(d.pickup_time) || 'Contact donor',
          distance: '—',
          status: 'available' as const,
          timeLeft,
          expiryTime: expiry
            ? expiry.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
            : '—',
          donorId: String(d.donor_id),
          donorName: d.donor_name,
          donorOrganization: d.donor_organization,
          pickupAddress: d.pickup_address,
          latitude: d.latitude,
          longitude: d.longitude,
          hygieneStatus: 'Verified',
        }
      })
      setDonations(items)
    } catch (error) {
      console.error('useAvailableDonations fetch error:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchDonations()
  }, [fetchDonations])

  useRealtimeSync([
    'new_donation',
    'pickup_requested',
    'pickup_approved',
    'pickup_rejected',
    'pickup_completed',
    'qr_generated',
    'qr_verified',
    'dashboard_updated',
  ], fetchDonations)

  return { donations, loading, refetch: fetchDonations }
}
