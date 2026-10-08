import { Link } from 'react-router-dom'
import {
  Eye,
  Pencil,
  Trash2,
  Clock3,
  Loader2,
  ChevronDown,
  ChevronUp,
  Users,
  Search,
  Plus,
  Utensils,
  X,
  Building2,
  Calendar,
  AlertCircle,
} from 'lucide-react'
import { StatusBadge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { Select } from '../ui/Input'
import { useDonorDonations } from '../../hooks/useDonationStats'
import { deleteDonation, updateDonation } from '../../services/donationService'
import { useState, Fragment } from 'react'
import { useToast } from '../../context/ToastContext'

interface DonationsTableProps {
  compact?: boolean
  limit?: number
}

function FoodThumbnail({ src, alt }: { src?: string | null; alt: string }) {
  const [failed, setFailed] = useState(false)

  if (!src || failed) {
    return (
      <div className="w-11 h-11 rounded-xl bg-primary/10 dark:bg-primary/20 border border-primary/25 flex items-center justify-center text-primary shrink-0">
        <Utensils className="w-5 h-5" />
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      onError={() => setFailed(true)}
      className="w-11 h-11 rounded-xl object-cover shrink-0 border border-gray-200/80 dark:border-gray-700/80 shadow-sm"
    />
  )
}

export function DonationsTable({ compact = false, limit }: DonationsTableProps) {
  const { donations, loading, refetch } = useDonorDonations()
  const { toast } = useToast()
  const [busyId, setBusyId] = useState<string | number | null>(null)
  const [search, setSearch] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<'all' | 'Available' | 'PARTIALLY_ALLOCATED' | 'FULLY_ALLOCATED' | 'Completed' | 'Expired'>('all')

  const rows = (limit ? donations.slice(0, limit) : donations).filter((donation) => {
    if (search && !`${donation.food} ${donation.pickupAddress} ${donation.status}`.toLowerCase().includes(search.toLowerCase())) {
      return false
    }
    if (statusFilter !== 'all') {
      const match = (donation.status || '').toUpperCase() === statusFilter.toUpperCase()
      if (!match) return false
    }
    return true
  })

  const handleEdit = async (donation: any) => {
    const foodName = window.prompt('Food name', donation.food)
    if (!foodName || !foodName.trim()) return
    const description = window.prompt('Description', donation.description || '') ?? (donation.description || '')

    setBusyId(donation.id)
    try {
      await updateDonation(donation.id, {
        food_name: foodName.trim(),
        description,
      })
      toast('Donation updated successfully.', 'success')
      await refetch()
    } catch (error) {
      console.error('Edit donation failed', error)
      toast('Failed to update donation.', 'error')
    } finally {
      setBusyId(null)
    }
  }

  const handleDelete = async (donation: any) => {
    if (!window.confirm('Delete this donation? Completed donations cannot be deleted.')) return
    setBusyId(donation.id)
    try {
      await deleteDonation(donation.id)
      toast('Donation deleted.', 'success')
      await refetch()
    } catch (error: any) {
      toast(error?.response?.data?.message || 'Failed to delete donation.', 'error')
    } finally {
      setBusyId(null)
    }
  }

  const handleExpire = async (donation: any) => {
    setBusyId(donation.id)
    try {
      await updateDonation(donation.id, { status: 'Expired' })
      toast('Donation marked as expired.', 'success')
      await refetch()
    } catch (error: any) {
      toast(error?.response?.data?.message || 'Failed to update donation.', 'error')
    } finally {
      setBusyId(null)
    }
  }

  const hasActiveFilters = search.trim() !== '' || statusFilter !== 'all'

  return (
    <div className="glass-card p-6 overflow-hidden">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-xl font-bold text-text dark:text-white">
            {compact ? 'Recent Donations & Allocations' : 'Donations & Allocations Directory'}
          </h3>
          <p className="text-xs text-text-secondary mt-1">
            Live breakdown of total meals donated, approved allocations, and remaining balances.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {compact ? (
            <Link to="/donor/donations" className="text-xs font-semibold text-primary hover:underline">
              View all donations →
            </Link>
          ) : (
            <Link to="/donor/add">
              <Button variant="primary" size="sm" icon={Plus} className="shadow-sm">
                Add Donation
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Filter toolbar */}
      {!compact && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
            <input
              type="text"
              placeholder="Search by food name, category, or address..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-10 pr-9 py-2.5 text-sm w-full"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-text-secondary hover:text-text rounded-md"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="w-full sm:w-56">
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              options={[
                { value: 'all', label: 'All Statuses' },
                { value: 'Available', label: 'Available' },
                { value: 'PARTIALLY_ALLOCATED', label: 'Partially Allocated' },
                { value: 'FULLY_ALLOCATED', label: 'Fully Allocated' },
                { value: 'Completed', label: 'Completed' },
                { value: 'Expired', label: 'Expired' },
              ]}
            />
          </div>

          {hasActiveFilters && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setSearch('')
                setStatusFilter('all')
              }}
              className="text-xs shrink-0"
            >
              Reset
            </Button>
          )}
        </div>
      )}

      {/* Table Content */}
      <div className="overflow-x-auto rounded-2xl border border-gray-200/80 dark:border-gray-800">
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-3 text-text-secondary">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <span className="text-xs font-medium">Loading donations...</span>
          </div>
        ) : rows.length === 0 ? (
          <div className="py-16 text-center text-text-secondary space-y-2">
            <AlertCircle className="w-8 h-8 mx-auto opacity-40 text-text-secondary" />
            <p className="font-semibold text-sm">No donations match your criteria.</p>
            <p className="text-xs">
              {hasActiveFilters ? 'Try resetting your search or status filters.' : 'Post a new donation to begin.'}
            </p>
          </div>
        ) : (
          <table className="w-full text-sm border-collapse min-w-[860px]">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50/75 dark:bg-gray-900/60 text-xs font-semibold text-text-secondary uppercase tracking-wider text-left">
                <th className="px-4 py-3.5 w-16">ID</th>
                <th className="px-4 py-3.5 min-w-[220px]">Food Details</th>
                <th className="px-4 py-3.5 whitespace-nowrap">Total Donated</th>
                <th className="px-4 py-3.5 whitespace-nowrap">Allocated</th>
                <th className="px-4 py-3.5 whitespace-nowrap">Remaining</th>
                <th className="px-4 py-3.5 whitespace-nowrap">Status</th>
                <th className="px-4 py-3.5 whitespace-nowrap text-center">Receiver Requests</th>
                <th className="px-4 py-3.5 whitespace-nowrap text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60">
              {rows.map((d) => {
                const total = d.total_quantity !== undefined ? d.total_quantity : d.meals
                const allocated = d.allocated_quantity !== undefined ? d.allocated_quantity : 0
                const remaining = d.remaining_quantity !== undefined ? d.remaining_quantity : Math.max(0, total - allocated)
                const requests = d.pickup_requests || []
                const isExpanded = expandedId === d.id

                return (
                  <Fragment key={d.id}>
                    <tr className="hover:bg-gray-50/60 dark:hover:bg-gray-800/40 transition-colors">
                      <td className="px-4 py-3.5 font-mono text-xs text-text-secondary font-medium whitespace-nowrap">
                        #{String(d.id).slice(0, 6)}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <FoodThumbnail src={d.image} alt={d.food} />
                          <div className="min-w-0 max-w-[280px]">
                            <span className="font-bold text-sm text-text dark:text-white block truncate">
                              {d.food}
                            </span>
                            <span
                              className="text-xs text-text-secondary block truncate mt-0.5"
                              title={d.pickupAddress || 'Direct Pickup'}
                            >
                              {d.category || 'Meal'} {d.pickupAddress ? `· ${d.pickupAddress}` : ''}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap font-bold text-text dark:text-white">
                        {total} <span className="text-xs font-normal text-text-secondary">{d.unit || 'meals'}</span>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap font-bold text-amber-600 dark:text-amber-400">
                        {allocated} <span className="text-xs font-normal text-amber-600/70 dark:text-amber-400/70">{d.unit || 'meals'}</span>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap font-extrabold text-emerald-600 dark:text-emerald-400">
                        {remaining} <span className="text-xs font-normal text-emerald-600/70 dark:text-emerald-400/70">{d.unit || 'meals'}</span>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <StatusBadge status={d.status} />
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-center">
                        <button
                          type="button"
                          onClick={() => requests.length > 0 && setExpandedId(isExpanded ? null : d.id)}
                          disabled={requests.length === 0}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                            requests.length > 0
                              ? 'bg-primary/10 text-primary hover:bg-primary/20 dark:bg-primary/20 dark:hover:bg-primary/30 border border-primary/25 cursor-pointer shadow-sm'
                              : 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500 cursor-not-allowed'
                          }`}
                        >
                          <Users className="w-3.5 h-3.5" />
                          <span>{requests.length} {requests.length === 1 ? 'Request' : 'Requests'}</span>
                          {requests.length > 0 && (
                            isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-right">
                        <div className="inline-flex items-center justify-end gap-1">
                          <Link to="/donor/pickups">
                            <button
                              className="p-1.5 rounded-lg text-text-secondary hover:text-primary hover:bg-primary/10 transition-colors"
                              title="Manage Pickups"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </Link>
                          <button
                            className="p-1.5 rounded-lg text-text-secondary hover:text-primary hover:bg-primary/10 transition-colors"
                            title="Edit Food Details"
                            onClick={() => handleEdit(d)}
                            disabled={busyId === d.id}
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            className="p-1.5 rounded-lg text-text-secondary hover:text-amber-600 hover:bg-amber-500/10 transition-colors"
                            title="Mark Expired"
                            onClick={() => handleExpire(d)}
                            disabled={busyId === d.id || d.status === 'Completed' || d.status === 'Expired'}
                          >
                            <Clock3 className="w-4 h-4" />
                          </button>
                          <button
                            className="p-1.5 rounded-lg text-text-secondary hover:text-red-600 hover:bg-red-500/10 transition-colors"
                            title="Delete Donation"
                            onClick={() => handleDelete(d)}
                            disabled={busyId === d.id || d.status === 'Completed'}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Expandable Child Requests Drawer */}
                    {isExpanded && (
                      <tr className="bg-gray-50/80 dark:bg-gray-900/60">
                        <td colSpan={8} className="p-4 sm:p-5">
                          <div className="rounded-2xl bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700/80 p-5 shadow-sm space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 dark:border-gray-700/60 pb-3">
                              <div className="flex items-center gap-2">
                                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                  <Users className="w-4 h-4" />
                                </div>
                                <div>
                                  <h4 className="text-sm font-bold text-text dark:text-white">
                                    Receiver Requests for {d.food}
                                  </h4>
                                  <p className="text-xs text-text-secondary">
                                    Total {requests.length} receiver {requests.length === 1 ? 'organization' : 'organizations'} requested portions of this listing.
                                  </p>
                                </div>
                              </div>
                              <div className="text-xs bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl text-emerald-700 dark:text-emerald-300 font-semibold self-start sm:self-auto">
                                Balance Remaining: {remaining} {d.unit || 'meals'}
                              </div>
                            </div>

                            <div className="grid gap-2.5">
                              {requests.map((req: any) => (
                                <div
                                  key={req.id}
                                  className="p-3.5 rounded-xl bg-gray-50/70 dark:bg-gray-900/40 border border-gray-200/60 dark:border-gray-700/50 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                                >
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <Building2 className="w-3.5 h-3.5 text-text-secondary" />
                                      <span className="font-bold text-text dark:text-white">
                                        {req.receiver_organization || req.receiver_name || 'Community Shelter'}
                                      </span>
                                      <StatusBadge status={req.status} />
                                    </div>
                                    <div className="flex items-center gap-3 text-[11px] text-text-secondary">
                                      <span>Contact: {req.receiver_name || 'Coordinator'}</span>
                                      {req.requested_at && (
                                        <span className="flex items-center gap-1">
                                          <Calendar className="w-3 h-3" />
                                          {new Date(req.requested_at).toLocaleString('en-IN', {
                                            dateStyle: 'short',
                                            timeStyle: 'short',
                                          })}
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-4 self-end md:self-auto">
                                    <div className="text-right">
                                      <p className="font-bold text-primary">
                                        Requested: {req.requested_quantity} meals
                                      </p>
                                      <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                                        Allocated: {req.allocated_quantity || 0} meals
                                      </p>
                                    </div>

                                    <Link to="/donor/pickups">
                                      <Button variant="secondary" size="sm" className="text-xs whitespace-nowrap">
                                        View in Pickups
                                      </Button>
                                    </Link>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

