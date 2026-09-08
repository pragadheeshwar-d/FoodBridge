import { Clock, AlertTriangle, ShieldCheck, Truck } from 'lucide-react'
interface LiveOperationsMapProps {
  status?: string
  verificationStatus?: string
  eta?: string
  traffic?: string
}

export function LiveOperationsMap({
  status = 'Active',
  verificationStatus = 'Completed',
  eta = 'On Schedule',
  traffic = 'Normal Flow',
}: LiveOperationsMapProps) {
  return (
    <div className="glass-card p-6">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
        <div>
          <h3 className="text-lg font-bold text-text dark:text-white">Live Operations Summary</h3>
          <p className="text-sm text-text-secondary mt-1">
            Current activity, verification status, and delivery timing at a glance.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 text-xs">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary font-medium">
            <Clock className="w-3.5 h-3.5" /> ETA {eta}
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 font-medium">
            <AlertTriangle className="w-3.5 h-3.5" /> {traffic}
          </span>
        </div>
      </div>
      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-gradient-to-br from-primary/5 to-white dark:from-primary/10 dark:to-gray-900 p-6">
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="rounded-xl bg-white/80 dark:bg-gray-950/60 border border-white/70 dark:border-gray-800 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-text-secondary">Activity</p>
            <p className="font-semibold mt-1">{status}</p>
            <p className="text-sm text-text-secondary mt-1">Operations are processing normally</p>
          </div>
          <div className="rounded-xl bg-white/80 dark:bg-gray-950/60 border border-white/70 dark:border-gray-800 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-text-secondary">Verification</p>
            <p className="font-semibold mt-1">{verificationStatus}</p>
            <p className="text-sm text-text-secondary mt-1">Pickup records are verified</p>
          </div>
          <div className="rounded-xl bg-white/80 dark:bg-gray-950/60 border border-white/70 dark:border-gray-800 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-text-secondary">Timing</p>
            <p className="font-semibold mt-1">{eta}</p>
            <p className="text-sm text-text-secondary mt-1">Estimated handoff window</p>
          </div>
        </div>
      </div>
      <div className="grid sm:grid-cols-3 gap-4 mt-4">
        <div className="flex items-center gap-2 text-sm">
          <ShieldCheck className="w-4 h-4 text-primary" />
          <span className="text-text-secondary">Security: <strong className="text-text dark:text-white">Confirmed</strong></span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Truck className="w-4 h-4 text-blue-500" />
          <span className="text-text-secondary">Dispatch: <strong className="text-text dark:text-white">Queued</strong></span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Clock className="w-4 h-4 text-accent" />
          <span className="text-text-secondary">ETA: <strong className="text-text dark:text-white">{eta}</strong></span>
        </div>
      </div>
    </div>
  )
}
