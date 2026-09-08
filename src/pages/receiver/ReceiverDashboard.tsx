import { useMemo } from 'react'
import {
  PackageSearch, ListOrdered, CalendarDays, CheckCircle2, Leaf, Wind,
} from 'lucide-react'
import { ReceiverShell } from '../../components/receiver/ReceiverShell'
import { StatCard } from '../../components/ui/StatCard'
import { useReceiverStats, useReceiverRequests } from '../../hooks/useReceiverStats'
import { ReceiverWelcomeSection } from '../../components/receiver/ReceiverWelcomeSection'
import { PendingApprovalBanner } from '../../components/ui/PendingApprovalBanner'
import { WorkflowTimeline } from '../../components/donor/WorkflowTimeline'

export default function ReceiverDashboard() {
  const { stats, loading: statsLoading } = useReceiverStats()
  const { requests } = useReceiverRequests()

  const { stageIndex, trackingId, subtitle } = useMemo(() => {
    const activeRequest = requests.find(
      (r) => (r.status || '').toLowerCase() === 'approved' || (r.status || '').toLowerCase() === 'pending'
    ) || requests[0]

    if (activeRequest) {
      const st = (activeRequest.status || '').toLowerCase()
      if (st === 'completed') {
        return {
          stageIndex: 3,
          trackingId: `REQ-${activeRequest.id}`,
          subtitle: `${activeRequest.foodType} received & verified`,
        }
      }
      if (st === 'approved') {
        return {
          stageIndex: 2,
          trackingId: `REQ-${activeRequest.id}`,
          subtitle: `${activeRequest.foodType} approved for pickup`,
        }
      }
      if (st === 'pending') {
        return {
          stageIndex: 1,
          trackingId: `REQ-${activeRequest.id}`,
          subtitle: `Awaiting donor approval for ${activeRequest.foodType}`,
        }
      }
    }

    return {
      stageIndex: 0,
      trackingId: undefined,
      subtitle: 'Browse available food to request meals for your community.',
    }
  }, [requests])

  return (
    <ReceiverShell>
      <PendingApprovalBanner />

      <ReceiverWelcomeSection />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <StatCard
          title="Available Donations"
          value={statsLoading ? 0 : stats.availableDonations}
          icon={PackageSearch}
        />
        <StatCard
          title="Active Requests"
          value={statsLoading ? 0 : stats.activeRequests}
          icon={ListOrdered}
        />
        <StatCard
          title="Today's Pickups"
          value={statsLoading ? 0 : stats.todayPickups}
          icon={CalendarDays}
        />
        <StatCard
          title="Meals Received"
          value={statsLoading ? 0 : stats.totalMealsReceived}
          icon={CheckCircle2}
        />
        <StatCard
          title="Waste Prevented"
          value={statsLoading ? 0 : stats.totalKgPrevented}
          icon={Leaf}
          color="text-accent"
        />
        <StatCard
          title="CO2 Reduced"
          value={statsLoading ? 0 : stats.co2Reduced}
          icon={Wind}
          color="text-blue-500"
        />
      </div>

      <div className="mb-8">
        <WorkflowTimeline
          currentStageIndex={stageIndex}
          donationId={trackingId}
          subtitle={subtitle}
        />
      </div>
    </ReceiverShell>
  )
}
