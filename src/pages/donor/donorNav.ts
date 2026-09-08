import {
  LayoutDashboard,
  PlusCircle,
  Package,
  Utensils,
  Map as MapIcon,
  Truck,
  BarChart3,
  MessageCircle,
  User,
} from 'lucide-react'

export const donorNavItems = [
  { label: 'Dashboard', path: '/donor', icon: LayoutDashboard },
  { label: 'Add Donation', path: '/donor/add', icon: PlusCircle },
  { label: 'My Donations', path: '/donor/donations', icon: Package },
  { label: 'Food Needs', path: '/donor/needs', icon: Utensils },
  { label: 'Needs Map', path: '/donor/needs-map', icon: MapIcon },
  { label: 'Pickup Requests', path: '/donor/pickups', icon: Truck },
  { label: 'Analytics', path: '/donor/analytics', icon: BarChart3 },
  { label: 'Messages', path: '/donor/messages', icon: MessageCircle },
  { label: 'Profile', path: '/donor/profile', icon: User },
]