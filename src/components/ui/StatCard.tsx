import { type LucideIcon } from 'lucide-react'
import { motion } from 'framer-motion'
import { AnimatedCounter } from './AnimatedCounter'

interface StatCardProps {
  title: string
  value: string | number
  change?: string
  icon: LucideIcon
  color?: string
  delay?: number
}

export function StatCard({ title, value, change, icon: Icon, color = 'text-primary', delay = 0 }: StatCardProps) {
  const isNumeric = typeof value === 'number'

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ delay, duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
      className="stat-card group hover:shadow-elevated transition-all duration-300 border border-gray-200/60 dark:border-gray-800"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-wider text-text-secondary font-semibold mb-1">{title}</p>
          <p className="text-2xl font-black text-text dark:text-white tracking-tight stat-value">
            {isNumeric ? <AnimatedCounter value={value} /> : value}
          </p>
          {change && (
            <p className="text-xs text-primary font-medium mt-1">{change}</p>
          )}
        </div>
        <div className={`p-2.5 rounded-xl bg-primary/10 ${color} group-hover:scale-110 transition-transform duration-300 shadow-soft`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </motion.div>
  )
}

interface GlassCardProps {
  children: React.ReactNode
  className?: string
  hover?: boolean
}

export function GlassCard({ children, className = '', hover = true }: GlassCardProps) {
  return (
    <div className={`glass-card p-6 ${hover ? 'hover:shadow-elevated transition-all duration-300 hover:-translate-y-1' : ''} ${className}`}>
      {children}
    </div>
  )
}
