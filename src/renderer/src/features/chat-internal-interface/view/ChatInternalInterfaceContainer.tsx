import type { FC } from 'react'
import { AppStateHandler } from 'astra'
import { useChatInternalViewModel } from '../viewmodel/useChatInternalViewModel'
import { ChatInternalView } from './ChatInternalView'

export const ChatInternalInterfaceContainer: FC = () => {
  const {
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
    onRefresh
  } = useChatInternalViewModel()

  return (
    <AppStateHandler appState={conversationsState}>
      <ChatInternalView
        conversations={conversationsState.data ?? []}
        selectedConversation={selectedConversation}
        messageHistory={messageHistory}
        messageInput={messageInput}
        isLoadingHistory={isLoadingHistory}
        participants={participants}
        selectedRecipientId={selectedRecipientId}
        onSelectRecipient={setSelectedRecipientId}
        onSelectConversation={selectConversation}
        onSendMessage={sendMessage}
        onMessageInputChange={setMessageInput}
        onRefresh={onRefresh}
      />
    </AppStateHandler>
  )
}
