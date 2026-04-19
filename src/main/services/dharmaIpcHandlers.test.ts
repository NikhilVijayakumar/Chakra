import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  handle: vi.fn(),
  getCompanies: vi.fn(),
  getCompany: vi.fn(),
  getActiveCompany: vi.fn(),
  setActiveCompany: vi.fn(),
  getAgents: vi.fn(),
  getAgent: vi.fn(),
  getSkills: vi.fn(),
  getProtocols: vi.fn(),
  getWorkflows: vi.fn(),
  getKpis: vi.fn(),
  getDataInputs: vi.fn(),
  getProductCatalog: vi.fn(),
  getProduct: vi.fn(),
  getAgentsSyncStatus: vi.fn(),
  getSkillsSyncStatus: vi.fn(),
  getProtocolsSyncStatus: vi.fn(),
  getWorkflowsSyncStatus: vi.fn(),
  getKpisSyncStatus: vi.fn(),
  getDataInputsSyncStatus: vi.fn(),
  getProductsSyncStatus: vi.fn(),
  syncAgentToCache: vi.fn(),
  syncSkillToCache: vi.fn(),
  syncProtocolToCache: vi.fn(),
  syncWorkflowToCache: vi.fn(),
  syncKpiToCache: vi.fn(),
  syncDataInputToCache: vi.fn(),
  syncProductToCache: vi.fn(),
  saveAgentToVault: vi.fn(),
  saveSkillToVault: vi.fn(),
  saveProtocolToVault: vi.fn(),
  saveWorkflowToVault: vi.fn(),
  saveKpiToVault: vi.fn(),
  saveDataInputToVault: vi.fn(),
  saveProductToVault: vi.fn()
}))

vi.mock('electron', () => ({
  ipcMain: {
    handle: mocks.handle
  }
}))

vi.mock('./dharmaSyncService', () => ({
  dharmaSyncService: {
    getCompanies: mocks.getCompanies,
    getCompany: mocks.getCompany,
    getActiveCompany: mocks.getActiveCompany,
    setActiveCompany: mocks.setActiveCompany,
    getAgents: mocks.getAgents,
    getAgent: mocks.getAgent,
    getSkills: mocks.getSkills,
    getProtocols: mocks.getProtocols,
    getWorkflows: mocks.getWorkflows,
    getKpis: mocks.getKpis,
    getDataInputs: mocks.getDataInputs,
    getProductCatalog: mocks.getProductCatalog,
    getProduct: mocks.getProduct,
    getAgentsSyncStatus: mocks.getAgentsSyncStatus,
    getSkillsSyncStatus: mocks.getSkillsSyncStatus,
    getProtocolsSyncStatus: mocks.getProtocolsSyncStatus,
    getWorkflowsSyncStatus: mocks.getWorkflowsSyncStatus,
    getKpisSyncStatus: mocks.getKpisSyncStatus,
    getDataInputsSyncStatus: mocks.getDataInputsSyncStatus,
    getProductsSyncStatus: mocks.getProductsSyncStatus,
    syncAgentToCache: mocks.syncAgentToCache,
    syncSkillToCache: mocks.syncSkillToCache,
    syncProtocolToCache: mocks.syncProtocolToCache,
    syncWorkflowToCache: mocks.syncWorkflowToCache,
    syncKpiToCache: mocks.syncKpiToCache,
    syncDataInputToCache: mocks.syncDataInputToCache,
    syncProductToCache: mocks.syncProductToCache,
    saveAgentToVault: mocks.saveAgentToVault,
    saveSkillToVault: mocks.saveSkillToVault,
    saveProtocolToVault: mocks.saveProtocolToVault,
    saveWorkflowToVault: mocks.saveWorkflowToVault,
    saveKpiToVault: mocks.saveKpiToVault,
    saveDataInputToVault: mocks.saveDataInputToVault,
    saveProductToVault: mocks.saveProductToVault
  }
}))

import { registerDharmaIpcHandlers } from './dharmaIpcHandlers'

type Handler = (event: unknown, payload?: unknown) => Promise<unknown>

const getRegisteredHandlers = (): Map<string, Handler> => {
  return new Map<string, Handler>(mocks.handle.mock.calls as Array<[string, Handler]>)
}

