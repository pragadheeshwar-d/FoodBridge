import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ShieldCheck, Clock, AlertCircle, Sparkles } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useDonationStats } from '../../hooks/useDonationStats'
import { AnimatedCounter } from '../ui/AnimatedCounter'

function formatLiveDateTime() {
  return new Date().toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

export function WelcomeSection() {
  const [dateTime, setDateTime] = useState(formatLiveDateTime())
  const { user } = useAuth()
  const { stats } = useDonationStats()

  useEffect(() => {
    const t = setInterval(() => setDateTime(formatLiveDateTime()), 60000)
    return () => clearInterval(t)
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
      className="glass-card p-6 md:p-8 mb-8 relative overflow-hidden border border-primary/20 shadow-card"
    >
      {/* Decorative ambient background glows */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none animate-pulse-soft" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

      {/* Floating subtle food particles */}
      <motion.div
        animate={{ y: [-4, 4, -4], rotate: [-4, 4, -4] }}
        transition={{ repeat: Infinity, duration: 4.5, ease: 'easeInOut' }}
        className="absolute top-4 right-20 text-2xl select-none opacity-40 hidden md:block"
      >
        🍱
      </motion.div>
      <motion.div
        animate={{ y: [4, -4, 4], rotate: [4, -4, 4] }}
        transition={{ repeat: Infinity, duration: 5, delay: 0.5, ease: 'easeInOut' }}
        className="absolute bottom-6 right-8 text-2xl select-none opacity-40 hidden md:block"
      >
        🌱
      </motion.div>

      <div className="relative z-10">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div>
            <p className="text-xs text-text-secondary mb-1 flex items-center gap-2 font-medium">
              <Clock className="w-3.5 h-3.5 text-primary" /> {dateTime}
            </p>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight flex items-center gap-2">
              <span>Welcome back, {user?.name || 'Donor'}</span>
              <motion.span
                animate={{ rotate: [0, 15, -10, 15, 0] }}
                transition={{ repeat: Infinity, repeatDelay: 4, duration: 1.2 }}
                className="inline-block origin-bottom-right text-2xl"
              >
                👋
              </motion.span>
            </h1>
          </div>

          <div className="flex flex-wrap gap-2">
            {user?.status === 'approved' ? (
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-500/25 shadow-soft">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Verified Account
              </span>
            ) : user?.status === 'pending' ? (
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold border border-amber-500/25">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <Clock className="w-4 h-4 text-amber-600" />
                Pending Approval
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 text-xs font-bold border border-red-500/25">
                <AlertCircle className="w-4 h-4" /> Unverified
              </span>
            )}
          </div>
        </div>

        <p className="text-text-secondary leading-relaxed max-w-3xl text-sm md:text-base">
          Your organization (<strong className="text-text dark:text-white font-bold">{user?.organization || 'FoodBridge Partner'}</strong>) has donated{' '}
          <strong className="text-primary font-bold">{stats.mealsDonatedThisMonth} meals</strong> this month,
          connecting fresh meals directly with verified <strong className="text-text dark:text-white">community shelters</strong>.
        </p>

        {/* Live Snapshot with Animated Counter Values */}
        <div className="grid sm:grid-cols-3 gap-4 mt-6">
          <motion.div
            whileHover={{ y: -2 }}
            className="p-4 rounded-2xl bg-white/70 dark:bg-gray-800/60 border border-gray-200/80 dark:border-gray-700 sm:col-span-3 shadow-sm hover:shadow-card transition-all"
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs uppercase tracking-wider font-bold text-text-secondary flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                Your Live Impact Snapshot
              </p>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                Live Data
              </span>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="p-3 rounded-xl bg-gray-50/70 dark:bg-gray-900/50">
                <p className="text-2xl font-black text-primary">
                  <AnimatedCounter value={stats.mealsDonatedThisMonth} />
                </p>
                <p className="text-xs text-text-secondary mt-1 font-medium">Meals donated this month</p>
              </div>
              <div className="p-3 rounded-xl bg-gray-50/70 dark:bg-gray-900/50">
                <p className="text-2xl font-black text-accent">
                  <AnimatedCounter value={stats.certificates} />
                </p>
                <p className="text-xs text-text-secondary mt-1 font-medium">Verified certificates</p>
              </div>
              <div className="p-3 rounded-xl bg-gray-50/70 dark:bg-gray-900/50">
                <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                  <AnimatedCounter value={Math.max(0, stats.totalDonationEvents - stats.certificates)} />
                </p>
                <p className="text-xs text-text-secondary mt-1 font-medium">Active listings</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ y: -2 }}
            className="p-4 rounded-2xl bg-white/70 dark:bg-gray-800/60 border border-gray-200/80 dark:border-gray-700 shadow-sm transition-all"
          >
            <p className="text-2xl font-black text-primary">
              <AnimatedCounter value={stats.pendingPickups} />
            </p>
            <p className="text-xs text-text-secondary mt-1 font-medium">Pending Pickups</p>
          </motion.div>

          <motion.div
            whileHover={{ y: -2 }}
            className="p-4 rounded-2xl bg-white/70 dark:bg-gray-800/60 border border-gray-200/80 dark:border-gray-700 shadow-sm transition-all"
          >
            <p className="text-2xl font-black text-accent">
              <AnimatedCounter value={stats.totalDonationEvents} />
            </p>
            <p className="text-xs text-text-secondary mt-1 font-medium">Total Donations Made</p>
          </motion.div>

          {stats.expiringSoon > 0 && (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5 animate-bounce" />
              <div>
                <p className="text-sm font-bold text-amber-800 dark:text-amber-300">
                  {stats.expiringSoon} donation(s) expiring soon
                </p>
                <p className="text-xs text-amber-700/90 dark:text-amber-400/90 mt-0.5">Please prepare for pickup</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
