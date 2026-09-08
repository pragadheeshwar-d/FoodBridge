import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, Heart, Sparkles, X, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { getSocket } from '../../lib/socket'

interface FoodReceivedEventPayload {
  event_id?: string
  transaction_id?: number | string
  donation_id?: number | string
  food_name: string
  quantity: string
  quantity_number?: number
  receiver_name?: string
  receiver_organization?: string
  received_at?: string
  message?: string
}

export function FoodReceivedCelebrationPopup() {
  const navigate = useNavigate()
  const [activePopup, setActivePopup] = useState<FoodReceivedEventPayload | null>(null)

  useEffect(() => {
    const socket = getSocket()
    if (!socket) return

    const handleFoodReceived = (payload: FoodReceivedEventPayload) => {
      if (!payload) return

      // Deduplicate using event key so page reloads don't show the same popup
      const dedupeKey = `fb_acknowledged_${payload.event_id || payload.transaction_id || payload.donation_id}`
      if (localStorage.getItem(dedupeKey)) {
        return
      }
      localStorage.setItem(dedupeKey, new Date().toISOString())

      setActivePopup(payload)
    }

    socket.on('food_received', handleFoodReceived)

    return () => {
      socket.off('food_received', handleFoodReceived)
    }
  }, [])

  // Auto-dismiss after 7 seconds
  useEffect(() => {
    if (!activePopup) return
    const timer = setTimeout(() => {
      setActivePopup(null)
    }, 7000)
    return () => clearTimeout(timer)
  }, [activePopup])

  if (!activePopup) return null

  const receiverDisplay =
    activePopup.receiver_organization || activePopup.receiver_name || 'Verified Receiver'

  return (
    <AnimatePresence>
      <div className="fixed bottom-6 right-6 z-50 max-w-md w-full px-4 sm:px-0">
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="relative rounded-3xl bg-white dark:bg-gray-900 border-2 border-emerald-500/40 shadow-elevated p-6 overflow-hidden text-text dark:text-white"
        >
          {/* Subtle warm decorative background aura */}
          <div className="absolute -top-12 -right-12 w-36 h-36 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-28 h-28 bg-amber-500/10 rounded-full blur-xl pointer-events-none" />

          {/* Dismiss button */}
          <button
            onClick={() => setActivePopup(null)}
            className="absolute top-4 right-4 p-1.5 rounded-full text-text-secondary hover:text-text hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Close acknowledgment"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Staggered Content Animation */}
          <div className="flex items-start gap-4">
            {/* Food Icon Badge */}
            <motion.div
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.15, type: 'spring', stiffness: 260, damping: 20 }}
              className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shrink-0 shadow-soft"
            >
              <span className="text-2xl">🍱</span>
            </motion.div>

            <div className="flex-1 pr-4">
              {/* Header Title */}
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-0.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Food Successfully Received!</span>
              </motion.div>

              {/* Food Name */}
              <motion.h4
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 }}
                className="text-lg font-black text-text dark:text-white leading-tight"
              >
                {activePopup.food_name}
              </motion.h4>

              {/* Receiver Info */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="text-xs text-text-secondary mt-1 flex items-center gap-1.5"
              >
                <span>Received by</span>
                <strong className="text-text dark:text-gray-200 font-semibold">{receiverDisplay}</strong>
              </motion.p>
            </div>
          </div>

          {/* Quantity & Heart Impact Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.75 }}
            className="mt-4 p-3 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/40 flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                {activePopup.quantity} reached destination
              </span>
            </div>
            <motion.div
              animate={{ scale: [1, 1.25, 1] }}
              transition={{ repeat: 2, duration: 0.6, delay: 0.9 }}
              className="text-red-500 flex items-center"
            >
              <Heart className="w-4 h-4 fill-red-500" />
            </motion.div>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="text-[11px] text-text-secondary mt-2.5 text-center font-medium"
          >
            Thank you for making a difference and reducing food waste!
          </motion.p>

          {/* Actions */}
          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between gap-3">
            <button
              onClick={() => {
                setActivePopup(null)
                navigate('/donor/donations')
              }}
              className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
            >
              <span>View Donation</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => setActivePopup(null)}
              className="text-xs text-text-secondary hover:text-text px-3 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              Dismiss
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