describe('registerDharmaIpcHandlers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('registers and delegates all Dharma IPC channels', async () => {
    registerDharmaIpcHandlers()

    const handlers = getRegisteredHandlers()

    const delegations = [
      {
        channel: 'dharma:get-companies',
        method: 'getCompanies',
        payload: undefined,
        result: { channel: 'dharma:get-companies' }
      },
      {
        channel: 'dharma:get-company',
        method: 'getCompany',
        payload: { companyId: 'acme-company' },
        result: { channel: 'dharma:get-company' }
      },
      {
        channel: 'dharma:get-active-company',
        method: 'getActiveCompany',
        payload: undefined,
        result: { channel: 'dharma:get-active-company' }
      },
      {
        channel: 'dharma:set-active-company',
        method: 'setActiveCompany',
        payload: { companyId: 'acme-company' },
        result: { channel: 'dharma:set-active-company' }
      },
      {
        channel: 'dharma:get-agents',
        method: 'getAgents',
        payload: { companyId: 'acme-company' },
        result: { channel: 'dharma:get-agents' }
      },
      {
        channel: 'dharma:get-agent',
        method: 'getAgent',
        payload: { companyId: 'acme-company', agentPath: 'agents/mira.md' },
        result: { channel: 'dharma:get-agent' }
      },
      {
        channel: 'dharma:get-skills',
        method: 'getSkills',
        payload: { companyId: 'acme-company' },
        result: { channel: 'dharma:get-skills' }
      },
      {
        channel: 'dharma:get-protocols',
        method: 'getProtocols',
        payload: { companyId: 'acme-company' },
        result: { channel: 'dharma:get-protocols' }
      },
      {
        channel: 'dharma:get-workflows',
        method: 'getWorkflows',
        payload: { companyId: 'acme-company' },
        result: { channel: 'dharma:get-workflows' }
      },
      {
        channel: 'dharma:get-kpis',
        method: 'getKpis',
        payload: { companyId: 'acme-company' },
        result: { channel: 'dharma:get-kpis' }
      },
      {
        channel: 'dharma:get-data-inputs',
        method: 'getDataInputs',
        payload: { companyId: 'acme-company' },
        result: { channel: 'dharma:get-data-inputs' }
      },
      {
        channel: 'dharma:get-products',
        method: 'getProductCatalog',
        payload: { companyId: 'acme-company' },
        result: { channel: 'dharma:get-products' }
      },
      {
        channel: 'dharma:get-product',
        method: 'getProduct',
        payload: { companyId: 'acme-company', productId: 'product-1' },
        result: { channel: 'dharma:get-product' }
      },
      {
        channel: 'dharma:get-agents-sync-status',
        method: 'getAgentsSyncStatus',
        payload: { companyId: 'acme-company' },
        result: { channel: 'dharma:get-agents-sync-status' }
      },
      {
        channel: 'dharma:get-skills-sync-status',
        method: 'getSkillsSyncStatus',
        payload: { companyId: 'acme-company' },
        result: { channel: 'dharma:get-skills-sync-status' }
      },
      {
        channel: 'dharma:get-protocols-sync-status',
        method: 'getProtocolsSyncStatus',
        payload: { companyId: 'acme-company' },
        result: { channel: 'dharma:get-protocols-sync-status' }
      },
      {
        channel: 'dharma:get-workflows-sync-status',
        method: 'getWorkflowsSyncStatus',
        payload: { companyId: 'acme-company' },
        result: { channel: 'dharma:get-workflows-sync-status' }
      },
      {
        channel: 'dharma:get-kpis-sync-status',
        method: 'getKpisSyncStatus',
        payload: { companyId: 'acme-company' },
        result: { channel: 'dharma:get-kpis-sync-status' }
      },
      {
        channel: 'dharma:get-data-inputs-sync-status',
        method: 'getDataInputsSyncStatus',
        payload: { companyId: 'acme-company' },
        result: { channel: 'dharma:get-data-inputs-sync-status' }
      },
      {
        channel: 'dharma:get-products-sync-status',
        method: 'getProductsSyncStatus',
        payload: { companyId: 'acme-company' },
        result: { channel: 'dharma:get-products-sync-status' }
      },
      {
        channel: 'dharma:sync-agent-to-cache',
        method: 'syncAgentToCache',
        payload: { companyId: 'acme-company', agent: { uid: 'agent-1' } },
        result: { channel: 'dharma:sync-agent-to-cache' }
      },
      {
        channel: 'dharma:sync-skill-to-cache',
        method: 'syncSkillToCache',
        payload: { companyId: 'acme-company', skill: { id: 'skill-1', name: 'Skill One' } },
        result: { channel: 'dharma:sync-skill-to-cache' }
      },
      {
        channel: 'dharma:sync-protocol-to-cache',
        method: 'syncProtocolToCache',
        payload: {
          companyId: 'acme-company',
          protocol: { id: 'protocol-1', name: 'Protocol One' }
        },
        result: { channel: 'dharma:sync-protocol-to-cache' }
      },
      {
        channel: 'dharma:sync-workflow-to-cache',
        method: 'syncWorkflowToCache',
        payload: {
          companyId: 'acme-company',
          workflow: { id: 'workflow-1', name: 'Workflow One' }
        },
        result: { channel: 'dharma:sync-workflow-to-cache' }
      },
      {
        channel: 'dharma:sync-kpi-to-cache',
        method: 'syncKpiToCache',
        payload: { companyId: 'acme-company', kpi: { id: 'kpi-1', name: 'KPI One' } },
        result: { channel: 'dharma:sync-kpi-to-cache' }
      },
      {
        channel: 'dharma:sync-data-input-to-cache',
        method: 'syncDataInputToCache',
        payload: { companyId: 'acme-company', dataInput: { id: 'input-1', name: 'Input One' } },
        result: { channel: 'dharma:sync-data-input-to-cache' }
      },
      {
        channel: 'dharma:sync-product-to-cache',
        method: 'syncProductToCache',
        payload: { companyId: 'acme-company', product: { id: 'product-1', name: 'Product One' } },
        result: { channel: 'dharma:sync-product-to-cache' }
      },
      {
        channel: 'dharma:save-agent-to-vault',
        method: 'saveAgentToVault',
        payload: { companyId: 'acme-company', agent: { uid: 'agent-1' } },
        result: { channel: 'dharma:save-agent-to-vault' }
      },
      {
        channel: 'dharma:save-skill-to-vault',
        method: 'saveSkillToVault',
        payload: { companyId: 'acme-company', skill: { id: 'skill-1', name: 'Skill One' } },
        result: { channel: 'dharma:save-skill-to-vault' }
      },
      {
        channel: 'dharma:save-protocol-to-vault',
        method: 'saveProtocolToVault',
        payload: {
          companyId: 'acme-company',
          protocol: { id: 'protocol-1', name: 'Protocol One' }
        },
        result: { channel: 'dharma:save-protocol-to-vault' }
      },
      {
        channel: 'dharma:save-workflow-to-vault',
        method: 'saveWorkflowToVault',
        payload: {
          companyId: 'acme-company',
          workflow: { id: 'workflow-1', name: 'Workflow One' }
        },
        result: { channel: 'dharma:save-workflow-to-vault' }
      },
      {
        channel: 'dharma:save-kpi-to-vault',
        method: 'saveKpiToVault',
        payload: { companyId: 'acme-company', kpi: { id: 'kpi-1', name: 'KPI One' } },
        result: { channel: 'dharma:save-kpi-to-vault' }
      },
      {
        channel: 'dharma:save-data-input-to-vault',
        method: 'saveDataInputToVault',
        payload: { companyId: 'acme-company', dataInput: { id: 'input-1', name: 'Input One' } },
        result: { channel: 'dharma:save-data-input-to-vault' }
      },
      {
        channel: 'dharma:save-product-to-vault',
        method: 'saveProductToVault',
        payload: { companyId: 'acme-company', product: { id: 'product-1', name: 'Product One' } },
        result: { channel: 'dharma:save-product-to-vault' }
      }
    ] as const

    for (const entry of delegations) {
      mocks[entry.method as keyof typeof mocks].mockResolvedValue(entry.result)
      const handler = handlers.get(entry.channel)
      expect(handler).toBeDefined()

      const result = await handler?.(undefined, entry.payload)

      expect(mocks[entry.method as keyof typeof mocks]).toHaveBeenCalledTimes(1)
      expect(mocks[entry.method as keyof typeof mocks]).toHaveBeenCalledWith(
        ...(entry.payload ? Object.values(entry.payload) : [])
      )
      expect(result).toEqual(entry.result)
    }

    expect(mocks.handle).toHaveBeenCalledTimes(delegations.length)
  })
})
