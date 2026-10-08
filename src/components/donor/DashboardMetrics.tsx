import { type LucideIcon } from 'lucide-react'
import {
  UtensilsCrossed, Package, Truck, Leaf, TrendingUp, Trophy,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useDonationStats } from '../../hooks/useDonationStats'
import { AnimatedCounter } from '../ui/AnimatedCounter'

interface MetricCardProps {
  title: string
  value: number | string
  isNumeric?: boolean
  suffix?: string
  subtitle: string
  icon: LucideIcon
  accent?: boolean
  delay?: number
}

function MetricCard({ title, value, isNumeric = false, suffix = '', subtitle, icon: Icon, accent, delay = 0 }: MetricCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      className="stat-card flex flex-col justify-between"
    >
      <div>
        <div className="flex items-start justify-between mb-3">
          <div className={`p-2.5 rounded-xl ${accent ? 'bg-accent/15 text-accent' : 'bg-primary/10 text-primary'}`}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
        <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">{title}</p>
        <p className="text-2xl font-black mt-1 stat-value">
          {isNumeric && typeof value === 'number' ? (
            <AnimatedCounter value={value} suffix={suffix} />
          ) : (
            <span>{value}</span>
          )}
        </p>
      </div>
      <p className="text-xs text-text-secondary mt-2 leading-relaxed">{subtitle}</p>
    </motion.div>
  )
}

function getCommunityRank(totalDonationEvents: number, totalMeals: number) {
  const score = totalDonationEvents * 2 + Math.floor(totalMeals / 25)

  if (score >= 120) return { value: 'Top 1%', subtitle: 'Elite community impact' }
  if (score >= 80) return { value: 'Top 3%', subtitle: 'Among the strongest donors' }
  if (score >= 50) return { value: 'Top 5%', subtitle: 'High-impact donor tier' }
  if (score >= 25) return { value: 'Top 10%', subtitle: 'Growing donor momentum' }
  if (score > 0) return { value: 'Rising', subtitle: 'Building community impact' }
  return { value: 'New', subtitle: 'Start your first donation' }
}

function getImpactScore(stats: { totalMeals: number; pendingPickups: number; totalDonationEvents: number }) {
  const score =
    Math.min(40, Math.round(stats.totalMeals / 10)) +
    Math.min(25, stats.totalDonationEvents * 2) +
    Math.max(0, 15 - stats.pendingPickups * 3)
  return Math.max(0, Math.min(100, score))
}

export function DashboardMetrics() {
  const { stats, loading } = useDonationStats()
  const communityRank = getCommunityRank(stats.totalDonationEvents, stats.totalMeals)

  if (loading) {
    return <div className="animate-pulse h-32 bg-gray-100 dark:bg-gray-800 rounded-2xl w-full mb-8" />
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
      <MetricCard
        title="Today's Donations"
        value={stats.todayDonations}
        isNumeric
        subtitle="Recent activity"
        icon={UtensilsCrossed}
        delay={0.03}
      />
      <MetricCard
        title="Meals Donated"
        value={stats.totalMeals}
        isNumeric
        subtitle={`Helping ~${stats.totalMeals} people`}
        icon={Package}
        delay={0.06}
      />
      <MetricCard
        title="Pending Pickups"
        value={stats.pendingPickups}
        isNumeric
        subtitle={stats.pendingPickups > 0 ? 'NGO arriving soon' : 'No pending pickups'}
        icon={Truck}
        delay={0.09}
      />
      <MetricCard
        title="Food Waste Rescued"
        value={stats.totalKg}
        isNumeric
        suffix=" kg"
        subtitle="Rescued this month"
        icon={Leaf}
        delay={0.12}
      />
      <MetricCard
        title="Impact Score"
        value={`${getImpactScore(stats)}/100`}
        subtitle="Sustainability tier"
        icon={TrendingUp}
        delay={0.15}
      />
      <MetricCard
        title="Community Rank"
        value={communityRank.value}
        subtitle={communityRank.subtitle}
        icon={Trophy}
        accent
        delay={0.18}
      />
    </div>
  )
}
