import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, X, AlertCircle } from 'lucide-react'
import { Button } from '../ui/Button'

interface ConfirmReceiptModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => Promise<void> | void
  loading?: boolean
  foodName: string
  quantity: string | number
  unit?: string
  donorName?: string
  donorOrganization?: string
}

export function ConfirmReceiptModal({
  isOpen,
  onClose,
  onConfirm,
  loading = false,
  foodName,
  quantity,
  unit = 'servings',
  donorName,
  donorOrganization,
}: ConfirmReceiptModalProps) {
  if (!isOpen) return null

  const displayQuantity = typeof quantity === 'string' && quantity.includes(' ')
    ? quantity
    : `${quantity} ${unit}`

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          className="relative w-full max-w-md rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-2xl overflow-hidden p-6 text-text dark:text-white"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            disabled={loading}
            className="absolute top-4 right-4 p-2 rounded-full text-text-secondary hover:text-text hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Icon Header */}
          <div className="flex flex-col items-center text-center mb-5">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-extrabold tracking-tight">Confirm Food Received?</h3>
            <p className="text-xs text-text-secondary mt-1">
              Please confirm that you have physically received this food delivery.
            </p>
          </div>

          {/* Delivery Details Card */}
          <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700/60 mb-5 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-text-secondary font-medium">Food Item:</span>
              <span className="font-bold text-base text-text dark:text-white flex items-center gap-1.5">
                🍱 {foodName}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-text-secondary font-medium">Quantity:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                {displayQuantity}
              </span>
            </div>
            {(donorOrganization || donorName) && (
              <div className="flex items-center justify-between text-sm pt-2 border-t border-gray-200/50 dark:border-gray-700/50">
                <span className="text-text-secondary font-medium">Donor:</span>
                <span className="font-medium text-xs text-text dark:text-gray-200">
                  {donorOrganization || donorName}
                </span>
              </div>
            )}
          </div>

          {/* Information Note */}
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-800/40 text-xs text-blue-800 dark:text-blue-300 mb-6">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              Once confirmed, the transaction will be completed and the donor will receive an immediate real-time acknowledgment popup.
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              disabled={loading}
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white shadow-soft"
              loading={loading}
              onClick={onConfirm}
            >
              Yes, Food Received
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
