import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ShieldCheck,
  Clock,
  CheckCircle2,
  RefreshCw,
  LogOut,
  Heart,
  Leaf,
  ArrowRight,
  XCircle,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { Button } from '../../components/ui/Button'
import { useToast } from '../../context/ToastContext'

export default function PendingApprovalPage() {
  const { user, logout, refreshUser } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [checking, setChecking] = useState(false)

  const checkStatus = async () => {
    setChecking(true)
    try {
      if (refreshUser) {
        await refreshUser()
      }
      if (user?.status === 'approved') {
        toast('Your account has been approved!', 'success')
        navigate('/dashboard')
        return
      }
      toast('Status checked. Your account is still in the admin review queue.', 'info')
    } catch {
      toast('Could not refresh status right now.', 'error')
    } finally {
      setTimeout(() => setChecking(false), 600)
    }
  }

  // 1. If already approved
  if (user?.status === 'approved') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-surface via-green-50/40 to-surface dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="max-w-md w-full glass-card p-8 text-center relative overflow-hidden"
        >
          <div className="w-20 h-20 mx-auto mb-4 rounded-3xl bg-emerald-500 text-white flex items-center justify-center shadow-glow text-3xl">
            🎉
          </div>
          <h1 className="text-2xl font-black tracking-tight mb-2 text-text dark:text-white">
            Account Approved! 🎉
          </h1>
          <p className="text-sm text-text-secondary mb-6 leading-relaxed">
            Welcome to FoodBridge, <strong className="text-text dark:text-white">{user?.name}</strong>. Your account for{' '}
            <strong className="text-text dark:text-white">{user?.organization || 'your organization'}</strong> has been approved by the admin.
          </p>

          <Button
            variant="primary"
            className="w-full shadow-glow"
            icon={ArrowRight}
            onClick={() => navigate('/dashboard')}
          >
            Continue to FoodBridge →
          </Button>
        </motion.div>
      </div>
    )
  }

  // 2. If rejected by admin
  if (user?.status === 'rejected') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-surface via-red-50/40 to-surface dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="max-w-md w-full glass-card p-8 text-center relative overflow-hidden border border-red-500/20"
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center">
            <XCircle className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight mb-2 text-text dark:text-white">
            Account Not Approved
          </h1>
          <p className="text-sm text-text-secondary mb-4 leading-relaxed">
            Your FoodBridge account registration was reviewed and has not been approved by the admin team.
          </p>

          {(user as any)?.rejection_reason && (
            <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 text-left text-xs mb-6">
              <strong className="text-red-700 dark:text-red-300 block mb-1">Reason:</strong>
              <p className="text-red-800 dark:text-red-200">{(user as any).rejection_reason}</p>
            </div>
          )}

          <div className="space-y-3">
            <Button variant="secondary" className="w-full" icon={LogOut} onClick={logout}>
              Sign Out
            </Button>
            <p className="text-xs text-text-secondary">
              Believe this was a mistake?{' '}
              <Link to="/" className="text-primary hover:underline font-medium">
                Contact Support
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    )
  }

  // 3. Pending Admin Approval State
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-surface via-green-50/40 to-surface dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
        className="max-w-md w-full glass-card p-8 text-center relative overflow-hidden"
      >
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-accent/10 rounded-full blur-2xl pointer-events-none" />

        {/* Animated FoodBridge Waiting Icon */}
        <div className="relative w-20 h-20 mx-auto mb-6 flex items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 12, ease: 'linear' }}
            className="absolute inset-0 rounded-full border-2 border-dashed border-primary/30 dark:border-primary/40"
          />
          <motion.div
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
            className="w-14 h-14 rounded-2xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center shadow-glow text-primary text-2xl"
          >
            🍱
          </motion.div>
          <motion.div
            animate={{ y: [-3, 3, -3], opacity: [0.7, 1, 0.7] }}
            transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
            className="absolute -top-1 -right-1 p-1 bg-white dark:bg-gray-800 rounded-full shadow-sm text-emerald-600"
          >
            <Leaf className="w-3.5 h-3.5" />
          </motion.div>
          <motion.div
            animate={{ y: [3, -3, 3], opacity: [0.7, 1, 0.7] }}
            transition={{ repeat: Infinity, duration: 2.4, ease: 'easeInOut' }}
            className="absolute -bottom-1 -left-1 p-1 bg-white dark:bg-gray-800 rounded-full shadow-sm text-red-500"
          >
            <Heart className="w-3.5 h-3.5" />
          </motion.div>
        </div>

        <h1 className="text-2xl font-bold tracking-tight mb-2">Your account is awaiting admin approval.</h1>
        <p className="text-sm text-text-secondary mb-6 leading-relaxed">
          Welcome, <strong className="text-text dark:text-white">{user?.name || 'Partner'}</strong>! Your account has been created for{' '}
          <strong className="text-text dark:text-white">{user?.organization || 'your organization'}</strong>.
        </p>

        {/* Status Breakdown Checklist */}
        <div className="space-y-3 text-left mb-6">
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div>
                <p className="text-xs font-bold text-emerald-900 dark:text-emerald-200">Email Address</p>
                <p className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80">{user?.email || 'Email verified'}</p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-white">
              Verified ✓
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 animate-pulse" />
              <div>
                <p className="text-xs font-bold text-amber-900 dark:text-amber-200">Admin Approval</p>
                <p className="text-[11px] text-amber-700/80 dark:text-amber-400/80">In review queue</p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white">
              Waiting ⏳
            </span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700 mb-6 text-xs text-text-secondary text-left leading-relaxed">
          <p className="font-semibold text-text dark:text-white mb-1 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-primary" /> Your account has been verified by email. Our admin team will review and approve your account shortly.
          </p>
        </div>

        <div className="space-y-3">
          <Button
            variant="primary"
            className="w-full shadow-glow"
            icon={RefreshCw}
            loading={checking}
            onClick={checkStatus}
          >
            Check Approval Status
          </Button>
          <Button
            variant="secondary"
            className="w-full"
            icon={LogOut}
            onClick={logout}
          >
            Sign Out
          </Button>
        </div>

        <p className="text-xs text-text-secondary mt-6">
          Need urgent access for emergency food distribution?{' '}
          <Link to="/" className="text-primary hover:underline font-medium">
            Contact Support
          </Link>
        </p>
      </motion.div>
    </div>
  )
}

