import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { GlassCard } from '../ui/StatCard'
import { useTheme } from '../../context/ThemeContext'

const COLORS = ['#2E7D32', '#43A047', '#81C784', '#F9A825', '#1B5E20']

interface ChartCardProps {
  title: string
  subtitle?: string
  children: React.ReactNode
  className?: string
}

function ChartCard({ title, subtitle, children, className = '' }: ChartCardProps) {
  return (
    <GlassCard className={className} hover={false}>
      <div className="mb-6">
        <h3 className="text-lg font-bold text-text dark:text-white">{title}</h3>
        {subtitle && <p className="text-sm text-text-secondary mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </GlassCard>
  )
}

function useChartTheme() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  return {
    gridStroke: isDark ? '#374151' : '#f0f0f0',
    axisStroke: isDark ? '#6B7280' : '#9CA3AF',
    trackFill: isDark ? '#374151' : '#E5E7EB',
    tooltipStyle: {
      contentStyle: {
        background: isDark ? 'rgba(17,24,39,0.95)' : 'rgba(255,255,255,0.95)',
        border: isDark ? '1px solid rgba(55,65,81,0.8)' : '1px solid rgba(0,0,0,0.06)',
        borderRadius: '12px',
        boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.4)' : '0 4px 20px rgba(0,0,0,0.08)',
        fontSize: '13px',
        color: isDark ? '#F3F4F6' : '#1A1A1A',
      },
    },
  }
}

export function DonationTrendChart({ data }: { data: { month: string; donations: number; meals: number }[] }) {
  const { gridStroke, axisStroke, tooltipStyle } = useChartTheme()
  return (
    <ChartCard title="Donation Trends" subtitle="Last 6 months performance">
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorDonations" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#2E7D32" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#2E7D32" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
          <XAxis dataKey="month" tick={{ fontSize: 12, fill: axisStroke }} stroke={axisStroke} />
          <YAxis tick={{ fontSize: 12, fill: axisStroke }} stroke={axisStroke} />
          <Tooltip {...tooltipStyle} />
          <Area type="monotone" dataKey="donations" stroke="#2E7D32" strokeWidth={2} fill="url(#colorDonations)" name="Donations" />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

export function MonthlyAnalyticsChart({ data }: { data: { month: string; donations: number; meals: number }[] }) {
  const { gridStroke, axisStroke, tooltipStyle } = useChartTheme()
  return (
    <ChartCard title="Monthly Analytics" subtitle="Meals donated per month">
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
          <XAxis dataKey="month" tick={{ fontSize: 12, fill: axisStroke }} stroke={axisStroke} />
          <YAxis tick={{ fontSize: 12, fill: axisStroke }} stroke={axisStroke} />
          <Tooltip {...tooltipStyle} />
          <Bar dataKey="meals" fill="#43A047" radius={[6, 6, 0, 0]} name="Meals" />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

export function LineTrendChart({ data }: { data: { month: string; value: number }[] }) {
  const { gridStroke, axisStroke, tooltipStyle } = useChartTheme()
  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
        <XAxis dataKey="month" tick={{ fontSize: 11, fill: axisStroke }} stroke={axisStroke} />
        <YAxis tick={{ fontSize: 11, fill: axisStroke }} stroke={axisStroke} />
        <Tooltip {...tooltipStyle} />
        <Line type="monotone" dataKey="value" stroke="#2E7D32" strokeWidth={2} dot={{ fill: '#2E7D32', r: 4 }} />
      </LineChart>
    </ResponsiveContainer>
  )
}

export function CircularProgress({ value, label, color = '#2E7D32' }: { value: number; label: string; color?: string }) {
  const { trackFill } = useChartTheme()
  const data = [{ value }, { value: 100 - value }]
  return (
    <div className="flex flex-col items-center">
      <ResponsiveContainer width={120} height={120}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={40}
            outerRadius={55}
            startAngle={90}
            endAngle={-270}
            dataKey="value"
          >
            <Cell fill={color} />
            <Cell fill={trackFill} />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <p className="text-2xl font-bold -mt-16 relative z-10 text-text dark:text-white">{value}%</p>
      <p className="text-xs text-text-secondary mt-8">{label}</p>
    </div>
  )
}

export function TopDonorsChart({ data }: { data: { name: string; meals: number }[] }) {
  const { gridStroke, axisStroke, tooltipStyle } = useChartTheme()
  return (
    <ChartCard title="Top Donors" subtitle="By meals donated">
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
          <XAxis type="number" tick={{ fontSize: 12, fill: axisStroke }} stroke={axisStroke} />
          <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11, fill: axisStroke }} stroke={axisStroke} />
          <Tooltip {...tooltipStyle} />
          <Bar dataKey="meals" fill="#2E7D32" radius={[0, 6, 6, 0]} name="Meals" />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

export function CityHeatmapChart({ data }: { data: { city: string; donations: number }[] }) {
  const { gridStroke, axisStroke, tooltipStyle } = useChartTheme()
  return (
    <ChartCard title="Most Active Cities" subtitle="Donation activity by city">
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
          <XAxis dataKey="city" tick={{ fontSize: 11, fill: axisStroke }} stroke={axisStroke} />
          <YAxis tick={{ fontSize: 12, fill: axisStroke }} stroke={axisStroke} />
          <Tooltip {...tooltipStyle} />
          <Bar dataKey="donations" radius={[6, 6, 0, 0]}>
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

export function PieDistributionChart({ data }: { data: { name: string; value: number }[] }) {
  const { tooltipStyle } = useChartTheme()
  return (
    <ChartCard title="Donation Distribution" subtitle="By food category">
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value">
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip {...tooltipStyle} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

export function CompletionRateChart({ rate }: { rate: number }) {
  return (
    <GlassCard hover={false}>
      <h3 className="text-lg font-bold mb-4 text-text dark:text-white">Completion Rate</h3>
      <CircularProgress value={rate} label="Pickup Success" />
    </GlassCard>
  )
}
