import { motion, AnimatePresence } from 'framer-motion'
import { Heart, Sparkles, X, ArrowRight } from 'lucide-react'
import { Button } from '../ui/Button'

interface DonorAcknowledgmentModalProps {
  isOpen: boolean
  onClose: () => void
  foodName: string
  receiverName: string
  mealsCount: number | string
}

export function DonorAcknowledgmentModal({
  isOpen,
  onClose,
  foodName,
  receiverName,
  mealsCount,
}: DonorAcknowledgmentModalProps) {
  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
          className="relative w-full max-w-md glass-card p-8 text-center overflow-hidden shadow-elevated border border-primary/20 bg-gradient-to-b from-surface via-emerald-50/20 to-surface dark:from-gray-900 dark:via-gray-900/90 dark:to-gray-950"
        >
          {/* Subtle sparkles background */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-accent/10 rounded-full blur-2xl pointer-events-none" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-text-secondary"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Floating animated heart badge */}
          <div className="relative w-20 h-20 mx-auto mb-5 flex items-center justify-center">
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
              className="absolute inset-0 rounded-3xl bg-primary/20 blur-md"
            />
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary-light text-white flex items-center justify-center shadow-glow text-3xl">
              ❤️
            </div>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 8, ease: 'linear' }}
              className="absolute -top-1 -right-1 text-amber-500"
            >
              <Sparkles className="w-5 h-5" />
            </motion.div>
          </div>

          <h2 className="text-2xl font-black text-text dark:text-white tracking-tight mb-2">
            Your Donation Made a Difference! 🎉
          </h2>

          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 my-4 text-center">
            <p className="text-sm font-bold text-emerald-950 dark:text-emerald-200">
              🍱 {foodName}
            </p>
            <p className="text-xs text-emerald-800 dark:text-emerald-300 mt-1">
              Received with gratitude by <strong className="text-emerald-900 dark:text-emerald-100">{receiverName}</strong>
            </p>
            <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500 text-white text-xs font-black shadow-soft">
              <Heart className="w-3.5 h-3.5 fill-white" />
              {mealsCount} Meals Rescued
            </div>
          </div>

          <p className="text-xs text-text-secondary leading-relaxed mb-6">
            Thank you for helping reduce food waste and feeding our local community in need.
          </p>

          <Button
            variant="primary"
            className="w-full shadow-glow"
            icon={ArrowRight}
            onClick={onClose}
          >
            Continue to FoodBridge
          </Button>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
