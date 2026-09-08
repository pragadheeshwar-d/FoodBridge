import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  Clock,
  MapPin,
  CheckCircle2,
  Send,
  Navigation,
  Map as MapIcon,
  ChevronUp,
  AlertCircle,
} from 'lucide-react'
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { ReceiverShell } from '../../components/receiver/ReceiverShell'
import { Button } from '../../components/ui/Button'
import { useToast } from '../../context/ToastContext'
import { useNotificationPopup } from '../../context/NotificationPopupContext'
import { needService, type FoodNeed } from '../../services/needService'
import { PublicProfileModal } from '../../components/profile/PublicProfileModal'
import { ConfirmReceiptModal } from '../../components/receiver/ConfirmReceiptModal'

delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

function MapClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(event) {
      onPick(event.latlng.lat, event.latlng.lng)
    },
  })
  return null
}

function MapCenterUpdater({ center }: { center: [number, number] }) {
  const map = useMap()
  useEffect(() => {
    map.setView(center, 13)
  }, [center, map])
  return null
}

export default function NeedFoodPage() {
  const { toast } = useToast()
  const { showPopup } = useNotificationPopup()

  const [myNeeds, setMyNeeds] = useState<FoodNeed[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Form State
  const [foodType, setFoodType] = useState('')
  const [foodName, setFoodName] = useState('')
  const [servings, setServings] = useState<number | ''>('')
  const [unit, setUnit] = useState('')
  const [urgency, setUrgency] = useState('')
  const [location, setLocation] = useState('')
  const [latitude, setLatitude] = useState<number | null>(null)
  const [longitude, setLongitude] = useState<number | null>(null)
  const [showMap, setShowMap] = useState(false)
  const [mapCenter, setMapCenter] = useState<[number, number]>([13.0827, 80.2707])
  const [requiredTime, setRequiredTime] = useState('')
  const [notes, setNotes] = useState('')

  // Modals
  const [selectedDonorId, setSelectedDonorId] = useState<number | null>(null)
  const [receiptConfirmTarget, setReceiptConfirmTarget] = useState<{
    responseId: number
    foodName: string
    quantity: string
    donorName?: string
    donorOrganization?: string
  } | null>(null)
  const [confirmingReceipt, setConfirmingReceipt] = useState(false)

  const loadNeeds = async () => {
    try {
      const data = await needService.getMyNeeds()
      setMyNeeds(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadNeeds()
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setMapCenter([pos.coords.latitude, pos.coords.longitude]),
        () => {}
      )
    }
  }, [])

  const handlePickFromMap = async (lat: number, lng: number) => {
    setLatitude(lat)
    setLongitude(lng)
    setMapCenter([lat, lng])
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
      const data = await res.json()
      if (data?.display_name) {
        setLocation(data.display_name)
      } else {
        setLocation(`${lat.toFixed(4)}, ${lng.toFixed(4)}`)
      }
    } catch {
      if (!location) setLocation(`${lat.toFixed(4)}, ${lng.toFixed(4)}`)
    }
    toast('Location updated from map pin!', 'success')
  }

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast('Geolocation is not supported by your browser.', 'error')
      return
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        setLatitude(lat)
        setLongitude(lng)
        setMapCenter([lat, lng])
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
          const data = await res.json()
          if (data?.display_name) {
            setLocation(data.display_name)
          } else {
            setLocation(`${lat.toFixed(4)}, ${lng.toFixed(4)}`)
          }
        } catch {
          if (!location) setLocation(`${lat.toFixed(4)}, ${lng.toFixed(4)}`)
        }
        toast('Location detected via GPS!', 'success')
      },
      () => {
        toast('Unable to retrieve your current location. Please enter address manually.', 'error')
      }
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!foodType || !servings || Number(servings) <= 0) {
      toast('Please select food type and enter servings needed.', 'error')
      return
    }

    if (!unit) {
      toast('Please select a unit for the quantity.', 'error')
      return
    }

    if (!urgency) {
      toast('Please select an urgency level.', 'error')
      return
    }

    if (!location || !location.trim()) {
      toast('Food requirement location is mandatory. Please enter a delivery address.', 'error')
      return
    }

    setSubmitting(true)
    try {
      const now = new Date()
      const reqDateTime = requiredTime
        ? new Date(`${now.toISOString().split('T')[0]}T${requiredTime}`).toISOString()
        : now.toISOString()

      await needService.createNeed({
        food_type: foodType,
        food_name: foodName || foodType,
        required_quantity: `${servings} ${unit}`,
        quantity_number: servings,
        unit,
        urgency,
        location: location.trim(),
        latitude: latitude ?? undefined,
        longitude: longitude ?? undefined,
        required_time: reqDateTime,
        additional_notes: notes,
      })
      showPopup({
        title: 'Food Requirement Posted',
        message: 'Food requirement posted successfully! Nearby donors will be notified.',
        type: 'success',
        link: '/receiver/need-food',
        category: 'Need Food',
      })
      setFoodName('')
      setNotes('')
      setShowMap(false)
      loadNeeds()
    } catch (err: any) {
      toast(err?.response?.data?.message || 'Could not post food need', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleAcceptOffer = async (responseId: number) => {
    try {
      await needService.acceptResponse(responseId)
      toast('Offer accepted! You can coordinate pickup in Messages.', 'success')
      loadNeeds()
    } catch (err: any) {
      toast(err?.response?.data?.message || 'Failed to accept offer', 'error')
    }
  }

  const handleDeclineOffer = async (responseId: number) => {
    try {
      await needService.declineResponse(responseId)
      toast('Offer declined.', 'info')
      loadNeeds()
    } catch (err: any) {
      toast('Failed to decline offer', 'error')
    }
  }

  const handleConfirmReceipt = async () => {
    if (!receiptConfirmTarget) return
    setConfirmingReceipt(true)
    try {
      await needService.confirmNeedReceipt(receiptConfirmTarget.responseId)
      showPopup({
        title: 'Food Marked as Collected',
        message: 'Food marked as collected successfully. The donor has been notified.',
        type: 'success',
        link: '/receiver/need-food',
        category: 'Food Collected',
      })
      setReceiptConfirmTarget(null)
      loadNeeds()
    } catch (err: any) {
      toast(err?.response?.data?.message || 'Failed to confirm receipt', 'error')
    } finally {
      setConfirmingReceipt(false)
    }
  }

  const handleCancelNeed = async (needId: number) => {
    if (!confirm('Are you sure you want to cancel this food need?')) return
    try {
      await needService.cancelNeed(needId)
      toast('Food need cancelled.', 'info')
      loadNeeds()
    } catch {
      toast('Could not cancel need', 'error')
    }
  }

  const markerPosition = useMemo(() => {
    if (latitude !== null && longitude !== null) {
      return [latitude, longitude] as [number, number]
    }
    return null
  }, [latitude, longitude])

  return (
    <ReceiverShell>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
          <h1 className="text-2xl font-black text-text dark:text-white tracking-tight flex items-center gap-2">
            🍽️ Need Food – Request Support
          </h1>
        </div>
        <p className="text-xs text-text-secondary mt-1">
          Tell donors and kitchens what food your community needs today. FoodBridge connects you with verified donors.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Create Food Need Form */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-5 glass-card p-6 border border-gray-200/80 dark:border-gray-800"
        >
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800 mb-5">
            <h2 className="text-base font-bold text-text dark:text-white flex items-center gap-2">
              <Plus className="w-4 h-4 text-primary" /> Post a Food Need
            </h2>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary">
              Live Network
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-text dark:text-white mb-1.5">
                Food Category / Type
              </label>
              <select
                value={foodType}
                onChange={(e) => setFoodType(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-sm font-semibold text-text dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                <option value="">Select food category...</option>
                <option value="Cooked Meals / Biryani">Cooked Meals / Biryani</option>
                <option value="Vegetarian Meals">Vegetarian Meals</option>
                <option value="Rice & Sambar Meals">Rice & Sambar Meals</option>
                <option value="Bread & Bakery items">Bread & Bakery items</option>
                <option value="Packaged Groceries & Grains">Packaged Groceries & Grains</option>
                <option value="Fruits & Fresh Vegetables">Fruits & Fresh Vegetables</option>
                <option value="Snacks & Breakfast">Snacks & Breakfast</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-text dark:text-white mb-1.5">
                Specific Dish Name (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Vegetarian Lunch Meals"
                value={foodName}
                onChange={(e) => setFoodName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-xs text-text dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-text dark:text-white mb-1.5">
                  Quantity / Servings
                </label>
                <input
                  type="number"
                  min="1"
                  placeholder="e.g. 50"
                  value={servings}
                  onChange={(e) => setServings(e.target.value === '' ? '' : Math.max(1, Number(e.target.value)))}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-sm font-bold text-text dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-text dark:text-white mb-1.5">
                  Unit
                </label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-xs font-semibold text-text dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  <option value="">Select unit...</option>
                  <option value="servings">servings / people</option>
                  <option value="meals">meals</option>
                  <option value="kg">kg</option>
                  <option value="packets">packets</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-text dark:text-white mb-1.5">
                  Urgency Level
                </label>
                <select
                  value={urgency}
                  onChange={(e) => setUrgency(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-xs font-semibold text-text dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  <option value="">Select urgency level...</option>
                  <option value="Critical">🔴 Critical (Immediate)</option>
                  <option value="High">🟠 High (Within 2-4 hrs)</option>
                  <option value="Medium">🟡 Medium (Today)</option>
                  <option value="Low">🟢 Low (This Week)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-text dark:text-white mb-1.5">
                  Needed By Time
                </label>
                <input
                  type="time"
                  value={requiredTime}
                  onChange={(e) => setRequiredTime(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-xs font-semibold text-text dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
            </div>

            {/* 📍 Food Need Location Section (Required) */}
            <div className="p-3.5 rounded-2xl bg-gray-50/80 dark:bg-gray-800/40 border border-gray-200/80 dark:border-gray-700 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-text dark:text-white flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-primary" />
                  <span>Food Need Location <strong className="text-red-500">*</strong></span>
                </label>
                <button
                  type="button"
                  onClick={handleUseCurrentLocation}
                  className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-1"
                >
                  <Navigation className="w-3 h-3" />
                  <span>GPS Location</span>
                </button>
              </div>

              <input
                type="text"
                required
                placeholder="Enter food requirement location (e.g. 123 Anna Salai, Guindy, Chennai)"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-xs text-text dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm"
              />

              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setShowMap((prev) => !prev)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 hover:border-primary text-text dark:text-gray-200 transition-colors shadow-sm"
                >
                  <MapIcon className="w-3.5 h-3.5 text-primary" />
                  <span>{showMap ? 'Hide Map Picker' : 'Select on Map'}</span>
                  {showMap && <ChevronUp className="w-3 h-3 ml-1" />}
                </button>

                {(latitude !== null && longitude !== null) ? (
                  <span className="text-[10px] text-text-secondary font-mono">
                    📍 {latitude.toFixed(4)}, {longitude.toFixed(4)}
                  </span>
                ) : (
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                    Map pin optional
                  </span>
                )}
              </div>

              {/* Interactive Map Picker */}
              <AnimatePresence>
                {showMap && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 mt-2"
                  >
                    <div className="p-2 bg-primary/5 border-b border-gray-200 dark:border-gray-700 text-[11px] text-text-secondary flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span>Click anywhere on the map to pin the food delivery location.</span>
                    </div>
                    <div style={{ height: 220 }}>
                      <MapContainer
                        center={mapCenter}
                        zoom={13}
                        scrollWheelZoom={false}
                        className="h-full w-full"
                      >
                        <TileLayer
                          attribution='&copy; OpenStreetMap'
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <MapCenterUpdater center={mapCenter} />
                        <MapClickHandler onPick={handlePickFromMap} />
                        {markerPosition && (
                          <Marker position={markerPosition}>
                            <Popup>Food Need Location</Popup>
                          </Marker>
                        )}
                      </MapContainer>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div>
              <label className="block text-xs font-bold text-text dark:text-white mb-1.5">
                Additional Notes
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Dietary preferences, distribution timing, packaging notes..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-xs text-text dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full shadow-glow"
              icon={Send}
              loading={submitting}
            >
              Post Food Need
            </Button>
          </form>
        </motion.div>

        {/* Right: Active Needs Tracker & Donor Responses */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-base font-bold text-text dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" /> Your Active Food Needs ({myNeeds.length})
            </h2>
            <button
              onClick={loadNeeds}
              className="text-xs font-bold text-primary hover:underline"
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="py-12 glass-card flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              <p className="text-xs text-text-secondary">Loading your food needs...</p>
            </div>
          ) : myNeeds.length === 0 ? (
            <div className="glass-card p-8 text-center">
              <div className="w-16 h-16 rounded-3xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3 text-2xl">
                🍽️
              </div>
              <h3 className="text-base font-bold text-text dark:text-white">No active food needs</h3>
              <p className="text-xs text-text-secondary mt-1 max-w-sm mx-auto">
                Post your first food requirement using the form on the left to alert local donors and restaurants.
              </p>
            </div>
          ) : (
            myNeeds.map((need) => (
              <motion.div
                key={need.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-5 border border-gray-200/80 dark:border-gray-800 relative overflow-hidden"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-gray-100 dark:border-gray-800">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-text dark:text-white">
                        {need.food_name || need.food_type}
                      </h3>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          need.status === 'Fulfilled'
                            ? 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300'
                            : need.status === 'Partially Fulfilled'
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                        }`}
                      >
                        {need.status}
                      </span>
                    </div>
                    <p className="text-xs text-text-secondary mt-0.5 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-text-secondary" /> {need.location}
                    </p>
                  </div>

                  <div className="text-right sm:text-right">
                    <p className="text-sm font-black text-primary">
                      {need.remaining_quantity} / {need.quantity_number} {need.unit} remaining
                    </p>
                    <span className="text-[10px] font-bold uppercase text-text-secondary">
                      Urgency: {need.urgency}
                    </span>
                  </div>
                </div>

                {/* Donor Responses for this need */}
                <div className="mt-3">
                  <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">
                    Donor Offers ({need.responses?.length || 0})
                  </h4>

                  {(!need.responses || need.responses.length === 0) ? (
                    <p className="text-xs text-text-secondary italic py-2">
                      Waiting for nearby donors to offer meals for this request...
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {need.responses.map((resp) => (
                        <div
                          key={resp.id}
                          className="p-3 rounded-xl bg-surface dark:bg-gray-900 border border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs text-text dark:text-white">
                                {resp.donor_organization || resp.donor_name}
                              </span>
                              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                                offered {resp.offered_quantity} {resp.unit}
                              </span>
                              <span className="text-[10px] text-text-secondary">
                                ({resp.delivery_type})
                              </span>
                            </div>
                            {resp.message && (
                              <p className="text-xs text-text-secondary mt-1">
                                "{resp.message}"
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => {
                                const donorId = resp.donor_id || (resp as any).donorId
                                if (donorId) {
                                  setSelectedDonorId(Number(donorId))
                                } else {
                                  toast('Donor profile not found', 'error')
                                }
                              }}
                            >
                              View Donor
                            </Button>

                            {resp.status === 'Pending' && (
                              <>
                                <Button
                                  variant="primary"
                                  size="sm"
                                  icon={CheckCircle2}
                                  onClick={() => handleAcceptOffer(resp.id)}
                                >
                                  Accept
                                </Button>
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => handleDeclineOffer(resp.id)}
                                >
                                  Decline
                                </Button>
                              </>
                            )}

                            {resp.status === 'Accepted' && (
                              <Button
                                variant="primary"
                                size="sm"
                                className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-soft"
                                icon={CheckCircle2}
                                onClick={() => setReceiptConfirmTarget({
                                  responseId: resp.id,
                                  foodName: need.food_name || need.food_type,
                                  quantity: `${resp.offered_quantity} ${resp.unit}`,
                                  donorName: resp.donor_name,
                                  donorOrganization: resp.donor_organization,
                                })}
                              >
                                Confirm Food Received
                              </Button>
                            )}

                            {resp.status === 'Completed' && (
                              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/50 flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Food Received ✓
                              </span>
                            )}

                            {resp.status === 'Declined' && (
                              <span className="text-xs font-bold text-text-secondary px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-800">
                                Declined
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {need.status === 'Open' && (
                  <div className="mt-4 pt-3 flex justify-end">
                    <button
                      onClick={() => handleCancelNeed(need.id)}
                      className="text-xs text-red-500 hover:underline font-semibold"
                    >
                      Cancel Food Need
                    </button>
                  </div>
                )}
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Public Donor Profile Modal */}
      <PublicProfileModal
        userId={selectedDonorId}
        isOpen={!!selectedDonorId}
        onClose={() => setSelectedDonorId(null)}
      />

      {/* Confirm Receipt Modal */}
      {receiptConfirmTarget && (
        <ConfirmReceiptModal
          isOpen={true}
          onClose={() => setReceiptConfirmTarget(null)}
          onConfirm={handleConfirmReceipt}
          loading={confirmingReceipt}
          foodName={receiptConfirmTarget.foodName}
          quantity={receiptConfirmTarget.quantity}
          donorName={receiptConfirmTarget.donorName}
          donorOrganization={receiptConfirmTarget.donorOrganization}
        />
      )}
    </ReceiverShell>
  )
}
