import { ShieldCheck, Clock, AlertCircle, PackageSearch } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '../ui/Button'
function formatLiveDateTime() {
  return new Date().toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })
}
import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useReceiverStats } from '../../hooks/useReceiverStats'

export function ReceiverWelcomeSection() {
  const [dateTime, setDateTime] = useState(formatLiveDateTime())
  const { user } = useAuth()
  const { stats, loading } = useReceiverStats()

  useEffect(() => {
    const t = setInterval(() => setDateTime(formatLiveDateTime()), 60000)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="glass-card p-6 md:p-8 mb-8 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="relative">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div>
            <p className="text-sm text-text-secondary mb-1 flex items-center gap-2">
              <Clock className="w-4 h-4" /> {dateTime}
            </p>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              Welcome back, {user?.name || 'Receiver'} 
            </h1>
          </div>
          <div className="flex flex-wrap gap-2">
            {user?.status === 'approved' ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 text-xs font-semibold border border-green-500/20">
                <ShieldCheck className="w-3.5 h-3.5" /> Verified Account
              </span>
            ) : user?.status === 'pending' ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-semibold border border-amber-500/20">
                <Clock className="w-3.5 h-3.5" /> Pending Approval
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 text-xs font-semibold border border-red-500/20">
                <AlertCircle className="w-3.5 h-3.5" /> Unverified
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center mb-6">
        <p className="text-text-secondary leading-relaxed max-w-3xl">
            Your organization ({user?.organization || 'Food Bridge NGO'}) has rescued{' '}
            <strong className="text-text dark:text-white">{loading ? '...' : stats.mealsReceivedThisMonth} meals</strong> this month,
            helping communities through verified pickups.
        </p>
          <Link to="/receiver/donations">
            <Button variant="primary" icon={PackageSearch}>Find Food</Button>
          </Link>
        </div>

        <div className="grid sm:grid-cols-3 gap-4 mt-6">
          <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 sm:col-span-3">
            <p className="text-xs uppercase tracking-wide text-text-secondary">Your live snapshot</p>
            <div className="grid sm:grid-cols-3 gap-4 mt-3">
              <div>
                <p className="text-2xl font-bold text-primary">{loading ? '-' : stats.mealsReceivedThisMonth.toLocaleString()}</p>
                <p className="text-xs text-text-secondary mt-1">Meals received this month</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-accent">{loading ? '-' : stats.totalPickups}</p>
                <p className="text-xs text-text-secondary mt-1">Completed pickups</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-primary">{loading ? '-' : stats.availableDonations}</p>
                <p className="text-xs text-text-secondary mt-1">Active donations</p>
              </div>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700">
            <p className="text-2xl font-bold text-primary">{loading ? '-' : stats.activeRequests}</p>
            <p className="text-xs text-text-secondary mt-1">Active Requests</p>
          </div>
          <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700">
            <p className="text-2xl font-bold text-accent">{loading ? '-' : stats.totalPickups}</p>
            <p className="text-xs text-text-secondary mt-1">Total Pickups Completed</p>
          </div>
        </div>
      </div>
    </div>
  )
}
