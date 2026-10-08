import { Link, Navigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  UtensilsCrossed, Brain, Truck, QrCode, Heart, Search,
  ChevronDown, Leaf, Scale, Store, Handshake, MapPin, PackageCheck, Users,
  ArrowRight,
} from 'lucide-react'
import { Navbar, Footer } from '../components/layout/Navbar'
import { Button } from '../components/ui/Button'
import { AnimatedCounter, FadeIn, StaggerContainer, staggerItem } from '../components/ui/AnimatedCounter'
import { FoodJourneyVisual } from '../components/animations/FoodJourneyVisual'
import { howItWorks, faqs } from '../data/mockData'
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { usePublicStats } from '../hooks/usePublicStats'

const stepIcons = [UtensilsCrossed, Brain, Truck, QrCode, Heart]

const floatingFoodItems = [
  { emoji: '🍎', x: '-12%', y: '10%', delay: 0, duration: 4.2 },
  { emoji: '🍱', x: '92%', y: '15%', delay: 0.8, duration: 4.8 },
  { emoji: '🥗', x: '-8%', y: '70%', delay: 1.2, duration: 5.2 },
  { emoji: '🍞', x: '95%', y: '75%', delay: 0.4, duration: 4.5 },
  { emoji: '🌱', x: '45%', y: '-10%', delay: 1.5, duration: 3.8 },
  { emoji: '❤️', x: '80%', y: '45%', delay: 0.6, duration: 4.0 },
]

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const { user } = useAuth()
  const { stats, loading } = usePublicStats()

  if (user) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <div className="min-h-screen bg-surface dark:bg-gray-950 text-text dark:text-gray-100 overflow-x-hidden">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-20 overflow-hidden bg-gradient-to-br from-surface via-green-50/50 to-surface dark:from-gray-950 dark:via-gray-900/60 dark:to-gray-950">
        {/* Soft blur backgrounds */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-primary/10 rounded-full blur-3xl animate-pulse-soft" />
          <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-accent/10 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-20 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Headline & Content */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1, duration: 0.4 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-6 border border-primary/20 shadow-soft"
              >
                <Leaf className="w-4 h-4" />
                Tamil Nadu's Smart Food Redistribution Platform
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
                className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1]"
              >
                Reduce Food Waste.
                <br />
                <span className="gradient-text">Feed More Lives.</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35, duration: 0.5 }}
                className="mt-6 text-lg text-text-secondary max-w-lg leading-relaxed"
              >
                Food Bridge connects surplus meals from hotels and caterers directly to verified NGOs & shelters with real-time routing, ensuring safe food reaches those who need it most.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.5 }}
                className="mt-8 flex flex-wrap gap-4"
              >
                <Link to="/donor/add">
                  <Button variant="primary" size="lg" icon={UtensilsCrossed} className="group shadow-glow">
                    <span>Donate Food</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link to="/receiver">
                  <Button variant="secondary" size="lg" icon={Search} className="hover:border-primary/40">
                    Find Food Near You
                  </Button>
                </Link>
              </motion.div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.65, duration: 0.4 }}
                className="mt-4 text-sm text-text-secondary"
              >
                New organization?{' '}
                <Link to="/auth/signup" className="text-primary font-bold hover:underline">
                  Create an account
                </Link>{' '}
                to get started.
              </motion.p>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8, duration: 0.5 }}
                className="mt-8 flex items-center gap-6 text-sm text-text-secondary"
              >
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <img
                      key={i}
                      src={`https://i.pravatar.cc/40?img=${i + 10}`}
                      alt=""
                      className="w-8 h-8 rounded-full border-2 border-white dark:border-gray-900 shadow-sm"
                    />
                  ))}
                </div>
                <span>
                  <strong className="text-text dark:text-white font-bold">
                    {loading ? '...' : stats.activeUsers.toLocaleString()}
                  </strong>{' '}
                  verified partners across TN
                </span>
              </motion.div>
            </motion.div>

            {/* Right Food Visual with Floating Food Elements */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.25, duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
              className="relative"
            >
              {/* Floating food icons around image */}
              {floatingFoodItems.map((item, idx) => (
                <motion.div
                  key={idx}
                  animate={{
                    y: [-6, 6, -6],
                    rotate: [-3, 3, -3],
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: item.duration,
                    delay: item.delay,
                    ease: 'easeInOut',
                  }}
                  style={{ left: item.x, top: item.y }}
                  className="absolute z-20 hidden sm:flex items-center justify-center w-12 h-12 rounded-2xl bg-white/90 dark:bg-gray-800/90 shadow-card border border-white/40 dark:border-gray-700 text-2xl select-none pointer-events-none"
                >
                  {item.emoji}
                </motion.div>
              ))}

              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 rounded-3xl blur-2xl animate-pulse-soft" />

              <div className="relative rounded-3xl overflow-hidden shadow-elevated border border-white/30 dark:border-gray-800 group">
                <motion.img
                  src="https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=800&h=600&fit=crop"
                  alt="Food donation hero"
                  className="w-full h-[380px] sm:h-[450px] lg:h-[480px] object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                {/* Floating live impact badge */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7, duration: 0.5 }}
                  className="absolute bottom-6 left-6 right-6 glass-card p-4 flex items-center justify-between gap-4 shadow-elevated"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-white shadow-glow">
                      <Heart className="w-6 h-6 animate-pulse" />
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-text-secondary">Live Community Impact</p>
                      <p className="text-2xl font-black text-primary">
                        <AnimatedCounter value={stats.mealsSaved} suffix="+" />
                      </p>
                    </div>
                  </div>
                  <span className="hidden sm:inline-flex px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                    Meals Rescued
                  </span>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Interactive Food Rescue Journey Section */}
      <section className="py-16 -mt-6 relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FoodJourneyVisual />
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 relative z-10 bg-white dark:bg-gray-900 border-y border-gray-100 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold">How FoodBridge Works</h2>
            <p className="text-text-secondary mt-3 max-w-2xl mx-auto text-base">
              From surplus listing to verified handover in 5 coordinated steps.
            </p>
          </FadeIn>

          <div className="relative">
            {/* Timeline line */}
            <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-primary via-primary-light to-accent -translate-y-1/2" />

            <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
              {howItWorks.map((step, i) => {
                const Icon = stepIcons[i]
                return (
                  <motion.div key={step.step} variants={staggerItem} className="relative">
                    <div className="glass-card p-6 text-center hover:shadow-elevated transition-all duration-300 hover:-translate-y-1.5 group h-full flex flex-col justify-between">
                      <div>
                        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-primary group-hover:scale-110 transition-all duration-300 shadow-soft">
                          <Icon className="w-7 h-7 text-primary group-hover:text-white transition-colors" />
                        </div>
                        <span className="text-xs font-bold text-primary uppercase tracking-wider">Step {step.step}</span>
                        <h3 className="font-bold text-base mt-1 mb-2">{step.title}</h3>
                        <p className="text-xs text-text-secondary leading-relaxed">{step.description}</p>
                      </div>
                    </div>
                    {i < howItWorks.length - 1 && (
                      <div className="lg:hidden flex justify-center my-2">
                        <ChevronDown className="w-5 h-5 text-primary animate-bounce" />
                      </div>
                    )}
                  </motion.div>
                )
              })}
            </StaggerContainer>
          </div>
        </div>
      </section>

      {/* Real Impact Stats */}
      <section id="impact" className="py-20 bg-surface dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-extrabold">Real Impact, Measured Daily</h2>
            <p className="text-text-secondary mt-3 max-w-2xl mx-auto">
              Every meal saved is a life nourished. Track environmental and community rescue metrics across Tamil Nadu.
            </p>
          </FadeIn>
          <StaggerContainer className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <motion.div variants={staggerItem} className="stat-card text-center">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto mb-3">
                <Heart className="w-6 h-6" />
              </div>
              <p className="stat-value text-3xl">
                <AnimatedCounter value={loading ? 0 : stats.mealsSaved} suffix="+" />
              </p>
              <p className="text-xs text-text-secondary mt-1 font-semibold uppercase tracking-wider">Meals Rescued</p>
            </motion.div>
            <motion.div variants={staggerItem} className="stat-card text-center">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3">
                <UtensilsCrossed className="w-6 h-6" />
              </div>
              <p className="stat-value text-3xl">
                <AnimatedCounter value={loading ? 0 : stats.activeDonations} />
              </p>
              <p className="text-xs text-text-secondary mt-1 font-semibold uppercase tracking-wider">Active Listings</p>
            </motion.div>
            <motion.div variants={staggerItem} className="stat-card text-center">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center mx-auto mb-3">
                <Users className="w-6 h-6" />
              </div>
              <p className="stat-value text-3xl">
                <AnimatedCounter value={loading ? 0 : stats.dailyPeopleFed} suffix="+" />
              </p>
              <p className="text-xs text-text-secondary mt-1 font-semibold uppercase tracking-wider">People Fed Daily</p>
            </motion.div>
            <motion.div variants={staggerItem} className="stat-card text-center">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                <Scale className="w-6 h-6" />
              </div>
              <p className="stat-value text-3xl">
                <AnimatedCounter value={loading ? 0 : stats.foodWastePrevented} suffix=" t" />
              </p>
              <p className="text-xs text-text-secondary mt-1 font-semibold uppercase tracking-wider">Waste Prevented</p>
            </motion.div>
          </StaggerContainer>
        </div>
      </section>

      {/* Network Stats */}
      <section id="network" className="py-16 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-extrabold">Network Ecosystem</h2>
            <p className="text-text-secondary mt-3 max-w-2xl mx-auto">
              Connecting restaurants, caterers, and shelters across cities in Tamil Nadu.
            </p>
          </FadeIn>
          <StaggerContainer className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <motion.div variants={staggerItem} className="stat-card text-center">
              <Store className="w-6 h-6 text-primary mx-auto mb-3" />
              <p className="stat-value text-2xl">
                <AnimatedCounter value={loading ? 0 : stats.restaurantsConnected} suffix="+" />
              </p>
              <p className="text-xs text-text-secondary mt-1 font-medium">Food Donors</p>
            </motion.div>
            <motion.div variants={staggerItem} className="stat-card text-center">
              <Handshake className="w-6 h-6 text-primary mx-auto mb-3" />
              <p className="stat-value text-2xl">
                <AnimatedCounter value={loading ? 0 : stats.ngosConnected} suffix="+" />
              </p>
              <p className="text-xs text-text-secondary mt-1 font-medium">NGOs & Shelters</p>
            </motion.div>
            <motion.div variants={staggerItem} className="stat-card text-center">
              <MapPin className="w-6 h-6 text-primary mx-auto mb-3" />
              <p className="stat-value text-2xl">
                <AnimatedCounter value={loading ? 0 : stats.citiesCovered} suffix="+" />
              </p>
              <p className="text-xs text-text-secondary mt-1 font-medium">Cities Covered</p>
            </motion.div>
            <motion.div variants={staggerItem} className="stat-card text-center">
              <PackageCheck className="w-6 h-6 text-primary mx-auto mb-3" />
              <p className="stat-value text-2xl">
                <AnimatedCounter value={loading ? 0 : stats.successfulDeliveries} suffix="+" />
              </p>
              <p className="text-xs text-text-secondary mt-1 font-medium">Verified Handouts</p>
            </motion.div>
          </StaggerContainer>
        </div>
      </section>

      {/* FAQ Accordion */}
      <section id="faq" className="py-20 bg-surface dark:bg-gray-950">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn className="text-center mb-12">
            <h2 className="text-3xl font-extrabold">Frequently Asked Questions</h2>
            <p className="text-sm text-text-secondary mt-2">Everything you need to know about FoodBridge verification and delivery</p>
          </FadeIn>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <FadeIn key={i} delay={i * 0.04}>
                <div className="glass-card overflow-hidden transition-all duration-200">
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between p-5 text-left font-semibold text-sm hover:text-primary transition-colors"
                  >
                    <span className="pr-4">{faq.q}</span>
                    <ChevronDown
                      className={`w-5 h-5 text-text-secondary shrink-0 transition-transform duration-300 ${
                        openFaq === i ? 'rotate-180 text-primary' : ''
                      }`}
                    />
                  </button>
                  <AnimatePresence>
                    {openFaq === i && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <p className="px-5 pb-5 text-sm text-text-secondary leading-relaxed border-t border-gray-100 dark:border-gray-800/60 pt-3">
                          {faq.a}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Bottom Banner */}
      <section className="py-20 bg-surface dark:bg-gray-950">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <FadeIn>
            <div className="relative rounded-3xl overflow-hidden p-10 md:p-16 shadow-elevated">
              <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary-dark to-emerald-900" />
              <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1593113598332-cd288d649433?w=800&h=400&fit=crop')] bg-cover bg-center opacity-10" />
              <div className="relative z-10">
                <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
                  Ready to Make a Real Difference?
                </h2>
                <p className="text-white/85 mb-8 max-w-lg mx-auto text-sm sm:text-base leading-relaxed">
                  Join verified food businesses and shelters across Tamil Nadu. Sign up, get approved, and turn surplus food into life-saving meals.
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                  <Link to="/auth/signup/donor">
                    <Button variant="accent" size="lg" className="shadow-glow font-bold">
                      Register as Donor
                    </Button>
                  </Link>
                  <Link to="/auth/signup/receiver">
                    <Button variant="secondary" size="lg" className="font-bold">
                      Register as NGO / Shelter
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      <Footer />
    </div>
  )
}
