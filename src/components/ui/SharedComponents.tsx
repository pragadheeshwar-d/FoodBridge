import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, X, Check, Trash2 } from 'lucide-react'
import { useNotifications, isNotificationRead } from '../../hooks/useNotifications'

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const { notifications, unreadCount, markAllRead, markAsRead, removeNotification } = useNotifications()

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="relative p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5 text-text-secondary" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white dark:ring-gray-900" />
        )}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              className="absolute right-0 top-full mt-2 w-80 sm:w-96 glass-card z-50 overflow-hidden shadow-2xl border border-gray-200/50 dark:border-gray-800/80 rounded-2xl"
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-sm">Notifications</h3>
                  {unreadCount > 0 && (
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-primary/15 text-primary">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={markAllRead}
                      className="text-xs font-semibold text-primary hover:underline transition-colors"
                    >
                      Mark all read
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-text-secondary hover:text-text transition-colors"
                    aria-label="Close notifications"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="max-h-96 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800/50">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-sm text-text-secondary">No notifications</div>
                ) : (
                  notifications.map((n) => {
                    const isRead = isNotificationRead(n)
                    return (
                      <div
                        key={n.id}
                        className={`p-4 transition-colors ${
                          !isRead ? 'bg-primary/5 dark:bg-primary/10' : 'hover:bg-gray-50 dark:hover:bg-gray-800/30'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <button
                            type="button"
                            onClick={() => {
                              if (!isRead) markAsRead(n.id)
                            }}
                            className={`mt-1.5 w-2.5 h-2.5 rounded-full shrink-0 transition-colors ${
                              !isRead
                                ? 'bg-primary ring-2 ring-primary/20'
                                : 'bg-transparent border border-gray-300 dark:border-gray-600'
                            }`}
                            aria-label={!isRead ? 'Mark notification as read' : 'Notification read'}
                            title={!isRead ? 'Click to mark as read' : 'Read'}
                          />
                          <div className="flex-1 min-w-0">
                            <div
                              onClick={() => {
                                if (!isRead) markAsRead(n.id)
                              }}
                              className="cursor-pointer"
                            >
                              <p className={`text-sm ${!isRead ? 'font-semibold text-text dark:text-white' : 'font-medium text-text-secondary'}`}>
                                {n.title}
                              </p>
                              <p className="text-xs text-text-secondary mt-0.5 leading-relaxed">
                                {n.message}
                              </p>
                            </div>
                            <p className="text-[11px] text-text-secondary/60 mt-1">
                              {n.createdAt
                                ? new Date(n.createdAt).toLocaleDateString() + ' ' + new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                : n.created_at
                                  ? new Date(n.created_at).toLocaleDateString()
                                  : ''}
                            </p>
                            <div className="flex items-center gap-3 mt-2 pt-1.5 border-t border-gray-100/80 dark:border-gray-800/60">
                              {!isRead && (
                                <button
                                  type="button"
                                  onClick={() => markAsRead(n.id)}
                                  className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1 transition-colors"
                                >
                                  <Check className="w-3 h-3" />
                                  Mark as read
                                </button>
                              )}
                              {n.link && (
                                <Link
                                  to={n.link}
                                  className="text-xs text-primary inline-block hover:underline font-medium"
                                  onClick={() => {
                                    if (!isRead) markAsRead(n.id)
                                    setOpen(false)
                                  }}
                                >
                                  View details
                                </Link>
                              )}
                              <button
                                type="button"
                                onClick={() => removeNotification(n.id)}
                                className="text-xs text-text-secondary hover:text-red-500 inline-flex items-center gap-1 ml-auto transition-colors"
                              >
                                <Trash2 className="w-3 h-3" />
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

export function EmptyState({
  icon: Icon,
  emoji = '🍱',
  title,
  description,
  action,
}: {
  icon?: React.ComponentType<{ className?: string }>
  emoji?: string
  title: string
  description: string
  action?: React.ReactNode
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center justify-center py-16 px-4 text-center select-none"
    >
      <motion.div
        animate={{ y: [-4, 4, -4], rotate: [0, 2, -2, 0] }}
        transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
        className="w-20 h-20 rounded-3xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center mb-4 text-3xl shadow-soft"
      >
        {Icon ? <Icon className="w-9 h-9 text-primary" /> : <span>{emoji}</span>}
      </motion.div>
      <h3 className="text-lg font-bold mb-1 text-text dark:text-white">{title}</h3>
      <p className="text-sm text-text-secondary max-w-sm mb-5 leading-relaxed">{description}</p>
      {action}
    </motion.div>
  )
}

export function LoadingSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4">
          <div className="skeleton w-12 h-12 rounded-xl" />
          <div className="flex-1 space-y-2">
            <div className="skeleton h-4 w-3/4" />
            <div className="skeleton h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function Pagination({ current = 1, total = 5 }: { current?: number; total?: number }) {
  return (
    <div className="flex items-center justify-between pt-4">
      <p className="text-sm text-text-secondary">
        Page {current} of {total}
      </p>
      <div className="flex gap-1">
        {Array.from({ length: total }).map((_, i) => (
          <button
            key={i}
            className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
              i + 1 === current
                ? 'bg-primary text-white'
                : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-text-secondary'
            }`}
          >
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  )
}

export function TimelineStep({ steps, currentStep }: { steps: string[]; currentStep: number }) {
  return (
    <div className="flex items-center gap-0">
      {steps.map((step, i) => (
        <div key={step} className="flex items-center flex-1 last:flex-none">
          <div className="flex flex-col items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                i <= currentStep
                  ? 'bg-primary text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-text-secondary'
              }`}
            >
              {i < currentStep ? <Check className="w-4 h-4" /> : i + 1}
            </div>
            <p
              className={`text-xs mt-1.5 text-center max-w-[80px] ${
                i <= currentStep ? 'text-primary font-medium' : 'text-text-secondary'
              }`}
            >
              {step}
            </p>
          </div>
          {i < steps.length - 1 && (
            <div className={`flex-1 h-0.5 mx-2 ${i < currentStep ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700'}`} />
          )}
        </div>
      ))}
    </div>
  )
}
