import { useState } from 'react'
import { X, Utensils, CheckCircle2, Search, Calendar, Building2 } from 'lucide-react'
import { Button } from '../ui/Button'

interface DonationItem {
  id: string
  date: string
  meals: number
  weightKg: number
  foodItems: string
  organization: string
  ngoRecipient: string
  status: 'Delivered' | 'In Transit' | 'Scheduled'
  notes: string
}

interface DonationHistoryModalProps {
  onClose: () => void
}

export function DonationHistoryModal({ onClose }: DonationHistoryModalProps) {
  const [filter, setFilter] = useState<'All' | 'Delivered' | 'In Transit'>('All')
  const [search, setSearch] = useState('')

  const allDonations: DonationItem[] = [
    {
      id: 'DON-2026-001',
      date: 'Sep 04, 2026',
      meals: 80,
      weightKg: 18,
      foodItems: 'Assorted Banquet Rice, Vegetable Curry & Fresh Bread',
      organization: 'ICT GRAND CHOLA',
      ngoRecipient: 'Anbagam Community Shelter & Meal Care',
      status: 'Delivered',
      notes: 'Meals reached 80 shelter residents in need with cold-chain transport.',
    },
    {
      id: 'DON-2026-002',
      date: 'Aug 28, 2026',
      meals: 70,
      weightKg: 14,
      foodItems: 'Steamed Rice, Lentil Dal, Mixed Vegetable Sabzi',
      organization: 'ICT GRAND CHOLA',
      ngoRecipient: 'Karunai Illam Youth & Senior Home',
      status: 'Delivered',
      notes: 'Meals reached people in need within 2 hours of prep verification.',
    },
  ]

  const filtered = allDonations.filter((d) => {
    if (filter !== 'All' && d.status !== filter) return false
    if (
      search &&
      !d.foodItems.toLowerCase().includes(search.toLowerCase()) &&
      !d.ngoRecipient.toLowerCase().includes(search.toLowerCase())
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
              <Utensils className="w-5 h-5 text-primary-light" />
              Complete Donation History
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Verified food deliveries & direct community impact logs
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
              placeholder="Search by meal type or NGO recipient..."
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
              No donation logs match your filter.
            </div>
          ) : (
            filtered.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 hover:border-slate-600 transition-all space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-700/40 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-primary/20 text-primary-light flex items-center justify-center font-bold text-xs">
                      #{item.id.split('-').pop()}
                    </span>
                    <div>
                      <div className="font-semibold text-sm text-slate-100">{item.foodItems}</div>
                      <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          {item.date}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Building2 className="w-3 h-3 text-slate-400" />
                          {item.organization}
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
                    <div className="text-slate-400">Total Donated</div>
                    <div className="text-sm font-bold text-emerald-400 mt-0.5">
                      {item.meals} meals ({item.weightKg} kg)
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900/60">
                    <div className="text-slate-400">Recipient Partner</div>
                    <div className="text-sm font-semibold text-slate-200 mt-0.5 truncate">
                      {item.ngoRecipient}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900/60 col-span-2 sm:col-span-1">
                    <div className="text-slate-400">Impact Verified</div>
                    <div className="text-xs text-slate-300 mt-0.5 font-mono">
                      Safe Handover Completed
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-400 italic bg-slate-900/40 p-2.5 rounded-lg border border-slate-800/80">
                  "{item.notes}"
                </p>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40 flex justify-between items-center text-xs text-slate-400">
          <span>Showing {filtered.length} verified donations</span>
          <Button variant="secondary" onClick={onClose} className="px-5 py-2 text-xs">
            Close
          </Button>
        </div>
      </div>
    </div>
  )
}
