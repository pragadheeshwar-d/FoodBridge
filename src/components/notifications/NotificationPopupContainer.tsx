import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CheckCircle2,
  AlertCircle,
  X,
  Utensils,
  Bell,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  PackageCheck,
  HeartHandshake,
} from 'lucide-react'
import { useNotificationPopup, type PopupNotification, type PopupType } from '../../context/NotificationPopupContext'

const AUTO_DISMISS_MS = 6000

function getPopupIcon(item: PopupNotification) {
  const title = (item.title || '').toLowerCase()
  const msg = (item.message || '').toLowerCase()

  if (title.includes('approved') || title.includes('admin')) return ShieldCheck
  if (title.includes('collected') || title.includes('received') || msg.includes('collected') || msg.includes('received')) return Sparkles
  if (title.includes('offer') || msg.includes('offer')) return HeartHandshake
  if (title.includes('uploaded') || title.includes('donation') || msg.includes('donation')) return PackageCheck
  if (title.includes('request') || msg.includes('request')) return Utensils

  switch (item.type) {
    case 'success':
      return CheckCircle2
    case 'warning':
      return AlertCircle
    case 'error':
      return AlertCircle
    default:
      return Bell
  }
}

function getStyleConfig(type: PopupType = 'info') {
  switch (type) {
    case 'success':
      return {
        badgeBg: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
        iconBg: 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
        cardBorder: 'border-emerald-500/30 dark:border-emerald-500/25',
        cardGlow: 'shadow-[0_8px_30px_rgb(16,185,129,0.12)] dark:shadow-[0_8px_30px_rgb(16,185,129,0.2)]',
        progressBar: 'bg-emerald-500',
      }
    case 'warning':
      return {
        badgeBg: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
        iconBg: 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30',
        cardBorder: 'border-amber-500/30 dark:border-amber-500/25',
        cardGlow: 'shadow-[0_8px_30px_rgb(245,158,11,0.12)] dark:shadow-[0_8px_30px_rgb(245,158,11,0.2)]',
        progressBar: 'bg-amber-500',
      }
    case 'error':
      return {
        badgeBg: 'bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30',
        iconBg: 'bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30',
        cardBorder: 'border-red-500/30 dark:border-red-500/25',
        cardGlow: 'shadow-[0_8px_30px_rgb(239,68,68,0.12)] dark:shadow-[0_8px_30px_rgb(239,68,68,0.2)]',
        progressBar: 'bg-red-500',
      }
    default:
      return {
        badgeBg: 'bg-primary/15 text-primary-dark dark:text-primary-light border-primary/30',
        iconBg: 'bg-primary/20 text-primary border-primary/30',
        cardBorder: 'border-primary/30 dark:border-primary/25',
        cardGlow: 'shadow-[0_8px_30px_rgb(16,185,129,0.1)]',
        progressBar: 'bg-primary',
      }
  }
}

function PopupCard({
  item,
  onDismiss,
}: {
  item: PopupNotification
  onDismiss: (id: string) => void
}) {
  const [paused, setPaused] = useState(false)
  const [remaining, setRemaining] = useState(AUTO_DISMISS_MS)
  const lastTickRef = useRef<number>(Date.now())

  const Icon = getPopupIcon(item)
  const styles = getStyleConfig(item.type)

  useEffect(() => {
    lastTickRef.current = Date.now()
    const timer = setInterval(() => {
      if (!paused) {
        const elapsed = Date.now() - lastTickRef.current
        setRemaining((prev) => {
          const next = prev - elapsed
          if (next <= 0) {
            clearInterval(timer)
            onDismiss(item.id)
            return 0
          }
          return next
        })
      }
      lastTickRef.current = Date.now()
    }, 50)

    return () => clearInterval(timer)
  }, [paused, item.id, onDismiss])

  const progressPercent = Math.max(0, Math.min(100, (remaining / AUTO_DISMISS_MS) * 100))

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -24, scale: 0.92, x: 20 }}
      animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: -16, x: 30, transition: { duration: 0.25 } }}
      transition={{ type: 'spring', damping: 25, stiffness: 350 }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className={`pointer-events-auto relative overflow-hidden rounded-2xl bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border ${styles.cardBorder} ${styles.cardGlow} p-4 shadow-xl transition-all`}
    >
      <div className="flex items-start gap-3.5">
        {/* Visual Icon Badge */}
        <div className={`p-2.5 rounded-xl border shrink-0 ${styles.iconBg}`}>
          <Icon className="w-5 h-5" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 pr-6">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            {item.category && (
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${styles.badgeBg}`}>
                {item.category}
              </span>
            )}
            <span className="text-[11px] text-text-secondary">Just now</span>
          </div>

          {item.title && (
            <h4 className="text-sm font-bold text-text dark:text-white leading-snug">
              {item.title}
            </h4>
          )}

          <p className="text-xs text-text-secondary dark:text-gray-300 mt-1 leading-relaxed">
            {item.message}
          </p>

          {item.link && (
            <Link
              to={item.link}
              onClick={() => onDismiss(item.id)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary-dark mt-2.5 group transition-colors"
            >
              <span>View details</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          )}
        </div>

        {/* Close Button */}
        <button
          type="button"
          onClick={() => onDismiss(item.id)}
          aria-label="Dismiss notification"
          className="absolute top-3.5 right-3.5 p-1 rounded-lg text-text-secondary hover:text-text hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Countdown Progress Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-100 dark:bg-gray-800">
        <div
          className={`h-full transition-all ease-linear ${styles.progressBar}`}
          style={{ width: `${progressPercent}%`, transitionDuration: '50ms' }}
        />
      </div>
    </motion.div>
  )
}

export function NotificationPopupContainer() {
  const { popups, dismissPopup } = useNotificationPopup()

  return (
    <div
      aria-live="polite"
      className="fixed top-4 right-4 sm:top-5 sm:right-5 z-[9999] flex flex-col gap-3 pointer-events-none w-[calc(100vw-2rem)] max-w-sm sm:max-w-md"
    >
      <AnimatePresence mode="popLayout">
        {popups.map((item) => (
          <PopupCard key={item.id} item={item} onDismiss={dismissPopup} />
        ))}
      </AnimatePresence>
    </div>
  )
}
