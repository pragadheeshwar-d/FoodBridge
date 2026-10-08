import { motion } from 'framer-motion'
import { Leaf } from 'lucide-react'

interface FoodBridgeLoaderProps {
  message?: string
  fullScreen?: boolean
}

export function FoodBridgeLoader({
  message = 'Preparing your FoodBridge experience...',
  fullScreen = false,
}: FoodBridgeLoaderProps) {
  const content = (
    <div className="flex flex-col items-center justify-center p-6 text-center select-none">
      <div className="relative w-20 h-20 mb-4 flex items-center justify-center">
        {/* Orbiting ring */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
          className="absolute inset-0 rounded-full border-2 border-primary/20 border-t-primary"
        />

        {/* Floating food container */}
        <motion.div
          animate={{ y: [-3, 3, -3], scale: [0.96, 1.04, 0.96] }}
          transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
          className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center text-2xl shadow-soft"
        >
          🍱
        </motion.div>

        {/* Orbiting leaf */}
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ repeat: Infinity, duration: 4, ease: 'linear' }}
          className="absolute inset-0 pointer-events-none"
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 p-1 bg-white dark:bg-gray-800 rounded-full shadow-sm text-emerald-600">
            <Leaf className="w-3 h-3" />
          </div>
        </motion.div>
      </div>

      <motion.p
        animate={{ opacity: [0.7, 1, 0.7] }}
        transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
        className="text-sm font-semibold text-text dark:text-gray-200"
      >
        {message}
      </motion.p>
      <p className="text-xs text-text-secondary mt-1">Connecting surplus food with people in need</p>
    </div>
  )

  if (fullScreen) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface dark:bg-gray-950">
        {content}
      </div>
    )
  }

  return content
}
