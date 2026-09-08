/**
 * Chat service backed by Flask REST + Socket.IO realtime events.
 */
import api from '../lib/api'
import { parseBackendDate } from '../lib/date'
import type { ChatConversationRecord, ChatMessageRecord } from '../lib/types'

export interface ChatMessageApiRecord {
  id: number
  sender_id: number
  receiver_id: number
  sender_name?: string | null
  receiver_name?: string | null
  sender_role?: string | null
  message: string
  created_at: string
  is_read?: boolean
}

export interface ChatConversationApiRecord {
  partner: {
    id: number
    name: string
    organization?: string | null
    role: string
    profile_image?: string | null
  }
  last_message: ChatMessageApiRecord | null
  unread_count: number
}

export interface ChatContactRecord {
  id: string
  name: string
  role: string
  organization?: string
  profileImage?: string
  verified?: boolean
  status?: string
}

function currentUserId(): string | null {
  const rawUser = localStorage.getItem('user')
  if (!rawUser) return null

  try {
    const parsed = JSON.parse(rawUser) as { id?: string | number }
    return parsed.id != null ? String(parsed.id) : null
  } catch {
    return null
  }
}

function currentUserRole(): ChatMessageRecord['senderRole'] {
  const rawUser = localStorage.getItem('user')
  if (!rawUser) return 'receiver'

  try {
    const parsed = JSON.parse(rawUser) as { role?: string }
    if (parsed.role === 'donor') return 'donor'
    return 'receiver'
  } catch {
    return 'receiver'
  }
}

function normalizeRole(role?: string | null): ChatMessageRecord['senderRole'] {
  if (role === 'donor') {
    return 'donor'
  }
  return 'receiver'
}

export function normalizeMessage(
  raw: ChatMessageApiRecord,
  currentId: string | null = currentUserId(),
): ChatMessageRecord {
  const createdAt = parseBackendDate(raw.created_at) ?? new Date()
  const senderId = String(raw.sender_id)
  const receiverId = String(raw.receiver_id)
  const isRead = Boolean(raw.is_read)
  const role = currentUserRole()
  const fallbackRole =
    senderId === currentId
      ? role
      : role === 'donor'
        ? 'receiver'
        : 'donor'

  return {
    id: String(raw.id),
    threadId: receiverId,
    conversationId: receiverId,
    senderId,
    receiverId,
    senderName: raw.sender_name || '',
    senderRole: raw.sender_role ? normalizeRole(raw.sender_role) : fallbackRole,
    text: raw.message,
    createdAt,
    readBy: isRead ? [String(currentId ?? receiverId)].filter(Boolean) : [],
    isRead,
  }
}

export function normalizeConversation(
  raw: ChatConversationApiRecord,
): ChatConversationRecord {
  const partnerId = String(raw.partner.id)
  const lastMessage = raw.last_message ? normalizeMessage(raw.last_message, currentUserId()) : null

  return {
    id: partnerId,
    partner: {
      id: partnerId,
      name: raw.partner.name,
      role: raw.partner.role,
      organization: raw.partner.organization || undefined,
      profileImage: raw.partner.profile_image || undefined,
    },
    lastMessagePreview: raw.last_message?.message || lastMessage?.text || undefined,
    lastMessageAt: lastMessage?.createdAt ?? (raw.last_message?.created_at ? parseBackendDate(raw.last_message.created_at) : null),
    unreadCount: raw.unread_count || 0,
  }
}

function normalizeChatContact(raw: Record<string, any>): ChatContactRecord {
  return {
    id: String(raw.id),
    name: raw.name || 'Unknown user',
    role: raw.role || 'receiver',
    organization: raw.organization || undefined,
    profileImage: raw.profile_image || undefined,
    verified: Boolean(raw.verified),
    status: raw.status || undefined,
  }
}

export async function getConversations(): Promise<ChatConversationRecord[]> {
  const res = await api.get('/chat/conversations')
  const payload = Array.isArray(res.data) ? res.data : res.data?.conversations ?? []
  return payload.map((conversation: ChatConversationApiRecord) => normalizeConversation(conversation))
}

export async function getConversationMessages(
  partnerId: string | number,
): Promise<ChatMessageRecord[]> {
  const res = await api.get(`/chat/messages/${partnerId}`)
  const payload = Array.isArray(res.data) ? res.data : res.data?.messages ?? []
  return payload.map((message: ChatMessageApiRecord) => normalizeMessage(message))
}

export async function sendMessage(
  receiverId: string | number,
  message: string,
): Promise<ChatMessageRecord> {
  const res = await api.post('/chat/messages', {
    receiver_id: receiverId,
    message,
  })

  const payload = res.data?.data ?? res.data
  return normalizeMessage(payload as ChatMessageApiRecord)
}

export async function getChatUsers(): Promise<ChatContactRecord[]> {
  const res = await api.get('/chat/users')
  const payload = Array.isArray(res.data) ? res.data : res.data?.users ?? []
  return payload.map((user: Record<string, any>) => normalizeChatContact(user))
}

/** Legacy compatibility helpers retained for older callers. */
export function threadIdFor(donationId: string, participantId: string): string {
  return `${donationId}__${participantId}`
}

export async function ensureChatThread(
  _threadId: string,
  _participants: { id: string; name: string; role: string }[],
): Promise<void> {
  // The backend stores direct user messages, so there is nothing to create.
}

export async function postChatMessage(input: {
  threadId: string
  senderId: string
  senderName: string
  senderRole: 'donor' | 'receiver'
  text: string
}): Promise<string> {
  const parts = input.threadId.split('__')
  const partnerId = parts[1] || parts[0]
  const message = await sendMessage(partnerId, input.text)
  return message.id
}

export function listenToThread(
  _threadId: string,
  _onChange: (msgs: ChatMessageRecord[]) => void,
): () => void {
  return () => {}
}

export function listenToUserThreads(
  _userId: string,
  _onChange: (threads: ChatConversationRecord[]) => void,
): () => void {
  return () => {}
}
