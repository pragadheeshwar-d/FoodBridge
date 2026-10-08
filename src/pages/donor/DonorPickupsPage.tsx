import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Truck, Loader2, Search } from 'lucide-react'
import { DonorShell } from '../../components/donor/DonorShell'
import { DashboardHeader } from '../../components/layout/DashboardLayout'
import { StatusBadge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/SharedComponents'
import { Input, Select } from '../../components/ui/Input'
import { useDonorPickups } from '../../hooks/useDonationStats'
import { donorApprovesPickup, donorDeclinesPickup } from '../../services/pickupRequestService'
import { useToast } from '../../context/ToastContext'
import { useNotificationPopup } from '../../context/NotificationPopupContext'
import { QrScannerModal } from '../../components/ui/QrScannerModal'
import { verifyQrCode } from '../../services/qrService'
import { PublicProfileModal } from '../../components/profile/PublicProfileModal'

export default function DonorPickupsPage() {
  const { pickups, loading, refetch } = useDonorPickups()
  const { toast } = useToast()
  const { showPopup } = useNotificationPopup()
  const [busyId, setBusyId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'Pending' | 'Approved' | 'Rejected' | 'Completed'>('all')
  const [scannerOpen, setScannerOpen] = useState(false)
  const [selectedReceiverId, setSelectedReceiverId] = useState<number | null>(null)

  const filteredPickups = useMemo(() => {
    return pickups.filter((pickup) => {
      if (
        search &&
        !`${pickup.receiverName} ${pickup.receiverOrganization} ${pickup.food}`
          .toLowerCase()
          .includes(search.toLowerCase())
      ) {
        return false
      }
      if (statusFilter !== 'all' && pickup.status !== statusFilter) {
        return false
      }
      return true
    })
  }, [pickups, search, statusFilter])

  const handleApprove = async (id: string) => {
    setBusyId(id)
    try {
      await donorApprovesPickup(id)
      showPopup({
        title: 'Request Accepted',
        message: 'Request accepted successfully. The receiver has been notified.',
        type: 'success',
        link: '/donor/pickups',
        category: 'Pickup Request',
      })
      await refetch()
    } catch (err) {
      console.error('Approve failed', err)
      toast('Failed to approve pickup', 'error')
    } finally {
      setBusyId(null)
    }
  }

  const handleDecline = async (id: string) => {
    setBusyId(id)
    try {
      await donorDeclinesPickup(id)
      toast('Pickup declined', 'info')
      await refetch()
    } catch (err) {
      console.error('Decline failed', err)
      toast('Failed to decline pickup', 'error')
    } finally {
      setBusyId(null)
    }
  }

  const handleScanQr = async (token: string) => {
    try {
      const result = await verifyQrCode(token)
      if (!result.valid) {
        toast(result.message || 'Invalid QR code', 'error')
        return
      }
      toast('QR verified and pickup completed.', 'success')
      setScannerOpen(false)
      await refetch()
    } catch (err: any) {
      toast(err?.response?.data?.message || 'Unable to verify QR code', 'error')
    }
  }

  return (
    <DonorShell>
      <DashboardHeader
        title="Pickup Requests"
        subtitle="Review NGO pickup requests, approve them, and monitor collection schedules."
      />

      <div className="glass-card p-4 mb-6 space-y-4">
        <Input
          placeholder="Search receiver, organization, or food..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          icon={Search}
        />
        <Select
          label="Status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
          options={[
            { value: 'all', label: 'All statuses' },
            { value: 'Pending', label: 'Pending' },
            { value: 'Approved', label: 'Approved' },
            { value: 'Rejected', label: 'Rejected' },
            { value: 'Completed', label: 'Completed' },
          ]}
        />
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-text-secondary">
          <Loader2 className="w-8 h-8 animate-spin mb-4" />
          <p>Loading pickup requests...</p>
        </div>
      ) : filteredPickups.length > 0 ? (
        <div className="space-y-4">
          {filteredPickups.map((p) => (
            <div key={p.id} className="glass-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <p className="font-semibold">{p.food}</p>
                <div className="flex items-center gap-2 text-xs py-0.5">
                  <span className="font-bold text-primary">
                    Requested: {p.requested_quantity !== null && p.requested_quantity !== undefined ? `${p.requested_quantity} meals` : p.quantity}
                  </span>
                  {p.allocated_quantity ? (
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                      (Allocated: {p.allocated_quantity} meals)
                    </span>
                  ) : null}
                </div>
                <p className="text-sm text-text-secondary">
                  {p.receiverName} - {p.receiverOrganization}
                </p>
                <p className="text-sm text-text-secondary">Requested {p.requestedAt}</p>
                <p className="text-xs text-text-secondary">{p.pickupAddress}</p>
                {p.requestMessage && <p className="text-xs text-primary/80">Note: {p.requestMessage}</p>}
                <p className="text-xs text-text-secondary">
                  QR Status: <span className="font-semibold text-text">{p.qr_status || 'Waiting for approval'}</span>
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <StatusBadge status={p.status} />
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    const receiverId = (p as any).receiverId || (p as any).receiver_id
                    if (receiverId) {
                      setSelectedReceiverId(Number(receiverId))
                    } else {
                      toast('Receiver profile not found', 'error')
                    }
                  }}
                >
                  View Receiver
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    const receiverId = (p as any).receiverId || (p as any).receiver_id
                    if (receiverId) {
                      window.location.href = `/donor/messages?partnerId=${receiverId}&pickupId=${p.id}`
                    } else {
                      toast('Receiver contact not found', 'error')
                    }
                  }}
                  title="Chat with Receiver"
                >
                  Chat
                </Button>
                {p.status === 'Approved' && (
                  <Button variant="secondary" size="sm" onClick={() => setScannerOpen(true)}>
                    Scan QR
                  </Button>
                )}
                {p.status === 'Pending' && (
                  <>
                    <Button variant="primary" size="sm" loading={busyId === p.id} onClick={() => handleApprove(p.id)}>
                      Approve
                    </Button>
                    <Button variant="secondary" size="sm" loading={busyId === p.id} onClick={() => handleDecline(p.id)}>
                      Reject
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Truck}
          title="No pickup requests available"
          description="Everything is up to date. New receiver requests will appear here when they match your donations."
          action={<Link to="/donor/add"><Button variant="primary">Create Donation</Button></Link>}
        />
      )}

      <QrScannerModal open={scannerOpen} onClose={() => setScannerOpen(false)} onScan={handleScanQr} />

      {/* Public Receiver Profile Modal */}
      <PublicProfileModal
        userId={selectedReceiverId}
        isOpen={!!selectedReceiverId}
        onClose={() => setSelectedReceiverId(null)}
      />
    </DonorShell>
  )
}
