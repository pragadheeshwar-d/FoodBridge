import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, Moon, Sun, ChevronDown, LogOut, ShieldCheck } from 'lucide-react'
import { Logo } from './Logo'
import { Button } from '../ui/Button'
import { useTheme } from '../../context/ThemeContext'
import { useAuth } from '../../context/AuthContext'

const navLinks = [
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Impact', href: '#impact' },
  { label: 'Network', href: '#network' },
  { label: 'FAQ', href: '#faq' },
]

function dashboardPath(role?: string): string {
  if (role === 'admin' || role === 'super_admin') return '/admin'
  if (role === 'receiver') return '/receiver'
  return '/donor'
}

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [dashOpen, setDashOpen] = useState(false)
  const { theme, toggleTheme } = useTheme()
  const { user, logout } = useAuth()

  return (
    <nav className="fixed top-0 inset-x-0 z-50 bg-white/70 dark:bg-gray-950/70 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-800/50 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Logo />

          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-text-secondary dark:text-gray-300 hover:text-primary transition-all duration-200 hover:-translate-y-0.5 relative py-1 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-primary hover:after:w-full after:transition-all after:duration-300"
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={toggleTheme}
              aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
              className="p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-300 text-text dark:text-gray-100 hover:rotate-12"
            >
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>

            {user ? (
              <div className="relative">
                <button
                  onClick={() => setDashOpen(!dashOpen)}
                  className="flex items-center gap-2 text-sm font-medium text-text-secondary hover:text-primary transition-colors px-3 py-2"
                >
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold">
                    {user.name.slice(0, 2).toUpperCase()}
                  </span>
                  <span className="hidden xl:inline">{user.name}</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${dashOpen ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {dashOpen && (
                    <>
                      <div className="fixed inset-0" onClick={() => setDashOpen(false)} />
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.96 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 top-full mt-1 w-56 glass-card py-2 z-50 shadow-elevated"
                      >
                        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                          <p className="text-sm font-semibold">{user.name}</p>
                          <p className="text-xs text-text-secondary flex items-center gap-1 mt-1 capitalize">
                            <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                            {user.role.replace('_', ' ')}
                          </p>
                        </div>
                        {user.role === 'admin' || user.role === 'super_admin' ? (
                          <Link to="/admin" className="block px-4 py-2.5 text-sm hover:bg-primary/5 transition-colors font-medium text-primary" onClick={() => setDashOpen(false)}>
                            Admin Portal
                          </Link>
                        ) : (
                          <>
                            <Link to={dashboardPath(user.role)} className="block px-4 py-2.5 text-sm hover:bg-primary/5 transition-colors" onClick={() => setDashOpen(false)}>Dashboard</Link>
                            {user.role === 'donor' && (
                              <Link to="/donor/add" className="block px-4 py-2.5 text-sm hover:bg-primary/5 transition-colors" onClick={() => setDashOpen(false)}>Create Donation</Link>
                            )}
                            {user.role === 'receiver' && (
                              <Link to="/receiver/donations" className="block px-4 py-2.5 text-sm hover:bg-primary/5 transition-colors" onClick={() => setDashOpen(false)}>Browse Donations</Link>
                            )}
                          </>
                        )}
                        <button
                          onClick={async () => {
                            setDashOpen(false)
                            await logout()
                          }}
                          className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          Sign out
                        </button>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link to="/auth/login" className="text-sm font-medium text-text-secondary hover:text-primary transition-colors px-3 py-2">
                  Sign in
                </Link>
                <Link to="/auth/signup">
                  <Button variant="primary" size="sm">Create Account</Button>
                </Link>
              </div>
            )}
          </div>

          <div className="flex md:hidden items-center gap-2">
            <button onClick={toggleTheme} className="p-2 rounded-lg">
              {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>
            <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2 rounded-lg">
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950"
          >
            <div className="px-4 py-4 space-y-3">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="block text-sm font-medium py-2"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </a>
              ))}

              <div className="pt-2 space-y-2">
                {user ? (
                  <>
                    <Link to={dashboardPath(user.role)} className="block text-sm py-2" onClick={() => setMobileOpen(false)}>
                      Dashboard
                    </Link>
                    <Link to="/donor/add" className="block text-sm py-2" onClick={() => setMobileOpen(false)}>
                      Create Donation
                    </Link>
                  </>
                ) : null}
                <Link to="/auth/login" onClick={() => setMobileOpen(false)}>
                  <Button variant="secondary" className="w-full">Sign In</Button>
                </Link>
                <Link to="/auth/signup" onClick={() => setMobileOpen(false)}>
                  <Button variant="primary" className="w-full">Create Account</Button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}

export function Footer() {
  return (
    <footer className="bg-sidebar text-gray-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="md:col-span-1">
            <Logo light />
            <p className="mt-4 text-sm leading-relaxed">
              Connecting surplus food with those who need it most across Tamil Nadu. Together, we can end food waste and hunger statewide.
            </p>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Platform</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a></li>
              <li><Link to="/donor" className="hover:text-white transition-colors">For Donors</Link></li>
              <li><Link to="/receiver" className="hover:text-white transition-colors">For NGOs</Link></li>
              <li><a href="#impact" className="hover:text-white transition-colors">Our Impact</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Resources</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
              <li><a href="#" className="hover:text-white transition-colors">API Reference</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
              <li><a href="#faq" className="hover:text-white transition-colors">FAQ</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Contact</h4>
            <ul className="space-y-2 text-sm">
              <li>support@foodbridge.org</li>
              <li>+91 (0) 44 4567 8900</li>
              <li>Chennai, Tamil Nadu, India</li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-gray-800 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm">
          <div>
            <p>&copy; 2026 Food Bridge. Connecting surplus food with people in need.</p>
            <p className="text-xs text-gray-500 mt-1">Version 1.0.0 &bull; Tamil Nadu, India</p>
          </div>
          <div className="flex flex-wrap gap-4 sm:gap-6">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-white transition-colors">Support</a>
            <a href="mailto:support@foodbridge.org" className="hover:text-white transition-colors">Contact</a>
            <a href="https://github.com" className="hover:text-white transition-colors">GitHub</a>
            <a href="https://linkedin.com" className="hover:text-white transition-colors">LinkedIn</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
