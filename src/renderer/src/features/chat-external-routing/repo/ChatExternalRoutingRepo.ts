import type { ServerResponse } from 'astra'
import { successResponse } from 'prana/services/ipcResponseFactory'

export interface Channel {
  id: string
  name: string
  enabled: boolean
  config: Record<string, unknown>
}

export interface RoutingRule {
  id: string
  source?: string
  targetChannel: string
  classification: 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'RESTRICTED'
  enabled: boolean
}

const toRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === 'object' ? (value as Record<string, unknown>) : null

export class ChatExternalRoutingRepo {
  async getAvailableChannels(): Promise<ServerResponse<Channel[]>> {
    try {
      const capabilities = await window.api.channels.getCapabilities()
      const channels = (Array.isArray(capabilities) ? capabilities : [])
        .map((item, index) => {
          const record = toRecord(item)
          if (!record) {
            return null
          }

          const id = String(record.id ?? record.channelId ?? record.name ?? `channel-${index}`)
          const name = String(record.name ?? record.label ?? id)

          return {
            id,
            name,
            enabled: Boolean(record.enabled ?? true),
            config: record
          } as Channel
        })
        .filter((item): item is Channel => item !== null)

      return successResponse(channels)
    } catch (error) {
      console.error('[ChatExternalRoutingRepo] getAvailableChannels failed', error)
      return successResponse([])
    }
  }

  async getRoutingRules(): Promise<ServerResponse<RoutingRule[]>> {
    try {
      // TODO: replace with strict typed operation when available in preload.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const payload = await (window.api.operations as any).getChannelRoutingRules?.()
      const list = Array.isArray(payload) ? payload : []

      const rules = list
        .map((item, index) => {
          const record = toRecord(item)
          if (!record) {
            return null
          }

          const classification = String(
            record.classification ?? 'INTERNAL'
          ) as RoutingRule['classification']
          return {
            id: String(record.id ?? `rule-${index}`),
            source: typeof record.source === 'string' ? record.source : undefined,
            targetChannel: String(record.targetChannel ?? record.channelId ?? ''),
            classification,
            enabled: Boolean(record.enabled ?? true)
          } as RoutingRule
        })
        .filter((item): item is RoutingRule => item !== null)

      return successResponse(rules)
    } catch (error) {
      console.error('[ChatExternalRoutingRepo] getRoutingRules failed', error)
      return successResponse([])
    }
  }

  async createRoutingRule(rule: Omit<RoutingRule, 'id'>): Promise<ServerResponse<RoutingRule>> {
    try {
      const created: RoutingRule = {
        id: `rule-${Date.now()}`,
        ...rule
      }

      // TODO: replace with strict typed operation when available in preload.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (window.api.operations as any).createChannelRoutingRule?.(created)
      return successResponse(created)
    } catch (error) {
      console.error('[ChatExternalRoutingRepo] createRoutingRule failed', error)
      return successResponse({ id: `rule-${Date.now()}`, ...rule })
    }
  }

  async updateRoutingRule(
    id: string,
    updates: Partial<RoutingRule>
  ): Promise<ServerResponse<RoutingRule>> {
    try {
      // TODO: replace with strict typed operation when available in preload.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (window.api.operations as any).updateChannelRoutingRule?.(id, updates)
      return successResponse({
        id,
        source: updates.source,
        targetChannel: updates.targetChannel ?? '',
        classification: updates.classification ?? 'INTERNAL',
        enabled: updates.enabled ?? true
      })
    } catch (error) {
      console.error('[ChatExternalRoutingRepo] updateRoutingRule failed', error)
      return successResponse({
        id,
        source: updates.source,
        targetChannel: updates.targetChannel ?? '',
        classification: updates.classification ?? 'INTERNAL',
        enabled: updates.enabled ?? true
      })
    }
  }

  async deleteRoutingRule(id: string): Promise<ServerResponse<boolean>> {
    try {
      // TODO: replace with strict typed operation when available in preload.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (window.api.operations as any).deleteChannelRoutingRule?.(id)
      return successResponse(true)
    } catch (error) {
      console.error('[ChatExternalRoutingRepo] deleteRoutingRule failed', error)
      return successResponse(false)
    }
  }
}
