import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Building2,
  Mail,
  MapPin,
  Phone,
  User,
  ArrowRight,
  Sparkles,
  UtensilsCrossed,
  CheckCircle2,
  Navigation,
  ShieldCheck,
  Lock,
} from 'lucide-react'
import { Logo } from '../../../components/layout/Logo'
import { useAuth } from '../../../context/AuthContext'
import { useToast } from '../../../context/ToastContext'

const businessTypes = [
  'Restaurant',
  'Hotel',
  'Catering Service',
  'Bakery',
  'College / University',
  'Corporate Cafeteria',
  'Hostel',
  'Event / Wedding',
  'Cloud Kitchen',
  'Other',
]

export function DonorSignupPage() {
  const navigate = useNavigate()
  const { register } = useAuth()
  const { toast } = useToast()

  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [locating, setLocating] = useState(false)

  // Form State - strictly empty by default (no dummy values)
  const [formData, setFormData] = useState({
    // Step 1: Organization & Basic Contact
    organizationName: '',
    primaryContact: '',
    businessType: '',
    email: '',
    phone: '',
    pickupAddress: '',
    city: '',
    pincode: '',
    // Step 2: Food Details
    foodCategories: [] as string[],
    dailySurplusEstimate: '',
    packagingType: '',
    // Step 3: Verification
    fssaiLicense: '',
    // Step 4: Security
    password: '',
    confirmPassword: '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const steps = [
    { number: 1, label: 'Organization' },
    { number: 2, label: 'Food Details' },
    { number: 3, label: 'Contact & Verification' },
    { number: 4, label: 'Security' },
  ]

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast('Geolocation is not supported by your browser', 'error')
      return
    }

    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude
        const lng = position.coords.longitude

        try {
          // Real reverse geocoding via OpenStreetMap Nominatim
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
          )
          const data = await res.json()

          if (data && data.address) {
            const addr = data.address
            const detectedCity =
              addr.city ||
              addr.town ||
              addr.village ||
              addr.suburb ||
              addr.state_district ||
              addr.county ||
              ''

            const detectedPincode = addr.postcode || ''

            const addressParts = [
              addr.amenity || addr.building || addr.shop || addr.office,
              addr.road || addr.pedestrian,
              addr.neighbourhood || addr.suburb || addr.village,
              detectedCity,
            ].filter(Boolean)

            const formattedAddress =
              addressParts.length > 0 ? addressParts.join(', ') : (data.display_name || '')

            setFormData((prev) => ({
              ...prev,
              pickupAddress: formattedAddress,
              city: detectedCity || prev.city,
              pincode: detectedPincode || prev.pincode,
            }))

            toast(
              detectedCity
                ? `Location detected: ${detectedCity}${detectedPincode ? ` (${detectedPincode})` : ''}`
                : 'Location address detected successfully',
              'success'
            )
          } else if (data?.display_name) {
            setFormData((prev) => ({
              ...prev,
              pickupAddress: data.display_name,
            }))
            toast('Location address detected successfully', 'success')
          } else {
            setFormData((prev) => ({
              ...prev,
              pickupAddress: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
            }))
            toast('GPS coordinates captured', 'success')
          }
        } catch (error) {
          console.error('Reverse geocode error:', error)
          setFormData((prev) => ({
            ...prev,
            pickupAddress: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
          }))
          toast('GPS coordinates captured (could not fetch street name)', 'info')
        } finally {
          setLocating(false)
        }
      },
      (err) => {
        setLocating(false)
        console.warn('Geolocation error:', err)
        toast('Unable to retrieve GPS location. Please type your address manually.', 'error')
      },
      { timeout: 10000, enableHighAccuracy: true }
    )
  }

  const validateStep1 = () => {
    const nextErrors: Record<string, string> = {}
    if (!formData.organizationName.trim()) nextErrors.organizationName = 'Organization name is required.'
    if (!formData.primaryContact.trim()) nextErrors.primaryContact = 'Primary contact person is required.'
    if (!formData.businessType) nextErrors.businessType = 'Please select a business type.'
    if (!formData.email.trim() || !formData.email.includes('@')) nextErrors.email = 'Valid email is required.'
    if (!formData.phone.trim()) nextErrors.phone = 'Phone number is required.'
    if (!formData.pickupAddress.trim()) nextErrors.pickupAddress = 'Pickup address is required.'
    if (!formData.city.trim()) nextErrors.city = 'City is required.'
    if (!formData.pincode.trim()) nextErrors.pincode = 'Pincode is required.'

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateStep1()) {
      toast('Please fill in all required organization fields', 'error')
      return
    }
    setCurrentStep(2)
  }

  const handleFinalSubmit = async () => {
    if (!formData.password || formData.password.length < 8) {
      toast('Please enter a password with at least 8 characters', 'error')
      return
    }
    if (formData.password !== formData.confirmPassword) {
      toast('Passwords do not match', 'error')
      return
    }

    setLoading(true)
    try {
      await register({
        name: formData.primaryContact.trim(),
        organization: formData.organizationName.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        role: 'donor',
        phone: formData.phone.trim(),
        address: `${formData.pickupAddress.trim()}, ${formData.city.trim()} - ${formData.pincode.trim()}`,
        businessType: formData.businessType,
      })
      toast('Donor account created successfully! Welcome to FoodBridge.', 'success')
      navigate('/auth/registration-success', { replace: true })
    } catch (error: any) {
      toast(error?.response?.data?.message || error.message || 'Registration failed', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0B1120] text-slate-100 flex flex-col justify-between selection:bg-emerald-500/20 selection:text-emerald-300">
      {/* Top Header Bar */}
      <header className="border-b border-slate-800/80 bg-[#0B1120]/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <Logo light size="sm" />
          </Link>
          <div className="flex items-center gap-3 text-xs sm:text-sm">
            <span className="text-slate-400">Already have an account?</span>
            <Link
              to="/auth/login/donor"
              className="text-emerald-400 hover:text-emerald-300 font-semibold transition-colors"
            >
              Sign in
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 flex items-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 w-full items-start">
          {/* ========================================================================= */}
          {/* LEFT SIDE — FOODBRIDGE BRANDING */}
          {/* ========================================================================= */}
          <div className="lg:col-span-5 space-y-7 lg:sticky lg:top-24">
            <div className="space-y-4">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Sparkles className="w-3.5 h-3.5" />
                FoodBridge Donor Network
              </span>

              <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-black tracking-tight text-white leading-tight">
                Have extra food? <br />
                <span className="text-slate-200">Don&apos;t let it go to waste.</span>
              </h1>

              <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
                Join FoodBridge as a Donor and help feed communities in need. Connect surplus meals from your
                kitchen directly with verified local charities, shelters, and orphanages.
              </p>
            </div>

            {/* Three Benefit Items */}
            <div className="space-y-3">
              <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center text-lg shrink-0 border border-emerald-500/20">
                  🍱
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Donate surplus food easily</h4>
                  <p className="text-xs text-slate-400">Post extra food in under 60 seconds with simple portion counts</p>
                </div>
              </div>

              <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center text-lg shrink-0 border border-emerald-500/20">
                  🤝
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Support people in need</h4>
                  <p className="text-xs text-slate-400">Verified receivers ensure meals reach genuine community members</p>
                </div>
              </div>

              <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center text-lg shrink-0 border border-emerald-500/20">
                  ♻
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Reduce food waste for a greener tomorrow</h4>
                  <p className="text-xs text-slate-400">Divert organic waste from landfills and track your sustainability impact</p>
                </div>
              </div>
            </div>

            {/* Realistic Kitchen / Food Prep Photographic Visual Card */}
            <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-3.5 shadow-xl relative overflow-hidden group">
              <div className="relative h-48 sm:h-56 rounded-xl overflow-hidden bg-slate-800 flex items-center justify-center">
                {/* SVG Documentary Style Kitchen Food Service Rendering */}
                <svg
                  viewBox="0 0 400 240"
                  className="w-full h-full object-cover"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <defs>
                    <linearGradient id="bgKitchen" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#1E293B" />
                      <stop offset="100%" stopColor="#0F172A" />
                    </linearGradient>
                    <linearGradient id="metalPan" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#64748B" />
                      <stop offset="50%" stopColor="#94A3B8" />
                      <stop offset="100%" stopColor="#475569" />
                    </linearGradient>
                    <linearGradient id="warmFood" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#F59E0B" />
                      <stop offset="50%" stopColor="#10B981" />
                      <stop offset="100%" stopColor="#EF4444" />
                    </linearGradient>
                  </defs>
                  {/* Kitchen wall & tiles */}
                  <rect width="400" height="240" fill="url(#bgKitchen)" />
                  <path d="M0 60 H400 M0 120 H400" stroke="#334155" strokeWidth="1" strokeDasharray="4 4" />
                  {/* Steel Work Counter */}
                  <rect x="20" y="140" width="360" height="100" rx="6" fill="#334155" />
                  <rect x="20" y="140" width="360" height="12" fill="#475569" />
                  {/* Stainless Steel Gastro Pans with Fresh Meals */}
                  <rect x="40" y="125" width="95" height="50" rx="6" fill="url(#metalPan)" />
                  <rect x="44" y="129" width="87" height="42" rx="4" fill="#F59E0B" opacity="0.9" />
                  {/* Pan 2 */}
                  <rect x="150" y="125" width="95" height="50" rx="6" fill="url(#metalPan)" />
                  <rect x="154" y="129" width="87" height="42" rx="4" fill="#10B981" opacity="0.85" />
                  {/* Pan 3 */}
                  <rect x="260" y="125" width="95" height="50" rx="6" fill="url(#metalPan)" />
                  <rect x="264" y="129" width="87" height="42" rx="4" fill="#EA580C" opacity="0.9" />
                  {/* Kitchen staff apron / gloved hands */}
                  <circle cx="200" cy="80" r="28" fill="#475569" />
                  <path d="M165 110 Q200 95 235 110 L240 180 L160 180 Z" fill="#0F172A" />
                  <path d="M150 115 Q140 135 130 145" stroke="#E2E8F0" strokeWidth="10" strokeLinecap="round" />
                  <path d="M250 115 Q260 135 270 145" stroke="#E2E8F0" strokeWidth="10" strokeLinecap="round" />
                  <text x="200" y="215" fill="#94A3B8" fontSize="10" textAnchor="middle" fontFamily="sans-serif">
                    Commercial Kitchen Hygiene Handover Protocol
                  </text>
                </svg>

                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent flex items-end p-4">
                  <div>
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-semibold border border-emerald-500/30">
                      <CheckCircle2 className="w-3 h-3" />
                      Safe Surplus Packaging
                    </span>
                    <p className="text-xs text-slate-200 font-medium mt-1">
                      Professional kitchen staff packaging surplus food into sealed containers for timely delivery.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Tagline */}
            <div className="flex items-center gap-2 text-xs text-slate-400 pt-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="font-semibold text-slate-300">Less Waste. More Hope.</span>
              <span className="text-slate-600">•</span>
              <span>FoodBridge Partner Verification Standards</span>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* RIGHT SIDE — ACCOUNT CREATION FORM */}
          {/* ========================================================================= */}
          <div className="lg:col-span-7">
            <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-6 sm:p-8 shadow-2xl backdrop-blur-sm space-y-6">
              {/* 4-Step Progress Indicator */}
              <div className="border-b border-slate-800 pb-5">
                <div className="grid grid-cols-4 gap-2 text-center">
                  {steps.map((step) => {
                    const isCurrent = step.number === currentStep
                    const isDone = step.number < currentStep
                    return (
                      <div
                        key={step.number}
                        onClick={() => {
                          if (step.number < currentStep) setCurrentStep(step.number)
                        }}
                        className={`flex flex-col items-center gap-1.5 group cursor-pointer transition-all ${
                          isCurrent
                            ? 'text-emerald-400'
                            : isDone
                            ? 'text-slate-300'
                            : 'text-slate-500'
                        }`}
                      >
                        <div
                          className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                            isCurrent
                              ? 'bg-emerald-500 text-white ring-4 ring-emerald-500/20'
                              : isDone
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                              : 'bg-slate-800 text-slate-400 border border-slate-700'
                          }`}
                        >
                          {isDone ? <CheckCircle2 className="w-4 h-4" /> : step.number}
                        </div>
                        <span className="text-[11px] sm:text-xs font-semibold truncate max-w-full">
                          {step.label}
                        </span>
                        <div
                          className={`w-full h-1 rounded-full mt-1 ${
                            isCurrent ? 'bg-emerald-500' : isDone ? 'bg-emerald-500/40' : 'bg-slate-800'
                          }`}
                        />
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Form Heading & Subtitle */}
              <div>
                <h2 className="text-2xl font-extrabold text-white tracking-tight">
                  Create Your Donor Account
                </h2>
                <p className="text-slate-400 text-xs sm:text-sm mt-1">
                  Tell us about your organization or kitchen.
                </p>
              </div>

              {/* STEP 1: ORGANIZATION FORM FIELDS */}
              {currentStep === 1 && (
                <form onSubmit={handleStep1Submit} className="space-y-4 animate-fade-in">
                  {/* Row 1: Org Name & Primary Contact */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Organization / Kitchen Name <span className="text-red-400">*</span>
                      </label>
                      <div className="relative">
                        <Building2 className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          required
                          placeholder="e.g. Grand Kitchen Caterers"
                          value={formData.organizationName}
                          onChange={(e) =>
                            setFormData((p) => ({ ...p, organizationName: e.target.value }))
                          }
                          className={`w-full pl-10 pr-3.5 py-2.5 bg-slate-800/80 border ${
                            errors.organizationName ? 'border-red-500' : 'border-slate-700'
                          } rounded-xl text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 transition-colors`}
                        />
                      </div>
                      {errors.organizationName && (
                        <p className="text-[11px] text-red-400 mt-1">{errors.organizationName}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Primary Contact Person <span className="text-red-400">*</span>
                      </label>
                      <div className="relative">
                        <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          required
                          placeholder="e.g. Ramesh Kumar"
                          value={formData.primaryContact}
                          onChange={(e) =>
                            setFormData((p) => ({ ...p, primaryContact: e.target.value }))
                          }
                          className={`w-full pl-10 pr-3.5 py-2.5 bg-slate-800/80 border ${
                            errors.primaryContact ? 'border-red-500' : 'border-slate-700'
                          } rounded-xl text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 transition-colors`}
                        />
                      </div>
                      {errors.primaryContact && (
                        <p className="text-[11px] text-red-400 mt-1">{errors.primaryContact}</p>
                      )}
                    </div>
                  </div>

                  {/* Business Type Dropdown */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Business Type <span className="text-red-400">*</span>
                    </label>
                    <select
                      value={formData.businessType}
                      onChange={(e) => setFormData((p) => ({ ...p, businessType: e.target.value }))}
                      className={`w-full px-3.5 py-2.5 bg-slate-800/80 border ${
                        errors.businessType ? 'border-red-500' : 'border-slate-700'
                      } rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors cursor-pointer`}
                    >
                      <option value="">Select business type...</option>
                      {businessTypes.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                    {errors.businessType && (
                      <p className="text-[11px] text-red-400 mt-1">{errors.businessType}</p>
                    )}
                  </div>

                  {/* Row 2: Email Address & Phone Number */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Email Address <span className="text-red-400">*</span>
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="email"
                          required
                          placeholder="yourname@example.com"
                          value={formData.email}
                          onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
                          className={`w-full pl-10 pr-3.5 py-2.5 bg-slate-800/80 border ${
                            errors.email ? 'border-red-500' : 'border-slate-700'
                          } rounded-xl text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 transition-colors`}
                        />
                      </div>
                      {errors.email && <p className="text-[11px] text-red-400 mt-1">{errors.email}</p>}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Phone Number <span className="text-red-400">*</span>
                      </label>
                      <div className="relative">
                        <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="tel"
                          required
                          placeholder="+91 XXXXX XXXXX"
                          value={formData.phone}
                          onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))}
                          className={`w-full pl-10 pr-3.5 py-2.5 bg-slate-800/80 border ${
                            errors.phone ? 'border-red-500' : 'border-slate-700'
                          } rounded-xl text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 transition-colors`}
                        />
                      </div>
                      {errors.phone && <p className="text-[11px] text-red-400 mt-1">{errors.phone}</p>}
                    </div>
                  </div>

                  {/* Pickup Address */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Pickup Address <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        required
                        placeholder="Enter your complete pickup address"
                        value={formData.pickupAddress}
                        onChange={(e) =>
                          setFormData((p) => ({ ...p, pickupAddress: e.target.value }))
                        }
                        className={`w-full pl-10 pr-3.5 py-2.5 bg-slate-800/80 border ${
                          errors.pickupAddress ? 'border-red-500' : 'border-slate-700'
                        } rounded-xl text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 transition-colors`}
                      />
                    </div>
                    {errors.pickupAddress && (
                      <p className="text-[11px] text-red-400 mt-1">{errors.pickupAddress}</p>
                    )}
                  </div>

                  {/* Row 3: City, Pincode & Use Current Location */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                    <div className="sm:col-span-4">
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        City <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Coimbatore or Chennai"
                        value={formData.city}
                        onChange={(e) => setFormData((p) => ({ ...p, city: e.target.value }))}
                        className={`w-full px-3.5 py-2.5 bg-slate-800/80 border ${
                          errors.city ? 'border-red-500' : 'border-slate-700'
                        } rounded-xl text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 transition-colors`}
                      />
                      {errors.city && <p className="text-[11px] text-red-400 mt-1">{errors.city}</p>}
                    </div>

                    <div className="sm:col-span-4">
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Pincode <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 641032"
                        value={formData.pincode}
                        onChange={(e) => setFormData((p) => ({ ...p, pincode: e.target.value }))}
                        className={`w-full px-3.5 py-2.5 bg-slate-800/80 border ${
                          errors.pincode ? 'border-red-500' : 'border-slate-700'
                        } rounded-xl text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 transition-colors`}
                      />
                      {errors.pincode && <p className="text-[11px] text-red-400 mt-1">{errors.pincode}</p>}
                    </div>

                    <div className="sm:col-span-4">
                      <button
                        type="button"
                        onClick={handleUseCurrentLocation}
                        disabled={locating}
                        className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-300 hover:text-white transition-colors disabled:opacity-50"
                      >
                        <Navigation className={`w-3.5 h-3.5 text-emerald-400 ${locating ? 'animate-spin' : ''}`} />
                        <span>{locating ? 'Detecting...' : 'Use current location'}</span>
                      </button>
                    </div>
                  </div>

                  {/* BOTTOM ACTIONS */}
                  <div className="pt-5 border-t border-slate-800 flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => navigate('/')}
                      className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs sm:text-sm font-semibold transition-colors"
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-primary hover:bg-primary-light text-white text-xs sm:text-sm font-bold shadow-md transition-all active:scale-95"
                    >
                      Continue to Food Details
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              )}

              {/* STEP 2: FOOD DETAILS */}
              {currentStep === 2 && (
                <div className="space-y-4 animate-fade-in text-xs sm:text-sm">
                  <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                    <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                      <UtensilsCrossed className="w-4 h-4" /> Surplus Food Estimation
                    </span>
                    <p className="text-xs text-slate-300">
                      Estimate the typical volume and types of food your kitchen can provide.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Typical Surplus per Batch
                    </label>
                    <select
                      value={formData.dailySurplusEstimate}
                      onChange={(e) => setFormData((p) => ({ ...p, dailySurplusEstimate: e.target.value }))}
                      className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="">Select typical surplus estimate...</option>
                      <option value="20-50 meals">20 – 50 meals</option>
                      <option value="50-100 meals">50 – 100 meals</option>
                      <option value="100-250 meals">100 – 250 meals</option>
                      <option value="250+ meals">250+ meals (Banquet / Large Events)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Packaging / Storage Facility
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Stainless steel containers, insulated warm boxes"
                      value={formData.packagingType}
                      onChange={(e) => setFormData((p) => ({ ...p, packagingType: e.target.value }))}
                      className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="pt-5 border-t border-slate-800 flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(1)}
                      className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs sm:text-sm font-semibold"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(3)}
                      className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary hover:bg-primary-light text-white text-xs sm:text-sm font-bold"
                    >
                      Continue to Verification
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: CONTACT & VERIFICATION */}
              {currentStep === 3 && (
                <div className="space-y-4 animate-fade-in text-xs sm:text-sm">
                  <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                    <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4" /> Regulatory & Hygiene Check
                    </span>
                    <p className="text-xs text-slate-300">
                      FoodBridge requires FSSAI registration or commercial food safety undertakings.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      FSSAI License Number (Optional / Can submit later)
                    </label>
                    <input
                      type="text"
                      placeholder="14-digit FSSAI Number"
                      value={formData.fssaiLicense}
                      onChange={(e) => setFormData((p) => ({ ...p, fssaiLicense: e.target.value }))}
                      className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs sm:text-sm text-white"
                    />
                  </div>

                  <div className="pt-5 border-t border-slate-800 flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(2)}
                      className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs sm:text-sm font-semibold"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(4)}
                      className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary hover:bg-primary-light text-white text-xs sm:text-sm font-bold"
                    >
                      Continue to Security
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 4: SECURITY & ACCOUNT CREATION */}
              {currentStep === 4 && (
                <div className="space-y-4 animate-fade-in text-xs sm:text-sm">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Set Password <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="password"
                        required
                        placeholder="Minimum 8 characters"
                        value={formData.password}
                        onChange={(e) => setFormData((p) => ({ ...p, password: e.target.value }))}
                        className="w-full pl-10 pr-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Confirm Password <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="password"
                        required
                        placeholder="Repeat your password"
                        value={formData.confirmPassword}
                        onChange={(e) =>
                          setFormData((p) => ({ ...p, confirmPassword: e.target.value }))
                        }
                        className="w-full pl-10 pr-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400 pt-1">
                    By clicking Complete Registration, you agree to FoodBridge&apos;s food safety standards,
                    donor integrity policy, and non-profit redistribution terms.
                  </p>

                  <div className="pt-5 border-t border-slate-800 flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(3)}
                      className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs sm:text-sm font-semibold"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      disabled={loading}
                      onClick={handleFinalSubmit}
                      className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold shadow-lg transition-all active:scale-95 disabled:opacity-50"
                    >
                      {loading ? 'Creating Account...' : 'Complete Registration'}
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer copyright */}
      <footer className="border-t border-slate-800/60 py-4 text-center text-xs text-slate-500">
        FoodBridge &copy; 2026. Connecting Surplus Food with Communities in Need.
      </footer>
    </div>
  )
}
