import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  MapPin,
  Clock,
  Building2,
  MessageSquare,
  UtensilsCrossed,
} from 'lucide-react'
import { Button } from '../ui/Button'
import type { FoodNeed } from '../../services/needService'

interface ViewFoodNeedModalProps {
  need: FoodNeed | null
  isOpen: boolean
  onClose: () => void
  onOfferFood: (need: FoodNeed) => void
}

export function ViewFoodNeedModal({
  need,
  isOpen,
  onClose,
  onOfferFood,
}: ViewFoodNeedModalProps) {
  if (!isOpen || !need) return null

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case 'Critical':
        return 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300 border-red-200 dark:border-red-800'
      case 'High':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800'
      case 'Medium':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-800'
      default:
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
    }
  }

  const formatRequiredTime = (dateStr?: string) => {
    if (!dateStr) return 'Needed today'
    try {
      const d = new Date(dateStr)
      return d.toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return dateStr
    }
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-2xl overflow-hidden p-6 text-text dark:text-white"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full text-text-secondary hover:text-text hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="flex items-start gap-4 mb-5">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center text-2xl shrink-0">
              🍽️
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${getUrgencyBadge(need.urgency)}`}>
                  {need.urgency} Priority
                </span>
                <span className="text-[11px] font-semibold text-text-secondary">
                  Status: {need.status}
                </span>
              </div>
              <h3 className="text-xl font-extrabold tracking-tight">
                {need.food_name || need.food_type}
              </h3>
              <p className="text-xs text-text-secondary flex items-center gap-1.5 mt-0.5">
                <Building2 className="w-3.5 h-3.5 text-primary" />
                <span className="font-semibold text-text dark:text-gray-200">
                  {need.receiver_organization || need.receiver_name}
                </span>
              </p>
            </div>
          </div>

          {/* Key requirement stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
            <div className="p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/60">
              <span className="text-[10px] uppercase font-bold text-text-secondary">Required</span>
              <p className="text-base font-bold text-text dark:text-white mt-0.5">
                {need.quantity_number} {need.unit}
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-800/40">
              <span className="text-[10px] uppercase font-bold text-emerald-800 dark:text-emerald-300">Remaining</span>
              <p className="text-base font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                {need.remaining_quantity} {need.unit}
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/60 col-span-2 sm:col-span-1">
              <span className="text-[10px] uppercase font-bold text-text-secondary">Food Category</span>
              <p className="text-xs font-semibold text-text dark:text-white mt-1 truncate">
                {need.food_type}
              </p>
            </div>
          </div>

          {/* Location & Time info */}
          <div className="space-y-3 p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-700/60 text-xs mb-5">
            <div className="flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <div>
                <strong className="text-text dark:text-white">Delivery Location:</strong>
                <p className="text-text-secondary mt-0.5 leading-relaxed">{need.location}</p>
                {need.latitude && need.longitude && (
                  <p className="text-[10px] text-text-secondary/80 font-mono mt-0.5">
                    Coordinates: {need.latitude.toFixed(4)}, {need.longitude.toFixed(4)}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2.5 pt-2 border-t border-gray-200/40 dark:border-gray-700/40">
              <Clock className="w-4 h-4 text-primary shrink-0" />
              <div>
                <strong className="text-text dark:text-white">Needed by: </strong>
                <span className="text-text-secondary font-medium">{formatRequiredTime(need.required_time)}</span>
              </div>
            </div>

            {need.additional_notes && (
              <div className="pt-2 border-t border-gray-200/40 dark:border-gray-700/40">
                <strong className="text-text dark:text-white">Dietary & Distribution Notes:</strong>
                <p className="text-text-secondary mt-1 italic">"{need.additional_notes}"</p>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3 pt-2 border-t border-gray-100 dark:border-gray-800">
            <Button
              variant="primary"
              className="flex-1 shadow-soft"
              icon={UtensilsCrossed}
              onClick={() => {
                onClose()
                onOfferFood(need)
              }}
            >
              Offer Food
            </Button>

            <Button
              variant="secondary"
              className="flex-1"
              icon={MessageSquare}
              onClick={() => {
                onClose()
                window.location.href = `/donor/messages?partnerId=${need.receiver_id}&needId=${need.id}`
              }}
            >
              Chat with Receiver
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
