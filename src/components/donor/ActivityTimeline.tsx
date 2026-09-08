import { motion } from 'framer-motion'
import { UtensilsCrossed, Truck, CheckCircle, Heart, Sparkles } from 'lucide-react'
import { useDonorActivity } from '../../hooks/useDynamicContent'

const icons = {
  donation: UtensilsCrossed,
  pickup: Truck,
  success: CheckCircle,
  delivered: Heart,
}

const colors = {
  donation: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  pickup: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
  success: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
  delivered: 'bg-primary/10 text-primary',
}

export function ActivityTimeline() {
  const { activity: activityFeed } = useDonorActivity()

  if (activityFeed.length === 0) {
    return (
      <div className="glass-card p-6 border border-gray-200/80 dark:border-gray-800">
        <h3 className="text-lg font-bold text-text dark:text-white flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" /> Live Activity Feed
        </h3>
        <p className="text-sm text-text-secondary mt-3">No activity logged yet. Your first donation will appear here live.</p>
      </div>
    )
  }

  return (
    <div className="glass-card p-6 border border-gray-200/80 dark:border-gray-800">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-text dark:text-white flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            Live Activity Feed
          </h3>
          <p className="text-xs text-text-secondary mt-1">
            Real-time donation handovers, vehicle dispatches, and verification milestones.
          </p>
        </div>
        <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-primary/10 text-primary uppercase tracking-wider">
          Real-Time
        </span>
      </div>

      <div className="space-y-0">
        {activityFeed.map((item, i) => {
          const Icon = icons[item.type as keyof typeof icons] || UtensilsCrossed
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06, duration: 0.3 }}
              className="flex gap-4 pb-6 last:pb-0 relative group"
            >
              {i < activityFeed.length - 1 && (
                <div className="absolute left-5 top-10 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />
              )}
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110 shadow-soft ${
                  colors[item.type as keyof typeof colors] || colors.donation
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0 pt-0.5">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-bold text-primary">{item.time}</p>
                  <span className="text-[10px] text-text-secondary">Milestone #{i + 1}</span>
                </div>
                <p className="text-sm font-bold mt-0.5 text-text dark:text-white">{item.title}</p>
                <p className="text-xs text-text-secondary mt-1 leading-relaxed">{item.detail}</p>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
