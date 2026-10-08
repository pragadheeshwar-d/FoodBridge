import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  UtensilsCrossed,
  Heart,
  Link as LinkIcon,
  Handshake,
  Truck,
  MapPin,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Play,
  Pause,
} from 'lucide-react'

const journeyStages = [
  {
    id: 'available',
    step: 1,
    title: 'Surplus Food Available',
    shortTitle: 'Food Available',
    icon: UtensilsCrossed,
    emoji: '🍱',
    color: 'from-emerald-500 to-green-600',
    accentColor: 'text-emerald-500',
    bgLight: 'bg-emerald-50 dark:bg-emerald-950/40',
    description: 'Hotels, caterers & restaurants list safe, fresh surplus meals with pickup windows and quantity details.',
    actor: 'Hotel / Restaurant Kitchen',
    statusBadge: 'AVAILABLE',
  },
  {
    id: 'donated',
    step: 2,
    title: 'Donor Initiates Donation',
    shortTitle: 'Donor Donates',
    icon: Heart,
    emoji: '❤️',
    color: 'from-rose-500 to-pink-600',
    accentColor: 'text-rose-500',
    bgLight: 'bg-rose-50 dark:bg-rose-950/40',
    description: 'Instant notification dispatched across Tamil Nadu with automated quantity allocation and reverse-geocoded pickup.',
    actor: 'Verified Donor Partner',
    statusBadge: 'DONATED',
  },
  {
    id: 'connected',
    step: 3,
    title: 'FoodBridge Connects',
    shortTitle: 'Smart Matching',
    icon: LinkIcon,
    emoji: '🔗',
    color: 'from-amber-500 to-orange-600',
    accentColor: 'text-amber-500',
    bgLight: 'bg-amber-50 dark:bg-amber-950/40',
    description: 'Real-time road routing (OSRM) matches nearby verified NGOs based on driving distance, travel ETA, and capacity.',
    actor: 'FoodBridge Engine',
    statusBadge: 'MATCHED',
  },
  {
    id: 'claimed',
    step: 4,
    title: 'NGO / Community Claims',
    shortTitle: 'NGO Claims',
    icon: Handshake,
    emoji: '🤝',
    color: 'from-blue-500 to-indigo-600',
    accentColor: 'text-blue-500',
    bgLight: 'bg-blue-50 dark:bg-blue-950/40',
    description: 'Verified shelter requests food allocation; digital handshakes lock in the pickup schedule securely.',
    actor: 'Registered NGO Partner',
    statusBadge: 'CLAIMED',
  },
  {
    id: 'transit',
    step: 5,
    title: 'Pickup & Live Transit',
    shortTitle: 'Pickup & Route',
    icon: Truck,
    emoji: '🚚',
    color: 'from-purple-500 to-indigo-600',
    accentColor: 'text-purple-500',
    bgLight: 'bg-purple-50 dark:bg-purple-950/40',
    description: 'NGO volunteer arrives at the pickup point. QR scan verifies safe collection and starts delivery route.',
    actor: 'Pickup Volunteer',
    statusBadge: 'IN TRANSIT',
  },
  {
    id: 'delivered',
    step: 6,
    title: 'Delivered & Meal Rescued',
    shortTitle: 'Meals Rescued',
    icon: CheckCircle2,
    emoji: '✓ ❤️',
    color: 'from-emerald-500 to-teal-600',
    accentColor: 'text-emerald-600',
    bgLight: 'bg-emerald-50 dark:bg-emerald-950/40',
    description: 'Surplus food reaches hungry children and families. Zero food wasted, landfill emissions prevented, impact recorded.',
    actor: 'Community Shelters',
    statusBadge: 'DELIVERED',
  },
]

