import { useState, useMemo } from 'react'
import {
  ShieldCheck,
  MapPin,
  Mail,
  Phone,
  Building2,
  Calendar,
  Edit2,
  Lock,
  UtensilsCrossed,
  Recycle,
  Users,
  PackageCheck,
  CheckCircle2,
  ChevronRight,
  Leaf,
  Sparkles,
  ArrowRight,
  Check,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { DonorShell } from '../../components/donor/DonorShell'
import { EditProfileModal } from '../../components/donor/EditProfileModal'
import { ChangePasswordModal } from '../../components/donor/ChangePasswordModal'
import { UpdateOrgModal } from '../../components/donor/UpdateOrgModal'
import { DonorDocumentsModal } from '../../components/donor/DonorDocumentsModal'
import { DonationHistoryModal } from '../../components/donor/DonationHistoryModal'
import { useAuth } from '../../context/AuthContext'
import { useDonationStats } from '../../hooks/useDonationStats'

export default function DonorProfilePage() {
  const { user } = useAuth()
  const { stats } = useDonationStats()

  // Modal visibility states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)
  const [isUpdateOrgModalOpen, setIsUpdateOrgModalOpen] = useState(false)
  const [isDocumentsModalOpen, setIsDocumentsModalOpen] = useState(false)
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false)

  // Chart timeframe state
  const [chartPeriod, setChartPeriod] = useState<'year' | '6months' | 'all'>('year')

  // Selected achievement for interactive drawer/detail view
  const [selectedAchievement, setSelectedAchievement] = useState<string | null>(null)

  // Authentic donor data from logged-in user and dynamic stats (no dummy defaults)
  const donorData = useMemo(() => {
    const isApproved = Boolean(user?.verified) || user?.status === 'approved'
    const totalDonations = stats.totalDonationEvents || 0
    const totalMeals = stats.totalMeals || 0
    const foodWasteKg = stats.foodWastePrevented || 0

    return {
      name: user?.name || user?.organization || 'Donor Account',
      organization: user?.organization || user?.name || 'Organization Name',
      email: user?.email || '',
      phone: user?.phone || '',
      location: user?.address || '',
      memberSince: user?.createdAt
        ? new Date(user.createdAt).getFullYear().toString()
        : '',
      isVerified: isApproved,
      totalDonations,
      totalMeals,
      foodWasteDivertedKg: foodWasteKg,
      peopleSupported: totalMeals,
      contributionLevel:
        totalDonations >= 50
          ? 'FoodBridge Hero'
          : totalDonations >= 25
          ? 'Community Champion'
          : totalDonations >= 10
          ? 'Active Contributor'
          : 'New Member',
      donationsToNextLevel: Math.max(0, 10 - totalDonations),
      nextLevelName: 'Active Contributor',
      targetDonationsForNextLevel: 10,
      avatarUrl: user?.avatarUrl || '',
    }
  }, [user, stats])

  // Chart monthly datasets
  const chartDataYear = [
    { month: 'Jan', meals: 20 },
    { month: 'Feb', meals: 35 },
    { month: 'Mar', meals: 40 },
    { month: 'Apr', meals: 55 },
    { month: 'May', meals: 70 },
    { month: 'Jun', meals: 90 },
    { month: 'Jul', meals: 100 },
    { month: 'Aug', meals: 120 },
    { month: 'Sep', meals: 150 },
  ]

  const chartData6Months = [
    { month: 'Apr', meals: 55 },
    { month: 'May', meals: 70 },
    { month: 'Jun', meals: 90 },
    { month: 'Jul', meals: 100 },
    { month: 'Aug', meals: 120 },
    { month: 'Sep', meals: 150 },
  ]

  const chartDataAll = [
    { month: 'Q1', meals: 95 },
    { month: 'Q2', meals: 215 },
    { month: 'Q3', meals: 370 },
  ]

  const activeChartData = useMemo(() => {
    if (chartPeriod === '6months') return chartData6Months
    if (chartPeriod === 'all') return chartDataAll
    return chartDataYear
  }, [chartPeriod])

  // Contribution journey steps
  const journeySteps = [
    { name: 'New Member', icon: '🌱', active: true, completed: true, desc: 'Current tier' },
    { name: 'Active Contributor', icon: '⭐', active: false, completed: false, desc: '10 verified donations' },
    { name: 'Community Champion', icon: '🏆', active: false, completed: false, desc: '25 verified donations' },
    { name: 'FoodBridge Hero', icon: '👑', active: false, completed: false, desc: '50+ verified donations' },
  ]

  // Recent donations data
  const recentDonations = [
    {
      id: 'DON-2026-001',
      date: 'Sep 04, 2026',
      amount: '80 meals donated',
      meals: 80,
      organization: 'ICT GRAND CHOLA',
      status: 'Delivered',
      description: 'Meals reached people in need.',
      badgeColor: 'emerald',
      itemType: 'Surplus Lunch Buffet Assortment',
      icon: '🍲',
    },
    {
      id: 'DON-2026-002',
      date: 'Aug 28, 2026',
      amount: '70 meals donated',
      meals: 70,
      organization: 'ICT GRAND CHOLA',
      status: 'Delivered',
      description: 'Meals reached people in need.',
      badgeColor: 'emerald',
      itemType: 'Steamed Rice & Veg Gravies',
      icon: '🍛',
    },
  ]

  // Achievements data
  const achievements = [
    {
      id: 'first-donation',
      title: 'First Donation',
      icon: '🍽',
      status: 'Earned',
      description: 'Complete your first donation',
      percent: 100,
      meta: 'Unlocked on Aug 28, 2026',
    },
    {
      id: 'ten-donations',
      title: '10 Donations',
      icon: '📦',
      status: 'In Progress',
      progressText: '2 / 10',
      description: 'Complete 10 verified donations',
      percent: 20,
      meta: '8 donations remaining',
    },
    {
      id: 'zero-waste',
      title: 'Zero Waste Champion',
      icon: '♻',
      status: 'Locked',
      description: 'Help divert significant food waste',
      percent: 15,
      meta: 'Reach 100 kg diverted food',
    },
  ]

  return (
    <DonorShell fab={false}>
      <div className="max-w-7xl mx-auto space-y-6 text-slate-100 pb-12">
        {/* ========================================================================= */}
        {/* PAGE HEADER */}
        {/* ========================================================================= */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
                Your FoodBridge Profile
              </h1>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Verified Donor
              </span>
            </div>
            <p className="text-slate-400 text-sm mt-1.5 max-w-2xl">
              Track your donations, achievements, and the difference you&apos;re making in your community.
            </p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-center">
            <span className="text-xs px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 flex items-center gap-1.5 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Donor Impact Center
            </span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 1. DONOR PROFILE HEADER CARD */}
        {/* ========================================================================= */}
        <div className="rounded-2xl bg-slate-900/90 border border-slate-800/90 p-5 md:p-6 shadow-xl backdrop-blur-sm">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            {/* Left profile info */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 w-full lg:w-auto">
              <div className="relative group shrink-0">
                {donorData.avatarUrl ? (
                  <img
                    src={donorData.avatarUrl}
                    alt={donorData.name}
                    className="w-20 h-20 md:w-24 md:h-24 rounded-2xl object-cover ring-2 ring-primary/40 bg-slate-800"
                  />
                ) : (
                  <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-gradient-to-br from-primary/30 to-primary-dark/40 border border-primary/40 flex items-center justify-center text-primary-light font-bold text-2xl md:text-3xl shadow-inner select-none ring-2 ring-primary/20">
                    {donorData.name
                      .split(' ')
                      .map((p) => p[0])
                      .filter(Boolean)
                      .slice(0, 2)
                      .join('')
                      .toUpperCase() || 'PD'}
                  </div>
                )}
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  className="absolute -bottom-1.5 -right-1.5 p-1.5 rounded-lg bg-primary hover:bg-primary-light text-white shadow-lg transition-transform hover:scale-110"
                  title="Update profile photo"
                  aria-label="Update profile photo"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h2 className="text-xl md:text-2xl font-bold text-white truncate">
                    {donorData.name}
                  </h2>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <CheckCircle2 className="w-3 h-3" />
                    Verified Donor
                  </span>
                </div>

                <div className="flex items-center gap-2 text-sm font-semibold text-emerald-400">
                  <Building2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>{donorData.organization}</span>
                </div>

                <div className="flex items-center gap-4 text-xs text-slate-400 flex-wrap pt-0.5">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-primary-light" />
                    {donorData.location || 'Location not set'}
                  </span>
                  {donorData.memberSince && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-primary-light" />
                      Member since {donorData.memberSince}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Right side buttons */}
            <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto lg:justify-end border-t lg:border-t-0 border-slate-800 pt-4 lg:pt-0">
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-light text-white text-xs font-semibold shadow-md transition-all active:scale-95"
              >
                <Edit2 className="w-3.5 h-3.5" />
                Edit Profile
              </button>

              <button
                onClick={() => setIsUpdateOrgModalOpen(true)}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold shadow-sm transition-all active:scale-95"
              >
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                Update Organization Details
              </button>

              <button
                onClick={() => setIsPasswordModalOpen(true)}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 text-xs font-medium transition-colors"
                title="Change account password"
              >
                <Lock className="w-3.5 h-3.5" />
                Change Password
              </button>
            </div>
          </div>

          {/* Quick contact and address sub-bar */}
          <div className="mt-5 pt-4 border-t border-slate-800/80 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="flex items-center gap-2.5 text-slate-300 bg-slate-950/40 px-3.5 py-2 rounded-xl border border-slate-800/60 truncate">
              <Mail className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="truncate">{donorData.email || 'Email not provided'}</span>
            </div>
            <div className="flex items-center gap-2.5 text-slate-300 bg-slate-950/40 px-3.5 py-2 rounded-xl border border-slate-800/60">
              <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{donorData.phone || 'Phone not provided'}</span>
            </div>
            <div className="flex items-center gap-2.5 text-slate-300 bg-slate-950/40 px-3.5 py-2 rounded-xl border border-slate-800/60 truncate">
              <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="truncate">{donorData.location || 'Address not provided'}</span>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. IMPACT AT A GLANCE */}
        {/* ========================================================================= */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-1">
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                Your Impact at a Glance
              </h2>
              <p className="text-slate-400 text-xs mt-0.5">
                Together, we can reduce food waste and feed more people.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Meals Donated */}
            <div className="group rounded-2xl bg-slate-900/90 border border-slate-800/90 p-5 hover:border-emerald-500/40 transition-all duration-300 hover:-translate-y-1 shadow-md">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Meals Donated
                </span>
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center border border-emerald-500/20 group-hover:scale-105 transition-transform">
                  <UtensilsCrossed className="w-5 h-5" />
                </div>
              </div>
              <div className="text-3xl font-extrabold text-white tracking-tight">
                {donorData.totalMeals}
              </div>
              <p className="text-xs text-slate-400 mt-1.5 line-clamp-2">
                Nutritious meals reached people in need
              </p>
            </div>

            {/* Card 2: Food Waste Diverted */}
            <div className="group rounded-2xl bg-slate-900/90 border border-slate-800/90 p-5 hover:border-emerald-500/40 transition-all duration-300 hover:-translate-y-1 shadow-md">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Food Waste Diverted
                </span>
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center border border-emerald-500/20 group-hover:scale-105 transition-transform">
                  <Recycle className="w-5 h-5" />
                </div>
              </div>
              <div className="text-3xl font-extrabold text-white tracking-tight">
                {donorData.foodWasteDivertedKg} kg
              </div>
              <p className="text-xs text-slate-400 mt-1.5 line-clamp-2">
                Good food kept out of landfills
              </p>
            </div>

            {/* Card 3: People Supported */}
            <div className="group rounded-2xl bg-slate-900/90 border border-slate-800/90 p-5 hover:border-emerald-500/40 transition-all duration-300 hover:-translate-y-1 shadow-md">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  People Supported
                </span>
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center border border-emerald-500/20 group-hover:scale-105 transition-transform">
                  <Users className="w-5 h-5" />
                </div>
              </div>
              <div className="text-3xl font-extrabold text-white tracking-tight">
                {donorData.peopleSupported}
              </div>
              <p className="text-xs text-slate-400 mt-1.5 line-clamp-2">
                Stronger communities through food
              </p>
            </div>

            {/* Card 4: Total Donations */}
            <div className="group rounded-2xl bg-slate-900/90 border border-slate-800/90 p-5 hover:border-emerald-500/40 transition-all duration-300 hover:-translate-y-1 shadow-md">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Total Donations
                </span>
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center border border-emerald-500/20 group-hover:scale-105 transition-transform">
                  <PackageCheck className="w-5 h-5" />
                </div>
              </div>
              <div className="text-3xl font-extrabold text-white tracking-tight">
                {donorData.totalDonations}
              </div>
              <p className="text-xs text-slate-400 mt-1.5 line-clamp-2">
                Every donation counts
              </p>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* ROW: CONTRIBUTION LEVEL | IMPACT CHART | BECAUSE OF YOU */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* 3. CONTRIBUTION LEVEL (4 cols on lg) */}
          <div className="lg:col-span-4 rounded-2xl bg-slate-900/90 border border-slate-800/90 p-5 flex flex-col justify-between shadow-lg">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="text-base font-bold text-white">Your Contribution Level</h3>
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  🌱 New Member
                </span>
              </div>

              <div className="mt-4 space-y-2">
                <div className="flex justify-between items-baseline text-xs">
                  <span className="text-slate-400 font-medium">Progress</span>
                  <span className="font-bold text-white">
                    {donorData.totalDonations} / {donorData.targetDonationsForNextLevel} donations
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700/50">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-primary-light rounded-full transition-all duration-700 shadow-sm"
                    style={{ width: `${(donorData.totalDonations / donorData.targetDonationsForNextLevel) * 100}%` }}
                  />
                </div>

                <p className="text-xs text-emerald-400 font-medium pt-1">
                  {donorData.donationsToNextLevel} more verified donations to reach {donorData.nextLevelName}
                </p>
              </div>

              {/* Visual contribution journey */}
              <div className="mt-6 pt-4 border-t border-slate-800/80">
                <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-3">
                  Contribution Journey
                </p>
                <div className="space-y-3">
                  {journeySteps.map((step, idx) => (
                    <div
                      key={step.name}
                      className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                        step.active
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-white'
                          : 'bg-slate-950/30 border-slate-800/60 text-slate-500'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-base">{step.icon}</span>
                        <div>
                          <p className={`text-xs font-semibold ${step.active ? 'text-white' : 'text-slate-400'}`}>
                            {step.name}
                          </p>
                          <p className="text-[10px] text-slate-500">{step.desc}</p>
                        </div>
                      </div>
                      {step.active ? (
                        <span className="text-[10px] font-bold text-emerald-400 px-2 py-0.5 rounded-md bg-emerald-500/20">
                          Active
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium text-slate-500">Tier {idx + 1}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 text-[11px] text-slate-400 flex items-center gap-1.5 border-t border-slate-800/60">
              <Sparkles className="w-3.5 h-3.5 text-primary-light shrink-0" />
              <span>Higher tiers unlock direct verified partner badges & certificate recognition.</span>
            </div>
          </div>

          {/* 4. IMPACT ANALYTICS (5 cols on lg) */}
          <div className="lg:col-span-5 rounded-2xl bg-slate-900/90 border border-slate-800/90 p-5 flex flex-col justify-between shadow-lg">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <h3 className="text-base font-bold text-white">Your Impact This Year</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Meals donated over time</p>
                </div>
                <select
                  value={chartPeriod}
                  onChange={(e) => setChartPeriod(e.target.value as any)}
                  className="px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs font-medium text-slate-200 focus:outline-none focus:border-primary cursor-pointer"
                >
                  <option value="year">This Year</option>
                  <option value="6months">Last 6 Months</option>
                  <option value="all">All Time (Quarterly)</option>
                </select>
              </div>

              {/* Bar chart */}
              <div className="h-56 mt-4 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={activeChartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                    <XAxis
                      dataKey="month"
                      tick={{ fill: '#94A3B8', fontSize: 11 }}
                      axisLine={{ stroke: '#334155' }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: '#94A3B8', fontSize: 11 }}
                      axisLine={{ stroke: '#334155' }}
                      tickLine={false}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-slate-950 border border-slate-800 p-2.5 rounded-xl shadow-xl text-xs">
                              <span className="font-semibold text-slate-200">{label}</span>
                              <div className="text-emerald-400 font-bold mt-1">
                                {payload[0].value} meals donated
                              </div>
                            </div>
                          )
                        }
                        return null
                      }}
                    />
                    <Bar dataKey="meals" radius={[6, 6, 0, 0]}>
                      {activeChartData.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={index === activeChartData.length - 1 ? '#43A047' : '#2E7D32'}
                          opacity={index === activeChartData.length - 1 ? 1 : 0.85}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="mt-2 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                <Leaf className="w-3.5 h-3.5" />
                Consistent growth
              </span>
              <span>Total recorded: 150 meals</span>
            </div>
          </div>

          {/* 5. "BECAUSE OF YOU" IMPACT CARD (3 cols on lg) */}
          <div className="lg:col-span-3 rounded-2xl bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-emerald-500/30 p-5 flex flex-col justify-between shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

            <div>
              <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
                <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                  Because of You <span className="text-red-400">❤️</span>
                </h3>
              </div>

              <div className="mt-5 space-y-4">
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="text-2xl font-extrabold text-emerald-400">150 meals</div>
                  <p className="text-xs text-slate-300 mt-0.5">reached people in need</p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="text-2xl font-extrabold text-emerald-400">32 kg of food</div>
                  <p className="text-xs text-slate-300 mt-0.5">kept out of landfills</p>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed pt-1">
                  You helped build a more sustainable and compassionate community.
                </p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800/80">
              <p className="text-xs text-slate-400 italic">
                &ldquo;Small actions make a big impact. Thank you for being part of the change.&rdquo;
              </p>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* ROW: RECENT DONATIONS | ACHIEVEMENTS | ORGANIZATION & TRUST */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* 6. RECENT DONATIONS (5 cols on lg) */}
          <div className="lg:col-span-5 rounded-2xl bg-slate-900/90 border border-slate-800/90 p-5 flex flex-col justify-between shadow-lg">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <h3 className="text-base font-bold text-white">Recent Donations</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Verified food handover logs</p>
                </div>
                <button
                  onClick={() => setIsHistoryModalOpen(true)}
                  className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 inline-flex items-center gap-1 group"
                >
                  View all
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>

              <div className="mt-4 space-y-3">
                {recentDonations.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setIsHistoryModalOpen(true)}
                    className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800/80 hover:border-slate-700 transition-all cursor-pointer group flex items-start justify-between gap-3"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center text-base shrink-0 group-hover:scale-105 transition-transform">
                        {item.icon}
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-white">
                            {item.amount || `${item.meals} meals donated`}
                          </span>
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            {item.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 font-medium">
                          {item.organization} • {item.date}
                        </p>
                        <p className="text-xs text-slate-300 pt-0.5">{item.description}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-slate-300 group-hover:translate-x-0.5 transition-all mt-1" />
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
              <span>2 verified batches completed</span>
              <button
                onClick={() => setIsHistoryModalOpen(true)}
                className="text-emerald-400 font-medium hover:underline"
              >
                Inspect logs
              </button>
            </div>
          </div>

          {/* 7. ACHIEVEMENTS (4 cols on lg) */}
          <div className="lg:col-span-4 rounded-2xl bg-slate-900/90 border border-slate-800/90 p-5 flex flex-col justify-between shadow-lg">
            <div>
              <div className="pb-3 border-b border-slate-800">
                <h3 className="text-base font-bold text-white">Achievements</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Milestones earned through your food rescue journey.
                </p>
              </div>

              <div className="mt-4 space-y-3">
                {achievements.map((ach) => {
                  const isEarned = ach.status === 'Earned'
                  const isInProgress = ach.status === 'In Progress'

                  return (
                    <div
                      key={ach.id}
                      onClick={() => setSelectedAchievement(selectedAchievement === ach.id ? null : ach.id)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                        isEarned
                          ? 'bg-emerald-500/10 border-emerald-500/30 hover:border-emerald-500/50'
                          : isInProgress
                          ? 'bg-slate-950/40 border-slate-700 hover:border-slate-600'
                          : 'bg-slate-950/20 border-slate-800/50 opacity-60 hover:opacity-80'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <span className="text-lg">{ach.icon}</span>
                          <div>
                            <div className="text-xs font-bold text-white flex items-center gap-1.5">
                              {ach.title}
                            </div>
                            <p className="text-[11px] text-slate-400 mt-0.5">{ach.description}</p>
                          </div>
                        </div>

                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-semibold shrink-0 ${
                            isEarned
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : isInProgress
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {ach.status}
                        </span>
                      </div>

                      {isInProgress && (
                        <div className="mt-2.5 pt-2 border-t border-slate-800">
                          <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                            <span>Progress</span>
                            <span className="font-semibold text-slate-200">{ach.progressText}</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-amber-400 rounded-full"
                              style={{ width: `${ach.percent}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {selectedAchievement === ach.id && (
                        <p className="mt-2 text-[10px] text-emerald-400 bg-slate-900/80 p-1.5 rounded font-mono">
                          {ach.meta}
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            <p className="mt-4 pt-3 text-[11px] text-slate-500 border-t border-slate-800/80">
              Earn badges to showcase verified corporate responsibility & sustainability.
            </p>
          </div>

          {/* 8 & 9. ORGANIZATION DETAILS & DONOR TRUST (3 cols on lg) */}
          <div className="lg:col-span-3 space-y-6">
            {/* Organization Details Card */}
            <div className="rounded-2xl bg-slate-900/90 border border-slate-800/90 p-5 shadow-lg space-y-4">
              <div className="pb-3 border-b border-slate-800">
                <h3 className="text-base font-bold text-white">Organization Details</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Commercial donor profile</p>
              </div>

              <div className="space-y-2.5 text-xs">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-semibold">Organization</span>
                  <p className="font-bold text-white mt-0.5">{donorData.organization}</p>
                </div>

                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-semibold">Type</span>
                  <p className="text-slate-200 mt-0.5">Hotel / Restaurant / Institution</p>
                </div>

                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-semibold">Address</span>
                  <p className="text-slate-200 mt-0.5 line-clamp-2">{donorData.location}</p>
                </div>

                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-semibold">Contact</span>
                  <p className="text-slate-200 mt-0.5 font-mono">{donorData.phone}</p>
                </div>

                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-semibold">Email</span>
                  <p className="text-slate-200 mt-0.5 truncate">{donorData.email}</p>
                </div>

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Verified by FoodBridge
                  </span>
                  <button
                    onClick={() => setIsDocumentsModalOpen(true)}
                    className="text-[11px] font-medium text-slate-300 hover:text-white underline"
                  >
                    View Documents
                  </button>
                </div>
              </div>
            </div>

            {/* 9. Donor Trust Card */}
            <div className="rounded-2xl bg-slate-900/90 border border-slate-800/90 p-5 shadow-lg space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  FoodBridge Trust
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Trusted Donor
                </span>
              </div>

              <ul className="space-y-1.5 text-xs text-slate-300">
                <li className="flex items-center gap-2 text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span className="text-slate-200 font-medium">Identity verified</span>
                </li>
                <li className="flex items-center gap-2 text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span className="text-slate-200 font-medium">Organization verified</span>
                </li>
                <li className="flex items-center gap-2 text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span className="text-slate-200 font-medium">Contact verified</span>
                </li>
                <li className="flex items-center gap-2 text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span className="text-slate-200 font-medium">Successful donations: {donorData.totalDonations}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 10. FOODBRIDGE MISSION FOOTER */}
        {/* ========================================================================= */}
        <div className="mt-8 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-900 border border-slate-800/80 p-6 text-center space-y-2 relative overflow-hidden">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-1">
            <Leaf className="w-5 h-5" />
          </div>
          <h4 className="text-base font-bold text-white tracking-wide">
            Less Waste. More Hope.
          </h4>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Every meal you rescue is a step toward a better tomorrow.
          </p>
        </div>

        {/* ========================================================================= */}
        {/* MODALS */}
        {/* ========================================================================= */}
        {isEditModalOpen && <EditProfileModal onClose={() => setIsEditModalOpen(false)} />}
        {isPasswordModalOpen && <ChangePasswordModal onClose={() => setIsPasswordModalOpen(false)} />}
        {isUpdateOrgModalOpen && <UpdateOrgModal onClose={() => setIsUpdateOrgModalOpen(false)} />}
        {isDocumentsModalOpen && (
          <DonorDocumentsModal
            onClose={() => setIsDocumentsModalOpen(false)}
            organizationName={donorData.organization}
          />
        )}
        {isHistoryModalOpen && <DonationHistoryModal onClose={() => setIsHistoryModalOpen(false)} />}
      </div>
    </DonorShell>
  )
}
