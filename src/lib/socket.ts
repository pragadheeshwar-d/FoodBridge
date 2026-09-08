/**
 * Singleton Socket.IO client.
 * Connects with JWT auth so the server can join us to user_{id} room.
 */
import { io, type Socket } from 'socket.io-client'
import { BASE_URL } from './api'

let socket: Socket | null = null

export function getSocket(): Socket {
  if (!socket) {
    const token = localStorage.getItem('token') ?? undefined
    const socketBaseUrl = BASE_URL || window.location.origin
    const transports = import.meta.env.DEV ? ['polling'] : ['websocket', 'polling']
    socket = io(socketBaseUrl, {
      auth: { token },
      transports,
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    })

    socket.on('connect_error', (err) => {
      console.warn('[Socket] connect error:', err.message)
    })
  }
  return socket
}

export function connectSocket(userId: string | number): Socket {
  const s = getSocket()
  if (!s.connected) {
    // Refresh token before connecting (in case it was set after getSocket)
    const token = localStorage.getItem('token') ?? undefined
    ;(s as any).auth = { token }
    s.connect()
  }
  s.once('connect', () => {
    s.emit('join', { user_id: String(userId) })
  })
  // Also emit join immediately if already connected
  if (s.connected) {
    s.emit('join', { user_id: String(userId) })
  }
  return s
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}

export { type Socket }
export default { getSocket, connectSocket, disconnectSocket }
