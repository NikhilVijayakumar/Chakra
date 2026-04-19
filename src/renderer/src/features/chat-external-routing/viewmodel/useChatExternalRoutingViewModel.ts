import { useEffect, useState } from 'react'
import { useDataState } from 'astra'
import {
  ChatExternalRoutingRepo,
  type Channel,
  type RoutingRule
} from '../repo/ChatExternalRoutingRepo'

export const useChatExternalRoutingViewModel = () => {
  const repo = new ChatExternalRoutingRepo()
  const [channelsState, executeChannelsLoad] = useDataState<Channel[]>()
  const [rulesState, executeRulesLoad] = useDataState<RoutingRule[]>()

  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null)
  const [newRuleFormOpen, setNewRuleFormOpen] = useState(false)
  const [newRule, setNewRule] = useState<Partial<RoutingRule>>({
    source: 'broadcast',
    classification: 'INTERNAL',
    enabled: true
  })
  const [isCreating, setIsCreating] = useState(false)

  const loadChannels = async (): Promise<void> => {
    await executeChannelsLoad(() => repo.getAvailableChannels())
  }

  const loadRules = async (): Promise<void> => {
    await executeRulesLoad(() => repo.getRoutingRules())
  }

  useEffect(() => {
    loadChannels()
    loadRules()
  }, [])

  const createRoutingRule = async (): Promise<void> => {
    if (!newRule.targetChannel || !newRule.classification) {
      return
    }

    setIsCreating(true)
    try {
      await repo.createRoutingRule({
        source: newRule.source,
        targetChannel: newRule.targetChannel,
        classification: newRule.classification,
        enabled: newRule.enabled ?? true
      })
      await loadRules()
      setNewRuleFormOpen(false)
      setNewRule({
        source: 'broadcast',
        classification: 'INTERNAL',
        enabled: true
      })
    } finally {
      setIsCreating(false)
    }
  }

  const updateRoutingRule = async (id: string, updates: Partial<RoutingRule>): Promise<void> => {
    await repo.updateRoutingRule(id, updates)
    await loadRules()
  }

  const deleteRoutingRule = async (id: string): Promise<void> => {
    await repo.deleteRoutingRule(id)
    await loadRules()
  }

  const setNewRuleField = <K extends keyof RoutingRule>(field: K, value: RoutingRule[K]): void => {
    setNewRule((previous) => ({ ...previous, [field]: value }))
  }

  const refresh = async (): Promise<void> => {
    await Promise.all([loadChannels(), loadRules()])
  }

  return {
    channelsState,
    rulesState,
    selectedChannelId,
    newRuleFormOpen,
    newRule,
    isCreating,
    setSelectedChannelId,
    openNewRuleForm: () => setNewRuleFormOpen(true),
    closeNewRuleForm: () => setNewRuleFormOpen(false),
    setNewRuleField,
    createRoutingRule,
    updateRoutingRule,
    deleteRoutingRule,
    refresh
  }
}
