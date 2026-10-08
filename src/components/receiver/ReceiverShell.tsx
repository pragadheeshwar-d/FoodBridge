import { Link } from 'react-router-dom'
import { Moon, Sun } from 'lucide-react'
import { DashboardLayout, TopBar } from '../layout/DashboardLayout'
import { Input } from '../ui/Input'
import { NotificationBell } from '../ui/SharedComponents'
import { useTheme } from '../../context/ThemeContext'
import { receiverNavItems } from '../../pages/receiver/receiverNav'
import { useAuth } from '../../context/AuthContext'

export function ReceiverShell({
  children,
}: {
  children: React.ReactNode
}) {
  const { theme, toggleTheme } = useTheme()
  const { user } = useAuth()

  return (
    <DashboardLayout navItems={receiverNavItems} role="receiver">
      <TopBar
        search={<Input placeholder="Search donations, NGOs..." icon />}
        extra={
          <>
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-text dark:text-gray-100 transition-colors"
            >
              {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>
            <NotificationBell />
          </>
        }
        profile={
          <Link to="/receiver/profile" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-primary/10 text-primary text-sm font-bold ring-2 ring-primary/20">
              {user?.name?.slice(0, 2).toUpperCase() || 'RV'}
            </span>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-semibold">{user?.name || 'Receiver'}</p>
              <p className="text-xs text-text-secondary">{user?.organization || 'NGO Partner'}</p>
            </div>
          </Link>
        }
      />
      {children}
    </DashboardLayout>
  )
}
