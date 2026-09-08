/**
 * useChat backed by Flask REST API + Socket.IO realtime messages.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { getSocket } from '../lib/socket'
import { parseBackendDate } from '../lib/date'
import {
  getChatUsers,
  getConversations,
  getConversationMessages,
  sendMessage,
  type ChatContactRecord,
  type ChatMessageApiRecord,
} from '../services/chatService'
import type { ChatConversationRecord, ChatMessageRecord } from '../lib/types'

function getStoredUser() {
  const raw = localStorage.getItem('user')
  if (!raw) return null
  try {
    return JSON.parse(raw) as { id?: string | number; role?: string; name?: string }
  } catch {
    return null
  }
}

function getCurrentUserId(userId?: string): string | null {
  if (userId) return String(userId)
  const stored = getStoredUser()
  return stored?.id != null ? String(stored.id) : null
}

function getCurrentUserRole(): ChatMessageRecord['senderRole'] {
  const stored = getStoredUser()
  const role = stored?.role
  if (role === 'donor') {
    return 'donor'
  }
  return 'receiver'
}

function isMessagePayload(payload: unknown): payload is ChatMessageApiRecord {
  return Boolean(
    payload &&
      typeof payload === 'object' &&
      'id' in payload &&
      'sender_id' in payload &&
      'receiver_id' in payload &&
      'created_at' in payload,
  )
}

function extractMessagePayload(payload: any): ChatMessageApiRecord | null {
  if (isMessagePayload(payload)) return payload
  if (isMessagePayload(payload?.message)) return payload.message
  if (isMessagePayload(payload?.data)) return payload.data
  return null
}

function normalizeIncomingMessage(
  message: ChatMessageApiRecord,
  currentUserId: string | null,
): ChatMessageRecord {
  const senderId = String(message.sender_id)
  const receiverId = String(message.receiver_id)
  const createdAt = parseBackendDate(message.created_at) ?? new Date()
  const senderRole =
    message.sender_role === 'donor'
      ? 'donor'
      : senderId === currentUserId
        ? getCurrentUserRole()
        : 'receiver'

  return {
    id: String(message.id),
    threadId: receiverId,
    conversationId: receiverId,
    senderId,
    receiverId,
    senderName: message.sender_name || '',
    senderRole,
    text: message.message,
    createdAt,
    isRead: Boolean(message.is_read),
    readBy: message.is_read ? [currentUserId ?? receiverId].filter(Boolean) : [],
  }
}

export function useChat() {
  const { user } = useAuth()
  const currentUserId = getCurrentUserId(user?.id)

  const [conversations, setConversations] = useState<ChatConversationRecord[]>([])
  const [contacts, setContacts] = useState<ChatContactRecord[]>([])
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessageRecord[]>([])
  const [draft, setDraft] = useState('')
  const [loadingConversations, setLoadingConversations] = useState(true)
  const [loadingContacts, setLoadingContacts] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [sending, setSending] = useState(false)
  const [conversationError, setConversationError] = useState<string | null>(null)
  const [messageError, setMessageError] = useState<string | null>(null)
  const [typingUserId, setTypingUserId] = useState<string | null>(null)

  const activeConversationRef = useRef<string | null>(null)
  const messageIdsRef = useRef<Set<string>>(new Set())
  const tempMessageIdRef = useRef<string | null>(null)

  const findContact = useCallback(
    (contactId: string | null) => {
      if (!contactId) return null
      return contacts.find((contact) => contact.id === contactId) || null
    },
    [contacts],
  )

  useEffect(() => {
    activeConversationRef.current = activeConversationId
    setTypingUserId(null)
  }, [activeConversationId])

  const refreshConversations = useCallback(async () => {
    if (!currentUserId) {
      setConversations([])
      setLoadingConversations(false)
      return
    }

    setConversationError(null)
    setLoadingConversations(true)
    try {
      const items = await getConversations()
      setConversations(items)
      setActiveConversationId((previous) => {
        if (previous && items.some((item) => item.id === previous)) {
          return previous
        }
        return items[0]?.id ?? null
      })
    } catch (error) {
      console.error('useChat refreshConversations error:', error)
      setConversationError('Unable to load conversations right now.')
    } finally {
      setLoadingConversations(false)
    }
  }, [currentUserId])

  const refreshContacts = useCallback(async () => {
    if (!currentUserId) {
      setContacts([])
      setLoadingContacts(false)
      return
    }

    setLoadingContacts(true)
    try {
      const items = await getChatUsers()
      setContacts(items)
    } catch (error) {
      console.error('useChat refreshContacts error:', error)
      setContacts([])
    } finally {
      setLoadingContacts(false)
    }
  }, [currentUserId])

  const refreshMessages = useCallback(
    async (conversationId: string) => {
      if (!currentUserId) return

      setLoadingMessages(true)
      setMessageError(null)
      try {
        const items = await getConversationMessages(conversationId)
        setMessages(items)
        messageIdsRef.current = new Set(items.map((message) => message.id))
        setConversations((previous) =>
          previous.map((item) => (item.id === conversationId ? { ...item, unreadCount: 0 } : item)),
        )
      } catch (error) {
        console.error('useChat refreshMessages error:', error)
        setMessageError('Unable to load messages for this conversation.')
        setMessages([])
        messageIdsRef.current = new Set()
      } finally {
        setLoadingMessages(false)
      }
    },
    [currentUserId],
  )

  useEffect(() => {
    void refreshConversations()
  }, [refreshConversations])

  useEffect(() => {
    void refreshContacts()
  }, [refreshContacts])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const partnerId = params.get('partnerId')
    if (partnerId) {
      setActiveConversationId(partnerId)
    }
  }, [])

  useEffect(() => {
    if (loadingConversations || loadingContacts) return
    if (activeConversationId) return
    const params = new URLSearchParams(window.location.search)
    const partnerId = params.get('partnerId')
    if (partnerId) {
      setActiveConversationId(partnerId)
      return
    }
    const nextId = conversations[0]?.id ?? contacts[0]?.id ?? null
    if (nextId) setActiveConversationId(nextId)
  }, [activeConversationId, contacts, conversations, loadingContacts, loadingConversations])

  useEffect(() => {
    if (!activeConversationId) {
      setMessages([])
      return
    }
    void refreshMessages(activeConversationId)
  }, [activeConversationId, refreshMessages])

  useEffect(() => {
    if (!currentUserId) return
    const socket = getSocket()

    const handleNewMessage = (payload: any) => {
      const message = extractMessagePayload(payload)
      if (!message) return

      const normalized = normalizeIncomingMessage(message, currentUserId)
      const senderId = normalized.senderId
      const receiverId = normalized.receiverId ?? ''
      const partnerId = senderId === currentUserId ? receiverId : senderId

      if (normalized.id && messageIdsRef.current.has(normalized.id)) {
        void refreshConversations()
        return
      }

      messageIdsRef.current.add(normalized.id)

      if (activeConversationRef.current === partnerId) {
        setMessages((previous) => {
          const tempId = tempMessageIdRef.current
          if (tempId && previous.some((item) => item.id === tempId && item.senderId === normalized.senderId)) {
            return previous.map((item) => (item.id === tempId ? normalized : item))
          }
          return [...previous, normalized]
        })

        if (senderId !== currentUserId) {
          void refreshMessages(partnerId)
        }
      }

      void refreshConversations()
    }

    const handleMessageRead = (payload: any) => {
      const ids = new Set((payload?.message_ids ?? []).map((id: number | string) => String(id)))
      if (ids.size === 0) return
      setMessages((previous) =>
        previous.map((message) =>
          ids.has(message.id)
            ? { ...message, isRead: true, readBy: [...message.readBy, currentUserId].filter(Boolean) }
            : message,
        ),
      )
      void refreshConversations()
    }

    const handleTyping = (payload: any) => {
      const senderId = String(payload?.user_id ?? '')
      if (!senderId || senderId === currentUserId) return
      if (senderId !== activeConversationRef.current) return
      setTypingUserId(senderId)
    }

    const handleStoppedTyping = (payload: any) => {
      const senderId = String(payload?.user_id ?? '')
      if (!senderId || senderId !== activeConversationRef.current) return
      setTypingUserId((previous) => (previous === senderId ? null : previous))
    }

    socket.on('new_message', handleNewMessage)
    socket.on('messages_read', handleMessageRead)
    socket.on('message_read', handleMessageRead)
    socket.on('user_typing', handleTyping)
    socket.on('userTyping', handleTyping)
    socket.on('typing_indicator', handleTyping)
    socket.on('user_stop_typing', handleStoppedTyping)
    socket.on('userStoppedTyping', handleStoppedTyping)

    return () => {
      socket.off('new_message', handleNewMessage)
      socket.off('messages_read', handleMessageRead)
      socket.off('message_read', handleMessageRead)
      socket.off('user_typing', handleTyping)
      socket.off('userTyping', handleTyping)
      socket.off('typing_indicator', handleTyping)
      socket.off('user_stop_typing', handleStoppedTyping)
      socket.off('userStoppedTyping', handleStoppedTyping)
    }
  }, [currentUserId, refreshConversations, refreshMessages])

  const activeConversation = useMemo(
    () => {
      const conversation = conversations.find((item) => item.id === activeConversationId)
      if (conversation) return conversation
      const contact = findContact(activeConversationId)
      if (!contact) return null
      return {
        id: contact.id,
        partner: {
          id: contact.id,
          name: contact.name,
          role: contact.role,
          organization: contact.organization,
          profileImage: contact.profileImage,
        },
        lastMessagePreview: undefined,
        lastMessageAt: null,
        unreadCount: 0,
      }
    },
    [activeConversationId, conversations, findContact],
  )

  const typingName = useMemo(() => {
    if (!typingUserId || !activeConversation) return null
    return activeConversation.partner.id === typingUserId ? activeConversation.partner.name : null
  }, [activeConversation, typingUserId])

  const setActiveConversation = useCallback((conversationId: string) => {
    setActiveConversationId(conversationId)
    setTypingUserId(null)
  }, [])

  const updateDraft = useCallback(
    (value: string) => {
      setDraft(value)
      if (!activeConversationId || !currentUserId) return
      const socket = getSocket()
      if (value.trim()) {
        socket.emit('typing', {
          sender_id: currentUserId,
          receiver_id: activeConversationId,
        })
      } else {
        socket.emit('stop_typing', {
          sender_id: currentUserId,
          receiver_id: activeConversationId,
        })
      }
    },
    [activeConversationId, currentUserId],
  )

  const stopCurrentTyping = useCallback(() => {
    if (!activeConversationId || !currentUserId) return
    getSocket().emit('stop_typing', {
      sender_id: currentUserId,
      receiver_id: activeConversationId,
    })
    setTypingUserId(null)
  }, [activeConversationId, currentUserId])

  const sendCurrentMessage = useCallback(async () => {
    if (!currentUserId || !activeConversationId) return
    const trimmed = draft.trim()
    if (!trimmed || !activeConversation) return

    const tempId = `temp-${Date.now()}`
    tempMessageIdRef.current = tempId
    const tempMessage: ChatMessageRecord = {
      id: tempId,
      threadId: activeConversationId,
      conversationId: activeConversationId,
      senderId: String(currentUserId),
      receiverId: activeConversation.partner.id,
      senderName: user?.name || 'You',
      senderRole: (user?.role as ChatMessageRecord['senderRole']) || 'receiver',
      text: trimmed,
      createdAt: new Date(),
      readBy: [String(currentUserId)],
      isRead: true,
      pending: true,
    }

    setSending(true)
    setMessageError(null)
    setMessages((previous) => [...previous, tempMessage])
    setDraft('')
    stopCurrentTyping()

    try {
      const persisted = await sendMessage(activeConversation.partner.id, trimmed)
      setMessages((previous) =>
        previous.map((message) => (message.id === tempId ? { ...persisted, pending: false } : message)),
      )
      messageIdsRef.current.add(persisted.id)
      void refreshConversations()
    } catch (error) {
      console.error('useChat sendCurrentMessage error:', error)
      setMessageError('Unable to send message right now.')
      setMessages((previous) => previous.filter((message) => message.id !== tempId))
    } finally {
      tempMessageIdRef.current = null
      setSending(false)
    }
  }, [activeConversation, activeConversationId, currentUserId, draft, refreshConversations, stopCurrentTyping, user?.name, user?.role])

  return {
    conversations,
    contacts,
    activeConversationId,
    activeConversation,
    setActiveConversation,
    messages,
    draft,
    updateDraft,
    sendCurrentMessage,
    stopCurrentTyping,
    loadingConversations,
    loadingContacts,
    loadingMessages,
    sending,
    conversationError,
    messageError,
    typingName,
    user,
  }
}
