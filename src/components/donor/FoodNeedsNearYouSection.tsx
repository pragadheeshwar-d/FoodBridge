import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  MapPin,
  Clock,
  ArrowRight,
  UtensilsCrossed,
  MessageSquare,
  Building2,
  Map as MapIcon,
} from 'lucide-react'
import { Button } from '../ui/Button'
import { needService, type FoodNeed } from '../../services/needService'
import { ViewFoodNeedModal } from './ViewFoodNeedModal'
import { RespondToNeedModal } from './RespondToNeedModal'

export function FoodNeedsNearYouSection() {
  const [needs, setNeeds] = useState<FoodNeed[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedNeedForDetails, setSelectedNeedForDetails] = useState<FoodNeed | null>(null)
  const [selectedNeedForOffer, setSelectedNeedForOffer] = useState<FoodNeed | null>(null)

  const fetchNeeds = async () => {
    try {
      const data = await needService.getNeeds({ status: 'active' })
      setNeeds(data.slice(0, 6)) // Show top 6 needs on dashboard
    } catch (err) {
      console.error('Failed to load food needs for donor dashboard', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNeeds()
  }, [])

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case 'Critical':
        return 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300'
      case 'High':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
      case 'Medium':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'
      default:
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
    }
  }

  const formatRequiredTime = (dateStr?: string) => {
    if (!dateStr) return 'Needed today'
    try {
      const d = new Date(dateStr)
      return d.toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return dateStr
    }
  }

  if (loading) {
    return (
      <div className="glass-card p-6 mb-8">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
          <h2 className="text-lg font-black tracking-tight">🍽️ Food Needs Near You</h2>
        </div>
        <div className="py-8 flex items-center justify-center text-text-secondary text-xs">
          Loading live food requirements from verified NGOs...
        </div>
      </div>
    )
  }

  return (
    <div className="glass-card p-6 mb-8 border border-blue-500/20 dark:border-blue-500/30">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-3 border-b border-gray-100 dark:border-gray-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
            <h2 className="text-xl font-black tracking-tight text-text dark:text-white flex items-center gap-2">
              🍽️ Food Needs Near You
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 uppercase tracking-wider">
              Live Network
            </span>
          </div>
          <p className="text-xs text-text-secondary mt-1">
            Verified shelters and NGOs requesting food support right now. Respond with surplus or prepared meals.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/donor/needs-map">
            <Button variant="ghost" size="sm" icon={MapIcon} className="text-xs">
              View on Map
            </Button>
          </Link>
          <Link to="/donor/needs">
            <Button variant="secondary" size="sm" icon={ArrowRight} className="text-xs">
              Browse All ({needs.length})
            </Button>
          </Link>
        </div>
      </div>

      {needs.length === 0 ? (
        <div className="text-center py-8 text-text-secondary">
          <UtensilsCrossed className="w-10 h-10 mx-auto opacity-30 mb-2" />
          <p className="font-semibold text-sm">No active food requests at this moment</p>
          <p className="text-xs mt-1 text-text-secondary/80">
            Whenever a receiver or shelter posts a need, it will appear here automatically.
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {needs.map((need) => (
            <motion.div
              key={need.id}
              whileHover={{ y: -3 }}
              transition={{ duration: 0.2 }}
              className="p-4 rounded-2xl bg-white dark:bg-gray-800/80 border border-gray-200/80 dark:border-gray-700 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase mb-1.5 ${getUrgencyBadge(need.urgency)}`}>
                      {need.urgency} Priority
                    </span>
                    <h3 className="font-bold text-base text-text dark:text-white leading-snug truncate">
                      🍚 {need.food_name || need.food_type}
                    </h3>
                    <p className="text-xs text-text-secondary flex items-center gap-1 mt-1">
                      <Building2 className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span className="font-medium text-text dark:text-gray-200 truncate">
                        {need.receiver_organization || need.receiver_name}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 text-xs space-y-1.5 my-3">
                  <div className="flex items-center justify-between">
                    <span className="text-text-secondary">Needed:</span>
                    <strong className="text-primary font-bold text-sm">
                      {need.remaining_quantity} / {need.quantity_number} {need.unit}
                    </strong>
                  </div>

                  <div className="flex items-center gap-1.5 text-text-secondary truncate">
                    <MapPin className="w-3 h-3 text-text-secondary shrink-0" />
                    <span className="truncate">{need.location}</span>
                  </div>

                  <div className="flex items-center gap-1.5 text-text-secondary">
                    <Clock className="w-3 h-3 text-text-secondary shrink-0" />
                    <span>{formatRequiredTime(need.required_time)}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2 border-t border-gray-100 dark:border-gray-700/60">
                <Button
                  variant="secondary"
                  size="sm"
                  className="flex-1 text-xs"
                  onClick={() => setSelectedNeedForDetails(need)}
                >
                  View Need
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  className="flex-1 text-xs shadow-soft"
                  icon={UtensilsCrossed}
                  onClick={() => setSelectedNeedForOffer(need)}
                >
                  Offer Food
                </Button>
                <button
                  type="button"
                  title="Contact Receiver"
                  onClick={() => {
                    window.location.href = `/donor/messages?partnerId=${need.receiver_id}&needId=${need.id}`
                  }}
                  className="p-2 rounded-xl text-text-secondary hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <MessageSquare className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* View Need Modal */}
      <ViewFoodNeedModal
        need={selectedNeedForDetails}
        isOpen={Boolean(selectedNeedForDetails)}
        onClose={() => setSelectedNeedForDetails(null)}
        onOfferFood={(need) => {
          setSelectedNeedForDetails(null)
          setSelectedNeedForOffer(need)
        }}
      />

      {/* Respond to Need Modal */}
      <RespondToNeedModal
        need={selectedNeedForOffer}
        isOpen={Boolean(selectedNeedForOffer)}
        onClose={() => setSelectedNeedForOffer(null)}
        onSuccess={() => {
          setSelectedNeedForOffer(null)
          fetchNeeds()
        }}
      />
    </div>
  )
}
