import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from './AuthContext'
import { getSocket } from '../lib/socket'
import api from '../lib/api'

export type PopupType = 'success' | 'info' | 'warning' | 'error'

export interface PopupNotification {
  id: string
  title?: string
  message: string
  type?: PopupType
  link?: string
  category?: string
  timestamp: number
}

interface NotificationPopupContextType {
  popups: PopupNotification[]
  showPopup: (popup: Omit<PopupNotification, 'id' | 'timestamp'> & { id?: string }) => void
  dismissPopup: (id: string) => void
}

const NotificationPopupContext = createContext<NotificationPopupContextType | undefined>(undefined)

export function NotificationPopupProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [popups, setPopups] = useState<PopupNotification[]>([])
  const seenIdsRef = useRef<Set<string>>(new Set())

  const dismissPopup = useCallback((id: string) => {
    setPopups((prev) => prev.filter((p) => p.id !== id))
  }, [])

  const showPopup = useCallback(
    (popup: Omit<PopupNotification, 'id' | 'timestamp'> & { id?: string }) => {
      const id = popup.id || `popup_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
      if (seenIdsRef.current.has(id)) return
      seenIdsRef.current.add(id)

      // Cap at 3 visible popups to avoid overwhelming the screen
      setPopups((prev) => {
        const next = [{ ...popup, id, timestamp: Date.now() }, ...prev]
        return next.slice(0, 3)
      })
    },
    []
  )

  // Listen for real-time Socket.IO events for the authenticated user
  useEffect(() => {
    if (!user?.id) return

    const s = getSocket()

    const handleNotification = (payload: any) => {
      if (!payload) return
      const id = String(payload.id || `sock_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`)
      if (seenIdsRef.current.has(id)) return

      const type: PopupType =
        payload.type === 'food_received' || payload.type === 'pickup_approved' || payload.type === 'success'
          ? 'success'
          : payload.type === 'pickup_rejected' || payload.type === 'warning'
            ? 'warning'
            : payload.type === 'error'
              ? 'error'
              : 'info'

      showPopup({
        id,
        title: payload.title || 'Notification',
        message: payload.message || '',
        type,
        link: payload.link,
        category: payload.type || 'Activity',
      })
    }

    const handleFoodReceived = (payload: any) => {
      if (!payload) return
      const id = String(payload.event_id || `food_rec_${payload.transaction_id || Date.now()}`)
      if (seenIdsRef.current.has(id)) return

      showPopup({
        id,
        title: 'Food Successfully Received!',
        message:
          payload.message ||
          'Food successfully received! Your donation has been collected by the receiver. Thank you for helping reduce food waste!',
        type: 'success',
        link: '/donor/donations',
        category: 'Food Collected',
      })
    }

    const handleAccountStatus = (payload: any) => {
      if (!payload) return
      const id = `status_${payload.status}_${Date.now()}`
      if (seenIdsRef.current.has(id)) return

      const isApproved = payload.status === 'approved'
      showPopup({
        id,
        title: isApproved ? 'Account Approved! 🎉' : 'Account Status Update',
        message:
          payload.message ||
          (isApproved
            ? 'Your account/request has been approved by the admin.'
            : 'Your request requires attention. Please check the latest status.'),
        type: isApproved ? 'success' : 'warning',
        link: isApproved ? (user.role === 'donor' ? '/donor' : '/receiver') : '/pending',
        category: 'Admin Approval',
      })
    }

    s.on('notification', handleNotification)
    s.on('notification_created', handleNotification)
    s.on('food_received', handleFoodReceived)
    s.on('account_status_changed', handleAccountStatus)

    // Fallback polling: Check recent unread notifications every 10s
    const pollInterval = setInterval(async () => {
      try {
        const res = await api.get('/notifications/', { params: { limit: 5 } })
        const items = Array.isArray(res.data) ? res.data : []
        const now = Date.now()

        for (const item of items) {
          const itemId = String(item.id)
          if (seenIdsRef.current.has(itemId)) continue

          // Only pop up if recent (within last 45 seconds) and unread
          const createdAt = item.created_at ? new Date(item.created_at).getTime() : 0
          if (!item.is_read && now - createdAt < 45000) {
            handleNotification(item)
          }
        }
      } catch (err) {
        // Silently ignore polling network errors
      }
    }, 10000)

    return () => {
      s.off('notification', handleNotification)
      s.off('notification_created', handleNotification)
      s.off('food_received', handleFoodReceived)
      s.off('account_status_changed', handleAccountStatus)
      clearInterval(pollInterval)
    }
  }, [user?.id, user?.role, showPopup])

  return (
    <NotificationPopupContext.Provider value={{ popups, showPopup, dismissPopup }}>
      {children}
    </NotificationPopupContext.Provider>
  )
}

export function useNotificationPopup() {
  const ctx = useContext(NotificationPopupContext)
  if (!ctx) {
    throw new Error('useNotificationPopup must be used within a NotificationPopupProvider')
  }
  return ctx
}
