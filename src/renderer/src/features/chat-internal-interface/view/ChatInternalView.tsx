import type { FC } from 'react'
import {
  Box,
  Button,
  List,
  ListItemButton,
  ListItemText,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography
} from '@mui/material'
import { spacing, useLanguage } from 'astra'
import type { ChatConversation, ChatMessage, Participant } from '../repo/ChatInternalRepo'

interface ChatInternalViewProps {
  conversations: ChatConversation[]
  selectedConversation: ChatConversation | null
  messageHistory: ChatMessage[]
  messageInput: string
  isLoadingHistory: boolean
  participants: Participant[]
  selectedRecipientId: string
  onSelectRecipient: (recipientId: string) => void
  onSelectConversation: (conversation: ChatConversation) => void
  onSendMessage: () => void
  onMessageInputChange: (value: string) => void
  onRefresh: () => void
}

export const ChatInternalView: FC<ChatInternalViewProps> = ({
  conversations,
  selectedConversation,
  messageHistory,
  messageInput,
  isLoadingHistory,
  participants,
  selectedRecipientId,
  onSelectRecipient,
  onSelectConversation,
  onSendMessage,
  onMessageInputChange,
  onRefresh
}) => {
  const { literal } = useLanguage()

  return (
    <Box sx={{ p: spacing.xl, maxWidth: 1300, mx: 'auto' }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: spacing.md }}
      >
        <Typography variant="h5">{literal['chatInternal.title'] || 'Internal Chat'}</Typography>
        <Button variant="outlined" onClick={onRefresh}>
          {literal['global.refresh'] || 'Refresh'}
        </Button>
      </Stack>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={spacing.md}>
        <Paper sx={{ width: { xs: '100%', md: 360 }, p: spacing.sm }}>
          <Typography variant="subtitle1" sx={{ mb: spacing.sm }}>
            {literal['chatInternal.conversations'] || 'Conversations'}
          </Typography>
          <List>
            {conversations.map((conversation) => {
              const names = conversation.participants
                .map((participant) => participant.name)
                .join(', ')
              return (
                <ListItemButton
                  key={conversation.conversationKey}
                  selected={selectedConversation?.conversationKey === conversation.conversationKey}
                  onClick={() => onSelectConversation(conversation)}
                >
                  <ListItemText
                    primary={names || conversation.conversationKey}
                    secondary={
                      conversation.lastMessage?.message ||
                      literal['chatInternal.noMessages'] ||
                      'No messages yet'
                    }
                  />
                </ListItemButton>
              )
            })}
          </List>
        </Paper>

        <Paper
          sx={{ flex: 1, p: spacing.md, minHeight: 520, display: 'flex', flexDirection: 'column' }}
        >
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ mb: spacing.sm }}
          >
            <Typography variant="subtitle1">
              {selectedConversation
                ? selectedConversation.participants
                    .map((participant) => participant.name)
                    .join(', ')
                : literal['chatInternal.selectConversation'] || 'Select a conversation'}
            </Typography>
            <Select
              size="small"
              value={selectedRecipientId}
              displayEmpty
              onChange={(event) => onSelectRecipient(String(event.target.value))}
              sx={{ minWidth: 220 }}
            >
              <MenuItem value="">
                {literal['chatInternal.selectRecipient'] || 'Select recipient'}
              </MenuItem>
              {participants.map((participant) => (
                <MenuItem key={participant.id} value={participant.id}>
                  {participant.name}
                </MenuItem>
              ))}
            </Select>
          </Stack>

          <Box sx={{ flex: 1, overflowY: 'auto', mb: spacing.sm, pr: spacing.xs }}>
            {isLoadingHistory ? (
              <Typography variant="body2" color="text.secondary">
                {literal['chatInternal.loadingHistory'] || 'Loading history...'}
              </Typography>
            ) : (
              <Stack spacing={spacing.sm}>
                {messageHistory.map((message) => {
                  const isDirector = message.senderId === 'director'
                  return (
                    <Box
                      key={message.id}
                      sx={{
                        display: 'flex',
                        justifyContent: isDirector ? 'flex-end' : 'flex-start'
                      }}
                    >
                      <Paper sx={{ p: spacing.sm, maxWidth: '75%' }}>
                        <Typography variant="caption" color="text.secondary">
                          {message.senderName}
                        </Typography>
                        <Typography variant="body2">{message.message}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(message.timestamp).toLocaleTimeString()}
                        </Typography>
                      </Paper>
                    </Box>
                  )
                })}
              </Stack>
            )}
          </Box>

          <Stack direction="row" spacing={spacing.sm}>
            <TextField
              fullWidth
              size="small"
              placeholder={literal['chatInternal.messagePlaceholder'] || 'Type your message'}
              value={messageInput}
              onChange={(event) => onMessageInputChange(event.target.value)}
            />
            <Button
              variant="contained"
              onClick={onSendMessage}
              disabled={!messageInput.trim() || !selectedRecipientId}
            >
              {literal['chatInternal.send'] || 'Send'}
            </Button>
          </Stack>
        </Paper>
      </Stack>
    </Box>
  )
}
