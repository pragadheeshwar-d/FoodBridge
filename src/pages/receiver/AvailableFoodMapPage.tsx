import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MapPin,
  Utensils,
  MessageSquare,
  Clock,
  ShieldCheck,
  X,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import L from 'leaflet'
import { ReceiverShell } from '../../components/receiver/ReceiverShell'
import { OpenStreetMapView, type MapMarker } from '../../components/maps/OpenStreetMapView'
import { donationService, type Donation } from '../../services/donationService'
import { Button } from '../../components/ui/Button'
import { PublicProfileModal } from '../../components/profile/PublicProfileModal'
import { ClaimQuantityModal } from '../../components/receiver/ClaimQuantityModal'

export default function AvailableFoodMapPage() {
  const [donations, setDonations] = useState<Donation[]>([])
  const [activeFilter, setActiveFilter] = useState<'all' | 'meals' | 'fresh'>('all')
  const [selectedDonation, setSelectedDonation] = useState<Donation | null>(null)
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null)

  // Modals
  const [selectedDonorId, setSelectedDonorId] = useState<number | null>(null)
  const [claimDonation, setClaimDonation] = useState<Donation | null>(null)

  const navigate = useNavigate()

  const loadDonations = async () => {
    try {
      const data = await donationService.getAvailableDonations()
      setDonations(data)
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    loadDonations()
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation([pos.coords.latitude, pos.coords.longitude]),
        () => {}
      )
    }
  }, [])

  const filteredDonations = useMemo(() => {
    return donations.filter((d) => {
      if (activeFilter === 'meals') return d.food_type?.toLowerCase().includes('meal') || d.food_name?.toLowerCase().includes('biryani')
      if (activeFilter === 'fresh') return d.category?.toLowerCase().includes('fresh') || d.veg_type === 'veg'
      return true
    })
  }, [donations, activeFilter])

  // Custom Green Marker Icon for Available Food
  const greenPinIcon = useMemo(() => {
    return L.divIcon({
      className: 'custom-food-marker',
      html: `
        <div style="
          width: 38px;
          height: 38px;
          background: #16a34a;
          border: 3px solid #ffffff;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          box-shadow: 0 4px 14px rgba(22,163,74,0.4);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <span style="transform: rotate(45deg); font-size: 16px;">🍱</span>
        </div>
      `,
      iconSize: [38, 38],
      iconAnchor: [19, 38],
    })
  }, [])

  const markers: MapMarker[] = useMemo(() => {
    return filteredDonations
      .filter((d) => typeof d.latitude === 'number' && typeof d.longitude === 'number' && !isNaN(d.latitude) && !isNaN(d.longitude))
      .map((d, index) => ({
        id: (d.id || index).toString(),
        lat: Number(d.latitude),
        lng: Number(d.longitude),
        label: d.food_name,
        icon: greenPinIcon,
        onClick: () => setSelectedDonation(d),
      }))
  }, [filteredDonations, greenPinIcon])

  const mapCenter = useMemo<[number, number]>(() => {
    if (markers.length > 0) {
      return [markers[0].lat, markers[0].lng]
    }
    if (userLocation) {
      return userLocation
    }
    return [13.0827, 80.2707]
  }, [markers, userLocation])

  const handleStartChat = (d: Donation) => {
    const partnerId = d.donor_id ? d.donor_id.toString() : ''
    const donationId = d.id ? d.id.toString() : ''
    const query = new URLSearchParams({
      partnerId,
      partnerName: d.donor_name || 'Donor',
      partnerOrg: d.donor_organization || '',
      donationId,
    })
    navigate(`/receiver/messages?${query.toString()}`)
  }

  return (
    <ReceiverShell>
      <div className="flex flex-col gap-4 mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black text-text dark:text-white tracking-tight flex items-center gap-2">
              <span>🟢 Available Food Map</span>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                {filteredDonations.length} Active Listings
              </span>
            </h1>
            <p className="text-sm text-text-secondary mt-1">
              Explore surplus food donations ready for pickup from verified restaurants and donors near you.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant={activeFilter === 'all' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setActiveFilter('all')}
            >
              All Food
            </Button>
            <Button
              variant={activeFilter === 'meals' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setActiveFilter('meals')}
            >
              Cooked Meals
            </Button>
            <Button
              variant={activeFilter === 'fresh' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setActiveFilter('fresh')}
            >
              Vegetarian
            </Button>
          </div>
        </div>
      </div>

      {/* Main Map Canvas */}
      <div className="relative w-full h-[620px] rounded-3xl overflow-hidden glass-card border border-gray-200/80 dark:border-gray-800 shadow-elevated">
        <OpenStreetMapView
          center={mapCenter}
          zoom={markers.length > 0 ? 13 : 11}
          markers={markers}
          height={620}
        />

        {markers.length === 0 && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[400] bg-white/95 dark:bg-gray-900/95 backdrop-blur-md px-4 py-2 rounded-2xl shadow-elevated border border-gray-200 dark:border-gray-800 text-xs font-medium text-text-secondary flex items-center gap-2">
            <span>ℹ️ No available food donations mapped at this moment.</span>
          </div>
        )}

        {/* Selected Donation Drawer */}
        <AnimatePresence>
          {selectedDonation && (
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.96 }}
              transition={{ duration: 0.25 }}
              className="absolute bottom-6 left-6 right-6 md:right-auto md:w-96 z-[1000] glass-card p-5 border border-emerald-500/30 shadow-2xl bg-surface/95 dark:bg-gray-900/95 backdrop-blur-md"
            >
              <div className="flex items-start justify-between gap-2 pb-3 border-b border-gray-100 dark:border-gray-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500 text-white">
                      {selectedDonation.veg_type || 'Fresh'}
                    </span>
                    <span className="text-xs font-black text-primary">
                      {selectedDonation.remaining_quantity ?? selectedDonation.quantity_number ?? 1} {selectedDonation.unit || 'servings'}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-text dark:text-white mt-1">
                    {selectedDonation.food_name}
                  </h3>
                  <p className="text-xs font-semibold text-primary flex items-center gap-1.5 mt-0.5">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    {selectedDonation.donor_organization || selectedDonation.donor_name || 'Verified Donor'}
                  </p>
                </div>

                <button
                  onClick={() => setSelectedDonation(null)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-text-secondary"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-1.5 mt-3 text-xs text-text-secondary">
                <p className="flex items-center gap-1.5 truncate">
                  <MapPin className="w-3.5 h-3.5 text-text-secondary shrink-0" />
                  {selectedDonation.pickup_address}
                </p>
                {selectedDonation.expiry_time && (
                  <p className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-text-secondary shrink-0" />
                    Available until {new Date(selectedDonation.expiry_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center gap-2">
                <Button
                  variant="primary"
                  className="flex-1 shadow-glow"
                  icon={Utensils}
                  onClick={() => setClaimDonation(selectedDonation)}
                >
                  Request Food
                </Button>
                <Button
                  variant="secondary"
                  icon={MessageSquare}
                  onClick={() => handleStartChat(selectedDonation)}
                >
                  Chat
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    if (selectedDonation.donor_id) setSelectedDonorId(selectedDonation.donor_id)
                  }}
                >
                  Donor
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Public Profile Modal */}
      <PublicProfileModal
        userId={selectedDonorId}
        isOpen={!!selectedDonorId}
        onClose={() => setSelectedDonorId(null)}
      />

      {/* Claim Modal */}
      <ClaimQuantityModal
        donation={claimDonation}
        isOpen={!!claimDonation}
        onClose={() => setClaimDonation(null)}
        onSuccess={() => loadDonations()}
      />
    </ReceiverShell>
  )
}
