import { useMemo, useState } from 'react'
import { MapPin, CheckCircle, Loader2, Search } from 'lucide-react'
import { ReceiverShell } from '../../components/receiver/ReceiverShell'
import { Button } from '../../components/ui/Button'
import { Input, Select } from '../../components/ui/Input'
import { useReceiverRequests } from '../../hooks/useReceiverStats'
import { useToast } from '../../context/ToastContext'
import { useNotificationPopup } from '../../context/NotificationPopupContext'
import { pickupRequestService } from '../../services/pickupRequestService'
import { getPickupQr } from '../../services/qrService'
import { QrPreviewModal } from '../../components/ui/QrPreviewModal'
import { ConfirmReceiptModal } from '../../components/receiver/ConfirmReceiptModal'

export default function ReceiverSchedulePage() {
  const { toast } = useToast()
  const { showPopup } = useNotificationPopup()
  const { requests, loading, refetch } = useReceiverRequests()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'Approved' | 'Pending' | 'Rejected' | 'Completed'>('Approved')
  const [qrModal, setQrModal] = useState<null | {
    title: string
    qrImage?: string
    token?: string
    status?: string
    expiresAt?: string
  }>(null)
  const [qrLoadingId, setQrLoadingId] = useState<string | null>(null)
  const [receiptConfirmTarget, setReceiptConfirmTarget] = useState<any | null>(null)
  const [confirmingReceipt, setConfirmingReceipt] = useState(false)

  const scheduled = useMemo(() => {
    return requests.filter((pickup) => {
      if (pickup.status !== 'Approved' && statusFilter === 'Approved') return false
      if (statusFilter !== 'all' && pickup.status !== statusFilter) return false
      if (
        search &&
        !`${pickup.donorName} ${pickup.foodType} ${pickup.pickupAddress}`
          .toLowerCase()
          .includes(search.toLowerCase())
      ) {
        return false
      }
      return true
    })
  }, [requests, search, statusFilter])

  const handleConfirmReceipt = async () => {
    if (!receiptConfirmTarget) return
    setConfirmingReceipt(true)
    try {
      await pickupRequestService.confirmFoodReceived(receiptConfirmTarget.id)
      showPopup({
        title: 'Food Marked as Collected',
        message: 'Food marked as collected successfully. The donor has been notified.',
        type: 'success',
        link: '/receiver/schedule',
        category: 'Food Collected',
      })
      setReceiptConfirmTarget(null)
      await refetch()
    } catch (err: any) {
      toast(err?.response?.data?.message || 'Failed to confirm receipt', 'error')
    } finally {
      setConfirmingReceipt(false)
    }
  }

  const handleViewQr = async (pickupId: string, label: string) => {
    setQrLoadingId(pickupId)
    try {
      const data = await getPickupQr(pickupId)
      setQrModal({
        title: label,
        qrImage: data.qr.qr_image,
        token: data.qr.qr_token,
        status: data.qr.status,
        expiresAt: data.qr.expires_at,
      })
    } catch {
      toast('QR code is not ready yet.', 'warning')
    } finally {
      setQrLoadingId(null)
    }
  }

  return (
    <ReceiverShell>
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Pickup Schedule</h1>
        <p className="text-text-secondary">Manage your upcoming food pickups.</p>
      </div>

      <div className="glass-card p-4 mb-6 space-y-4">
        <Input
          placeholder="Search donor, food, or address..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          icon={Search}
        />
        <Select
          label="Status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
          options={[
            { value: 'Approved', label: 'Approved' },
            { value: 'Pending', label: 'Pending' },
            { value: 'Rejected', label: 'Rejected' },
            { value: 'Completed', label: 'Completed' },
            { value: 'all', label: 'All' },
          ]}
        />
      </div>

      {loading ? (
        <div className="glass-card p-16 flex items-center justify-center gap-3 text-text-secondary">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading schedule...</span>
        </div>
      ) : scheduled.length === 0 ? (
        <div className="glass-card p-16 text-center text-text-secondary">
          <p className="font-semibold text-lg">No pickups scheduled</p>
          <p className="text-sm mt-1">Once your requests are approved, they will appear here.</p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-6">
          {scheduled.map((pickup) => (
            <div key={pickup.id} className="glass-card p-6 flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-lg">{pickup.donorName}</h3>
                  <p className="text-sm text-text-secondary flex items-center gap-1 mt-1">
                    <MapPin className="w-4 h-4" /> {pickup.pickupAddress || 'Address on file'}
                  </p>
                </div>
                <span className="px-3 py-1 bg-primary/10 text-primary text-sm font-semibold rounded-lg border border-primary/20">
                  {pickup.pickupTime}
                </span>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-text-secondary">Food Item</span>
                  <span className="font-medium">{pickup.foodType}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-text-secondary">Quantity</span>
                  <span className="font-medium">
                    {pickup.quantity} {pickup.unit}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-text-secondary">Status</span>
                  <span className="font-medium">{pickup.status}</span>
                </div>
              </div>

              <div className="mt-auto grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Button
                  variant="secondary"
                  className="w-full flex justify-center sm:col-span-1"
                  disabled={pickup.status !== 'Approved'}
                  loading={qrLoadingId === pickup.id}
                  onClick={() => handleViewQr(pickup.id, pickup.donorName)}
                >
                  View QR
                </Button>
                {pickup.status === 'Completed' ? (
                  <div className="sm:col-span-2 flex items-center justify-center py-2 px-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-bold text-xs border border-emerald-200/60">
                    <CheckCircle className="w-4 h-4 mr-1.5" /> Food Received ✓
                  </div>
                ) : (
                  <Button
                    variant="primary"
                    className="w-full flex justify-center sm:col-span-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-soft"
                    icon={CheckCircle}
                    disabled={pickup.status !== 'Approved'}
                    onClick={() => setReceiptConfirmTarget(pickup)}
                  >
                    Confirm Food Received
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <QrPreviewModal
        open={Boolean(qrModal)}
        onClose={() => setQrModal(null)}
        title={qrModal?.title || 'Pickup QR'}
        qrImage={qrModal?.qrImage}
        token={qrModal?.token}
        status={qrModal?.status}
        expiresAt={qrModal?.expiresAt}
      />

      {/* Confirm Food Received Modal */}
      {receiptConfirmTarget && (
        <ConfirmReceiptModal
          isOpen={true}
          onClose={() => setReceiptConfirmTarget(null)}
          onConfirm={handleConfirmReceipt}
          loading={confirmingReceipt}
          foodName={receiptConfirmTarget.foodType || receiptConfirmTarget.food_name || 'Food Donation'}
          quantity={receiptConfirmTarget.allocatedQuantity || receiptConfirmTarget.requestedQuantity || receiptConfirmTarget.quantity || 1}
          unit={receiptConfirmTarget.unit || 'servings'}
          donorName={receiptConfirmTarget.donorName}
          donorOrganization={receiptConfirmTarget.donorOrganization}
        />
      )}
    </ReceiverShell>
  )
}
