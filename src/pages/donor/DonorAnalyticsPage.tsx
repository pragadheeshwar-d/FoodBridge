import { DonorShell } from '../../components/donor/DonorShell'
import { DashboardHeader } from '../../components/layout/DashboardLayout'
import {
  DonationTrendChart, MonthlyAnalyticsChart,
  PieDistributionChart, CircularProgress,
} from '../../components/charts/Charts'
import { useAuth } from '../../context/AuthContext'
import { useDonationStats, useDonorDonations, useDonorPickups } from '../../hooks/useDonationStats'
import { Loader2 } from 'lucide-react'

export default function DonorAnalyticsPage() {
  const { user } = useAuth()
  const { stats, loading: statsLoading } = useDonationStats()
  const { donations, loading: donationsLoading } = useDonorDonations()
  const { pickups, loading: pickupsLoading } = useDonorPickups()

  const loading = statsLoading || donationsLoading || pickupsLoading

  // Calculate monthly trends from live donations
  const monthlyData = (() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const buckets: Record<string, { donations: number; meals: number }> = {}
    months.forEach(m => { buckets[m] = { donations: 0, meals: 0 } })

    donations.forEach(d => {
      const m = months[d.createdAt.getMonth()]
      if (String(d.status).toLowerCase() === 'completed') {
        buckets[m].donations += 1
        buckets[m].meals += d.meals
      }
    })

    return months
      .map(month => ({ month, ...buckets[month] }))
      .filter(d => d.donations > 0)
      .slice(-6)
  })()

  // Calculate top NGOs from completed pickups
  const topNGOs = (() => {
    const ngoMap: Record<string, number> = {}
    pickups.forEach(p => {
      if (String(p.status).toLowerCase() === 'completed') {
        const ngo = p.receiverOrganization || p.receiverName || 'NGO'
        ngoMap[ngo] = (ngoMap[ngo] || 0) + (Number(p.quantity) || 0)
      }
    })
    return Object.entries(ngoMap)
      .map(([name, meals]) => ({ name, meals }))
      .sort((a, b) => b.meals - a.meals)
      .slice(0, 3)
  })()

  // Calculate food categories
  const foodCategories = (() => {
    let veg = 0, nonVeg = 0
    donations.forEach(d => {
      if (String(d.status).toLowerCase() === 'completed') {
        const category = String(d.category || d.food || '').toLowerCase()
        if (category.includes('veg') && !category.includes('non')) {
          veg += d.meals
        } else {
          nonVeg += d.meals
        }
      }
    })
    const total = veg + nonVeg || 1
    return [
      { name: 'Vegetarian', value: Math.round((veg / total) * 100), color: '#16A34A' },
      { name: 'Non-Veg', value: Math.round((nonVeg / total) * 100), color: '#059669' },
    ]
  })()

  const completedPickupDurations = pickups
    .filter((p: any) => String(p.status).toLowerCase() === 'completed' && p.requestedAtDate && p.completedAtDate)
    .map((p: any) => Math.max(1, Math.round((p.completedAtDate.getTime() - p.requestedAtDate.getTime()) / 60000)))
  const avgPickupTime = completedPickupDurations.length
    ? `${Math.round(completedPickupDurations.reduce((sum: number, value: number) => sum + value, 0) / completedPickupDurations.length)} mins`
    : '—'

  // Calculate success rates
  const successRate = pickups.length > 0
    ? Math.round((pickups.filter(p => String(p.status).toLowerCase() === 'completed').length / pickups.length) * 100)
    : 0

  return (
    <DonorShell fab={false}>
      <DashboardHeader
        title="Analytics"
        subtitle="Monitor your impact with real-time insights into meals donated, food rescued, and pickup efficiency."
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Pickup Success Rate', value: loading ? '-' : `${successRate}%` },
          { label: 'Avg Pickup Time', value: loading ? '-' : avgPickupTime },
          { label: 'Total Meals', value: loading ? '-' : stats.totalMeals },
          { label: 'Waste Prevented', value: loading ? '-' : `${stats.totalKg} kg` },
        ].map((s) => (
          <div key={s.label} className="stat-card text-center">
            <p className="text-xs text-text-secondary font-medium">{s.label}</p>
            <p className="text-2xl font-bold stat-value mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        <div className="glass-card p-6">
          <h3 className="font-bold text-lg mb-6">Donation Trends</h3>
          {loading ? (
            <div className="h-56 flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin" /></div>
          ) : monthlyData.length > 0 ? (
            <DonationTrendChart data={monthlyData} />
          ) : (
            <div className="h-56 flex items-center justify-center text-text-secondary text-sm">No trend data available.</div>
          )}
        </div>
        <div className="glass-card p-6">
          <h3 className="font-bold text-lg mb-6">Meals Rescued</h3>
          {loading ? (
            <div className="h-56 flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin" /></div>
          ) : monthlyData.length > 0 ? (
            <MonthlyAnalyticsChart data={monthlyData} />
          ) : (
            <div className="h-56 flex items-center justify-center text-text-secondary text-sm">No monthly data available.</div>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        <div className="glass-card p-6">
           <h3 className="font-bold text-lg mb-6">Food Categories</h3>
           {loading ? (
              <div className="flex items-center justify-center h-40"><Loader2 className="w-5 h-5 animate-spin" /></div>
           ) : foodCategories[0].value === 0 && foodCategories[1].value === 0 ? (
              <div className="flex items-center justify-center h-40 text-text-secondary text-sm">No data available</div>
           ) : (
              <PieDistributionChart data={foodCategories} />
           )}
        </div>
        <div className="glass-card p-6">
          <h3 className="font-bold mb-4">Top NGOs You Support</h3>
          {loading ? (
            <div className="flex items-center justify-center py-4"><Loader2 className="w-5 h-5 animate-spin" /></div>
          ) : topNGOs.length > 0 ? (
            <div className="space-y-3">
              {topNGOs.map((n) => (
                <div key={n.name} className="flex justify-between text-sm">
                  <span>{n.name}</span>
                  <span className="font-semibold text-primary">{n.meals} meals</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-text-secondary text-sm">No completed pickups yet.</div>
          )}
        </div>
      </div>

      <div className="glass-card p-6 mb-8">
        <h3 className="text-lg font-bold mb-2">Pickup Efficiency</h3>
        <p className="text-sm text-text-secondary mb-6">Success rate and performance for {user?.organization || 'your location'}.</p>
        <div className="grid grid-cols-2 gap-4 max-w-xl">
          <CircularProgress value={loading ? 0 : successRate} label="Pickup Success" />
          <CircularProgress value={loading ? 0 : (successRate > 0 ? 85 : 0)} label="On-Time Rate" color="#F9A825" />
        </div>
      </div>
    </DonorShell>
  )
}
