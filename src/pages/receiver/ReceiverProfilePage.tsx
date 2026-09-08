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
  Users,
  CheckCircle2,
  ChevronRight,
  Leaf,
  ArrowRight,
  Clock,
  Flame,
  Truck,
  Plus,
  Trash2,
  Check,
  HeartHandshake,
  FileText,
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
import { ReceiverShell } from '../../components/receiver/ReceiverShell'
import { EditProfileModal } from '../../components/donor/EditProfileModal'
import { ChangePasswordModal } from '../../components/donor/ChangePasswordModal'
import { UpdateOrgModal } from '../../components/donor/UpdateOrgModal'
import { ReceiverDocumentsModal } from '../../components/receiver/ReceiverDocumentsModal'
import { ReceivingHistoryModal } from '../../components/receiver/ReceivingHistoryModal'
import { UpdateFoodNeedModal } from '../../components/receiver/UpdateFoodNeedModal'
import { UrgentFoodRequestModal } from '../../components/receiver/UrgentFoodRequestModal'
import { useAuth } from '../../context/AuthContext'
import { useReceiverStats } from '../../hooks/useReceiverStats'
import { useToast } from '../../context/ToastContext'

interface NeedCategory {
  id: string
  name: string
  icon: string
  need: number
  unit: string
  received: number
}

