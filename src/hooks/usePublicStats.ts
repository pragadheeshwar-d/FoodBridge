import { useCallback, useEffect, useState } from 'react'
import api from '../lib/api'
import { useRealtimeSync } from './useRealtimeSync'

export interface PublicPlatformStats {
  mealsSaved: number
  activeDonations: number
  dailyPeopleFed: number
  foodWastePrevented: number
  restaurantsConnected: number
  ngosConnected: number
  citiesCovered: number
  successfulDeliveries: number
  todaysDonations: number
  activeUsers: number
}

const EMPTY_STATS: PublicPlatformStats = {
  mealsSaved: 0,
  activeDonations: 0,
  dailyPeopleFed: 0,
  foodWastePrevented: 0,
  restaurantsConnected: 0,
  ngosConnected: 0,
  citiesCovered: 0,
  successfulDeliveries: 0,
  todaysDonations: 0,
  activeUsers: 0,
}

export function usePublicStats() {
  const [stats, setStats] = useState<PublicPlatformStats>(EMPTY_STATS)
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    try {
      const res = await api.get('/dashboard/public')
      const s = res.data.stats || {}
      setStats({
        mealsSaved: s.meals_saved ?? 0,
        activeDonations: s.active_donations ?? 0,
        dailyPeopleFed: s.daily_people_fed ?? 0,
        foodWastePrevented: s.food_waste_prevented ?? 0,
        restaurantsConnected: s.restaurants_connected ?? 0,
        ngosConnected: s.ngos_connected ?? 0,
        citiesCovered: s.cities_covered ?? 0,
        successfulDeliveries: s.successful_deliveries ?? 0,
        todaysDonations: s.todays_donations ?? 0,
        activeUsers: s.active_users ?? 0,
      })
    } catch (err) {
      console.error('usePublicStats fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetch()
  }, [fetch])

  useRealtimeSync([
    'new_donation',
    'pickup_requested',
    'pickup_approved',
    'pickup_rejected',
    'pickup_completed',
    'qr_verified',
    'dashboard_updated',
  ], fetch)

  return { stats, loading, refetch: fetch }
}
