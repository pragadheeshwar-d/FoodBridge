import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import L from 'leaflet'
import { Marker, Popup, MapContainer, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { Upload, Image, X, Search, Navigation, Loader2 } from 'lucide-react'
import { DashboardHeader } from '../../components/layout/DashboardLayout'
import { Input, Select, Textarea } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { DonorShell } from '../../components/donor/DonorShell'
import { useToast } from '../../context/ToastContext'
import { useNotificationPopup } from '../../context/NotificationPopupContext'
import { DonationSuccessModal } from '../../components/donor/DonationSuccessModal'

import { useAuth } from '../../context/AuthContext'
import api from '../../lib/api'
import { addDonation } from '../../services/donationService'
// The donor add page uses a minimal native Leaflet picker to avoid map re-render issues.

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

function MapViewUpdater({ center }: { center: [number, number] }) {
  const map = useMap()

  useEffect(() => {
    map.setView(center)
  }, [center, map])

  return null
}

function LocationPickerMap({
  center,
  marker,
  onPick,
}: {
  center: [number, number]
  marker: { lat: number; lng: number; label?: string } | null
  onPick: (lat: number, lng: number) => void
}) {
  const selectedPosition = useMemo(() => (marker ? [marker.lat, marker.lng] as [number, number] : null), [marker])

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700" style={{ height: 360 }}>
      <MapContainer center={center} zoom={13} scrollWheelZoom className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapViewUpdater center={center} />
        <MapClickHandler onPick={onPick} />
        {selectedPosition && (
          <Marker
            position={selectedPosition}
            draggable
            eventHandlers={{
              dragend(event) {
                const target = event.target as L.Marker
                const latLng = target.getLatLng()
                onPick(latLng.lat, latLng.lng)
              },
            }}
          >
            <Popup>{marker?.label || 'Pickup location'}</Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  )
}

export default function AddDonationPage() {
  const { toast } = useToast()
  const { showPopup } = useNotificationPopup()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [imagePreview, setImagePreview] = useState<string>('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [foodName, setFoodName] = useState('')
  const [category, setCategory] = useState('main')
  const [vegType, setVegType] = useState<'veg' | 'nonveg' | 'vegan'>('veg')
  const [quantity, setQuantity] = useState('')
  const [unit, setUnit] = useState<'meals' | 'kg'>('meals')
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [submittedDonation, setSubmittedDonation] = useState<{ foodName: string; quantity: string; unit: string; pickupAddress: string } | null>(null)
  const [preparationTime, setPreparationTime] = useState('')
  const [expiryTime, setExpiryTime] = useState('')
  const [pickupAddress, setPickupAddress] = useState(user?.address || '')
  const [preferredPickupTime, setPreferredPickupTime] = useState('')
  const [specialInstructions, setSpecialInstructions] = useState('')
  const [storageMethod, setStorageMethod] = useState('Room temperature')
  const [currentTemperature, setCurrentTemperature] = useState('')

  useEffect(() => {
    if (user?.address && !pickupAddress) {
      setPickupAddress(user.address)
    }
  }, [user?.address])
  const [locationSearch, setLocationSearch] = useState('')
  const [latitude, setLatitude] = useState<number | null>(null)
  const [longitude, setLongitude] = useState<number | null>(null)
  const [city, setCity] = useState('')
  const [stateName, setStateName] = useState('')
  const [pincode, setPincode] = useState('')
  const [addressLabel, setAddressLabel] = useState('')
  const [mapCenter, setMapCenter] = useState<[number, number]>([13.0827, 80.2707])
  const [locationStatus, setLocationStatus] = useState<'loading' | 'ready' | 'denied' | 'manual'>('loading')
  const isSubmitDisabled = !user || !foodName || !quantity || !expiryTime || !pickupAddress || !imageFile || loading
  const center = mapCenter

  const parseLocalDateTime = (value: string) => {
    if (!value) return null
    const [datePart, timePart] = value.split('T')
    if (!datePart || !timePart) return null
    const [year, month, day] = datePart.split('-').map(Number)
    const [hours, minutes] = timePart.split(':').map(Number)
    if ([year, month, day, hours, minutes].some((part) => Number.isNaN(part))) return null
    return new Date(year, month - 1, day, hours, minutes, 0, 0)
  }

  useEffect(() => {
    if (!pickupAddress) return
    setLocationSearch(pickupAddress)
  }, [pickupAddress])

  useEffect(() => {
    const query = pickupAddress.trim()
    if (!query) return
    if (latitude !== null && longitude !== null) return
    if (/^\s*-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?\s*$/.test(query)) return

    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          const res = await api.get('/services/geocode', { params: { q: query } })
          await applyLocation(res.data.latitude, res.data.longitude)
          setLocationStatus('manual')
        } catch {
          // Leave the default center until the user searches or clicks manually.
        }
      })()
    }, 900)

    return () => window.clearTimeout(timer)
  }, [pickupAddress, latitude, longitude])

  useEffect(() => {
    void useCurrentLocation()
  }, [])

  const handleFile = async (file: File | undefined | null) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast('Please upload an image file', 'error')
      return
    }
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const applyLocation = async (lat: number, lng: number) => {
    setLatitude(lat)
    setLongitude(lng)
    setMapCenter([lat, lng])
    const fallback = `${lat.toFixed(6)}, ${lng.toFixed(6)}`
    setAddressLabel(fallback)
    setPickupAddress(fallback)
    try {
      const res = await api.get('/services/reverse-geocode', { params: { lat, lng } })
      const data = res.data
      const resolved = data?.address || ''
      if (resolved) {
        setAddressLabel(resolved)
        setPickupAddress(resolved)
      }
      setCity(data?.city || '')
      setStateName(data?.state || '')
      setPincode(data?.pincode || '')
    } catch {
      // Keep the coordinate fallback already applied above.
    }
  }

  const searchLocation = async () => {
    if (!locationSearch.trim()) return
    try {
      const res = await api.get('/services/geocode', { params: { q: locationSearch } })
      await applyLocation(res.data.latitude, res.data.longitude)
      setLocationStatus('manual')
    } catch (error) {
      console.error('Location search failed', error)
      toast('Could not find that address', 'error')
    }
  }

  const useCurrentLocation = async () => {
    if (!navigator.geolocation) {
      setLocationStatus('denied')
      toast('Your browser does not support location access.', 'error')
      return
    }

    setLocationStatus('loading')
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        await applyLocation(position.coords.latitude, position.coords.longitude)
        setLocationStatus('ready')
      },
      () => {
        setLocationStatus('denied')
        toast('Location access was denied. Search manually instead.', 'warning')
      },
      { enableHighAccuracy: true, timeout: 12_000 },
    )
  }

  const buildPickupTime = () => {
    const now = new Date()
    const expiryDate = parseLocalDateTime(expiryTime)
    const selectedTime = preferredPickupTime || preparationTime
    let pickupDate = new Date(now.getTime() + 15 * 60 * 1000)

    if (selectedTime && expiryDate) {
      const [hours, minutes] = selectedTime.split(':').map(Number)
      pickupDate = new Date(now)
      pickupDate.setHours(hours || 0, minutes || 0, 0, 0)
      if (pickupDate < now) {
        pickupDate = new Date(now.getTime() + 15 * 60 * 1000)
      }
      if (pickupDate > expiryDate) {
        pickupDate = new Date(expiryDate.getTime() - 15 * 60 * 1000)
      }
    }

    if (pickupDate <= now) {
      pickupDate = new Date(now.getTime() + 15 * 60 * 1000)
    }

    return pickupDate
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      toast('You must be logged in to donate', 'error')
      return
    }
    if (!foodName || !quantity || !expiryTime || !pickupAddress) {
      toast('Fill in the required fields before submitting.', 'warning')
      return
    }
    if (!imageFile) {
      toast('Upload a food image before submitting.', 'warning')
      return
    }

    setLoading(true)
    try {
      const pickupDate = buildPickupTime()
      const expiryDate = parseLocalDateTime(expiryTime)
      if (!expiryDate) {
        toast('Enter a valid expiry time.', 'warning')
        setLoading(false)
        return
      }
      if (pickupDate >= expiryDate) {
        toast('Preferred pickup time must be before expiry time.', 'warning')
        setLoading(false)
        return
      }

      await addDonation({
        foodName,
        foodType: foodName,
        quantity,
        pickupAddress,
        pickupTime: pickupDate.toISOString(),
        expiryTime: expiryDate.toISOString(),
        description: specialInstructions || '',
        category,
        vegType,
        preferredPickupTime,
        specialInstructions,
        storageMethod,
        currentTemperature: currentTemperature ? Number(currentTemperature) : undefined,
        latitude: latitude ?? undefined,
        longitude: longitude ?? undefined,
        imageFile,
        unit,
      })

      setSubmittedDonation({
        foodName,
        quantity,
        unit,
        pickupAddress,
      })
      setShowSuccessModal(true)

      showPopup({
        title: 'Donation Uploaded',
        message: 'Donation uploaded successfully! Your food donation is now available for receivers.',
        type: 'success',
        link: '/donor/donations',
        category: 'Food Donation',
      })

      setFoodName('')
      setCategory('main')
      setVegType('veg')
      setQuantity('')
      setUnit('meals')
      setPreparationTime('')
      setExpiryTime('')
      setPickupAddress('')
      setPreferredPickupTime('')
      setSpecialInstructions('')
      setStorageMethod('Room temperature')
      setCurrentTemperature('')
      setLatitude(null)
      setLongitude(null)
      setCity('')
      setStateName('')
      setPincode('')
      setAddressLabel('')
      setImageFile(null)
      setImagePreview('')
    } catch (error: any) {
      console.error('Failed to submit donation', error)
      toast(error?.response?.data?.message || 'Failed to submit donation', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <DonorShell fab={false}>
      <DashboardHeader
        title="Add Donation"
        subtitle={`List surplus food from ${user?.organization || 'your kitchen'} and help nearby NGOs pick it up quickly.`}
      />

      <form onSubmit={handleSubmit} className="max-w-4xl">
        <div
          className={`relative mb-8 border-2 border-dashed rounded-2xl p-8 text-center transition-colors ${dragOver ? 'border-primary bg-primary/5' : 'border-gray-200 dark:border-gray-700 hover:border-primary/50'}`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragOver(false)
            handleFile(e.dataTransfer.files?.[0])
          }}
        >
          {imagePreview ? (
            <div className="relative inline-block">
              <img src={imagePreview} alt="Donation preview" className="max-h-64 rounded-xl mx-auto" />
              <button
                type="button"
                onClick={() => {
                  setImageFile(null)
                  setImagePreview('')
                }}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
                aria-label="Remove image"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <>
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Upload className="w-8 h-8 text-primary" />
              </div>
              <p className="font-semibold mb-1">Upload food photograph for NGO review</p>
              <p className="text-sm text-text-secondary mb-4">PNG or JPG up to 10MB. Food image is required.</p>
              <Button variant="secondary" type="button" icon={Image} onClick={() => fileInputRef.current?.click()}>
                Choose File
              </Button>
              {!imageFile && (
                <p className="text-xs text-amber-500 mt-3">No photo selected yet.</p>
              )}
            </>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
        </div>

        <div className="glass-card p-6 md:p-8 space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Input label="Food Name" placeholder="e.g. Chettinad Vegetable Biryani" required value={foodName} onChange={(e) => setFoodName(e.target.value)} />
            <Select
              label="Category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              options={[
                { value: 'main', label: 'Main Course' },
                { value: 'snacks', label: 'Snacks' },
                { value: 'dessert', label: 'Dessert' },
                { value: 'beverages', label: 'Beverages' },
                { value: 'fruits', label: 'Fresh Fruits' },
                { value: 'breakfast', label: 'Breakfast' },
              ]}
            />
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <Select
              label="Food Type"
              value={vegType}
              onChange={(e) => setVegType(e.target.value as 'veg' | 'nonveg' | 'vegan')}
              options={[
                { value: 'veg', label: 'Vegetarian' },
                { value: 'nonveg', label: 'Non-Vegetarian' },
                { value: 'vegan', label: 'Vegan' },
              ]}
            />
            <Input label="Quantity" placeholder="e.g. 120" type="number" min="1" required value={quantity} onChange={(e) => setQuantity(e.target.value)} />
            <Select
              label="Unit"
              value={unit}
              onChange={(e) => setUnit(e.target.value as 'meals' | 'kg')}
              options={[
                { value: 'meals', label: 'Meals / servings' },
                { value: 'kg', label: 'Kilograms (kg)' },
              ]}
            />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Input label="Preparation Time" type="time" value={preparationTime} onChange={(e) => setPreparationTime(e.target.value)} />
            <Input label="Expiry Time" type="datetime-local" required value={expiryTime} onChange={(e) => setExpiryTime(e.target.value)} />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Select
              label="Storage Method"
              value={storageMethod}
              onChange={(e) => setStorageMethod(e.target.value)}
              options={[
                { value: 'Room temperature', label: 'Room temperature' },
                { value: 'Refrigerated', label: 'Refrigerated' },
                { value: 'Frozen', label: 'Frozen' },
                { value: 'Hot holding', label: 'Hot holding' },
              ]}
            />
            <Input
              label="Current Temperature (C)"
              type="number"
              placeholder="e.g. 28"
              value={currentTemperature}
              onChange={(e) => setCurrentTemperature(e.target.value)}
            />
          </div>

          <Input label="Pickup Address" placeholder="e.g. 123 Anna Salai, Guindy, Chennai..." required value={pickupAddress} onChange={(e) => setPickupAddress(e.target.value)} />

          <div className="glass-card p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-end mb-4">
            <div className="flex-1">
              <Input
                label="Search Address"
                placeholder="Search the pickup location on OpenStreetMap"
                value={locationSearch}
                onChange={(e) => setLocationSearch(e.target.value)}
                icon
              />
            </div>
            <div className="flex flex-col gap-3 md:flex-row">
              <Button variant="secondary" type="button" icon={Search} onClick={searchLocation}>
                Search Location
              </Button>
              <Button variant="secondary" type="button" icon={Navigation} onClick={() => void useCurrentLocation()}>
                Use Current Location
              </Button>
            </div>
          </div>

          {locationStatus === 'loading' && !latitude && !longitude && (
            <div className="mb-4 rounded-2xl border border-dashed border-gray-200 bg-white/70 px-4 py-3 text-sm text-text-secondary dark:border-gray-700 dark:bg-gray-950/60">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span>Finding your current location...</span>
              </div>
            </div>
          )}

          <LocationPickerMap
            center={center}
            marker={latitude && longitude ? { lat: latitude, lng: longitude, label: addressLabel || pickupAddress || 'Pickup location' } : null}
            onPick={(lat, lng) => {
              void applyLocation(lat, lng)
            }}
          />

          <p className="text-sm text-text-secondary mt-4">
            Click the map or search an address to pin the pickup point with latitude, longitude, and reverse-geocoded details.
          </p>

          <div className="grid md:grid-cols-3 gap-4 mt-4 text-sm">
            <div className="rounded-2xl bg-gray-50 dark:bg-gray-800/50 p-4">
              <p className="text-text-secondary">Latitude</p>
              <p className="font-semibold">{latitude ?? '—'}</p>
            </div>
            <div className="rounded-2xl bg-gray-50 dark:bg-gray-800/50 p-4">
              <p className="text-text-secondary">Longitude</p>
              <p className="font-semibold">{longitude ?? '—'}</p>
            </div>
            <div className="rounded-2xl bg-gray-50 dark:bg-gray-800/50 p-4">
              <p className="text-text-secondary">Location</p>
              <p className="font-semibold">{[city, stateName, pincode].filter(Boolean).join(', ') || '—'}</p>
            </div>
          </div>
          </div>

          <p className="text-sm text-text-secondary">
            Provide a complete pickup address and landmark so the team can confirm the location before collection.
          </p>

          <Input label="Preferred Pickup Time" type="time" value={preferredPickupTime} onChange={(e) => setPreferredPickupTime(e.target.value)} />

          <Textarea label="Special Instructions" placeholder="Allergens, halal/veg kitchen separation, loading bay Gate 3 access..." value={specialInstructions} onChange={(e) => setSpecialInstructions(e.target.value)} />

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button variant="primary" type="submit" loading={loading} disabled={isSubmitDisabled} className="flex-1 sm:flex-none">
              Submit Donation
            </Button>
            <Link to="/donor">
              <Button variant="secondary" type="button">Cancel</Button>
            </Link>
          </div>
        </div>
      </form>

      <DonationSuccessModal
        isOpen={showSuccessModal}
        foodName={submittedDonation?.foodName || ''}
        mealsCount={submittedDonation?.quantity || ''}
        unit={submittedDonation?.unit || 'meals'}
        pickupAddress={submittedDonation?.pickupAddress || ''}
        onClose={() => setShowSuccessModal(false)}
      />
    </DonorShell>
  )
}
