import { Link } from 'react-router-dom'
import { Moon, Sun, Plus } from 'lucide-react'
import { DashboardLayout, TopBar } from '../layout/DashboardLayout'
import { Input } from '../ui/Input'
import { NotificationBell } from '../ui/SharedComponents'
import { useTheme } from '../../context/ThemeContext'
import { donorNavItems } from '../../pages/donor/donorNav'
import { useAuth } from '../../context/AuthContext'
import { FoodReceivedCelebrationPopup } from './FoodReceivedCelebrationPopup'

export function DonorShell({
  children,
  fab = true,
}: {
  children: React.ReactNode
  fab?: boolean
}) {
  const { theme, toggleTheme } = useTheme()
  const { user } = useAuth()

  return (
    <DashboardLayout navItems={donorNavItems} role="donor">
      <TopBar
        search={
          <div className="relative flex items-center w-full max-w-lg">
            <Input
              placeholder="Search donations, NGOs, locations..."
              icon
              className="bg-slate-900/60 border-slate-800 focus:border-emerald-500 text-xs sm:text-sm"
            />
          </div>
        }
        extra={
          <>
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 text-text dark:text-gray-100 transition-colors"
            >
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>
            <NotificationBell />
          </>
        }
        profile={
          <Link to="/donor/profile" className="flex items-center gap-2.5 pl-2 group">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-400 text-xs font-bold border border-emerald-500/30">
              {user?.name?.slice(0, 2).toUpperCase() || 'PD'}
            </span>
            <div className="hidden sm:block text-left leading-tight">
              <p className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors">
                {user?.name || 'Pragadheeshwar D'}
              </p>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">
                {user?.organization || 'ICT GRAND CHOLA'}
              </p>
            </div>
          </Link>
        }
      />
      <FoodReceivedCelebrationPopup />
      {children}
      {fab && (
        <Link to="/donor/add" className="lg:hidden fixed bottom-20 right-4 z-30">
          <button className="w-14 h-14 rounded-2xl bg-primary text-white shadow-elevated flex items-center justify-center hover:scale-105 transition-transform">
            <Plus className="w-6 h-6" />
          </button>
        </Link>
      )}
    </DashboardLayout>
  )
}
