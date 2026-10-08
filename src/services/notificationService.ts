/**
 * Notification service — all calls go to Flask REST API.
 */
import api from '../lib/api'

export interface NotificationRecord {
  id: string | number
  user_id?: number
  userId?: string    // alias for legacy UI code
  title: string
  message: string
  type?: string
  is_read: boolean
  isRead?: boolean   // alias for legacy UI code
  link?: string
  created_at?: string
  createdAt?: Date   // alias for legacy UI code
}

export async function getNotifications(limit = 50): Promise<NotificationRecord[]> {
  try {
    const res = await api.get('/notifications/', { params: { limit } })
    const list = Array.isArray(res.data) ? res.data : (res.data?.data || res.data?.notifications || [])
    return list.map((n: any) => ({
      ...n,
      isRead: Boolean(n.is_read || n.isRead),
      createdAt: n.created_at ? new Date(n.created_at) : new Date(),
      userId: String(n.user_id || n.userId || ''),
    }))
  } catch {
    return []
  }
}

export async function getUnreadCount(): Promise<number> {
  try {
    const res = await api.get('/notifications/unread-count')
    return Number(res.data?.count ?? res.data?.unread_count ?? (typeof res.data === 'number' ? res.data : 0))
  } catch {
    return 0
  }
}

export async function markNotificationRead(id: string | number): Promise<void> {
  try {
    await api.put(`/notifications/${id}/read`)
  } catch {}
}

export async function markAllNotificationsRead(): Promise<void> {
  try {
    await api.put('/notifications/read-all')
  } catch {}
}

export async function deleteNotification(id: string | number): Promise<void> {
  try {
    await api.delete(`/notifications/${id}`)
  } catch {}
}

/** Legacy compat: listenToNotifications used by useNotifications hook */
export function listenToNotifications(
  _userId: string,
  onChange: (notifications: NotificationRecord[]) => void
): () => void {
  let cancelled = false

  const fetch = async () => {
    try {
      const notifs = await getNotifications()
      if (!cancelled) onChange(notifs)
    } catch {
      // silently ignore
    }
  }

  fetch()
  // Poll every 15 seconds as a fallback (Socket.IO push is primary)
  const interval = setInterval(fetch, 15_000)
  return () => {
    cancelled = true
    clearInterval(interval)
  }
}
