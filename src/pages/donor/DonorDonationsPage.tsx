import { useMemo } from 'react'
import { Package, Utensils, Clock, CheckCircle2 } from 'lucide-react'
import { DonorShell } from '../../components/donor/DonorShell'
import { DonationsTable } from '../../components/donor/DonationsTable'
import { DashboardHeader } from '../../components/layout/DashboardLayout'
import { AnimatedCounter } from '../../components/ui/AnimatedCounter'
import { useDonorDonations } from '../../hooks/useDonationStats'

export default function DonorDonationsPage() {
  const { donations } = useDonorDonations()

  const summary = useMemo(() => {
    let totalMeals = 0
    let allocatedMeals = 0
    let remainingMeals = 0

    for (const d of donations) {
      const tot = d.total_quantity !== undefined ? d.total_quantity : (d.meals || 0)
      const alloc = d.allocated_quantity !== undefined ? d.allocated_quantity : 0
      const rem = d.remaining_quantity !== undefined ? d.remaining_quantity : Math.max(0, tot - alloc)
      totalMeals += tot
      allocatedMeals += alloc
      remainingMeals += rem
    }

    return {
      count: donations.length,
      totalMeals,
      allocatedMeals,
      remainingMeals,
    }
  }, [donations])

  return (
    <DonorShell fab={false}>
      <DashboardHeader
        title="My Donations"
        subtitle="Manage all surplus food listings, track status, and coordinate with NGOs and volunteers."
      />

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 -mt-2">
        <div className="stat-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase tracking-wider text-text-secondary font-medium">Total Listings</span>
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <p className="stat-value text-2xl font-bold">
            <AnimatedCounter value={summary.count} />
          </p>
          <p className="text-[11px] text-text-secondary mt-1">Surplus batches created</p>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase tracking-wider text-text-secondary font-medium">Total Meals</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
              <Utensils className="w-4 h-4" />
            </div>
          </div>
          <p className="stat-value text-2xl font-bold">
            <AnimatedCounter value={summary.totalMeals} />
          </p>
          <p className="text-[11px] text-text-secondary mt-1">Total meals offered</p>
        </div>

        <div className="stat-card border-amber-300/40 dark:border-amber-700/40 bg-amber-50/20 dark:bg-amber-950/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase tracking-wider text-amber-700 dark:text-amber-300 font-bold">Allocated</span>
            <div className="p-2 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="stat-value text-2xl font-bold text-amber-600 dark:text-amber-400">
            <AnimatedCounter value={summary.allocatedMeals} />
          </p>
          <p className="text-[11px] text-amber-700/80 dark:text-amber-400/80 mt-1">Claimed by NGO partners</p>
        </div>

        <div className="stat-card border-emerald-300/40 dark:border-emerald-700/40 bg-emerald-50/20 dark:bg-emerald-950/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase tracking-wider text-emerald-700 dark:text-emerald-300 font-bold">Remaining Available</span>
            <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="stat-value text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            <AnimatedCounter value={summary.remainingMeals} />
          </p>
          <p className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80 mt-1">Ready for receiver pickup</p>
        </div>
      </div>

      <DonationsTable />
    </DonorShell>
  )
}
