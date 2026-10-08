/**
 * FoodBridge Cloudflare Edge Real-Time Signaling & Event Socket Bridge
 * Implements Socket.IO-compatible event emitter for WebRTC Audio Calls & Live Chat.
 * Works 100% serverless on Cloudflare Workers edge backend.
 */

import { BASE_URL } from './api'

type EventHandler = (...args: any[]) => void

class EdgeSocket {
  public connected: boolean = true
  public id: string = 'edge-' + Math.random().toString(36).substring(2, 9)
  public auth: { token?: string } = {}
  private listeners: Map<string, Set<EventHandler>> = new Map()
  private pollingTimer: any = null
  private currentUserId: string | null = null
  private lastProcessedEventId: number = 0

  constructor() {
    this.startPolling()
  }

  public on(event: string, handler: EventHandler): this {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(handler)
    return this
  }

  public off(event: string, handler?: EventHandler): this {
    if (!handler) {
      this.listeners.delete(event)
    } else {
      this.listeners.get(event)?.delete(handler)
    }
    return this
  }

  public once(event: string, handler: EventHandler): this {
    const wrapper = (...args: any[]) => {
      this.off(event, wrapper)
      handler(...args)
    }
    return this.on(event, wrapper)
  }

  public triggerLocal(event: string, ...args: any[]) {
    const handlers = this.listeners.get(event)
    if (handlers) {
      handlers.forEach((fn) => {
        try {
          fn(...args)
        } catch (err) {
          console.error(`[EdgeSocket] Error in handler for ${event}:`, err)
        }
      })
    }
  }

  public emit(event: string, ...args: any[]): this {
    const payload = args[0] || {}

    // Special client-only events
    if (event === 'join') {
      if (payload.user_id) {
        this.currentUserId = String(payload.user_id)
      }
      return this
    }

    // Forward signaling events to Cloudflare Worker Edge
    const targetUrl = `${BASE_URL}/call/signal`
    fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: this.auth.token ? `Bearer ${this.auth.token}` : '',
      },
      body: JSON.stringify({
        event,
        payload,
        sender_id: this.currentUserId || payload.caller_id || payload.user_id || payload.sender_id,
        timestamp: Date.now(),
      }),
    }).catch((err) => {
      console.warn('[EdgeSocket] Failed to send signal:', err)
    })

    return this
  }

  public connect(): this {
    this.connected = true
    this.startPolling()
    setTimeout(() => this.triggerLocal('connect'), 50)
    return this
  }

  public disconnect(): this {
    this.connected = false
    if (this.pollingTimer) {
      clearInterval(this.pollingTimer)
      this.pollingTimer = null
    }
    this.triggerLocal('disconnect')
    return this
  }

  private startPolling() {
    if (this.pollingTimer) return

    this.pollingTimer = setInterval(async () => {
      if (!this.connected) return

      // Determine active user ID from token or localStorage
      if (!this.currentUserId) {
        try {
          const rawUser = localStorage.getItem('user')
          if (rawUser) {
            const u = JSON.parse(rawUser)
            if (u && u.id) this.currentUserId = String(u.id)
          }
        } catch {}
      }

      if (!this.currentUserId) return

      try {
        const token = localStorage.getItem('token') || this.auth.token || ''
        const url = `${BASE_URL}/call/signal?user_id=${this.currentUserId}&since=${this.lastProcessedEventId}`
        const res = await fetch(url, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })

        if (res.ok) {
          const data = await res.json()
          if (data && Array.isArray(data.events)) {
            for (const evt of data.events) {
              if (evt.id > this.lastProcessedEventId) {
                this.lastProcessedEventId = evt.id
                // Trigger event listeners
                this.triggerLocal(evt.event, evt.payload)

                // Normalize synonyms for incoming calls
                if (evt.event === 'call:initiate' || evt.event === 'call:incoming') {
                  this.triggerLocal('call:incoming', evt.payload)
                  this.triggerLocal('incoming_call', evt.payload)
                }
              }
            }
          }
        }
      } catch (err) {
        // Silent poll error handling
      }
    }, 900)
  }
}

let socketInstance: EdgeSocket | null = null

export function getSocket(): any {
  if (!socketInstance) {
    socketInstance = new EdgeSocket()
    const token = localStorage.getItem('token') ?? undefined
    socketInstance.auth = { token }
  }
  return socketInstance
}

export function connectSocket(userId: string | number): any {
  const s = getSocket()
  s.auth.token = localStorage.getItem('token') ?? undefined
  s.connect()
  s.emit('join', { user_id: String(userId) })
  return s
}

export function disconnectSocket(): void {
  if (socketInstance) {
    socketInstance.disconnect()
    socketInstance = null
  }
}

export type Socket = any
export default { getSocket, connectSocket, disconnectSocket }
