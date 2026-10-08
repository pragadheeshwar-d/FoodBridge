import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Heart, Truck, Clock, MapPin } from 'lucide-react'
import { Button } from '../ui/Button'
import { useToast } from '../../context/ToastContext'
import { useNotificationPopup } from '../../context/NotificationPopupContext'
import { needService, type FoodNeed } from '../../services/needService'

interface RespondToNeedModalProps {
  need: FoodNeed | null
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function RespondToNeedModal({
  need,
  isOpen,
  onClose,
  onSuccess,
}: RespondToNeedModalProps) {
  const { toast } = useToast()
  const { showPopup } = useNotificationPopup()
  const neededQty = Math.max(1, Number(need?.remaining_quantity ?? need?.quantity_number ?? 1))
  const unit = need?.unit || 'servings'

  const [offeredQty, setOfferedQty] = useState<number>(neededQty)
  const [deliveryType, setDeliveryType] = useState<string>('Pickup by NGO')
  const [message, setMessage] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)

  if (!isOpen || !need) return null

  const handleOffer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (offeredQty <= 0) {
      toast('Please offer at least 1 portion.', 'error')
      return
    }
    if (offeredQty > neededQty) {
      toast(`You cannot offer more than the remaining need (${neededQty} ${unit}).`, 'error')
      return
    }

    setLoading(true)
    try {
      await needService.respondToNeed(need.id, {
        offered_quantity: offeredQty,
        delivery_type: deliveryType,
        message: message || `We can provide ${offeredQty} ${unit} for your requirement.`,
      })
      showPopup({
        title: 'Food Offer Sent',
        message: 'Food offer sent successfully! The receiver has been notified.',
        type: 'success',
        link: '/donor/needs',
        category: 'Food Offer',
      })
      onSuccess()
      onClose()
    } catch (err: any) {
      toast(err?.response?.data?.message || 'Failed to submit food offer', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
          className="relative w-full max-w-md glass-card p-6 overflow-hidden shadow-elevated border border-gray-200/80 dark:border-gray-800"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800">
            <div>
              <h3 className="text-base font-bold text-text dark:text-white flex items-center gap-2">
                <Heart className="w-4 h-4 text-primary fill-primary/20" />
                Respond to Food Need
              </h3>
              <p className="text-xs text-text-secondary mt-0.5">
                Offer food to help fulfill this NGO/community request.
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-text-secondary transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleOffer} className="mt-5 space-y-4">
            {/* Need Summary Card */}
            <div className="p-3.5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-500/20">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-blue-900 dark:text-blue-200">
                  {need.food_name || need.food_type}
                </p>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500 text-white">
                  {need.urgency} Urgency
                </span>
              </div>
              <p className="text-xs text-blue-800 dark:text-blue-300 mt-1">
                Needed: <strong>{need.required_quantity}</strong> • Remaining: <strong>{neededQty} {unit}</strong>
              </p>
              <p className="text-[11px] text-text-secondary mt-1 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-text-secondary" /> {need.location}
              </p>
            </div>

            {/* Quantity You Can Provide */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-text dark:text-white">
                  How many {unit} can you provide?
                </label>
                <button
                  type="button"
                  onClick={() => setOfferedQty(neededQty)}
                  className="text-[11px] font-bold text-primary hover:underline"
                >
                  Full amount ({neededQty})
                </button>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="1"
                  max={neededQty}
                  value={offeredQty}
                  onChange={(e) => setOfferedQty(Math.min(neededQty, Math.max(1, Number(e.target.value))))}
                  required
                  className="w-full px-4 py-2.5 rounded-xl bg-surface dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-sm font-bold text-text dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
                <span className="text-xs font-bold text-text-secondary px-3 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800">
                  {unit}
                </span>
              </div>
            </div>

            {/* Delivery / Pickup Option */}
            <div>
              <label className="block text-xs font-bold text-text dark:text-white mb-1.5">
                Fulfillment Logistics
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setDeliveryType('Pickup by NGO')}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    deliveryType === 'Pickup by NGO'
                      ? 'border-primary bg-primary/10 text-primary shadow-soft'
                      : 'border-gray-200 dark:border-gray-700 text-text-secondary hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  Pickup by NGO
                </button>
                <button
                  type="button"
                  onClick={() => setDeliveryType('Delivery by Donor')}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    deliveryType === 'Delivery by Donor'
                      ? 'border-primary bg-primary/10 text-primary shadow-soft'
                      : 'border-gray-200 dark:border-gray-700 text-text-secondary hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  <Truck className="w-3.5 h-3.5" />
                  Delivery by Me
                </button>
              </div>
            </div>

            {/* Message to Receiver */}
            <div>
              <label className="block text-xs font-bold text-text dark:text-white mb-1.5">
                Note to Receiver (Optional)
              </label>
              <textarea
                rows={2}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="e.g. Freshly prepared vegetarian meals available from 1:00 PM."
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-xs text-text dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <Button
                type="submit"
                variant="primary"
                className="flex-1 shadow-glow"
                loading={loading}
              >
                Send Offer ({offeredQty} {unit})
              </Button>
              <Button type="button" variant="secondary" onClick={onClose}>
                Cancel
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