export function FoodJourneyVisual() {
  const [activeStageIndex, setActiveStageIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)

  useEffect(() => {
    if (!isPlaying) return
    const timer = setInterval(() => {
      setActiveStageIndex((prev) => (prev + 1) % journeyStages.length)
    }, 4000)
    return () => clearInterval(timer)
  }, [isPlaying])

  const activeStage = journeyStages[activeStageIndex]

  return (
    <div className="w-full glass-card p-6 md:p-10 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl pointer-events-none translate-y-1/2 -translate-x-1/2" />

      {/* Header Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 relative z-10">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            Interactive Visual Story
          </div>
          <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            How Food Moves: <span className="gradient-text">Surplus to Smiles</span>
          </h3>
          <p className="text-sm text-text-secondary mt-1 max-w-xl">
            Watch the seamless journey from hotel kitchen to community table in real-time.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-text hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5 text-text-secondary" /> Pause Flow
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 text-primary" /> Auto Play
              </>
            )}
          </button>
        </div>
      </div>

      {/* Horizontal Interactive Steps Ribbon */}
      <div className="relative z-10 mb-8 overflow-x-auto pb-2 scrollbar-hide">
        <div className="flex items-center justify-between min-w-[680px] relative">
          {/* Connecting Track Line */}
          <div className="absolute top-1/2 left-6 right-6 h-1 bg-gray-200 dark:bg-gray-800 -translate-y-1/2 z-0 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-primary via-accent to-emerald-500"
              initial={false}
              animate={{
                width: `${(activeStageIndex / (journeyStages.length - 1)) * 100}%`,
              }}
              transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
            />
          </div>

          {/* Stage Step Nodes */}
          {journeyStages.map((stage, idx) => {
            const isActive = idx === activeStageIndex
            const isPassed = idx < activeStageIndex

            return (
              <button
                key={stage.id}
                onClick={() => {
                  setActiveStageIndex(idx)
                  setIsPlaying(false)
                }}
                className="relative z-10 flex flex-col items-center group focus:outline-none"
              >
                <motion.div
                  animate={{
                    scale: isActive ? 1.18 : 1,
                    boxShadow: isActive ? '0 0 25px rgba(46, 125, 50, 0.35)' : 'none',
                  }}
                  transition={{ duration: 0.3 }}
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                    isActive
                      ? 'bg-primary text-white ring-4 ring-primary/20 scale-110'
                      : isPassed
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-white dark:bg-gray-800 text-text-secondary border border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <span className="text-lg">{stage.emoji.split(' ')[0]}</span>
                </motion.div>

                <span
                  className={`text-[11px] font-bold mt-2 whitespace-nowrap transition-colors ${
                    isActive
                      ? 'text-primary dark:text-primary-light'
                      : isPassed
                        ? 'text-text dark:text-gray-200'
                        : 'text-text-secondary/70'
                  }`}
                >
                  {stage.shortTitle}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Stage Detail Card Preview (Morphs smoothly between stages) */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeStage.id}
          initial={{ opacity: 0, y: 12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -12, scale: 0.98 }}
          transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
          className="relative z-10 rounded-2xl bg-white/90 dark:bg-gray-900/90 border border-gray-200/80 dark:border-gray-700/80 p-6 md:p-8 shadow-card"
        >
          <div className="grid md:grid-cols-12 gap-6 items-center">
            {/* Left Graphic Showcase */}
            <div className="md:col-span-5 flex flex-col items-center justify-center p-6 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/60 dark:to-gray-900/60 border border-gray-200/60 dark:border-gray-700/50 text-center relative overflow-hidden">
              <motion.div
                animate={{ y: [-4, 4, -4], rotate: [0, 2, -2, 0] }}
                transition={{ repeat: Infinity, duration: 3.5, ease: 'easeInOut' }}
                className="text-6xl mb-4 select-none drop-shadow-md"
              >
                {activeStage.emoji}
              </motion.div>

              <span className="px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase bg-primary/10 text-primary border border-primary/20">
                Stage {activeStage.step} of 6 • {activeStage.statusBadge}
              </span>

              <p className="text-xs font-semibold text-text-secondary mt-3">
                Operated by: <span className="text-text dark:text-white">{activeStage.actor}</span>
              </p>
            </div>

            {/* Right Story & Explanation */}
            <div className="md:col-span-7 space-y-4">
              <div className="flex items-center gap-2 text-xs text-text-secondary font-medium uppercase tracking-wider">
                <span>Phase {activeStage.step}</span>
                <span>•</span>
                <span className={activeStage.accentColor}>{activeStage.title}</span>
              </div>

              <h4 className="text-xl sm:text-2xl font-bold text-text dark:text-white">
                {activeStage.title}
              </h4>

              <p className="text-sm text-text-secondary leading-relaxed">
                {activeStage.description}
              </p>

              {/* Dynamic Action / Visual Path simulation */}
              <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-gray-800/70 border border-gray-100 dark:border-gray-700/80 flex items-center justify-between text-xs text-text-secondary">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary shrink-0" />
                  <span>
                    {activeStageIndex === 0 && 'Donation drafted in Chennai kitchen'}
                    {activeStageIndex === 1 && 'Quantity logged & expiry countdown active'}
                    {activeStageIndex === 2 && 'OSRM routing 3 nearby verified shelters'}
                    {activeStageIndex === 3 && 'Shelter confirmed allocation: 100% matched'}
                    {activeStageIndex === 4 && 'Volunteer in transit with cold/hot insulation'}
                    {activeStageIndex === 5 && 'Verified handover complete with impact certificate'}
                  </span>
                </div>
                <span className="font-bold text-primary">Live</span>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => {
                    setActiveStageIndex((prev) => (prev > 0 ? prev - 1 : journeyStages.length - 1))
                    setIsPlaying(false)
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  Previous Step
                </button>
                <button
                  onClick={() => {
                    setActiveStageIndex((prev) => (prev + 1) % journeyStages.length)
                    setIsPlaying(false)
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-primary text-white hover:bg-primary-dark transition-all"
                >
                  Next Step <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
