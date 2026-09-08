import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  MailCheck,
  Search,
  RefreshCw,
  ShieldCheck,
  Building2,
  AlertTriangle,
  ChevronRight,
  LogOut,
  Check,
  X,
  Sparkles,
} from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Input, Select } from '../../components/ui/Input'
import { AnimatedCounter } from '../../components/ui/AnimatedCounter'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { Logo } from '../../components/layout/Logo'
import api from '../../lib/api'

interface AdminStats {
  totalUsers: number
  pendingApprovals: number
  approvedUsers: number
  rejectedUsers: number
  emailVerifiedUsers: number
}

interface AdminUser {
  id: number
  name: string
  email: string
  role: 'donor' | 'receiver' | 'admin'
  organization?: string | null
  phone?: string | null
  address?: string | null
  business_type?: string | null
  operating_hours?: string | null
  verified: boolean
  status: 'pending' | 'approved' | 'rejected' | 'suspended'
  approved_at?: string | null
  rejected_at?: string | null
  rejection_reason?: string | null
  created_at?: string | null
}

export default function AdminPortal() {
  const { user: currentAdmin, logout } = useAuth()
  const { toast } = useToast()

  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    pendingApprovals: 0,
    approvedUsers: 0,
    rejectedUsers: 0,
    emailVerifiedUsers: 0,
  })
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')
  const [roleFilter, setRoleFilter] = useState<'all' | 'donor' | 'receiver'>('all')
  const [search, setSearch] = useState('')
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null)
  const [recentlyApprovedId, setRecentlyApprovedId] = useState<number | null>(null)

  // Rejection modal state
  const [rejectModalUser, setRejectModalUser] = useState<AdminUser | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')

  // View Details modal
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null)

  const fetchData = async () => {
    setLoading(true)
    try {
      const [statsRes, usersRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/users', {
          params: {
            status: statusFilter,
            role: roleFilter,
            search,
          },
        }),
      ])
      const rawStats = statsRes.data?.data ?? statsRes.data
      if (rawStats && typeof rawStats === 'object') {
        setStats({
          totalUsers: Number(rawStats.totalUsers ?? 0),
          pendingApprovals: Number(rawStats.pendingApprovals ?? 0),
          approvedUsers: Number(rawStats.approvedUsers ?? 0),
          rejectedUsers: Number(rawStats.rejectedUsers ?? 0),
          emailVerifiedUsers: Number(rawStats.emailVerifiedUsers ?? 0),
        })
      }

      const rawUsers =
        usersRes.data?.users ??
        usersRes.data?.data?.users ??
        (Array.isArray(usersRes.data) ? usersRes.data : [])

      if (Array.isArray(rawUsers)) {
        setUsers(rawUsers)
      }
    } catch (error: any) {
      toast(error?.response?.data?.message || 'Failed to load admin data', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, roleFilter])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    void fetchData()
  }

  const handleApprove = async (userToApprove: AdminUser) => {
    setActionLoadingId(userToApprove.id)
    try {
      await api.post(`/admin/users/${userToApprove.id}/approve`)
      setRecentlyApprovedId(userToApprove.id)
      toast(`Approved ${userToApprove.name} (${userToApprove.organization || userToApprove.email})`, 'success')

      // Optimistic update
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userToApprove.id ? { ...u, status: 'approved', approved_at: new Date().toISOString(), rejection_reason: null } : u
        )
      )
      setStats((prev) => ({
        ...prev,
        pendingApprovals: Math.max(0, prev.pendingApprovals - 1),
        approvedUsers: prev.approvedUsers + 1,
      }))

      setTimeout(() => setRecentlyApprovedId(null), 2500)
    } catch (error: any) {
      toast(error?.response?.data?.message || 'Failed to approve user', 'error')
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleRejectConfirm = async () => {
    if (!rejectModalUser) return
    setActionLoadingId(rejectModalUser.id)
    try {
      await api.post(`/admin/users/${rejectModalUser.id}/reject`, {
        rejection_reason: rejectionReason.trim(),
      })
      toast(`Registration for ${rejectModalUser.name} rejected`, 'info')

      // Optimistic update
      setUsers((prev) =>
        prev.map((u) =>
          u.id === rejectModalUser.id
            ? {
                ...u,
                status: 'rejected',
                rejected_at: new Date().toISOString(),
                rejection_reason: rejectionReason.trim() || 'Not meeting requirements',
              }
            : u
        )
      )
      setStats((prev) => ({
        ...prev,
        pendingApprovals: Math.max(0, prev.pendingApprovals - 1),
        rejectedUsers: prev.rejectedUsers + 1,
      }))
      setRejectModalUser(null)
      setRejectionReason('')
    } catch (error: any) {
      toast(error?.response?.data?.message || 'Failed to reject user', 'error')
    } finally {
      setActionLoadingId(null)
    }
  }

  const pendingUsers = useMemo(() => users.filter((u) => u.status === 'pending'), [users])

  return (
    <div className="min-h-screen bg-surface dark:bg-gray-950 text-text dark:text-gray-100 flex flex-col">
      {/* Admin Top Navigation */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/80 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo size="md" />
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary uppercase tracking-wider border border-primary/20">
              Admin Portal
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-xs text-text-secondary">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Signed in as <strong className="text-text dark:text-white">{currentAdmin?.name || 'Admin'}</strong></span>
            </div>
            <Button variant="ghost" size="sm" icon={RefreshCw} onClick={fetchData}>
              Refresh
            </Button>
            <Button variant="secondary" size="sm" icon={LogOut} onClick={logout}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              Account Approvals & Platform Governance
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">FoodBridge Admin Dashboard</h1>
            <p className="text-sm text-text-secondary mt-1">
              Review new registrations, approve verified organizations, and manage platform safety.
            </p>
          </div>
        </div>

        {/* Real-time Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="stat-card"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs uppercase tracking-wider text-text-secondary font-medium">Total Users</span>
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <p className="stat-value text-2xl font-bold">
              <AnimatedCounter value={stats.totalUsers} />
            </p>
            <p className="text-[11px] text-text-secondary mt-1">Donors & Receivers</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.05 }}
            className="stat-card border-amber-300/40 dark:border-amber-700/40 bg-amber-50/30 dark:bg-amber-950/20"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs uppercase tracking-wider text-amber-700 dark:text-amber-300 font-bold">
                Pending Approvals
              </span>
              <div className="p-2 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <p className="stat-value text-2xl font-bold text-amber-600 dark:text-amber-400">
              <AnimatedCounter value={stats.pendingApprovals} />
            </p>
            <p className="text-[11px] text-amber-700/80 dark:text-amber-400/80 mt-1">Requires review</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="stat-card border-emerald-300/40 dark:border-emerald-700/40 bg-emerald-50/30 dark:bg-emerald-950/20"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs uppercase tracking-wider text-emerald-700 dark:text-emerald-300 font-bold">
                Approved Users
              </span>
              <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <p className="stat-value text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              <AnimatedCounter value={stats.approvedUsers} />
            </p>
            <p className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80 mt-1">Active platform access</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.15 }}
            className="stat-card"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs uppercase tracking-wider text-text-secondary font-medium">Rejected</span>
              <div className="p-2 rounded-xl bg-red-500/10 text-red-500">
                <XCircle className="w-4 h-4" />
              </div>
            </div>
            <p className="stat-value text-2xl font-bold text-red-500">
              <AnimatedCounter value={stats.rejectedUsers} />
            </p>
            <p className="text-[11px] text-text-secondary mt-1">Not approved</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="stat-card"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs uppercase tracking-wider text-text-secondary font-medium">Email Verified</span>
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
                <MailCheck className="w-4 h-4" />
              </div>
            </div>
            <p className="stat-value text-2xl font-bold text-blue-600 dark:text-blue-400">
              <AnimatedCounter value={stats.emailVerifiedUsers} />
            </p>
            <p className="text-[11px] text-text-secondary mt-1">Confirmed emails</p>
          </motion.div>
        </div>

        {/* Priority Pending Queue */}
        {pendingUsers.length > 0 && (
          <div className="glass-card p-6 border-amber-300/60 dark:border-amber-700/60">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-3 h-3 rounded-full bg-amber-500 animate-ping" />
                <h2 className="text-lg font-bold">Pending Review Queue ({pendingUsers.length})</h2>
              </div>
              <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                Action required
              </span>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pendingUsers.map((pendingUser) => {
                const isActionLoading = actionLoadingId === pendingUser.id
                const isJustApproved = recentlyApprovedId === pendingUser.id

                return (
                  <motion.div
                    key={pendingUser.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              pendingUser.role === 'donor'
                                ? 'bg-primary/10 text-primary'
                                : 'bg-accent/20 text-accent-dark dark:text-accent'
                            }`}
                          >
                            {pendingUser.role}
                          </span>
                          <h3 className="font-bold text-base mt-1">{pendingUser.name}</h3>
                          <p className="text-xs text-text-secondary flex items-center gap-1 mt-0.5">
                            <Building2 className="w-3 h-3" />
                            {pendingUser.organization || 'Individual Donor'}
                          </p>
                        </div>

                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            pendingUser.verified
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300'
                          }`}
                        >
                          {pendingUser.verified ? 'Email ✓' : 'Email Unverified'}
                        </span>
                      </div>

                      <div className="text-xs text-text-secondary space-y-1 my-3 bg-gray-50 dark:bg-gray-900/50 p-2.5 rounded-lg">
                        <p className="truncate"><strong>Email:</strong> {pendingUser.email}</p>
                        {pendingUser.phone && <p><strong>Phone:</strong> {pendingUser.phone}</p>}
                        {pendingUser.address && <p className="truncate"><strong>Location:</strong> {pendingUser.address}</p>}
                        <p className="text-[10px] text-text-secondary/70">
                          Registered: {pendingUser.created_at ? new Date(pendingUser.created_at).toLocaleDateString() : 'Recent'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                      <Button
                        variant="primary"
                        size="sm"
                        className="flex-1 text-xs"
                        loading={isActionLoading}
                        onClick={() => handleApprove(pendingUser)}
                      >
                        {isJustApproved ? (
                          <span className="inline-flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" /> Approved ✓
                          </span>
                        ) : (
                          'Approve'
                        )}
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="flex-1 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                        onClick={() => {
                          setRejectModalUser(pendingUser)
                          setRejectionReason('')
                        }}
                      >
                        Reject
                      </Button>
                      <button
                        type="button"
                        onClick={() => setSelectedUser(pendingUser)}
                        className="p-2 text-text-secondary hover:text-text hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        title="View details"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </div>
        )}

        {/* User Management Table */}
        <div className="glass-card overflow-hidden">
          <div className="p-6 border-b border-gray-200/80 dark:border-gray-800 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold">User Directory</h2>
                <p className="text-xs text-text-secondary mt-0.5">
                  Filter, search, and manage all accounts across the FoodBridge ecosystem.
                </p>
              </div>

              {/* Status Filter Tabs */}
              <div className="flex flex-wrap gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
                {(['all', 'pending', 'approved', 'rejected'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setStatusFilter(tab)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                      statusFilter === tab
                        ? 'bg-white dark:bg-gray-700 text-primary font-bold shadow-sm'
                        : 'text-text-secondary hover:text-text'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Search and Role Filter Bar */}
            <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <Input
                  icon={Search}
                  placeholder="Search by name, organization, email, or phone..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="w-full sm:w-48">
                <Select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value as any)}
                  options={[
                    { value: 'all', label: 'All Roles' },
                    { value: 'donor', label: 'Donors only' },
                    { value: 'receiver', label: 'Receivers only' },
                  ]}
                />
              </div>
              <Button type="submit" variant="secondary">
                Search
              </Button>
            </form>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-12 flex flex-col items-center justify-center gap-3 text-text-secondary">
                <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                <span>Loading user directory...</span>
              </div>
            ) : users.length === 0 ? (
              <div className="p-12 text-center text-text-secondary">
                <AlertTriangle className="w-10 h-10 mx-auto opacity-30 mb-2" />
                <p className="font-semibold text-base">No users found</p>
                <p className="text-xs mt-1">Try adjusting your search or status filters.</p>
              </div>
            ) : (
              <table className="w-full text-left text-sm border-collapse min-w-[760px]">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-800 text-xs uppercase tracking-wider text-text-secondary bg-gray-50/50 dark:bg-gray-900/50">
                    <th className="p-4 font-semibold">User / Organization</th>
                    <th className="p-4 font-semibold">Role</th>
                    <th className="p-4 font-semibold">Email Verification</th>
                    <th className="p-4 font-semibold">Account Status</th>
                    <th className="p-4 font-semibold">Registered</th>
                    <th className="p-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60">
                  {users.map((u) => {
                    const isActionLoading = actionLoadingId === u.id
                    const isJustApproved = recentlyApprovedId === u.id

                    return (
                      <tr
                        key={u.id}
                        className="hover:bg-gray-50/60 dark:hover:bg-gray-800/40 transition-colors"
                      >
                        <td className="p-4">
                          <p className="font-bold text-text dark:text-white">{u.name}</p>
                          <p className="text-xs text-text-secondary flex items-center gap-1 mt-0.5">
                            <Building2 className="w-3 h-3 text-text-secondary/70" />
                            {u.organization || 'Individual Donor'}
                          </p>
                          <p className="text-xs text-text-secondary/70">{u.email}</p>
                        </td>

                        <td className="p-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${
                              u.role === 'donor'
                                ? 'bg-primary/10 text-primary'
                                : 'bg-accent/15 text-accent-dark dark:text-accent'
                            }`}
                          >
                            {u.role}
                          </span>
                        </td>

                        <td className="p-4">
                          {u.verified ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                              <Check className="w-3 h-3" /> Verified
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400">
                              <Clock className="w-3 h-3" /> Pending
                            </span>
                          )}
                        </td>

                        <td className="p-4">
                          {u.status === 'approved' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Approved ✓
                            </span>
                          ) : u.status === 'pending' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                              <Clock className="w-3.5 h-3.5" /> Pending ⏳
                            </span>
                          ) : u.status === 'rejected' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
                              <XCircle className="w-3.5 h-3.5" /> Rejected ✕
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                              {u.status}
                            </span>
                          )}
                        </td>

                        <td className="p-4 text-xs text-text-secondary">
                          {u.created_at ? new Date(u.created_at).toLocaleDateString() : '-'}
                        </td>

                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {u.status === 'pending' ? (
                              <>
                                <Button
                                  variant="primary"
                                  size="sm"
                                  loading={isActionLoading}
                                  onClick={() => handleApprove(u)}
                                >
                                  {isJustApproved ? 'Approved ✓' : 'Approve'}
                                </Button>
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  onClick={() => {
                                    setRejectModalUser(u)
                                    setRejectionReason('')
                                  }}
                                >
                                  Reject
                                </Button>
                              </>
                            ) : u.status === 'rejected' ? (
                              <Button
                                variant="secondary"
                                size="sm"
                                loading={isActionLoading}
                                onClick={() => handleApprove(u)}
                              >
                                Re-Approve
                              </Button>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedUser(u)}
                              >
                                Details
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>

      {/* Reject Modal */}
      <AnimatePresence>
        {rejectModalUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setRejectModalUser(null)}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative z-10 w-full max-w-md glass-card p-6 md:p-8 space-y-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-bold text-red-600 dark:text-red-400 flex items-center gap-2">
                    <XCircle className="w-5 h-5" /> Reject Registration
                  </h3>
                  <p className="text-xs text-text-secondary mt-1">
                    Rejecting {rejectModalUser.name} ({rejectModalUser.organization || rejectModalUser.email}).
                  </p>
                </div>
                <button
                  onClick={() => setRejectModalUser(null)}
                  className="p-1 rounded-lg text-text-secondary hover:text-text"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-text-secondary">
                  Optional Reason for Rejection:
                </label>
                <textarea
                  className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20"
                  rows={3}
                  placeholder="e.g. Duplicate registration or invalid contact details..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => setRejectModalUser(null)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                  loading={actionLoadingId === rejectModalUser.id}
                  onClick={handleRejectConfirm}
                >
                  Confirm Rejection
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* User Details Modal */}
      <AnimatePresence>
        {selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setSelectedUser(null)}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative z-10 w-full max-w-lg glass-card p-6 md:p-8 space-y-5"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-primary">
                    {selectedUser.role} Account Details
                  </span>
                  <h3 className="text-2xl font-bold mt-1">{selectedUser.name}</h3>
                </div>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="p-1 rounded-lg text-text-secondary hover:text-text"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60">
                  <span className="text-text-secondary">Organization</span>
                  <p className="font-bold text-sm text-text dark:text-white mt-0.5">
                    {selectedUser.organization || 'Individual'}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60">
                  <span className="text-text-secondary">Email</span>
                  <p className="font-bold text-sm text-text dark:text-white mt-0.5">
                    {selectedUser.email}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60">
                  <span className="text-text-secondary">Phone</span>
                  <p className="font-bold text-sm text-text dark:text-white mt-0.5">
                    {selectedUser.phone || 'Not provided'}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60">
                  <span className="text-text-secondary">Address</span>
                  <p className="font-bold text-sm text-text dark:text-white mt-0.5">
                    {selectedUser.address || 'Not provided'}
                  </p>
                </div>
                {selectedUser.operating_hours && (
                  <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 sm:col-span-2">
                    <span className="text-text-secondary">Operating Hours</span>
                    <p className="font-bold text-sm text-text dark:text-white mt-0.5">
                      {selectedUser.operating_hours}
                    </p>
                  </div>
                )}
                <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60">
                  <span className="text-text-secondary">Status</span>
                  <p className="font-bold text-sm capitalize text-text dark:text-white mt-0.5">
                    {selectedUser.status}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60">
                  <span className="text-text-secondary">Email Verified</span>
                  <p className="font-bold text-sm text-text dark:text-white mt-0.5">
                    {selectedUser.verified ? 'Yes ✓' : 'No ✕'}
                  </p>
                </div>
                {selectedUser.rejection_reason && (
                  <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 sm:col-span-2">
                    <span className="text-red-700 dark:text-red-300 font-bold">Rejection Reason:</span>
                    <p className="text-xs text-red-800 dark:text-red-200 mt-0.5">
                      {selectedUser.rejection_reason}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                {selectedUser.status === 'pending' && (
                  <Button
                    variant="primary"
                    className="flex-1"
                    onClick={() => {
                      setSelectedUser(null)
                      void handleApprove(selectedUser)
                    }}
                  >
                    Approve Account
                  </Button>
                )}
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => setSelectedUser(null)}
                >
                  Close
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
