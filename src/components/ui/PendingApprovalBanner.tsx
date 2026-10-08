import { Link } from 'react-router-dom'
import { Clock, AlertTriangle, ArrowRight } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export function PendingApprovalBanner() {
  const { user } = useAuth()

  if (!user || user.status === 'approved') {
    return null
  }

  if (user.status === 'pending') {
    return (
      <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-bold">Account Pending Admin Approval</p>
            <p className="text-xs text-amber-800/80 dark:text-amber-300/80 mt-0.5">
              Your email is verified. An administrator is currently reviewing your registration before granting full access.
            </p>
          </div>
        </div>
        <Link
          to="/pending"
          className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 dark:text-amber-300 hover:underline shrink-0"
        >
          View Status <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    )
  }

  if (user.status === 'rejected') {
    return (
      <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-900 dark:text-red-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-red-500/20 text-red-600 dark:text-red-400 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-bold">Account Not Approved</p>
            <p className="text-xs text-red-800/80 dark:text-red-300/80 mt-0.5">
              Your registration was not approved by an administrator. Please review the details.
            </p>
          </div>
        </div>
        <Link
          to="/pending"
          className="inline-flex items-center gap-1 text-xs font-semibold text-red-700 dark:text-red-300 hover:underline shrink-0"
        >
          View Details <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    )
  }

  return null
}

