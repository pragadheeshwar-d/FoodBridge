// Shared Firestore record types for collections that were previously hard-coded.

import type { PickupRequestStatus } from '../services/pickupRequestService'

export type DonationStatus = 'pending' | 'accepted' | 'completed' | 'expired' | 'cancelled'
export type DonationUnit = 'meals' | 'kg'
export type DonationVegType = 'veg' | 'nonveg' | 'vegan'
export type { PickupRequestStatus }

export interface HistoryRecord {
  id: string
  donorId: string
  donorOrganization?: string
  foodType: string
  imageUrl?: string
  meals: number
  receiverName: string
  receiverId?: number | string | null
  status: DonationStatus | PickupRequestStatus | 'completed'
  completedAt: Date
  [k: string]: unknown
}

export interface CertificateRecord {
  id: string
  donorId: string
  organization: string
  type: 'Environmental Impact' | 'Food Donation' | 'Community Service'
  period: string
  meals: number
  donations: number
  co2SavedKg: number
  issuedAt: Date
  certificateUrl?: string
  [k: string]: unknown
}

export type AchievementId =
  | 'first_donation'
  | 'ten_donations'
  | 'hundred_donations'
  | 'meals_100'
  | 'meals_1000'
  | 'co2_hero'
  | 'community_champion'

export interface AchievementDefinition {
  id: AchievementId
  title: string
  description: string
  icon: string
  target: number
}

export interface DonorActivityItem {
  id: string
  donorId: string
  time: string
  title: string
  detail: string
  type: 'donation' | 'pickup' | 'success' | 'delivered'
  createdAt: Date
  [k: string]: unknown
}

export interface InsightSummary {
  donorId: string
  peakWindow: string
  topCategory: string
  recommendation: string
  generatedAt: Date
  [k: string]: unknown
}

export interface LiveOpsMarker {
  id: string
  donorId: string
  label: string
  lat: number
  lng: number
  type: 'donor' | 'receiver' | 'route'
  lastUpdated: Date
  [k: string]: unknown
}

export interface ChatMessageRecord {
  id: string
  threadId: string
  conversationId?: string
  senderId: string
  receiverId?: string
  senderName: string
  senderRole: 'donor' | 'receiver'
  text: string
  createdAt: Date
  readBy: string[]
  isRead?: boolean
  pending?: boolean
}

export interface ChatConversationRecord {
  id: string
  partner: {
    id: string
    name: string
    role: string
    organization?: string
    profileImage?: string
  }
  lastMessagePreview?: string
  lastMessageAt?: Date | null
  unreadCount: number
}
