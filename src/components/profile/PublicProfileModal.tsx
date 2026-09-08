import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  ShieldCheck,
  MapPin,
  Calendar,
  MessageSquare,
  Heart,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { profileService, type PublicProfile } from '../../services/profileService'
import { Button } from '../ui/Button'
import { useAuth } from '../../context/AuthContext'

interface PublicProfileModalProps {
  userId: number | null
  isOpen: boolean
  onClose: () => void
  contextDonationId?: number
  contextNeedId?: number
}

export function PublicProfileModal({
  userId,
  isOpen,
  onClose,
  contextDonationId,
  contextNeedId,
}: PublicProfileModalProps) {
  const [profile, setProfile] = useState<PublicProfile | null>(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { user: currentUser } = useAuth()

  useEffect(() => {
    if (isOpen && userId) {
      setLoading(true)
      profileService
        .getPublicProfile(userId)
        .then((data) => setProfile(data))
        .catch(console.error)
        .finally(() => setLoading(false))
    } else {
      setProfile(null)
    }
  }, [isOpen, userId])

  if (!isOpen) return null

  const handleStartChat = () => {
    if (!profile) return
    onClose()
    const targetRoute = currentUser?.role === 'receiver' ? '/receiver/messages' : '/donor/messages'
    const query = new URLSearchParams({
      partnerId: profile.id.toString(),
      partnerName: profile.name,
      partnerOrg: profile.organization || '',
      ...(contextDonationId ? { donationId: contextDonationId.toString() } : {}),
      ...(contextNeedId ? { needId: contextNeedId.toString() } : {}),
    })
    navigate(`${targetRoute}?${query.toString()}`)
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
          className="relative w-full max-w-md glass-card p-6 overflow-hidden shadow-elevated border border-gray-200/80 dark:border-gray-800"
        >
          {/* Header & Close */}
          <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-text-secondary">
                Verified FoodBridge Partner
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-text-secondary transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              <p className="text-xs text-text-secondary">Loading partner profile...</p>
            </div>
          ) : profile ? (
            <div className="mt-4 space-y-5">
              {/* Profile Card Header */}
              <div className="flex items-center gap-4">
                {profile.profile_image ? (
                  <img
                    src={profile.profile_image.startsWith('http') ? profile.profile_image : `/api${profile.profile_image}`}
                    alt={profile.name}
                    className="w-16 h-16 rounded-2xl object-cover shadow-soft border border-primary/20 shrink-0"
                    onError={(e) => {
                      (e.currentTarget as HTMLElement).style.display = 'none'
                    }}
                  />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary-light/30 text-primary font-black text-xl flex items-center justify-center shadow-soft border border-primary/20 shrink-0">
                    {(profile.name || 'User').slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-text dark:text-white truncate">
                      {profile.name}
                    </h2>
                    {profile.verified && (
                      <span title="Verified by Admin" className="text-primary shrink-0">
                        <ShieldCheck className="w-4 h-4 fill-primary/20" />
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-semibold text-primary">
                    {profile.organization || (profile.role === 'donor' ? 'Food Donor' : 'Community Receiver')}
                  </p>
                  <div className="flex items-center gap-3 mt-1.5 text-[11px] text-text-secondary">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-text-secondary" />
                      {profile.general_location}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-text-secondary" />
                      {profile.member_since}
                    </span>
                  </div>
                </div>
              </div>

              {/* Impact Stats Grid */}
              <div className="grid grid-cols-3 gap-2.5 p-3 rounded-2xl bg-gray-50/80 dark:bg-gray-900/60 border border-gray-100 dark:border-gray-800 text-center">
                {profile.role === 'donor' ? (
                  <>
                    <div className="p-2">
                      <p className="text-xs text-text-secondary font-medium">Donations</p>
                      <p className="text-base font-black text-text dark:text-white mt-0.5">
                        {profile.successful_donations}
                      </p>
                    </div>
                    <div className="p-2 border-x border-gray-200 dark:border-gray-700">
                      <p className="text-xs text-text-secondary font-medium">Meals Given</p>
                      <p className="text-base font-black text-primary mt-0.5 flex items-center justify-center gap-1">
                        <Heart className="w-3.5 h-3.5 fill-primary" />
                        {profile.total_meals_donated}
                      </p>
                    </div>
                    <div className="p-2">
                      <p className="text-xs text-text-secondary font-medium">Active Food</p>
                      <p className="text-base font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                        {profile.active_donations_count}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="p-2">
                      <p className="text-xs text-text-secondary font-medium">Pickups</p>
                      <p className="text-base font-black text-text dark:text-white mt-0.5">
                        {profile.successful_pickups}
                      </p>
                    </div>
                    <div className="p-2 border-x border-gray-200 dark:border-gray-700">
                      <p className="text-xs text-text-secondary font-medium">Open Needs</p>
                      <p className="text-base font-black text-primary mt-0.5">
                        {profile.active_needs_count}
                      </p>
                    </div>
                    <div className="p-2">
                      <p className="text-xs text-text-secondary font-medium">Impact Status</p>
                      <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                        Verified ✓
                      </p>
                    </div>
                  </>
                )}
              </div>

              {/* Privacy Notice */}
              <p className="text-[11px] text-text-secondary leading-relaxed bg-primary/5 p-2.5 rounded-xl border border-primary/10">
                🔒 <strong>FoodBridge Safe Connect:</strong> Contact numbers and sensitive records remain protected. Coordinate all logistics securely via FoodBridge Messages.
              </p>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <Button
                  variant="primary"
                  className="flex-1 shadow-glow"
                  icon={MessageSquare}
                  onClick={handleStartChat}
                >
                  Chat with {profile.role === 'donor' ? 'Donor' : 'Receiver'}
                </Button>
                <Button variant="secondary" onClick={onClose}>
                  Close
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-xs text-text-secondary py-6 text-center">Profile information unavailable.</p>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
