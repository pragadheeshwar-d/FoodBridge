import { CheckCircle2, Clock, XCircle, AlertTriangle, ShieldCheck } from 'lucide-react'
import { Button } from './Button'

type VerificationState = 'VERIFIED' | 'PENDING' | 'UNDER_REVIEW' | 'REJECTED' | 'NOT_SUBMITTED'

interface StatusRow {
  label: string
  status: VerificationState | boolean
}

interface VerificationStatusCardProps {
  rows: StatusRow[]
  rejectionReason?: string | null
  onResubmit?: () => void
  className?: string
}

function StatusIcon({ status }: { status: VerificationState | boolean }) {
  if (status === true || status === 'VERIFIED') {
    return <CheckCircle2 className="w-4 h-4 text-green-500" />
  }
  if (status === 'PENDING' || status === 'UNDER_REVIEW') {
    return <Clock className="w-4 h-4 text-amber-500" />
  }
  if (status === 'REJECTED') {
    return <XCircle className="w-4 h-4 text-red-500" />
  }
  if (status === false || status === 'NOT_SUBMITTED') {
    return <AlertTriangle className="w-4 h-4 text-gray-400" />
  }
  return <Clock className="w-4 h-4 text-gray-400" />
}

function StatusLabel({ status }: { status: VerificationState | boolean }) {
  if (status === true || status === 'VERIFIED') return <span className="text-green-500 font-medium">Verified</span>
  if (status === 'PENDING') return <span className="text-amber-500 font-medium">Pending</span>
  if (status === 'UNDER_REVIEW') return <span className="text-amber-500 font-medium">Under Review</span>
  if (status === 'REJECTED') return <span className="text-red-500 font-medium">Rejected</span>
  if (status === false) return <span className="text-gray-400 font-medium">Not Verified</span>
  if (status === 'NOT_SUBMITTED') return <span className="text-gray-400 font-medium">Not Submitted</span>
  return <span className="text-gray-400">Unknown</span>
}

export function VerificationStatusCard({ rows, rejectionReason, onResubmit, className = '' }: VerificationStatusCardProps) {
  const hasRejection = rows.some((r) => r.status === 'REJECTED')

  return (
    <div className={`glass-card p-5 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <ShieldCheck className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-sm">Verification Status</h3>
      </div>

      <div className="space-y-3">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between">
            <span className="text-sm text-text-secondary">{row.label}</span>
            <div className="flex items-center gap-1.5">
              <StatusIcon status={row.status} />
              <StatusLabel status={row.status} />
            </div>
          </div>
        ))}
      </div>

      {hasRejection && rejectionReason && (
        <div className="mt-4 rounded-xl border border-red-300/50 dark:border-red-700/50 bg-red-50 dark:bg-red-900/20 px-4 py-3">
          <p className="text-xs font-semibold text-red-700 dark:text-red-400 mb-1">Rejection Reason</p>
          <p className="text-xs text-red-600 dark:text-red-300">{rejectionReason}</p>
        </div>
      )}

      {hasRejection && onResubmit && (
        <div className="mt-4">
          <Button variant="primary" size="sm" onClick={onResubmit} className="w-full">
            Update Details & Resubmit
          </Button>
        </div>
      )}
    </div>
  )
}
