import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, MapPin, Truck, ArrowRight } from 'lucide-react'
import { Button } from '../ui/Button'
import { Link } from 'react-router-dom'

interface DonationSuccessModalProps {
  isOpen: boolean
  foodName: string
  mealsCount: number | string
  unit?: string
  pickupAddress?: string
  onClose: () => void
}

type Stage = 'packing' | 'impact' | 'routing' | 'success'

export function DonationSuccessModal({
  isOpen,
  foodName,
  mealsCount,
  unit = 'meals',
  pickupAddress,
  onClose,
}: DonationSuccessModalProps) {
  const [stage, setStage] = useState<Stage>('packing')

  useEffect(() => {
    if (!isOpen) {
      setStage('packing')
      return
    }

    // Sequence stages smoothly over 2.5 seconds before showing final success
    const t1 = setTimeout(() => setStage('impact'), 700)
    const t2 = setTimeout(() => setStage('routing'), 1500)
    const t3 = setTimeout(() => setStage('success'), 2300)

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-md"
          onClick={stage === 'success' ? onClose : undefined}
        />

        {/* Modal Container */}
        <motion.div
          initial={{ scale: 0.85, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
          className="relative z-10 w-full max-w-lg glass-card p-8 text-center overflow-hidden bg-white/95 dark:bg-gray-900/95 shadow-elevated border border-primary/20"
        >
          {/* Ambient radial glows */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-accent/20 rounded-full blur-3xl pointer-events-none" />

          {/* Stages Animation Area */}
          <div className="h-44 flex flex-col items-center justify-center relative mb-4">
            {stage === 'packing' && (
              <motion.div
                key="packing"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: [0.8, 1.1, 1], opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="flex flex-col items-center"
              >
                <div className="w-20 h-20 rounded-3xl bg-primary/10 text-primary flex items-center justify-center text-4xl shadow-glow mb-2 animate-bounce">
                  🍱
                </div>
                <p className="text-sm font-bold text-text dark:text-white mt-1">
                  Packaging {foodName || 'Food Donation'}...
                </p>
                <p className="text-xs text-text-secondary">Preparing food donation container</p>
              </motion.div>
            )}

            {stage === 'impact' && (
              <motion.div
                key="impact"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="relative flex flex-col items-center"
              >
                {/* Floating hearts */}
                <motion.div
                  initial={{ y: 0, opacity: 0 }}
                  animate={{ y: -30, opacity: [0, 1, 0] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                  className="absolute -top-4 -left-8 text-xl"
                >
                  ❤️
                </motion.div>
                <motion.div
                  initial={{ y: 0, opacity: 0 }}
                  animate={{ y: -35, opacity: [0, 1, 0] }}
                  transition={{ duration: 0.9, delay: 0.2, repeat: Infinity }}
                  className="absolute -top-6 text-2xl"
                >
                  🌱
                </motion.div>
                <motion.div
                  initial={{ y: 0, opacity: 0 }}
                  animate={{ y: -30, opacity: [0, 1, 0] }}
                  transition={{ duration: 0.7, delay: 0.3, repeat: Infinity }}
                  className="absolute -top-4 -right-8 text-xl"
                >
                  ❤️
                </motion.div>

                <div className="w-20 h-20 rounded-3xl bg-rose-500/15 text-rose-500 flex items-center justify-center text-4xl shadow-glow mb-2">
                  ❤️
                </div>
                <p className="text-sm font-bold text-text dark:text-white mt-1">
                  Generating Impact Metrics...
                </p>
                <p className="text-xs text-text-secondary">Linking {mealsCount} {unit} to community network</p>
              </motion.div>
            )}

            {stage === 'routing' && (
              <motion.div
                key="routing"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="flex flex-col items-center"
              >
                <div className="relative w-20 h-20 rounded-3xl bg-blue-500/15 text-blue-600 flex items-center justify-center text-4xl shadow-glow mb-2">
                  <Truck className="w-10 h-10 text-blue-600 animate-pulse" />
                  <MapPin className="w-5 h-5 text-red-500 absolute -top-1 -right-1" />
                </div>
                <p className="text-sm font-bold text-text dark:text-white mt-1">
                  Broadcasting to Nearby Verified NGOs...
                </p>
                <p className="text-xs text-text-secondary">Routing pickup schedules</p>
              </motion.div>
            )}

            {stage === 'success' && (
              <motion.div
                key="success"
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', damping: 15, stiffness: 200 }}
                className="flex flex-col items-center"
              >
                <div className="relative w-20 h-20 rounded-3xl bg-emerald-500 text-white flex items-center justify-center shadow-glow mb-2">
                  <CheckCircle2 className="w-11 h-11" />
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="absolute -top-2 -right-2 text-xl"
                  >
                    🍱
                  </motion.span>
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3 }}
                    className="absolute -bottom-2 -left-2 text-xl"
                  >
                    ❤️
                  </motion.span>
                </div>
                <h3 className="text-2xl font-extrabold text-text dark:text-white mt-1">
                  Donation Successful!
                </h3>
              </motion.div>
            )}
          </div>

          {/* Final Impact Summary Box */}
          {stage === 'success' ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="space-y-4"
            >
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/20 text-center">
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                  Impact Created
                </p>
                <p className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                  {mealsCount} {unit} Rescued
                </p>
                <p className="text-xs text-emerald-700/80 dark:text-emerald-300/80 mt-0.5">
                  Listed under {foodName} • Live on NGO map
                </p>
              </div>

              {pickupAddress && (
                <div className="flex items-center justify-center gap-2 text-xs text-text-secondary">
                  <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span className="truncate max-w-xs">{pickupAddress}</span>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button
                  variant="primary"
                  className="flex-1"
                  onClick={onClose}
                  icon={CheckCircle2}
                >
                  Done
                </Button>
                <Link to="/donor/donations" className="flex-1">
                  <Button variant="secondary" className="w-full" icon={ArrowRight}>
                    View My Donations
                  </Button>
                </Link>
              </div>
            </motion.div>
          ) : (
            <div className="w-full bg-gray-100 dark:bg-gray-800 h-2 rounded-full overflow-hidden mt-4">
              <motion.div
                className="h-full bg-primary"
                initial={{ width: '15%' }}
                animate={{
                  width: stage === 'packing' ? '30%' : stage === 'impact' ? '65%' : '95%',
                }}
                transition={{ duration: 0.6 }}
              />
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
