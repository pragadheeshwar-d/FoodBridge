/**
 * useNotifications — fetches from Flask REST API, updated via Socket.IO push.
 */
import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { getSocket } from '../lib/socket'
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  type NotificationRecord,
} from '../services/notificationService'

export const isNotificationRead = (n: NotificationRecord): boolean => {
  return Boolean(n.is_read || n.isRead)
}

export function useNotifications() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<NotificationRecord[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    if (!user?.id) {
      setNotifications([])
      setLoading(false)
      return
    }
    try {
      const items = await getNotifications()
      setNotifications(items)
    } catch (e) {
      console.error('useNotifications fetch error:', e)
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    fetch()

    const s = getSocket()

    // Server pushes a notification object directly
    const handlePush = (payload: any) => {
      if (!payload) return
      const incomingId = payload.id || Date.now()
      const isReadVal = Boolean(payload.is_read || payload.isRead)
      const newNotif: NotificationRecord = {
        id: incomingId,
        title: payload.title || 'Notification',
        message: payload.message || '',
        type: payload.type,
        is_read: isReadVal,
        isRead: isReadVal,
        link: payload.link,
        created_at: payload.created_at || new Date().toISOString(),
        createdAt: payload.created_at ? new Date(payload.created_at) : new Date(),
        userId: user?.id,
      }
      setNotifications((prev) => {
        if (prev.some((n) => String(n.id) === String(incomingId))) {
          return prev
        }
        return [newNotif, ...prev]
      })
    }

    const handleReadOne = (payload: any) => {
      if (!payload?.id) return
      setNotifications((prev) =>
        prev.map((n) =>
          String(n.id) === String(payload.id)
            ? { ...n, is_read: true, isRead: true }
            : n
        )
      )
    }

    const handleReadAll = () => {
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, is_read: true, isRead: true }))
      )
    }

    s.on('notification', handlePush)
    s.on('notification_created', handlePush)
    s.on('notification_read', handleReadOne)
    s.on('notifications_read_all', handleReadAll)

    return () => {
      s.off('notification', handlePush)
      s.off('notification_created', handlePush)
      s.off('notification_read', handleReadOne)
      s.off('notifications_read_all', handleReadAll)
    }
  }, [fetch, user?.id])

  const unreadCount = notifications.filter((n) => !isNotificationRead(n)).length

  const markAsRead = async (id: string | number) => {
    // Optimistically update local state immediately
    setNotifications((prev) =>
      prev.map((n) =>
        String(n.id) === String(id) ? { ...n, is_read: true, isRead: true } : n
      )
    )
    try {
      await markNotificationRead(id)
    } catch (e) {
      console.error('markAsRead error:', e)
    }
  }

  const markAllRead = async () => {
    // Optimistically update all notifications to read immediately
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, is_read: true, isRead: true }))
    )
    try {
      await markAllNotificationsRead()
    } catch (e) {
      console.error('markAllRead error:', e)
    }
  }

  const removeNotification = async (id: string | number) => {
    // Optimistically remove notification immediately
    setNotifications((prev) => prev.filter((n) => String(n.id) !== String(id)))
    try {
      await deleteNotification(id)
    } catch (e) {
      console.error('removeNotification error:', e)
    }
  }

  return { notifications, unreadCount, loading, markAsRead, markAllRead, removeNotification, refetch: fetch }
}
