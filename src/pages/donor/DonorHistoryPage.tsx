import { useState } from 'react'
import { DonorShell } from '../../components/donor/DonorShell'
import { DashboardHeader } from '../../components/layout/DashboardLayout'
import { useDonorHistory } from '../../hooks/useDynamicContent'
import { StatusBadge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { PublicProfileModal } from '../../components/profile/PublicProfileModal'
import { UserCheck, MessageSquare } from 'lucide-react'

export default function DonorHistoryPage() {
  const { history: completed } = useDonorHistory()
  const [selectedReceiverId, setSelectedReceiverId] = useState<number | null>(null)

  return (
    <DonorShell fab={false}>
      <DashboardHeader
        title="Donation History"
        subtitle="Complete archive of verified donations, deliveries, and NGO confirmations."
      />
      <div className="space-y-3">
        {completed.map((d) => (
          <div key={d.id} className="glass-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 shadow-soft">
                <span className="text-2xl">🍱</span>
              </div>
              <div>
                <p className="font-bold text-text dark:text-white">{d.foodType}</p>
                <p className="text-sm text-text-secondary">
                  Receiver: <strong>{d.receiverName}</strong> • {d.meals} meals • {d.completedAt.toLocaleDateString()}
                </p>
                <p className="text-xs font-mono text-text-secondary mt-0.5">Reference #{d.id}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <StatusBadge status={d.status} />
              {d.receiverId ? (
                <>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setSelectedReceiverId(Number(d.receiverId))
                    }}
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    View Receiver
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      window.location.href = `/donor/messages?partnerId=${d.receiverId}`
                    }}
                    title="Chat with Receiver"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    Chat
                  </Button>
                </>
              ) : null}
            </div>
          </div>
        ))}
      </div>

      {/* Public Receiver Profile Modal */}
      <PublicProfileModal
        userId={selectedReceiverId}
        isOpen={!!selectedReceiverId}
        onClose={() => setSelectedReceiverId(null)}
      />
    </DonorShell>
  )
}
