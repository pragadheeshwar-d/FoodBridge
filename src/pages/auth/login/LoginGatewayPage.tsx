import { Link } from 'react-router-dom'
import { ArrowRight, Building2, UtensilsCrossed, Shield } from 'lucide-react'
import { AuthShell } from '../AuthShell'

const options = [
  {
    title: 'I am a Donor',
    subtitle: 'For restaurants, hotels, caterers, supermarkets, and food partners.',
    to: '/auth/login/donor',
    icon: UtensilsCrossed,
  },
  {
    title: 'I am a Receiver',
    subtitle: 'For NGOs, shelters, food banks, and distribution teams.',
    to: '/auth/login/receiver',
    icon: Building2,
  },
]

export function LoginGatewayPage() {
  return (
    <AuthShell
      title="Choose your sign in portal"
      subtitle="Pick the account type that matches how you use Food Bridge."
    >
      <div className="space-y-4">
        {options.map((option) => {
          const Icon = option.icon
          return (
            <Link
              key={option.to}
              to={option.to}
              className="block rounded-3xl border border-gray-200 dark:border-gray-700 p-5 bg-white/70 dark:bg-gray-900/40 hover:border-primary/40 hover:shadow-soft transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{option.title}</h3>
                    <p className="text-sm text-text-secondary mt-1 leading-relaxed">{option.subtitle}</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-text-secondary mt-1" />
              </div>
            </Link>
          )
        })}
      </div>

      <div className="mt-8 pt-4 border-t border-gray-100 dark:border-gray-800 text-center">
        <Link
          to="/admin/login"
          className="inline-flex items-center gap-1.5 text-xs text-text-secondary hover:text-primary transition-colors opacity-75 hover:opacity-100"
        >
          <Shield className="w-3.5 h-3.5" />
          <span>Admin Login Portal</span>
        </Link>
      </div>
    </AuthShell>
  )
}
