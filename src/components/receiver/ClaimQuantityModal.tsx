import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Utensils, CheckCircle2 } from 'lucide-react'
import { Button } from '../ui/Button'
import { useToast } from '../../context/ToastContext'
import { useNotificationPopup } from '../../context/NotificationPopupContext'
import { pickupRequestService } from '../../services/pickupRequestService'

interface ClaimQuantityModalProps {
  donation: any | null
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function ClaimQuantityModal({
  donation,
  isOpen,
  onClose,
  onSuccess,
}: ClaimQuantityModalProps) {
  const { toast } = useToast()
  const { showPopup } = useNotificationPopup()
  const availableQty = Math.max(1, Number(donation?.remaining_quantity ?? donation?.quantity_number ?? 1))
  const unit = donation?.unit || 'servings'

  const [quantity, setQuantity] = useState<number>(availableQty)
  const [message, setMessage] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)

  if (!isOpen || !donation) return null

  const handleClaim = async (e: React.FormEvent) => {
    e.preventDefault()
    if (quantity <= 0) {
      toast('Please request at least 1 portion.', 'error')
      return
    }
    if (quantity > availableQty) {
      toast(`Cannot request more than the available ${availableQty} ${unit}.`, 'error')
      return
    }

    setLoading(true)
    try {
      await pickupRequestService.createPickupRequest({
        donation_id: donation.id,
        requested_quantity: quantity,
        request_message: message || `Requesting ${quantity} ${unit} for our community distribution.`,
      })
      showPopup({
        title: 'Food Request Sent',
        message: 'Food request sent successfully! The donor will be notified.',
        type: 'success',
        link: '/receiver/requests',
        category: 'Food Request',
      })
      onSuccess()
      onClose()
    } catch (err: any) {
      toast(err?.response?.data?.message || 'Could not submit pickup request', 'error')
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
                <Utensils className="w-4 h-4 text-primary" />
                Request Food Donation
              </h3>
              <p className="text-xs text-text-secondary mt-0.5">
                Specify only the quantity needed for your community.
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-text-secondary transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleClaim} className="mt-5 space-y-4">
            {/* Donation Summary Card */}
            <div className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-500/20">
              <p className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                {donation.food_name}
              </p>
              <div className="flex items-center justify-between mt-1 text-xs text-emerald-800 dark:text-emerald-300">
                <span>Available Total:</span>
                <span className="font-bold">{availableQty} {unit}</span>
              </div>
              <p className="text-[11px] text-text-secondary mt-1">
                Donated by: <strong>{donation.donor_name || donation.donor_organization || 'Verified Donor'}</strong>
              </p>
            </div>

            {/* Requested Quantity Selector */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-text dark:text-white">
                  How many {unit} do you need?
                </label>
                <button
                  type="button"
                  onClick={() => setQuantity(availableQty)}
                  className="text-[11px] font-bold text-primary hover:underline"
                >
                  Take all ({availableQty})
                </button>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="1"
                  max={availableQty}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.min(availableQty, Math.max(1, Number(e.target.value))))}
                  required
                  className="w-full px-4 py-2.5 rounded-xl bg-surface dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-sm font-bold text-text dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
                <span className="text-xs font-bold text-text-secondary px-3 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800">
                  {unit}
                </span>
              </div>

              {quantity < availableQty && (
                <p className="text-[11px] text-primary mt-1.5 flex items-center gap-1 font-medium">
                  <CheckCircle2 className="w-3 h-3" />
                  Remaining {availableQty - quantity} {unit} will stay open for other receivers.
                </p>
              )}
            </div>

            {/* Message to Donor */}
            <div>
              <label className="block text-xs font-bold text-text dark:text-white mb-1.5">
                Message / Pickup Time Arrangement
              </label>
              <textarea
                rows={2}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="e.g. Can arrange volunteer pickup today by 6:30 PM."
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
                Request {quantity} {unit}
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
