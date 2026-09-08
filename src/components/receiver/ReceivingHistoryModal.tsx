import { useState } from 'react'
import { X, CheckCircle2, Search, Calendar, Building2, Package } from 'lucide-react'
import { Button } from '../ui/Button'

interface ReceivedItem {
  id: string
  date: string
  meals: number
  foodType: string
  donor: string
  status: 'Delivered' | 'In Transit' | 'Scheduled'
  notes: string
}

interface ReceivingHistoryModalProps {
  onClose: () => void
}

export function ReceivingHistoryModal({ onClose }: ReceivingHistoryModalProps) {
  const [filter, setFilter] = useState<'All' | 'Delivered'>('All')
  const [search, setSearch] = useState('')

  const allHistory: ReceivedItem[] = [
    {
      id: 'REC-2026-024',
      date: 'Sep 04, 2026',
      meals: 80,
      foodType: 'Surplus Lunch Buffet Assortment & Breads',
      donor: 'ICT GRAND CHOLA',
      status: 'Delivered',
      notes: 'Successfully delivered to Hope Community Centre. Inspected and served hot.',
    },
    {
      id: 'REC-2026-023',
      date: 'Sep 01, 2026',
      meals: 50,
      foodType: 'Packed Vegetarian Dinner & Dal Makhani',
      donor: 'ABC Restaurant',
      status: 'Delivered',
      notes: 'Evenly portioned and distributed during evening community food counter.',
    },
    {
      id: 'REC-2026-022',
      date: 'Aug 28, 2026',
      meals: 40,
      foodType: 'Fresh Green Salads, Rotis & Veg Curries',
      donor: 'Green Kitchen',
      status: 'Delivered',
      notes: 'Delivered safely with thermal container. Benefited 40 elder shelter residents.',
    },
    {
      id: 'REC-2026-021',
      date: 'Aug 22, 2026',
      meals: 110,
      foodType: 'Wedding Banquet Rice & Mixed Sabzi',
      donor: 'Grand Palace Caterers',
      status: 'Delivered',
      notes: 'Large surplus rescued and served to temporary shelter camps across area.',
    },
    {
      id: 'REC-2026-020',
      date: 'Aug 15, 2026',
      meals: 65,
      foodType: 'Independence Day Sweet & Savory Snack Boxes',
      donor: 'Spice Garden',
      status: 'Delivered',
      notes: 'Special holiday distribution for 65 youth home students.',
    },
  ]

  const filtered = allHistory.filter((item) => {
    if (filter !== 'All' && item.status !== filter) return false
    if (
      search &&
      !item.foodType.toLowerCase().includes(search.toLowerCase()) &&
      !item.donor.toLowerCase().includes(search.toLowerCase())
    ) {
      return false
    }
    return true
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 text-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-950/40">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Package className="w-5 h-5 text-primary-light" />
              Complete Food Receiving History
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Verified food arrivals, donor sources, and meal distribution logs
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-slate-800 bg-slate-900/60 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by food type or donor name..."
              className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-primary"
            />
          </div>

          <div className="flex items-center gap-1.5">
            {(['All', 'Delivered'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  filter === tab
                    ? 'bg-primary text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {filtered.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-sm">
              No delivery records found matching your search.
            </div>
          ) : (
            filtered.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 hover:border-slate-600 transition-all space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-700/40 pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                      #{item.id.split('-').pop()}
                    </span>
                    <div>
                      <div className="font-semibold text-sm text-slate-100">{item.foodType}</div>
                      <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          {item.date}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Building2 className="w-3 h-3 text-slate-400" />
                          From: {item.donor}
                        </span>
                      </div>
                    </div>
                  </div>

                  <span className="self-start sm:self-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {item.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-2.5 rounded-lg bg-slate-900/60">
                    <div className="text-slate-400">Total Volume</div>
                    <div className="text-sm font-bold text-emerald-400 mt-0.5">
                      {item.meals} meals
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900/60">
                    <div className="text-slate-400">Donor Partner</div>
                    <div className="text-sm font-semibold text-slate-200 mt-0.5 truncate">
                      {item.donor}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900/60 col-span-2 sm:col-span-1">
                    <div className="text-slate-400">Handover Protocol</div>
                    <div className="text-xs text-slate-300 mt-0.5 font-mono">
                      Safe Cold/Hot Handover
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-400 italic bg-slate-900/40 p-2.5 rounded-lg border border-slate-800/80">
                  &ldquo;{item.notes}&rdquo;
                </p>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40 flex justify-between items-center text-xs text-slate-400">
          <span>Showing {filtered.length} of 24 deliveries</span>
          <Button variant="secondary" onClick={onClose} className="px-5 py-2 text-xs">
            Close
          </Button>
        </div>
      </div>
    </div>
  )
}
