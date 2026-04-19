import { useEffect, useState } from 'react'
import { useDataState } from 'astra'
import {
  ChatInternalRepo,
  type ChatConversation,
  type ChatMessage,
  type Participant
} from '../repo/ChatInternalRepo'

export const useChatInternalViewModel = () => {
  const repo = new ChatInternalRepo()
  const [conversationsState, executeLoad] = useDataState<ChatConversation[]>()

  const [selectedConversation, setSelectedConversation] = useState<ChatConversation | null>(null)
  const [messageHistory, setMessageHistory] = useState<ChatMessage[]>([])
  const [messageInput, setMessageInput] = useState('')
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [selectedRecipientId, setSelectedRecipientId] = useState<string>('')

  const loadConversations = async (): Promise<void> => {
    await executeLoad(() => repo.getConversations())
  }

  const loadParticipants = async (): Promise<void> => {
    const response = await repo.fetchParticipants()
    setParticipants(response.data ?? [])
  }

  useEffect(() => {
    loadConversations()
    loadParticipants()

    const poll = window.setInterval(() => {
      loadConversations()
    }, 5000)

    return () => {
      window.clearInterval(poll)
    }
  }, [])

  const selectConversation = async (conversation: ChatConversation): Promise<void> => {
    setSelectedConversation(conversation)
    setIsLoadingHistory(true)
    try {
      const response = await repo.getHistory(conversation.conversationKey, 100)
      setMessageHistory(response.data ?? [])
      const recipient = conversation.participants.find(
        (participant) => participant.id !== 'director'
      )
      setSelectedRecipientId(recipient?.id ?? '')
    } finally {
      setIsLoadingHistory(false)
    }
  }

  const sendMessage = async (): Promise<void> => {
    const trimmed = messageInput.trim()
    if (!trimmed) {
      return
    }

    const recipientId = selectedRecipientId
    if (!recipientId) {
      return
    }

    const optimistic: ChatMessage = {
      id: `local-${Date.now()}`,
      senderId: 'director',
      senderName: 'Director',
      message: trimmed,
      timestamp: new Date().toISOString(),
      channelId: 'internal-chat'
    }

    setMessageHistory((previous) => [...previous, optimistic])
    setMessageInput('')

    const response = await repo.sendMessage(recipientId, trimmed)
    if (response.data) {
      setMessageHistory((previous) => {
        const withoutOptimistic = previous.filter((item) => item.id !== optimistic.id)
        return [...withoutOptimistic, response.data as ChatMessage]
      })
    }

    await loadConversations()
  }

  return {
    conversationsState,
    selectedConversation,
    messageHistory,
    messageInput,
    isLoadingHistory,
    participants,
    selectedRecipientId,
    setSelectedRecipientId,
    selectConversation,
    sendMessage,
    setMessageInput,
    onRefresh: loadConversations
  }
}
