/**
 * AuthContext backed by the Flask JWT API.
 */
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import api from '../lib/api'
import { connectSocket, disconnectSocket } from '../lib/socket'

export type UserRole = 'donor' | 'receiver' | 'admin' | 'super_admin'

export interface AuthUser {
  id: string
  name: string
  email: string
  role: UserRole
  organization?: string
  status: 'pending' | 'approved' | 'rejected' | 'suspended'
  phone?: string
  address?: string
  avatarUrl?: string
  verified?: boolean
  createdAt?: string
  businessType?: string
  verificationId?: string
  operatingHours?: string
  phoneVerified?: boolean
  orgVerificationStatus?: string
}

interface RegisterInput {
  name: string
  organization?: string
  email: string
  password: string
  role: UserRole
  phone?: string
  address?: string
  businessType?: string
  operatingHours?: string
  organizationType?: string
}

interface LoginInput {
  email: string
  password: string
  role?: UserRole
}

interface AuthContextType {
  user: AuthUser | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (input: LoginInput) => Promise<AuthUser>
  register: (input: RegisterInput) => Promise<AuthUser>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

function mapUser(raw: Record<string, any>): AuthUser {
  return {
    id: String(raw.id),
    name: raw.name ?? '',
    email: raw.email ?? '',
    role: raw.role as UserRole,
    organization: raw.organization ?? undefined,
    status: (raw.status ?? 'pending') as AuthUser['status'],
    phone: raw.phone ?? undefined,
    address: raw.address ?? undefined,
    avatarUrl: raw.profile_image ?? undefined,
    verified: raw.verified ?? false,
    createdAt: raw.created_at ?? undefined,
    businessType: raw.business_type ?? undefined,
    verificationId: raw.verification_id ?? undefined,
    operatingHours: raw.operating_hours ?? undefined,
    phoneVerified: raw.phone_verified ?? false,
    orgVerificationStatus: raw.org_verification_status ?? undefined,
  }
}

function clearSession() {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!user?.id) {
      disconnectSocket()
      return
    }
    connectSocket(user.id)
    return () => {
      disconnectSocket()
    }
  }, [user?.id])

  useEffect(() => {
    const bootstrap = async () => {
      const token = localStorage.getItem('token')
      if (!token) {
        setIsLoading(false)
        return
      }

      try {
        const res = await api.get('/auth/check')
        const rawUser = res.data.user
        const authUser = mapUser(rawUser)
        setUser(authUser)
        localStorage.setItem('user', JSON.stringify(rawUser))
      } catch {
        clearSession()
      } finally {
        setIsLoading(false)
      }
    }

    void bootstrap()
  }, [])

  const refreshUser = async () => {
    try {
      const res = await api.get('/auth/profile')
      const rawUser = res.data.user
      const updated = mapUser(rawUser)
      setUser(updated)
      localStorage.setItem('user', JSON.stringify(rawUser))
    } catch {
      // The Axios interceptor already handles auth expiry.
    }
  }

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoading,

      login: async ({ email, password, role }) => {
        const res = await api.post('/auth/login', { email, password, role })
        const { token, user: rawUser } = res.data

        localStorage.setItem('token', token)
        localStorage.setItem('user', JSON.stringify(rawUser))

        const authUser = mapUser(rawUser)
        setUser(authUser)
        return authUser
      },

      register: async (input) => {
        const payload = {
          name: input.name,
          email: input.email,
          password: input.password,
          role: input.role,
          organization: input.organization,
          phone: input.phone,
          address: input.address,
          businessType: input.businessType,
          operatingHours: input.operatingHours,
          organizationType: input.organizationType,
        }
        
        const res = await api.post('/auth/register', payload)
        const { token, user: rawUser } = res.data
        if (token) {
          localStorage.setItem('token', token)
          localStorage.setItem('user', JSON.stringify(rawUser))
          const authUser = mapUser(rawUser)
          setUser(authUser)
          return authUser
        }
        return mapUser(rawUser)
      },

      logout: async () => {
        try {
          await api.post('/auth/logout')
        } catch {
          // Logout should still clear the local session even if the server call fails.
        } finally {
          clearSession()
          setUser(null)
          window.location.replace('/')
        }
      },

      refreshUser,
    }),
    [isLoading, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
