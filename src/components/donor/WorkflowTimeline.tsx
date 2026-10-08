import { motion, AnimatePresence } from 'framer-motion'
import { Package, Handshake, Truck, CheckCircle2 } from 'lucide-react'

const deliveryStages = [
  { id: 'available', label: 'Available', emoji: '📦', icon: Package, description: 'Listed on FoodBridge map' },
  { id: 'claimed', label: 'Claimed', emoji: '🤝', icon: Handshake, description: 'NGO matched & confirmed' },
  { id: 'pickup', label: 'In Transit', emoji: '🚚', icon: Truck, description: 'Volunteer en route' },
  { id: 'delivered', label: 'Delivered', emoji: '✓', icon: CheckCircle2, description: 'Meal rescued & verified' },
]

interface WorkflowTimelineProps {
  currentStageIndex?: number
  donationId?: string
  subtitle?: string
  title?: string
}

export function WorkflowTimeline({
  currentStageIndex = 0,
  donationId,
  subtitle,
  title = 'Live Food Rescue Lifecycle',
}: WorkflowTimelineProps) {
  const safeStageIndex = Math.max(0, Math.min(deliveryStages.length - 1, currentStageIndex))

  return (
    <div className="glass-card p-6 border border-gray-200/80 dark:border-gray-800">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
        <div>
          <h3 className="text-lg font-bold text-text dark:text-white">{title}</h3>
          <p className="text-xs text-text-secondary mt-0.5">
            {donationId ? (
              <>
                Tracking item <span className="font-mono font-semibold text-primary">{donationId}</span>
                {subtitle ? <span className="ml-1 text-text-secondary">({subtitle})</span> : ''}
              </>
            ) : (
              <span>{subtitle || 'List food to start live handover tracking.'}</span>
            )}
          </p>
        </div>
        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20 self-start sm:self-auto">
          {deliveryStages[safeStageIndex]?.label.toUpperCase()} STAGE
        </span>
      </div>

      <div className="overflow-x-auto pb-3">
        <div className="flex items-center justify-between min-w-[600px] relative px-4">
          {/* Background Connecting Bar */}
          <div className="absolute top-6 left-12 right-12 h-1 bg-gray-200 dark:bg-gray-700 -translate-y-1/2 z-0 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-primary via-accent to-emerald-500"
              initial={{ width: 0 }}
              animate={{ width: `${(safeStageIndex / (deliveryStages.length - 1)) * 100}%` }}
              transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
            />
          </div>

          {deliveryStages.map((stage, idx) => {
            const Icon = stage.icon
            const isCompleted = idx < safeStageIndex
            const isCurrent = idx === safeStageIndex

            return (
              <div key={stage.id} className="relative z-10 flex flex-col items-center text-center">
                <motion.div
                  initial={false}
                  animate={{
                    scale: isCurrent ? 1.15 : 1,
                    boxShadow: isCurrent ? '0 0 20px rgba(46, 125, 50, 0.35)' : 'none',
                  }}
                  transition={{ duration: 0.3 }}
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-bold transition-all duration-300 ${
                    isCurrent
                      ? 'bg-primary text-white ring-4 ring-primary/20 scale-110 shadow-glow'
                      : isCompleted
                        ? 'bg-emerald-600 text-white'
                        : 'bg-white dark:bg-gray-800 text-text-secondary border border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={isCurrent ? 'current' : isCompleted ? 'done' : 'upcoming'}
                      initial={{ scale: 0.6, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.6, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                    >
                      <Icon className="w-5 h-5" />
                    </motion.div>
                  </AnimatePresence>
                </motion.div>

                <p
                  className={`text-xs font-bold mt-2.5 transition-colors ${
                    isCurrent
                      ? 'text-primary dark:text-primary-light'
                      : isCompleted
                        ? 'text-text dark:text-gray-100'
                        : 'text-text-secondary/60'
                  }`}
                >
                  {stage.label}
                </p>
                <p className="text-[10px] text-text-secondary mt-0.5 max-w-[100px] leading-tight">
                  {stage.description}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
