import type { FC } from 'react'
import { AppStateHandler, StateType } from 'astra'
import { useChatExternalRoutingViewModel } from '../viewmodel/useChatExternalRoutingViewModel'
import { ChatExternalRoutingView } from './ChatExternalRoutingView'

export const ChatExternalRoutingContainer: FC = () => {
  const {
    channelsState,
    rulesState,
    selectedChannelId,
    newRuleFormOpen,
    newRule,
    isCreating,
    setSelectedChannelId,
    openNewRuleForm,
    closeNewRuleForm,
    setNewRuleField,
    createRoutingRule,
    updateRoutingRule,
    deleteRoutingRule,
    refresh
  } = useChatExternalRoutingViewModel()

  return (
    <AppStateHandler appState={rulesState}>
      <ChatExternalRoutingView
        channels={channelsState.data ?? []}
        rules={rulesState.data ?? []}
        isLoadingChannels={channelsState.state === StateType.LOADING}
        isLoadingRules={rulesState.state === StateType.LOADING}
        formOpen={newRuleFormOpen}
        isCreating={isCreating}
        selectedChannelId={selectedChannelId}
        newRule={newRule}
        onChannelSelect={setSelectedChannelId}
        onFormOpen={openNewRuleForm}
        onFormClose={closeNewRuleForm}
        onCreateRule={createRoutingRule}
        onUpdateRule={updateRoutingRule}
        onDeleteRule={deleteRoutingRule}
        onFormFieldChange={setNewRuleField}
        onRefresh={refresh}
      />
    </AppStateHandler>
  )
}
