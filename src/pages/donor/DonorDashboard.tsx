import { DonorShell } from '../../components/donor/DonorShell'
import { WelcomeSection } from '../../components/donor/WelcomeSection'
import { DashboardMetrics } from '../../components/donor/DashboardMetrics'
import { PendingApprovalBanner } from '../../components/ui/PendingApprovalBanner'

export default function DonorDashboard() {
  return (
    <DonorShell>
      <PendingApprovalBanner />

      {/* Welcome Banner with Live Animated Counters */}
      <WelcomeSection />

      {/* 6 Grid Metrics with Live Counting Numbers */}
      <DashboardMetrics />
    </DonorShell>
  )
}
