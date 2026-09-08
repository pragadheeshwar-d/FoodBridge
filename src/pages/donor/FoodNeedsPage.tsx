import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  MapPin,
  Clock,
  Heart,
  ShieldCheck,
  Map as MapIcon,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { DonorShell } from '../../components/donor/DonorShell'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { needService, type FoodNeed } from '../../services/needService'
import { PublicProfileModal } from '../../components/profile/PublicProfileModal'
import { RespondToNeedModal } from '../../components/donor/RespondToNeedModal'
import { ViewFoodNeedModal } from '../../components/donor/ViewFoodNeedModal'

export default function FoodNeedsPage() {
  const [needs, setNeeds] = useState<FoodNeed[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [urgencyFilter, setUrgencyFilter] = useState('all')

  // Modals
  const [selectedReceiverId, setSelectedReceiverId] = useState<number | null>(null)
  const [selectedNeedForOffer, setSelectedNeedForOffer] = useState<FoodNeed | null>(null)
  const [selectedNeedForDetails, setSelectedNeedForDetails] = useState<FoodNeed | null>(null)

  const loadNeeds = async () => {
    setLoading(true)
    try {
      const data = await needService.getNeeds({
        search: search || undefined,
        urgency: urgencyFilter !== 'all' ? urgencyFilter : undefined,
      })
      setNeeds(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadNeeds()
  }, [urgencyFilter])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    loadNeeds()
  }

  const formatRequiredTime = (dateStr?: string) => {
    if (!dateStr) return 'Flexible timing'
    try {
      const d = new Date(dateStr)
      if (isNaN(d.getTime())) return dateStr
      const now = new Date()
      const isToday = d.toDateString() === now.toDateString()
      const tomorrow = new Date(now)
      tomorrow.setDate(tomorrow.getDate() + 1)
      const isTomorrow = d.toDateString() === tomorrow.toDateString()
      const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

      if (isToday) return `Needed today by ${timeStr}`
      if (isTomorrow) return `Needed tomorrow by ${timeStr}`
      return `Needed by ${d.toLocaleDateString([], { month: 'short', day: 'numeric' })} at ${timeStr}`
    } catch {
      return dateStr || 'Flexible timing'
    }
  }

  return (
    <DonorShell>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
            <h1 className="text-2xl font-black text-text dark:text-white tracking-tight flex items-center gap-2">
              🍽️ Food Needs Near You
            </h1>
          </div>
          <p className="text-xs text-text-secondary mt-1">
            Discover verified NGOs, shelters, and communities in need of food support. Offer surplus or freshly prepared meals directly.
          </p>
        </div>

        <Link to="/donor/needs-map">
          <Button variant="secondary" icon={MapIcon} className="shadow-soft">
            View on Map
          </Button>
        </Link>
      </div>

      {/* Filter & Search Bar */}
      <div className="glass-card p-4 mb-6 border border-gray-200/80 dark:border-gray-800">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
          <div className="flex-1">
            <Input
              placeholder="Search by food dish, location, or NGO name..."
              icon
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
            {['all', 'Critical', 'High', 'Medium'].map((urg) => (
              <button
                key={urg}
                type="button"
                onClick={() => setUrgencyFilter(urg)}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  urgencyFilter === urg
                    ? 'bg-primary text-white shadow-soft'
                    : 'bg-surface dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-text-secondary hover:text-text'
                }`}
              >
                {urg === 'all' ? 'All Urgencies' : `${urg} Urgency`}
              </button>
            ))}
            <Button type="submit" variant="primary" size="sm">
              Search
            </Button>
          </div>
        </form>
      </div>

      {/* Needs Cards Grid */}
      {loading ? (
        <div className="py-16 glass-card flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-xs text-text-secondary">Discovering food needs in your region...</p>
        </div>
      ) : needs.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <div className="w-16 h-16 rounded-3xl bg-blue-500/10 text-blue-500 flex items-center justify-center mx-auto mb-3 text-2xl">
            🍽️
          </div>
          <h3 className="text-base font-bold text-text dark:text-white">No active food needs matching your filter</h3>
          <p className="text-xs text-text-secondary mt-1">
            Try adjusting your search criteria or urgency filter.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {needs.map((need) => (
            <motion.div
              key={need.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -4 }}
              transition={{ duration: 0.3 }}
              className="glass-card p-5 border border-gray-200/80 dark:border-gray-800 flex flex-col justify-between hover:shadow-elevated transition-all relative overflow-hidden group"
            >
              {/* Card Top */}
              <div>
                <div className="flex items-start justify-between gap-2 mb-2.5">
                  <span
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                      need.urgency === 'Critical'
                        ? 'bg-red-500 text-white animate-pulse'
                        : need.urgency === 'High'
                        ? 'bg-orange-500 text-white'
                        : 'bg-blue-500 text-white'
                    }`}
                  >
                    {need.urgency} Urgency
                  </span>

                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-primary/10 text-primary">
                    {need.required_quantity}
                  </span>
                </div>

                <h3 className="text-base font-bold text-text dark:text-white group-hover:text-primary transition-colors">
                  {need.food_name || need.food_type}
                </h3>

                <p className="text-xs text-primary font-semibold mt-1 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {need.receiver_organization || need.receiver_name}
                </p>

                <div className="space-y-1.5 mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 text-xs text-text-secondary">
                  <p className="flex items-center gap-1.5 truncate">
                    <MapPin className="w-3.5 h-3.5 text-text-secondary shrink-0" />
                    {need.location}
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-text-secondary shrink-0" />
                    <span>{formatRequiredTime(need.required_time)}</span>
                  </p>
                </div>

                {need.additional_notes && (
                  <p className="text-[11px] text-text-secondary mt-2.5 p-2 rounded-lg bg-gray-50 dark:bg-gray-900/60 italic border border-gray-100 dark:border-gray-800">
                    "{need.additional_notes}"
                  </p>
                )}
              </div>

              {/* Card Bottom Actions */}
              <div className="mt-5 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  className="text-xs"
                  onClick={() => setSelectedNeedForDetails(need)}
                >
                  View Need
                </Button>
                <Button
                  variant="primary"
                  className="flex-1 shadow-glow text-xs"
                  icon={Heart}
                  onClick={() => setSelectedNeedForOffer(need)}
                >
                  Offer Food
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  className="text-xs"
                  onClick={() => setSelectedReceiverId(need.receiver_id)}
                >
                  View NGO
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* View Food Need Modal */}
      <ViewFoodNeedModal
        need={selectedNeedForDetails}
        isOpen={Boolean(selectedNeedForDetails)}
        onClose={() => setSelectedNeedForDetails(null)}
        onOfferFood={(need) => {
          setSelectedNeedForDetails(null)
          setSelectedNeedForOffer(need)
        }}
      />

      {/* Public Receiver Profile Modal */}
      <PublicProfileModal
        userId={selectedReceiverId}
        isOpen={!!selectedReceiverId}
        onClose={() => setSelectedReceiverId(null)}
      />

      {/* Respond to Need Modal */}
      <RespondToNeedModal
        need={selectedNeedForOffer}
        isOpen={!!selectedNeedForOffer}
        onClose={() => setSelectedNeedForOffer(null)}
        onSuccess={loadNeeds}
      />
    </DonorShell>
  )
}
