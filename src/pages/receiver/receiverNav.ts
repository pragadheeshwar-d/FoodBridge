import {
  LayoutDashboard,
  PackageSearch,
  Utensils,
  Map as MapIcon,
  ListOrdered,
  CalendarDays,
  BarChart3,
  MessageCircle,
  User,
} from 'lucide-react'

export const receiverNavItems = [
  { label: 'Dashboard', path: '/receiver', icon: LayoutDashboard },
  { label: 'Available Donations', path: '/receiver/donations', icon: PackageSearch },
  { label: 'Need Food', path: '/receiver/need-food', icon: Utensils },
  { label: 'Food Map', path: '/receiver/map', icon: MapIcon },
  { label: 'My Requests', path: '/receiver/requests', icon: ListOrdered },
  { label: 'Pickup Schedule', path: '/receiver/schedule', icon: CalendarDays },
  { label: 'Analytics', path: '/receiver/analytics', icon: BarChart3 },
  { label: 'Messages', path: '/receiver/messages', icon: MessageCircle },
  { label: 'Profile', path: '/receiver/profile', icon: User },
]
