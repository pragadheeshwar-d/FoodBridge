import { Link } from 'react-router-dom'
import { ArrowRight, UtensilsCrossed, Gift, Building2 } from 'lucide-react'
import { AuthShell } from '../AuthShell'

const options = [
  {
    title: 'I want to Donate Food',
    subtitle: 'For restaurants, hotels, caterers, supermarkets, households, and catering teams.',
    to: '/auth/signup/donor',
    icon: UtensilsCrossed,
  },
  {
    title: 'I need to Receive Food',
    subtitle: 'For NGOs, shelters, food banks, and community distribution teams.',
    to: '/auth/signup/receiver',
    icon: Building2,
  },
]

export function SignupGatewayPage() {
  return (
    <AuthShell
      title="Choose your Food Bridge path"
      subtitle="Select the account type that matches how you'll use the platform."
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

      <div className="mt-6 rounded-2xl bg-primary/5 border border-primary/10 p-4 text-sm text-text-secondary flex items-start gap-3">
        <Gift className="w-5 h-5 text-primary shrink-0 mt-0.5" />
        Select how you want to use the platform.
      </div>
    </AuthShell>
  )
}
