import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MapPin,
  Heart,
  MessageSquare,
  Clock,
  ShieldCheck,
  X,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import L from 'leaflet'
import { DonorShell } from '../../components/donor/DonorShell'
import { OpenStreetMapView, type MapMarker } from '../../components/maps/OpenStreetMapView'
import { needService, type FoodNeed } from '../../services/needService'
import { Button } from '../../components/ui/Button'
import { PublicProfileModal } from '../../components/profile/PublicProfileModal'
import { RespondToNeedModal } from '../../components/donor/RespondToNeedModal'
import { ViewFoodNeedModal } from '../../components/donor/ViewFoodNeedModal'

export default function FoodNeedsMapPage() {
  const [needs, setNeeds] = useState<FoodNeed[]>([])
  const [activeFilter, setActiveFilter] = useState<'all' | 'urgent' | 'meals' | 'today'>('all')
  const [selectedNeed, setSelectedNeed] = useState<FoodNeed | null>(null)
  const [viewDetailsNeed, setViewDetailsNeed] = useState<FoodNeed | null>(null)
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null)

  // Modals
  const [selectedReceiverId, setSelectedReceiverId] = useState<number | null>(null)
  const [needForOffer, setNeedForOffer] = useState<FoodNeed | null>(null)

  const navigate = useNavigate()

  const loadNeeds = async () => {
    try {
      const data = await needService.getNeeds()
      setNeeds(data)
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    loadNeeds()
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation([pos.coords.latitude, pos.coords.longitude]),
        () => {}
      )
    }
  }, [])

  // Filtered Needs
  const filteredNeeds = useMemo(() => {
    return needs.filter((n) => {
      if (activeFilter === 'urgent') return n.urgency === 'Critical' || n.urgency === 'High'
      if (activeFilter === 'meals') return n.food_type.toLowerCase().includes('meal') || n.food_type.toLowerCase().includes('rice')
      return true
    })
  }, [needs, activeFilter])

  // Custom Blue Marker Icon for Food Needs
  const bluePinIcon = useMemo(() => {
    return L.divIcon({
      className: 'custom-need-marker',
      html: `
        <div style="
          width: 38px;
          height: 38px;
          background: #2563eb;
          border: 3px solid #ffffff;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          box-shadow: 0 4px 14px rgba(37,99,235,0.4);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <span style="transform: rotate(45deg); font-size: 16px;">🍽️</span>
        </div>
      `,
      iconSize: [38, 38],
      iconAnchor: [19, 38],
    })
  }, [])

  const markers: MapMarker[] = useMemo(() => {
    return filteredNeeds
      .filter((need) => typeof need.latitude === 'number' && typeof need.longitude === 'number' && !isNaN(need.latitude) && !isNaN(need.longitude))
      .map((need) => ({
        id: need.id.toString(),
        lat: Number(need.latitude),
        lng: Number(need.longitude),
        label: need.food_name || need.food_type,
        icon: bluePinIcon,
        onClick: () => setSelectedNeed(need),
      }))
  }, [filteredNeeds, bluePinIcon])

  const mapCenter = useMemo<[number, number]>(() => {
    if (markers.length > 0) {
      return [markers[0].lat, markers[0].lng]
    }
    if (userLocation) {
      return userLocation
    }
    return [13.0827, 80.2707]
  }, [markers, userLocation])

  const handleStartChat = (need: FoodNeed) => {
    const query = new URLSearchParams({
      partnerId: need.receiver_id.toString(),
      partnerName: need.receiver_name,
      partnerOrg: need.receiver_organization || '',
      needId: need.id.toString(),
    })
    navigate(`/donor/messages?${query.toString()}`)
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
      <div className="flex flex-col gap-4 mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-ping" />
              <h1 className="text-2xl font-black text-text dark:text-white tracking-tight flex items-center gap-2">
                🗺️ Food Needs Map
              </h1>
            </div>
            <p className="text-xs text-text-secondary mt-1">
              Real-time map showing NGO and community centers that need food donations near you.
            </p>
          </div>

          {/* Quick Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto">
            {[
              { id: 'all', label: 'All Needs (🔵)' },
              { id: 'urgent', label: '🔥 Urgent Needs' },
              { id: 'meals', label: '🍚 Cooked Meals' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setActiveFilter(f.id as any)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  activeFilter === f.id
                    ? 'bg-blue-600 text-white shadow-soft'
                    : 'bg-surface dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-text-secondary hover:text-text'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Map Canvas & Selected Need Drawer */}
      <div className="relative w-full h-[620px] rounded-3xl overflow-hidden glass-card border border-gray-200/80 dark:border-gray-800 shadow-elevated">
        <OpenStreetMapView
          center={mapCenter}
          zoom={markers.length > 0 ? 13 : 11}
          markers={markers}
          height={620}
        />

        {markers.length === 0 && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[400] bg-white/95 dark:bg-gray-900/95 backdrop-blur-md px-4 py-2 rounded-2xl shadow-elevated border border-gray-200 dark:border-gray-800 text-xs font-medium text-text-secondary flex items-center gap-2">
            <span>ℹ️ No active food requirements mapped at this moment.</span>
          </div>
        )}

        {/* Floating Selected Need Panel */}
        <AnimatePresence>
          {selectedNeed && (
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.96 }}
              transition={{ duration: 0.25 }}
              className="absolute bottom-6 left-6 right-6 md:right-auto md:w-96 z-[1000] glass-card p-5 border border-blue-500/30 shadow-2xl bg-surface/95 dark:bg-gray-900/95 backdrop-blur-md"
            >
              <div className="flex items-start justify-between gap-2 pb-3 border-b border-gray-100 dark:border-gray-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        selectedNeed.urgency === 'Critical'
                          ? 'bg-red-500 text-white animate-pulse'
                          : selectedNeed.urgency === 'High'
                          ? 'bg-orange-500 text-white'
                          : 'bg-blue-500 text-white'
                      }`}
                    >
                      {selectedNeed.urgency} Urgency
                    </span>
                    <span className="text-xs font-black text-primary">
                      {selectedNeed.required_quantity}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-text dark:text-white mt-1">
                    {selectedNeed.food_name || selectedNeed.food_type}
                  </h3>
                  <p className="text-xs font-semibold text-primary flex items-center gap-1.5 mt-0.5">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    {selectedNeed.receiver_organization || selectedNeed.receiver_name}
                  </p>
                </div>

                <button
                  onClick={() => setSelectedNeed(null)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-text-secondary"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-1.5 mt-3 text-xs text-text-secondary">
                <p className="flex items-center gap-1.5 truncate">
                  <MapPin className="w-3.5 h-3.5 text-text-secondary shrink-0" />
                  {selectedNeed.location}
                </p>
                <p className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-text-secondary shrink-0" />
                  <span>{formatRequiredTime(selectedNeed.required_time)}</span>
                </p>
                {selectedNeed.additional_notes && (
                  <p className="italic text-[11px] p-2 rounded-lg bg-gray-50 dark:bg-gray-800/80 mt-1">
                    "{selectedNeed.additional_notes}"
                  </p>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  className="text-xs"
                  onClick={() => setViewDetailsNeed(selectedNeed)}
                >
                  View Need
                </Button>
                <Button
                  variant="primary"
                  className="flex-1 shadow-glow text-xs"
                  icon={Heart}
                  onClick={() => setNeedForOffer(selectedNeed)}
                >
                  Offer Food
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  className="text-xs"
                  icon={MessageSquare}
                  onClick={() => handleStartChat(selectedNeed)}
                >
                  Chat
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* View Food Need Modal */}
      <ViewFoodNeedModal
        need={viewDetailsNeed}
        isOpen={Boolean(viewDetailsNeed)}
        onClose={() => setViewDetailsNeed(null)}
        onOfferFood={(need) => {
          setViewDetailsNeed(null)
          setNeedForOffer(need)
        }}
      />

      {/* Public Profile Modal */}
      <PublicProfileModal
        userId={selectedReceiverId}
        isOpen={!!selectedReceiverId}
        onClose={() => setSelectedReceiverId(null)}
      />

      {/* Respond to Need Modal */}
      <RespondToNeedModal
        need={needForOffer}
        isOpen={!!needForOffer}
        onClose={() => setNeedForOffer(null)}
        onSuccess={loadNeeds}
      />
    </DonorShell>
  )
}
