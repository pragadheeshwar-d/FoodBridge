import { BarChart3, Package, Clock, Leaf, Wind, Loader2 } from 'lucide-react'
import { ReceiverShell } from '../../components/receiver/ReceiverShell'
import { StatCard } from '../../components/ui/StatCard'
import { CompletionRateChart, MonthlyAnalyticsChart } from '../../components/charts/Charts'
import { useReceiverStats, useReceiverRequests } from '../../hooks/useReceiverStats'

export default function ReceiverAnalyticsPage() {
  const { stats, loading } = useReceiverStats()
  const { requests } = useReceiverRequests()

  // Build monthly chart data from real requests grouped by month
  const monthlyData = (() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const buckets: Record<string, { donations: number; meals: number }> = {}
    months.forEach(m => { buckets[m] = { donations: 0, meals: 0 } })

    requests.forEach(r => {
      const m = months[r.createdAt.getMonth()]
      if (String(r.status).toLowerCase() === 'completed') {
        buckets[m].donations += 1
        buckets[m].meals += Number(r.quantity) || 0
      }
    })

    return months
      .map(month => ({ month, ...buckets[month] }))
      .filter(d => d.donations > 0)
      .slice(-6)
  })()

  // Veg vs Non-Veg from food type labels
  const vegCount = requests.filter(r => r.foodType?.toLowerCase().includes('veg')).length
  const total = requests.length || 1
  const vegPct = Math.round((vegCount / total) * 100)
  const nonVegPct = 100 - vegPct

  return (
    <ReceiverShell>
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Analytics & Impact</h1>
        <p className="text-text-secondary">Your NGO's real-time impact from the database.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        <StatCard
          title="Total Meals Received"
          value={loading ? '—' : stats.totalMealsReceived.toLocaleString()}
          icon={Package}
        />
        <StatCard
          title="Total Pickups"
          value={loading ? '—' : stats.totalPickups}
          icon={BarChart3}
        />
        <StatCard
          title="Active Requests"
          value={loading ? '—' : stats.activeRequests}
          icon={Clock}
          color="text-amber-500"
        />
        <StatCard
          title="Waste Prevented"
          value={loading ? '—' : `${stats.totalKgPrevented} kg`}
          icon={Leaf}
          color="text-accent"
        />
        <StatCard
          title="CO2 Reduced"
          value={loading ? '—' : `${stats.co2Reduced} kg`}
          icon={Wind}
          color="text-blue-500"
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        <div className="glass-card p-6">
          <h3 className="font-bold text-lg mb-6">Meals Received (Monthly)</h3>
          {loading ? (
            <div className="h-56 flex items-center justify-center gap-2 text-text-secondary">
              <Loader2 className="w-5 h-5 animate-spin" /> Loading…
            </div>
          ) : monthlyData.length > 0 ? (
            <MonthlyAnalyticsChart data={monthlyData} />
          ) : (
            <div className="h-56 flex items-center justify-center text-text-secondary text-sm">
              No completed pickups yet.
            </div>
          )}
        </div>

        <div className="glass-card p-6">
          <h3 className="font-bold text-lg mb-6">Request Acceptance Rate</h3>
          {loading ? (
            <div className="h-56 flex items-center justify-center gap-2 text-text-secondary">
              <Loader2 className="w-5 h-5 animate-spin" /> Loading…
            </div>
          ) : (
            <>
              <CompletionRateChart rate={stats.acceptanceRate} />
              <p className="text-center text-sm text-text-secondary mt-4">
                {stats.acceptanceRate}% of your requests are accepted by donors.
              </p>
            </>
          )}
        </div>
      </div>

      <div className="glass-card p-6">
        <h3 className="font-bold text-lg mb-6">Food Categories Received</h3>
        {loading ? (
          <div className="flex items-center gap-2 text-text-secondary text-sm">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading…
          </div>
        ) : requests.length === 0 ? (
          <p className="text-text-secondary text-sm">No data available yet.</p>
        ) : (
          <div className="space-y-4 max-w-xl">
            {[
              { label: 'Vegetarian Meals', pct: vegPct, color: 'bg-primary' },
              { label: 'Non-Veg Meals',    pct: nonVegPct, color: 'bg-accent' },
            ].map(({ label, pct, color }) => (
              <div key={label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium">{label}</span>
                  <span className="text-text-secondary">{pct}%</span>
                </div>
                <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${color} rounded-full transition-all duration-700`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </ReceiverShell>
  )
}