export default function ReceiverProfilePage() {
  const { user } = useAuth()
  const { stats } = useReceiverStats()
  const { toast } = useToast()

  // Modal visibility states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)
  const [isUpdateOrgModalOpen, setIsUpdateOrgModalOpen] = useState(false)
  const [isDocumentsModalOpen, setIsDocumentsModalOpen] = useState(false)
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false)
  const [isUpdateNeedModalOpen, setIsUpdateNeedModalOpen] = useState(false)
  const [isUrgentModalOpen, setIsUrgentModalOpen] = useState(false)

  // Chart timeframe state
  const [chartPeriod, setChartPeriod] = useState<'year' | '6months' | 'all'>('year')

  // Selected achievement for interactive info
  const [selectedAchievement, setSelectedAchievement] = useState<string | null>(null)

  // Current primary food need state
  const [currentNeed, setCurrentNeed] = useState({
    category: 'Rice / Meals',
    icon: '🍚',
    neededMeals: 150,
    receivedMeals: 112,
    status: 'Partially Fulfilled',
    priority: 'High',
    peopleToServe: 150,
    preferredDelivery: 'Today',
  })

  // Food need categories list
  const [categories, setCategories] = useState<NeedCategory[]>([
    { id: 'cooked-meals', name: 'Cooked Meals', icon: '🍚', need: 100, unit: 'meals', received: 75 },
    { id: 'veg-food', name: 'Vegetarian Food', icon: '🥗', need: 80, unit: 'meals', received: 60 },
    { id: 'bread-bakery', name: 'Bread & Bakery', icon: '🥖', need: 40, unit: 'packs', received: 20 },
    { id: 'dairy', name: 'Dairy', icon: '🥛', need: 30, unit: 'L', received: 25 },
    { id: 'fruits', name: 'Fruits', icon: '🍎', need: 50, unit: 'kg', received: 35 },
    { id: 'water', name: 'Drinking Water', icon: '💧', need: 200, unit: 'L', received: 180 },
  ])

  // Dynamic receiver data from logged-in user context and verified stats (no dummy defaults)
  const receiverData = useMemo(() => {
    const isApproved = Boolean(user?.verified) || user?.status === 'approved'
    const mealsReceived = stats.totalMealsReceived || 0
    const pickups = stats.totalPickups || 0

    return {
      name: user?.name || user?.organization || 'Receiver Account',
      organization: user?.organization || user?.name || 'Organization Name',
      type: user?.businessType || 'Community Organization / NGO',
      email: user?.email || '',
      phone: user?.phone || '',
      location: user?.address || '',
      memberSince: user?.createdAt
        ? new Date(user.createdAt).getFullYear().toString()
        : '',
      isVerified: isApproved,
      peopleSupported: mealsReceived,
      operatingHours: user?.operatingHours || '',
      totalMealsReceived: mealsReceived,
      peopleServed: mealsReceived,
      donationsReceived: pickups,
      activeDays: pickups,
      avatarUrl: user?.avatarUrl || '',
    }
  }, [user, stats])

  // Chart datasets
  const chartDataYear = [
    { month: 'Jan', meals: 100 },
    { month: 'Feb', meals: 120 },
    { month: 'Mar', meals: 150 },
    { month: 'Apr', meals: 90 },
    { month: 'May', meals: 180 },
    { month: 'Jun', meals: 140 },
    { month: 'Jul', meals: 160 },
    { month: 'Aug', meals: 190 },
    { month: 'Sep', meals: 220 },
  ]

  const chartData6Months = [
    { month: 'Apr', meals: 90 },
    { month: 'May', meals: 180 },
    { month: 'Jun', meals: 140 },
    { month: 'Jul', meals: 160 },
    { month: 'Aug', meals: 190 },
    { month: 'Sep', meals: 220 },
  ]

  const chartDataAll = [
    { month: 'Q1', meals: 370 },
    { month: 'Q2', meals: 410 },
    { month: 'Q3', meals: 570 },
  ]

  const activeChartData = useMemo(() => {
    if (chartPeriod === '6months') return chartData6Months
    if (chartPeriod === 'all') return chartDataAll
    return chartDataYear
  }, [chartPeriod])

  // Recent food received items
  const recentReceived = [
    {
      id: 'REC-01',
      date: 'Sep 04, 2026',
      quantity: '80 meals received',
      icon: '🍱',
      donor: 'ICT GRAND CHOLA',
      status: 'Delivered',
      notes: 'Successfully delivered to Hope Community Centre',
    },
    {
      id: 'REC-02',
      date: 'Sep 01, 2026',
      quantity: '50 meals received',
      icon: '🍱',
      donor: 'ABC Restaurant',
      status: 'Delivered',
      notes: 'Evenly distributed during evening dinner drive',
    },
    {
      id: 'REC-03',
      date: 'Aug 28, 2026',
      quantity: '40 vegetarian meals',
      icon: '🥗',
      donor: 'Green Kitchen',
      status: 'Delivered',
      notes: 'Nutritious lunch served to senior residents',
    },
  ]

  // Receiver achievements
  const receiverAchievements = [
    {
      id: 'community-partner',
      title: 'Community Partner',
      icon: '🏠',
      desc: 'Completed first successful food delivery',
      status: 'Earned',
      meta: 'Unlocked upon first verified delivery',
    },
    {
      id: 'meals-500',
      title: '500 Meals Received',
      icon: '🍱',
      desc: 'Received 500 meals through FoodBridge',
      status: 'Earned',
      meta: 'Surpassed on July 14, 2026',
    },
    {
      id: 'trusted-receiver',
      title: 'Trusted Receiver',
      icon: '🤝',
      desc: 'Maintained successful receiving history',
      status: 'Earned',
      meta: '100% verified distribution compliance',
    },
    {
      id: 'waste-rescue',
      title: 'Waste Rescue Partner',
      icon: '🌱',
      desc: 'Helped redirect surplus food to the community',
      status: 'Locked',
      meta: 'Requires 2,000 total meals received',
    },
  ]

  const handleUpdateNeed = (updated: {
    category: string
    neededMeals: number
    priority: string
    peopleToServe: number
    preferredDelivery: string
  }) => {
    setCurrentNeed((prev) => ({
      ...prev,
      ...updated,
      status: prev.receivedMeals >= updated.neededMeals ? 'Fulfilled' : 'Partially Fulfilled',
    }))
    toast('Current food need broadcast updated successfully!', 'success')
  }

  const handleRemoveCategory = (id: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== id))
    toast('Requirement category removed', 'info')
  }

  const handleUrgentRequestSent = () => {
    toast('Urgent food requirement broadcasted to nearby donors!', 'success')
  }

  return (
    <ReceiverShell>
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
                Verified Receiver
              </span>
            </div>
            <p className="text-slate-400 text-sm mt-1.5 max-w-2xl">
              Manage your organization, food needs, verification, and community impact.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <span className="text-xs px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 flex items-center gap-1.5 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Community Partner Dashboard
            </span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 1. RECEIVER PROFILE HEADER */}
        {/* ========================================================================= */}
        <div className="rounded-2xl bg-slate-900/90 border border-slate-800/90 p-5 md:p-6 shadow-xl backdrop-blur-sm">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            {/* Left profile info */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 w-full lg:w-auto">
              <div className="relative group shrink-0">
                {receiverData.avatarUrl ? (
                  <img
                    src={receiverData.avatarUrl}
                    alt={receiverData.organization}
                    className="w-20 h-20 md:w-24 md:h-24 rounded-2xl object-cover ring-2 ring-primary/40 bg-slate-800"
                  />
                ) : (
                  <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-gradient-to-br from-primary/30 to-primary-dark/40 border border-primary/40 flex items-center justify-center text-primary-light font-bold text-2xl md:text-3xl shadow-inner select-none ring-2 ring-primary/20">
                    {receiverData.organization
                      .split(' ')
                      .map((p) => p[0])
                      .filter(Boolean)
                      .slice(0, 2)
                      .join('')
                      .toUpperCase() || 'HC'}
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
                    {receiverData.organization}
                  </h2>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <CheckCircle2 className="w-3 h-3" />
                    Verified Receiver
                  </span>
                </div>

                <div className="flex items-center gap-2 text-sm font-semibold text-emerald-400">
                  <Building2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>{receiverData.type}</span>
                </div>

                <div className="flex items-center gap-4 text-xs text-slate-400 flex-wrap pt-0.5">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-primary-light" />
                    {receiverData.location || 'Location not specified'}
                  </span>
                  {receiverData.memberSince && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-primary-light" />
                      Member since {receiverData.memberSince}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Right side action buttons */}
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

          {/* Contact sub-bar */}
          <div className="mt-5 pt-4 border-t border-slate-800/80 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="flex items-center gap-2.5 text-slate-300 bg-slate-950/40 px-3.5 py-2 rounded-xl border border-slate-800/60 truncate">
              <Mail className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="truncate">{receiverData.email || 'Email not provided'}</span>
            </div>
            <div className="flex items-center gap-2.5 text-slate-300 bg-slate-950/40 px-3.5 py-2 rounded-xl border border-slate-800/60">
              <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{receiverData.phone || 'Phone not provided'}</span>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. RECEIVER IMPACT AT A GLANCE */}
        {/* ========================================================================= */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-1">
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                Your Community Impact
              </h2>
              <p className="text-slate-400 text-xs mt-0.5">
                Every rescued meal helps us serve our community.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Meals Received */}
            <div className="group rounded-2xl bg-slate-900/90 border border-slate-800/90 p-5 hover:border-emerald-500/40 transition-all duration-300 hover:-translate-y-1 shadow-md">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Meals Received
                </span>
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center border border-emerald-500/20 text-lg group-hover:scale-105 transition-transform">
                  🍱
                </div>
              </div>
              <div className="text-3xl font-extrabold text-white tracking-tight">
                {receiverData.totalMealsReceived.toLocaleString()}
              </div>
              <p className="text-xs text-slate-400 mt-1.5 line-clamp-2">
                Nutritious meals received through FoodBridge
              </p>
            </div>

            {/* Card 2: People Served */}
            <div className="group rounded-2xl bg-slate-900/90 border border-slate-800/90 p-5 hover:border-emerald-500/40 transition-all duration-300 hover:-translate-y-1 shadow-md">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  People Served
                </span>
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center border border-emerald-500/20 text-lg group-hover:scale-105 transition-transform">
                  👥
                </div>
              </div>
              <div className="text-3xl font-extrabold text-white tracking-tight">
                {receiverData.peopleServed.toLocaleString()}
              </div>
              <p className="text-xs text-slate-400 mt-1.5 line-clamp-2">
                Community members supported
              </p>
            </div>

            {/* Card 3: Food Donations Received */}
            <div className="group rounded-2xl bg-slate-900/90 border border-slate-800/90 p-5 hover:border-emerald-500/40 transition-all duration-300 hover:-translate-y-1 shadow-md">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Food Donations Received
                </span>
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center border border-emerald-500/20 text-lg group-hover:scale-105 transition-transform">
                  🤝
                </div>
              </div>
              <div className="text-3xl font-extrabold text-white tracking-tight">
                {receiverData.donationsReceived}
              </div>
              <p className="text-xs text-slate-400 mt-1.5 line-clamp-2">
                Successful FoodBridge deliveries
              </p>
            </div>

            {/* Card 4: Active Days */}
            <div className="group rounded-2xl bg-slate-900/90 border border-slate-800/90 p-5 hover:border-emerald-500/40 transition-all duration-300 hover:-translate-y-1 shadow-md">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Active Days
                </span>
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center border border-emerald-500/20 text-lg group-hover:scale-105 transition-transform">
                  📅
                </div>
              </div>
              <div className="text-3xl font-extrabold text-white tracking-tight">
                {receiverData.activeDays}
              </div>
              <p className="text-xs text-slate-400 mt-1.5 line-clamp-2">
                Days receiving food support
              </p>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 3. CURRENT FOOD NEED (Most Prominent Section) */}
        {/* ========================================================================= */}
        <section className="rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border-2 border-emerald-500/40 p-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
            <div className="space-y-3 flex-1 min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="text-xs uppercase tracking-wider font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  Live Requirement Broadcast
                </span>
                <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  {currentNeed.status}
                </span>
                <span className="px-2 py-1 rounded-md text-xs font-semibold bg-red-500/15 text-red-400 border border-red-500/30 flex items-center gap-1">
                  🔴 Priority: {currentNeed.priority}
                </span>
              </div>

              <div>
                <h3 className="text-xl md:text-2xl font-black text-white flex items-center gap-2">
                  <span>{currentNeed.icon}</span>
                  <span>{currentNeed.category}</span>
                  <span className="text-slate-400 font-normal text-base md:text-lg">
                    ({currentNeed.neededMeals} meals needed)
                  </span>
                </h3>
              </div>

              {/* Progress bar */}
              <div className="space-y-1.5 max-w-xl">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-300 font-medium">
                    {currentNeed.receivedMeals} / {currentNeed.neededMeals} meals received
                  </span>
                  <span className="text-emerald-400 font-bold">
                    {Math.round((currentNeed.receivedMeals / currentNeed.neededMeals) * 100)}%
                  </span>
                </div>
                <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700/60">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-primary-light rounded-full transition-all duration-700"
                    style={{
                      width: `${Math.min(
                        100,
                        (currentNeed.receivedMeals / currentNeed.neededMeals) * 100
                      )}%`,
                    }}
                  />
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs text-slate-300 flex-wrap pt-1">
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-emerald-400" />
                  People to serve: <strong className="text-white">{currentNeed.peopleToServe} people</strong>
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-emerald-400" />
                  Preferred delivery: <strong className="text-white">{currentNeed.preferredDelivery}</strong>
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row lg:flex-col gap-3 w-full lg:w-auto shrink-0 relative z-10">
              <button
                onClick={() => setIsUpdateNeedModalOpen(true)}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-primary hover:bg-primary-light text-white text-sm font-bold shadow-lg transition-all active:scale-95"
              >
                <UtensilsCrossed className="w-4 h-4" />
                Update Food Need
              </button>

              <button
                onClick={() => setIsUrgentModalOpen(true)}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-red-400 border border-red-500/30 text-xs font-semibold transition-all active:scale-95"
              >
                <Flame className="w-3.5 h-3.5" />
                Broadcast Urgent Need
              </button>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* ROW: FOOD NEEDS | IMPACT CHART | TRUST PROFILE (3 Columns) */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* 4. FOOD NEED CATEGORIES (4 cols on lg) */}
          <div className="lg:col-span-4 rounded-2xl bg-slate-900/90 border border-slate-800/90 p-5 flex flex-col justify-between shadow-lg">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <h3 className="text-base font-bold text-white">What We Need</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Active food category targets</p>
                </div>
                <button
                  onClick={() => setIsUpdateNeedModalOpen(true)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-primary-light text-xs font-medium transition-colors"
                  title="Add category requirement"
                  aria-label="Add category requirement"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <div className="mt-4 space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
                {categories.map((cat) => {
                  const pct = Math.round((cat.received / cat.need) * 100)
                  return (
                    <div
                      key={cat.id}
                      className="p-3 rounded-xl bg-slate-950/50 border border-slate-800/80 hover:border-slate-700 transition-all space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-base">{cat.icon}</span>
                          <span className="text-xs font-bold text-white">{cat.name}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-1.5 py-0.5 rounded">
                            {pct}%
                          </span>
                          <button
                            onClick={() => handleRemoveCategory(cat.id)}
                            className="text-slate-500 hover:text-red-400 transition-colors p-0.5"
                            title="Remove category"
                            aria-label={`Remove ${cat.name}`}
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      <div className="flex justify-between items-center text-[11px] text-slate-400">
                        <span>Need: {cat.need} {cat.unit}</span>
                        <span className="text-slate-300">Received: {cat.received}</span>
                      </div>

                      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary-light rounded-full"
                          style={{ width: `${Math.min(100, pct)}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
              <span>{categories.length} tracked items</span>
              <button
                onClick={() => setIsUpdateNeedModalOpen(true)}
                className="text-emerald-400 font-medium hover:underline text-xs"
              >
                Manage list
              </button>
            </div>
          </div>

          {/* 7. MONTHLY RECEIVING ANALYTICS (5 cols on lg) */}
          <div className="lg:col-span-5 rounded-2xl bg-slate-900/90 border border-slate-800/90 p-5 flex flex-col justify-between shadow-lg">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <h3 className="text-base font-bold text-white">Food Received This Year</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Meals received through FoodBridge</p>
                </div>
                <select
                  value={chartPeriod}
                  onChange={(e) => setChartPeriod(e.target.value as any)}
                  className="px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs font-medium text-slate-200 focus:outline-none focus:border-primary cursor-pointer"
                >
                  <option value="year">This Year</option>
                  <option value="6months">Last 6 Months</option>
                  <option value="all">All Time</option>
                </select>
              </div>

              {/* Bar chart */}
              <div className="h-60 mt-4 w-full">
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
                                {payload[0].value} meals distributed
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
                Reliable rescue flow
              </span>
              <span>Total: 1,250 meals</span>
            </div>
          </div>

          {/* 10. RECEIVER TRUST PROFILE (3 cols on lg) */}
          <div className="lg:col-span-3 rounded-2xl bg-slate-900/90 border border-slate-800/90 p-5 flex flex-col justify-between shadow-lg">
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  FoodBridge Trust
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Trusted Receiver
                </span>
              </div>

              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                <div className="text-sm font-extrabold text-emerald-300">
                  Trusted Receiver
                </div>
                <p className="text-[11px] text-emerald-400/90 mt-1 leading-snug">
                  Verified organizations help donors confidently send surplus food where it is needed most.
                </p>
              </div>

              <ul className="space-y-2 text-xs text-slate-300 pt-1">
                <li className="flex items-center gap-2 text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span className="text-slate-200 font-medium">Organization verified</span>
                </li>
                <li className="flex items-center gap-2 text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span className="text-slate-200 font-medium">Address verified</span>
                </li>
                <li className="flex items-center gap-2 text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span className="text-slate-200 font-medium">Contact verified</span>
                </li>
                <li className="flex items-center gap-2 text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span className="text-slate-200 font-medium">Receiver status verified</span>
                </li>
              </ul>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400">
              <span>Audited under FoodBridge Community Safety Norms</span>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 6. COMMUNITY IMPACT FLOW */}
        {/* ========================================================================= */}
        <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-900 border border-slate-800/90 p-6 shadow-xl">
          <div className="pb-3 border-b border-slate-800/80 mb-5">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <HeartHandshake className="w-5 h-5 text-emerald-400" />
              Our Community Impact
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 items-center gap-4 text-center">
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="text-2xl md:text-3xl font-black text-white">1,250</div>
              <p className="text-xs text-emerald-400 font-semibold mt-1">Meals received</p>
            </div>

            <div className="hidden md:flex justify-center text-slate-600">
              <ArrowRight className="w-6 h-6" />
            </div>

            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="text-2xl md:text-3xl font-black text-white">980</div>
              <p className="text-xs text-emerald-400 font-semibold mt-1">People served</p>
            </div>

            <div className="hidden md:flex justify-center text-slate-600">
              <ArrowRight className="w-6 h-6" />
            </div>

            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="text-2xl md:text-3xl font-black text-white">24</div>
              <p className="text-xs text-emerald-400 font-semibold mt-1">Successful donations</p>
            </div>
          </div>

          <p className="text-xs text-slate-300 text-center italic mt-5 max-w-xl mx-auto">
            &ldquo;FoodBridge has helped us provide nutritious meals to people in our community while reducing food waste.&rdquo;
          </p>
        </div>

        {/* ========================================================================= */}
        {/* ROW: RECENT FOOD RECEIVED | ACHIEVEMENTS (7 cols / 5 cols) */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* 5. RECENT FOOD RECEIVED (7 cols on lg) */}
          <div className="lg:col-span-7 rounded-2xl bg-slate-900/90 border border-slate-800/90 p-5 flex flex-col justify-between shadow-lg">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <h3 className="text-base font-bold text-white">Recent Food Received</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Verified incoming delivery records</p>
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
                {recentReceived.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setIsHistoryModalOpen(true)}
                    className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800/80 hover:border-slate-700 transition-all cursor-pointer group flex items-start justify-between gap-3"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-lg shrink-0 group-hover:scale-105 transition-transform">
                        {item.icon}
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">{item.quantity}</span>
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            {item.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400">
                          From: <strong className="text-slate-200">{item.donor}</strong> • {item.date}
                        </p>
                        <p className="text-xs text-slate-300 pt-0.5">{item.notes}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-slate-300 group-hover:translate-x-0.5 transition-all mt-1" />
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
              <span>Showing last 3 deliveries</span>
              <button
                onClick={() => setIsHistoryModalOpen(true)}
                className="text-emerald-400 font-medium hover:underline"
              >
                Inspect full logs
              </button>
            </div>
          </div>

          {/* 8. RECEIVER ACHIEVEMENTS (5 cols on lg) */}
          <div className="lg:col-span-5 rounded-2xl bg-slate-900/90 border border-slate-800/90 p-5 flex flex-col justify-between shadow-lg">
            <div>
              <div className="pb-3 border-b border-slate-800">
                <h3 className="text-base font-bold text-white">Receiver Achievements</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Milestones achieved through community support.
                </p>
              </div>

              <div className="mt-4 space-y-2.5">
                {receiverAchievements.map((ach) => {
                  const isEarned = ach.status === 'Earned'
                  return (
                    <div
                      key={ach.id}
                      onClick={() =>
                        setSelectedAchievement(selectedAchievement === ach.id ? null : ach.id)
                      }
                      className={`p-3 rounded-xl border transition-all cursor-pointer ${
                        isEarned
                          ? 'bg-emerald-500/10 border-emerald-500/30 hover:border-emerald-500/50'
                          : 'bg-slate-950/20 border-slate-800/50 opacity-60 hover:opacity-80'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <span className="text-xl">{ach.icon}</span>
                          <div>
                            <div className="text-xs font-bold text-white flex items-center gap-1.5">
                              {ach.title}
                            </div>
                            <p className="text-[11px] text-slate-400 mt-0.5">{ach.desc}</p>
                          </div>
                        </div>

                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-semibold shrink-0 ${
                            isEarned
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-slate-800 text-slate-500'
                          }`}
                        >
                          {isEarned ? '✓ Earned' : '🔒 Locked'}
                        </span>
                      </div>

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
              Milestone badges help establish community reliability and donor trust.
            </p>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* ROW: ORGANIZATION DETAILS | FOOD PREFERENCES (6 cols / 6 cols) */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* 9. ORGANIZATION DETAILS (6 cols on lg) */}
          <div className="lg:col-span-6 rounded-2xl bg-slate-900/90 border border-slate-800/90 p-5 shadow-lg space-y-4">
            <div className="pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">Organization Details</h3>
              <p className="text-xs text-slate-400 mt-0.5">Verified NGO identity & operations</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-semibold">Organization</span>
                <p className="font-bold text-white mt-0.5">{receiverData.organization}</p>
              </div>

              <div>
                <span className="text-slate-400 text-[10px] uppercase font-semibold">Organization Type</span>
                <p className="text-slate-200 mt-0.5">{receiverData.type}</p>
              </div>

              <div>
                <span className="text-slate-400 text-[10px] uppercase font-semibold">Address</span>
                <p className="text-slate-200 mt-0.5">{receiverData.location}</p>
              </div>

              <div>
                <span className="text-slate-400 text-[10px] uppercase font-semibold">Contact</span>
                <p className="text-slate-200 mt-0.5 font-mono">{receiverData.phone}</p>
              </div>

              <div>
                <span className="text-slate-400 text-[10px] uppercase font-semibold">Email</span>
                <p className="text-slate-200 mt-0.5 truncate">{receiverData.email}</p>
              </div>

              <div>
                <span className="text-slate-400 text-[10px] uppercase font-semibold">People Supported</span>
                <p className="text-slate-200 mt-0.5 font-bold text-emerald-400">
                  {receiverData.peopleSupported} daily
                </p>
              </div>

              <div>
                <span className="text-slate-400 text-[10px] uppercase font-semibold">Operating Hours</span>
                <p className="text-slate-200 mt-0.5 font-mono">{receiverData.operatingHours}</p>
              </div>

              <div>
                <span className="text-slate-400 text-[10px] uppercase font-semibold">Verification</span>
                <p className="text-emerald-400 font-semibold mt-0.5 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Verified by FoodBridge
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setIsDocumentsModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition-colors"
              >
                <FileText className="w-3.5 h-3.5 text-primary-light" />
                View Verification Documents
              </button>
            </div>
          </div>

          {/* 11. FOOD PREFERENCES & DELIVERY (6 cols on lg) */}
          <div className="lg:col-span-6 rounded-2xl bg-slate-900/90 border border-slate-800/90 p-5 shadow-lg space-y-4">
            <div className="pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">Food Preferences & Delivery</h3>
              <p className="text-xs text-slate-400 mt-0.5">Specifications for donor kitchens & logistics</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800/80">
                <span className="text-[10px] uppercase text-slate-400 font-semibold">Dietary Acceptance</span>
                <div className="space-y-1.5 mt-2">
                  <div className="flex items-center gap-2 text-slate-200">
                    <span className="text-emerald-400">🥗</span> Vegetarian preferred
                  </div>
                  <div className="flex items-center gap-2 text-slate-200">
                    <span className="text-emerald-400">🍱</span> Cooked meals accepted
                  </div>
                  <div className="flex items-center gap-2 text-slate-200">
                    <span className="text-emerald-400">🥛</span> Packaged food accepted
                  </div>
                  <div className="flex items-center gap-2 text-red-400">
                    <span>❌</span> Alcohol-containing food not accepted
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800/80 space-y-3">
                <div>
                  <span className="text-[10px] uppercase text-slate-400 font-semibold">Delivery Mode</span>
                  <p className="text-slate-200 mt-1 flex items-center gap-1.5 font-medium">
                    <Truck className="w-4 h-4 text-emerald-400" />
                    Pickup / Delivery accepted
                  </p>
                </div>

                <div>
                  <span className="text-[10px] uppercase text-slate-400 font-semibold">Preferred Delivery Window</span>
                  <p className="text-slate-200 mt-1 font-mono flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-emerald-400" />
                    11:00 AM – 2:00 PM
                  </p>
                </div>

                <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-300">
                  Ready with insulated containers & cold storage facilities.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 12. EMERGENCY / URGENT FOOD NEED */}
        {/* ========================================================================= */}
        <section className="rounded-2xl bg-gradient-to-r from-red-950/30 via-slate-900 to-slate-900 border border-red-500/30 p-5 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center border border-red-500/30 shrink-0">
              <Flame className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                  🔴 HIGH PRIORITY
                </span>
                <span className="text-xs font-bold text-white">80 meals needed today</span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Currently serving 80 people. Immediate hot meals or lunch boxes needed on site.
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsUrgentModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-md transition-all active:scale-95 shrink-0"
          >
            <Flame className="w-4 h-4" />
            Request Food Support
          </button>
        </section>

        {/* ========================================================================= */}
        {/* 13. FOODBRIDGE MISSION FOOTER */}
        {/* ========================================================================= */}
        <div className="mt-8 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-900 border border-slate-800/80 p-6 text-center space-y-2 relative overflow-hidden">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-1">
            <Leaf className="w-5 h-5" />
          </div>
          <h4 className="text-base font-bold text-white tracking-wide">
            Together, we can turn surplus food into hope.
          </h4>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Connecting surplus food donors with communities in need across Chennai.
          </p>
        </div>

        {/* ========================================================================= */}
        {/* MODALS */}
        {/* ========================================================================= */}
        {isEditModalOpen && <EditProfileModal onClose={() => setIsEditModalOpen(false)} />}
        {isPasswordModalOpen && <ChangePasswordModal onClose={() => setIsPasswordModalOpen(false)} />}
        {isUpdateOrgModalOpen && <UpdateOrgModal onClose={() => setIsUpdateOrgModalOpen(false)} />}
        {isDocumentsModalOpen && (
          <ReceiverDocumentsModal
            onClose={() => setIsDocumentsModalOpen(false)}
            organizationName={receiverData.organization}
          />
        )}
        {isHistoryModalOpen && <ReceivingHistoryModal onClose={() => setIsHistoryModalOpen(false)} />}
        {isUpdateNeedModalOpen && (
          <UpdateFoodNeedModal
            onClose={() => setIsUpdateNeedModalOpen(false)}
            currentNeed={currentNeed}
            onSave={handleUpdateNeed}
          />
        )}
        {isUrgentModalOpen && (
          <UrgentFoodRequestModal
            onClose={() => setIsUrgentModalOpen(false)}
            onRequestSent={handleUrgentRequestSent}
          />
        )}
      </div>
    </ReceiverShell>
  )
}
