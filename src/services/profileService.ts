import api from '../lib/api'

export interface PublicProfile {
  id: number
  name: string
  organization?: string
  role: 'donor' | 'receiver' | 'admin'
  profile_image?: string
  business_type?: string
  general_location?: string
  verified: boolean
  status: string
  member_since: string
  successful_donations: number
  total_meals_donated: number
  active_donations_count: number
  successful_pickups: number
  active_needs_count: number
}

export const profileService = {
  async getPublicProfile(userId: number): Promise<PublicProfile> {
    const res = await api.get<any>(`/auth/users/${userId}/public-profile`)
    return (res.data && res.data.data) ? res.data.data : res.data
  }
}

