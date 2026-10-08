/**
 * Central Axios instance for all Flask REST API calls.
 * Automatically attaches the JWT token from localStorage
 * and handles 401 (expired token) globally.
 */
import axios from 'axios'

const DEFAULT_API_URL = ''

export const BASE_URL = ((import.meta.env?.VITE_API_URL as string) || DEFAULT_API_URL).replace(/\/+$/, '')

const api = axios.create({
  baseURL: BASE_URL ? `${BASE_URL}/api` : '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 60_000,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  if (config.data instanceof FormData && config.headers) {
    delete (config.headers as Record<string, unknown>)['Content-Type']
    delete (config.headers as Record<string, unknown>)['content-type']
  }
  return config
})

function getLoginPathForStoredRole(): string {
  const rawUser = localStorage.getItem('user')
  if (!rawUser) return '/auth/login/donor'

  try {
    const parsed = JSON.parse(rawUser) as { role?: string }
    if (parsed.role === 'receiver') return '/auth/login/receiver'
    return '/auth/login/donor'
  } catch {
    return '/auth/login/donor'
  }
}

api.interceptors.response.use(
  (res) => {
    const payload = res.data
    if (
      payload &&
      typeof payload === 'object' &&
      'success' in payload &&
      (payload as { success?: boolean }).success !== false
    ) {
      const rawData = (payload as { data?: unknown }).data !== undefined ? (payload as { data?: unknown }).data : payload

      if (Array.isArray(rawData)) {
        const arr = rawData as any
        arr.data = rawData
        arr.donations = (payload as any).donations || rawData
        arr.pickup_requests = (payload as any).pickup_requests || (payload as any).requests || rawData
        arr.needs = (payload as any).needs || rawData
        arr.users = (payload as any).users || rawData
        arr.conversations = (payload as any).conversations || rawData
        arr.messages = (payload as any).messages || rawData
        arr.events = (payload as any).events || rawData
        arr.notifications = (payload as any).notifications || rawData
        res.data = arr
      } else if (rawData && typeof rawData === 'object') {
        const obj = { ...(payload as object), ...(rawData as object) } as any
        obj.data = rawData
        obj.stats = (rawData as any).stats || (payload as any).stats || ((rawData as any).total_donations !== undefined ? rawData : undefined) || (payload as any).overview || rawData
        obj.donation = (rawData as any).donation || (payload as any).donation || rawData
        obj.pickup_request = (rawData as any).pickup_request || (payload as any).pickup_request || rawData
        obj.user = (rawData as any).user || (payload as any).user || ((rawData as any).email ? rawData : undefined)
        obj.token = (rawData as any).token || (payload as any).token
        res.data = obj
      } else {
        res.data = rawData
      }
    }
    return res
  },
  (err) => {
    if (err.response?.status === 401) {
      // Token expired or invalid. Clear storage and send users back to their portal.
      const redirectPath = getLoginPathForStoredRole()
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      if (!window.location.pathname.startsWith('/auth')) {
        window.location.href = redirectPath
      }
    }
    return Promise.reject(err)
  },
)

export default api
