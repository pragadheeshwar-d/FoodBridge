import { motion } from 'framer-motion'
import { MapPin, Clock, Users, ArrowRight, UserCheck, MessageSquare } from 'lucide-react'
import { useState } from 'react'
import { Badge, StatusBadge } from '../ui/Badge'
import { Button } from '../ui/Button'

export interface DonationItem {
  id: string | number
  food: string
  restaurant: string
  donor_id?: number
  donor_name?: string
  donor_organization?: string
  image: string
  type: 'veg' | 'nonveg'
  meals: number
  totalMeals?: number
  remainingMeals?: number
  pickupTime: string
  distance: string
  status: 'available' | 'pending' | 'claimed' | 'partially_allocated' | 'fully_allocated' | string
}

interface DonationCardProps {
  donation: DonationItem
  onRequest?: () => void
  onViewDonor?: (donorId?: number) => void
  onChat?: (donorId?: number) => void
  compact?: boolean
}

export function DonationCard({
  donation,
  onRequest,
  onViewDonor,
  onChat,
  compact = false,
}: DonationCardProps) {
  const [imageError, setImageError] = useState(false)
  const fallbackImage = 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&h=300&fit=crop'

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -6 }}
      transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
      className="glass-card overflow-hidden group hover:shadow-elevated transition-all duration-300 border border-gray-200/60 dark:border-gray-700/60 flex flex-col justify-between"
    >
      <div>
        <div className={`relative ${compact ? 'h-40' : 'h-48'} overflow-hidden`}>
          <img
            src={imageError ? fallbackImage : donation.image}
            alt={donation.food}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
            onError={() => setImageError(true)}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />

          <div className="absolute top-3 left-3 flex gap-2">
            <Badge variant={donation.type === 'veg' ? 'veg' : 'nonveg'}>
              {donation.type === 'veg' ? '🌱 Veg' : '🍗 Non-Veg'}
            </Badge>
          </div>
          <div className="absolute top-3 right-3">
            <StatusBadge status={donation.status} />
          </div>
          <div className="absolute bottom-3 left-3 right-3">
            <h3 className="text-white font-bold text-lg leading-tight group-hover:text-primary-soft transition-colors">
              {donation.food}
            </h3>
            <p className="text-white/80 text-xs mt-0.5">{donation.restaurant}</p>
          </div>
        </div>

        <div className="p-4 space-y-3">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700/50">
              <Users className="w-4 h-4 mx-auto text-primary mb-1" />
              <p className="text-[10px] uppercase font-semibold text-text-secondary">
                {donation.status === 'partially_allocated' ? 'Remaining' : 'Available'}
              </p>
              <p className="text-sm font-bold text-text dark:text-white mt-0.5">
                {donation.remainingMeals ?? donation.meals}
                {donation.totalMeals && donation.totalMeals !== (donation.remainingMeals ?? donation.meals) ? (
                  <span className="text-[10px] font-normal text-text-secondary block">
                    / {donation.totalMeals}
                  </span>
                ) : null}
              </p>
            </div>
            <div className="p-2 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700/50">
              <Clock className="w-4 h-4 mx-auto text-accent mb-1" />
              <p className="text-[10px] uppercase font-semibold text-text-secondary">Pickup</p>
              <p className="text-sm font-bold text-text dark:text-white mt-0.5">{donation.pickupTime}</p>
            </div>
            <div className="p-2 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700/50">
              <MapPin className="w-4 h-4 mx-auto text-primary-light mb-1" />
              <p className="text-[10px] uppercase font-semibold text-text-secondary">Distance</p>
              <p className="text-sm font-bold text-text dark:text-white mt-0.5">{donation.distance}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 pt-0 space-y-2">
        <div className="flex gap-2">
          {onViewDonor && (
            <Button
              variant="secondary"
              size="sm"
              className="flex-1 text-xs"
              onClick={() => onViewDonor(donation.donor_id)}
            >
              <UserCheck className="w-3.5 h-3.5" />
              View Donor
            </Button>
          )}
          {onChat && (
            <Button
              variant="secondary"
              size="sm"
              className="px-3"
              onClick={() => onChat(donation.donor_id)}
              title="Chat with Donor"
            >
              <MessageSquare className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>

        {onRequest && (
          <Button
            variant="primary"
            className="w-full group/btn relative overflow-hidden shadow-glow"
            onClick={onRequest}
            disabled={donation.status.toLowerCase() !== 'available' && donation.status.toLowerCase() !== 'partially_allocated'}
          >
            <span>Request Food</span>
            <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1.5 transition-transform duration-300" />
          </Button>
        )}
      </div>
    </motion.div>
  )
}
