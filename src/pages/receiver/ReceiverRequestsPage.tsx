import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { ReceiverShell } from '../../components/receiver/ReceiverShell'
import { StatusBadge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { useReceiverRequests } from '../../hooks/useReceiverStats'
import { PublicProfileModal } from '../../components/profile/PublicProfileModal'
import { ConfirmReceiptModal } from '../../components/receiver/ConfirmReceiptModal'
import { pickupRequestService } from '../../services/pickupRequestService'
import { useToast } from '../../context/ToastContext'
import { useNotificationPopup } from '../../context/NotificationPopupContext'

type Tab = 'Pending' | 'Approved' | 'Completed' | 'Rejected'

export default function ReceiverRequestsPage() {
  const { toast } = useToast()
  const { showPopup } = useNotificationPopup()
  const [activeTab, setActiveTab] = useState<Tab>('Pending')
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null)
  const [selectedDonorId, setSelectedDonorId] = useState<number | null>(null)
  const [receiptConfirmTarget, setReceiptConfirmTarget] = useState<any | null>(null)
  const [confirmingReceipt, setConfirmingReceipt] = useState(false)
  const { requests, loading, refetch } = useReceiverRequests()

  const filtered = requests.filter(r => r.status === activeTab)

  const tabs: { id: Tab; label: string }[] = [
    { id: 'Pending', label: 'Pending' },
    { id: 'Approved', label: 'Approved' },
    { id: 'Completed', label: 'Completed' },
    { id: 'Rejected', label: 'Rejected' },
  ]

  const handleConfirmReceipt = async () => {
    if (!receiptConfirmTarget) return
    setConfirmingReceipt(true)
    try {
      await pickupRequestService.confirmFoodReceived(receiptConfirmTarget.id)
      showPopup({
        title: 'Food Marked as Collected',
        message: 'Food marked as collected successfully. The donor has been notified.',
        type: 'success',
        link: '/receiver/requests',
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

  return (
    <ReceiverShell>
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">My Requests</h1>
        <p className="text-text-secondary">Track and manage your pickup requests.</p>
      </div>

      <div className="glass-card mb-6 p-1 inline-flex overflow-x-auto max-w-full">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-2.5 rounded-xl font-medium text-sm transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-white dark:bg-gray-800 shadow-sm text-primary'
                : 'text-text-secondary hover:text-text hover:bg-gray-50 dark:hover:bg-gray-800/50'
            }`}
          >
            {tab.label}
            {/* live count badge */}
            {!loading && (
              <span className="ml-2 px-1.5 py-0.5 text-xs rounded-full bg-primary/10 text-primary font-semibold">
                {requests.filter(r => r.status === tab.id).length}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="glass-card overflow-x-auto">
        {loading ? (
          <div className="p-12 flex items-center justify-center gap-3 text-text-secondary">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Loading requests...</span>
          </div>
        ) : (
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800 text-sm text-text-secondary">
                <th className="p-4 font-semibold">Donor / Restaurant</th>
                <th className="p-4 font-semibold">Food</th>
              <th className="p-4 font-semibold">Allocation</th>
                <th className="p-4 font-semibold">Pickup Time</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {filtered.length > 0 ? (
                filtered.map((req) => (
                  <tr key={req.id}
                    className="border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                    <td className="p-4 font-medium">{req.donorName}</td>
                    <td className="p-4">{req.foodType}</td>
                    <td className="p-4">
                      <p className="font-medium">Requested: {req.requestedQuantity ?? req.quantity} {req.unit}</p>
                      <p className="text-xs text-emerald-700 dark:text-emerald-300">Allocated: {req.allocatedQuantity ?? 0} {req.unit}</p>
                      {(req.pendingQuantity ?? 0) > 0 && <p className="text-xs text-amber-700 dark:text-amber-300">Pending: {req.pendingQuantity} {req.unit}</p>}
                    </td>
                    <td className="p-4 text-text-secondary">{req.pickupTime}</td>
                    <td className="p-4">
                      <StatusBadge status={req.status} />
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {req.status === 'Approved' && (
                          <Button
                            variant="primary"
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-soft text-xs font-bold"
                            onClick={() => setReceiptConfirmTarget(req)}
                          >
                            Confirm Food Received
                          </Button>
                        )}
                        {req.status === 'Completed' && (
                          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/50 flex items-center gap-1">
                            ✓ Food Received
                          </span>
                        )}
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            const donorId = (req as any).donorId || (req as any).donor_id || (req as any).donation?.donor_id
                            if (donorId) {
                              setSelectedDonorId(Number(donorId))
                            } else {
                              toast('Donor profile not found', 'error')
                            }
                          }}
                        >
                          View Donor
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            const donorId = (req as any).donorId || (req as any).donor_id || (req as any).donation?.donor_id
                            if (donorId) {
                              window.location.href = `/receiver/messages?partnerId=${donorId}&pickupId=${req.id}`
                            } else {
                              toast('Donor contact not found', 'error')
                            }
                          }}
                        >
                          Chat
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setSelectedRequest(req)}>
                          Details
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-text-secondary">
                    No {activeTab} requests found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            className="absolute inset-0 bg-black/50"
            aria-label="Close request details"
            onClick={() => setSelectedRequest(null)}
          />
          <div className="relative z-10 w-full max-w-2xl glass-card p-6 md:p-8">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold">Request Details</h2>
                <p className="text-text-secondary mt-1">Pickup request summary for {selectedRequest.donorName}.</p>
              </div>
              <button
                onClick={() => setSelectedRequest(null)}
                className="text-sm text-text-secondary hover:text-text"
              >
                Close
              </button>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              <div className="rounded-xl bg-gray-50 dark:bg-gray-800/50 p-4">
                <p className="text-text-secondary text-xs uppercase tracking-wide">Donor / Restaurant</p>
                <p className="font-semibold mt-1">{selectedRequest.donorName}</p>
              </div>
              <div className="rounded-xl bg-gray-50 dark:bg-gray-800/50 p-4">
                <p className="text-text-secondary text-xs uppercase tracking-wide">Food</p>
                <p className="font-semibold mt-1">{selectedRequest.foodType}</p>
              </div>
              <div className="rounded-xl bg-gray-50 dark:bg-gray-800/50 p-4">
                <p className="text-text-secondary text-xs uppercase tracking-wide">Requested</p>
                <p className="font-semibold mt-1">{selectedRequest.requestedQuantity ?? selectedRequest.quantity} {selectedRequest.unit}</p>
              </div>
              <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/20 p-4">
                <p className="text-emerald-700 dark:text-emerald-300 text-xs uppercase tracking-wide">Allocated</p>
                <p className="font-semibold mt-1">{selectedRequest.allocatedQuantity ?? 0} {selectedRequest.unit}</p>
              </div>
              <div className="rounded-xl bg-gray-50 dark:bg-gray-800/50 p-4">
                <p className="text-text-secondary text-xs uppercase tracking-wide">Pickup Time</p>
                <p className="font-semibold mt-1">{selectedRequest.pickupTime}</p>
              </div>
              <div className="rounded-xl bg-amber-50 dark:bg-amber-950/20 p-4 sm:col-span-2">
                <p className="text-amber-800 dark:text-amber-200 text-xs uppercase tracking-wide">Allocation update</p>
                {selectedRequest.allocationStatus === 'FULLY_ALLOCATED' ? (
                  <p className="mt-1 font-semibold">Request fulfilled — your complete food request has been allocated.</p>
                ) : (
                  <p className="mt-1 font-semibold">Partially fulfilled — {selectedRequest.allocatedQuantity ?? 0} of {selectedRequest.requestedQuantity ?? selectedRequest.quantity} {selectedRequest.unit} allocated. {selectedRequest.pendingQuantity ?? 0} portions remain pending and will be fulfilled automatically.</p>
                )}
              </div>
              <div className="rounded-xl bg-gray-50 dark:bg-gray-800/50 p-4 sm:col-span-2">
                <p className="text-text-secondary text-xs uppercase tracking-wide">Pickup Address</p>
                <p className="font-semibold mt-1">{selectedRequest.pickupAddress || 'Not provided'}</p>
              </div>
              <div className="rounded-xl bg-gray-50 dark:bg-gray-800/50 p-4">
                <p className="text-text-secondary text-xs uppercase tracking-wide">Status</p>
                <div className="mt-1 inline-flex">
                  <StatusBadge status={selectedRequest.status} />
                </div>
              </div>
              <div className="rounded-xl bg-gray-50 dark:bg-gray-800/50 p-4">
                <p className="text-text-secondary text-xs uppercase tracking-wide">Request ID</p>
                <p className="font-mono font-semibold mt-1">{String(selectedRequest.id)}</p>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
              <Button
                variant="secondary"
                onClick={() => {
                  const donorId = selectedRequest.donorId || selectedRequest.donor_id || (selectedRequest as any).donation?.donor_id
                  if (donorId) {
                    setSelectedDonorId(Number(donorId))
                  } else {
                    toast('Donor profile not found', 'error')
                  }
                }}
              >
                View Donor Profile
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  const donorId = selectedRequest.donorId || selectedRequest.donor_id || (selectedRequest as any).donation?.donor_id
                  if (donorId) {
                    window.location.href = `/receiver/messages?partnerId=${donorId}&pickupId=${selectedRequest.id}`
                  } else {
                    toast('Donor contact not found', 'error')
                  }
                }}
              >
                Chat with Donor
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Public Donor Profile Modal */}
      <PublicProfileModal
        userId={selectedDonorId}
        isOpen={!!selectedDonorId}
        onClose={() => setSelectedDonorId(null)}
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
          donorName={receiptConfirmTarget.donorName || receiptConfirmTarget.donor_name}
          donorOrganization={receiptConfirmTarget.donorOrganization || receiptConfirmTarget.donor_organization}
        />
      )}
    </ReceiverShell>
  )
}
