import { motion } from 'framer-motion'
import { ShieldCheck, Sparkles } from 'lucide-react'
import { Logo } from '../../components/layout/Logo'

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle: string
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(46,125,50,0.18),_transparent_34%),radial-gradient(circle_at_top_right,_rgba(249,168,37,0.16),_transparent_28%),linear-gradient(180deg,_#fbfdf9_0%,_#f4f8f3_100%)] dark:bg-[radial-gradient(circle_at_top_left,_rgba(46,125,50,0.25),_transparent_34%),radial-gradient(circle_at_top_right,_rgba(249,168,37,0.18),_transparent_28%),linear-gradient(180deg,_#05070a_0%,_#090d0a_100%)]">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <Logo />
      </div>

      <div className="mx-auto flex min-h-[calc(100vh-84px)] max-w-3xl items-center px-4 pb-10 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full"
        >
          <div className="rounded-[2rem] border border-white/70 bg-white/85 p-6 shadow-[0_30px_100px_rgba(15,23,42,0.12)] backdrop-blur-xl dark:border-gray-800 dark:bg-gray-900/85 sm:p-8">
            <div className="mb-8 space-y-3">
              <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                Secure role-based access
              </span>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
              <p className="max-w-2xl text-sm leading-6 text-text-secondary sm:text-base">{subtitle}</p>
            </div>

            <div className="space-y-6">
              {children}
            </div>

            <div className="mt-6 flex items-center gap-2 text-xs text-text-secondary">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
              Donors and receivers sign in through their own portal.
            </div>

            <p className="mt-4 text-xs leading-5 text-text-secondary">
              By continuing, you agree to our Terms and Privacy Policy. Session state is stored locally in this frontend demo.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
