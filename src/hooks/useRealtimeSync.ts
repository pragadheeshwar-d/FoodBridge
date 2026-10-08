import { useEffect } from 'react'
import { getSocket } from '../lib/socket'

export function useRealtimeSync(
  eventNames: string[],
  handler: () => void | Promise<void>,
  enabled = true,
) {
  const eventKey = eventNames.join('|')

  useEffect(() => {
    if (!enabled || eventNames.length === 0) return
    const socket = getSocket()
    const wrapped = () => {
      void handler()
    }

    eventNames.forEach((eventName) => socket.on(eventName, wrapped))

    return () => {
      eventNames.forEach((eventName) => socket.off(eventName, wrapped))
    }
  }, [enabled, eventKey, handler])
}
