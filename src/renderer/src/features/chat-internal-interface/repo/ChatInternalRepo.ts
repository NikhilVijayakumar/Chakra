import type { ServerResponse } from 'astra'
import { successResponse } from 'prana/services/ipcResponseFactory'

export interface Participant {
  id: string
  name: string
  avatar?: string
}

export interface ChatMessage {
  id: string
  senderId: string
  senderName: string
  message: string
  timestamp: string
  channelId?: string
}

export interface ChatConversation {
  conversationKey: string
  participants: Participant[]
  lastMessage?: ChatMessage
  updatedAt: string
}

const toRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === 'object' ? (value as Record<string, unknown>) : null

const toParticipant = (value: unknown): Participant | null => {
  const record = toRecord(value)
  if (!record) {
    return null
  }

  const id = String(record.id ?? record.uid ?? '')
  const name = String(record.name ?? record.senderName ?? id)
  if (!id) {
    return null
  }

  return {
    id,
    name,
    avatar: typeof record.avatar === 'string' ? record.avatar : undefined
  }
}

const toChatMessage = (value: unknown): ChatMessage | null => {
  const record = toRecord(value)
  if (!record) {
    return null
  }

  const message = String(record.message ?? record.messageText ?? '')
  if (!message) {
    return null
  }

  return {
    id: String(record.id ?? record.messageId ?? `${Date.now()}`),
    senderId: String(record.senderId ?? record.personaId ?? 'unknown'),
    senderName: String(record.senderName ?? record.personaName ?? 'Unknown'),
    message,
    timestamp: String(record.timestamp ?? record.timestampIso ?? new Date().toISOString()),
    channelId: typeof record.channelId === 'string' ? record.channelId : undefined
  }
}

const toChatConversation = (value: unknown): ChatConversation | null => {
  const record = toRecord(value)
  if (!record) {
    return null
  }

  const conversationKey = String(record.conversationKey ?? record.key ?? '')
  if (!conversationKey) {
    return null
  }

  const participantsRaw = Array.isArray(record.participants) ? record.participants : []
  const participants = participantsRaw
    .map((participant) => toParticipant(participant))
    .filter((participant): participant is Participant => participant !== null)

  const lastMessage = toChatMessage(record.lastMessage)

  return {
    conversationKey,
    participants,
    lastMessage: lastMessage ?? undefined,
    updatedAt: String(record.updatedAt ?? record.lastMessageAt ?? new Date().toISOString())
  }
}

export class ChatInternalRepo {
  async getConversations(): Promise<ServerResponse<ChatConversation[]>> {
    try {
      const payload = await window.api.channels.listConversations({ channel: 'internal-chat' })
      const list = Array.isArray(payload) ? payload : []
      const conversations = list
        .map((item) => toChatConversation(item))
        .filter((item): item is ChatConversation => item !== null)

      return successResponse(conversations)
    } catch (error) {
      console.error('[ChatInternalRepo] getConversations failed', error)
      return successResponse([])
    }
  }

  async getHistory(conversationKey: string, limit = 100): Promise<ServerResponse<ChatMessage[]>> {
    try {
      const payload = await window.api.channels.getConversationHistory({
        conversationKey,
        limit: Math.min(limit, 500)
      })

      const list = Array.isArray(payload)
        ? payload
        : Array.isArray(toRecord(payload)?.messages ?? null)
          ? ((toRecord(payload)?.messages ?? []) as unknown[])
          : []

      const messages = list
        .map((item) => toChatMessage(item))
        .filter((item): item is ChatMessage => item !== null)

      return successResponse(messages)
    } catch (error) {
      console.error('[ChatInternalRepo] getHistory failed', error)
      return successResponse([])
    }
  }

  async sendMessage(recipientId: string, message: string): Promise<ServerResponse<ChatMessage>> {
    const sanitizedMessage = message.replace(/<[^>]*>/g, '').slice(0, 5000)
    try {
      const nowIso = new Date().toISOString()
      const result = await window.api.channels.routeInternalMessage({
        message: sanitizedMessage,
        senderId: 'director',
        senderName: 'Director',
        moduleRoute: '/chat-internal-interface',
        targetPersonaId: recipientId,
        timestampIso: nowIso
      })

      const responsePreview =
        typeof result.responsePreview === 'string' && result.responsePreview
          ? result.responsePreview
          : sanitizedMessage

      return successResponse({
        id: `${Date.now()}`,
        senderId: 'director',
        senderName: 'Director',
        message: responsePreview,
        timestamp: nowIso,
        channelId: 'internal-chat'
      })
    } catch (error) {
      console.error('[ChatInternalRepo] sendMessage failed', error)
      return successResponse({
        id: `${Date.now()}`,
        senderId: 'director',
        senderName: 'Director',
        message: sanitizedMessage,
        timestamp: new Date().toISOString(),
        channelId: 'internal-chat'
      })
    }
  }

  async fetchParticipants(): Promise<ServerResponse<Participant[]>> {
    try {
      const companyId = await window.api.dharma.getActiveCompany()
      if (!companyId) {
        return successResponse([])
      }

      const catalog = await window.api.dharma.getAgents(companyId)
      const participants = catalog.entries.map((entry) => ({
        id: entry.uid,
        name: entry.name
      }))

      return successResponse(participants)
    } catch (error) {
      console.error('[ChatInternalRepo] fetchParticipants failed', error)
      return successResponse([])
    }
  }
}
