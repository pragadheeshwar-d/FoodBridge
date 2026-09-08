import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, CheckCircle2, ArrowRight, Shield } from 'lucide-react'
import { AuthShell } from './AuthShell'
import { Button } from '../../components/ui/Button'
import { useAuth } from '../../context/AuthContext'

export function RegistrationSuccessPage() {
  const { user } = useAuth()

  return (
    <AuthShell
      title="Registration Submitted!"
      subtitle="Your registration is created. Follow the steps below to activate your account."
    >
      <div className="space-y-6">
        {/* Animated Checkmark Circle */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
          className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center flex flex-col items-center"
        >
          <div className="w-16 h-16 bg-emerald-500 text-white rounded-2xl flex items-center justify-center shadow-glow mb-3">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-text dark:text-white">Account Created Successfully</h3>
          <p className="text-xs text-text-secondary mt-1">
            {user?.name ? `Welcome, ${user.name} (${user.organization || 'FoodBridge Partner'})` : 'Welcome to FoodBridge!'}
          </p>
        </motion.div>

        {/* Verification Steps */}
        <div className="space-y-3">
          <div className="p-4 rounded-xl bg-white/80 dark:bg-gray-800/80 border border-gray-200/80 dark:border-gray-700/80 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0 mt-0.5">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold text-text dark:text-white">Step 1: Verify Your Email</p>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  Required First
                </span>
              </div>
              <p className="text-xs text-text-secondary mt-1 leading-relaxed">
                We sent a verification link to your email ({user?.email || 'your registered email'}). Please click the link to confirm your address.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white/80 dark:bg-gray-800/80 border border-gray-200/80 dark:border-gray-700/80 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold text-text dark:text-white">Step 2: Admin Approval</p>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  Pending Review
                </span>
              </div>
              <p className="text-xs text-text-secondary mt-1 leading-relaxed">
                After email verification, our admin team reviews your registration. You will receive full access once your account is approved.
              </p>
            </div>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/15 flex items-center gap-2.5 text-xs text-text-secondary">
          <Shield className="w-4 h-4 text-primary shrink-0" />
          <span>FoodBridge requires email verification and admin approval before accessing dashboard features.</span>
        </div>

        <div className="pt-2 space-y-2.5">
          <Link to="/auth/login">
            <Button variant="primary" className="w-full" icon={ArrowRight}>
              Proceed to Sign In
            </Button>
          </Link>
          <Link to="/">
            <Button variant="secondary" className="w-full">
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </AuthShell>
  )
}
