import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AgentDefinition } from 'dharma/registry/loader'

const mocks = vi.hoisted(() => ({
  loadCompany: vi.fn(),
  loadProductCatalog: vi.fn(),
  loadProductById: vi.fn(),
  loadAgent: vi.fn(),
  loadSkill: vi.fn(),
  loadProtocol: vi.fn(),
  loadKpi: vi.fn(),
  loadDataInput: vi.fn(),
  loadWorkflow: vi.fn(),
  getEntityPath: vi.fn(),
  sqliteGetAll: vi.fn(),
  sqliteSet: vi.fn(),
  writeJson: vi.fn(),
  flushPendingToVault: vi.fn()
}))

vi.mock('dharma/registry/loader', () => ({
  loadCompany: mocks.loadCompany,
  loadProductCatalog: mocks.loadProductCatalog,
  loadProductById: mocks.loadProductById,
  loadAgent: mocks.loadAgent,
  loadSkill: mocks.loadSkill,
  loadProtocol: mocks.loadProtocol,
  loadKpi: mocks.loadKpi,
  loadDataInput: mocks.loadDataInput,
  loadWorkflow: mocks.loadWorkflow,
  getEntityPath: mocks.getEntityPath
}))

vi.mock('prana/main/services/sqliteConfigStoreService', () => ({
  sqliteConfigStoreService: {
    getAll: mocks.sqliteGetAll,
    set: mocks.sqliteSet
  }
}))

vi.mock('prana/main/services/runtimeDocumentStoreService', () => ({
  runtimeDocumentStoreService: {
    writeJson: mocks.writeJson,
    flushPendingToVault: mocks.flushPendingToVault
  }
}))

import { dharmaSyncService } from './dharmaSyncService'

const makeCompanyRegistry = (id = 'acme-company') => ({
  id,
  metadata: {
    companyName: 'Acme Company',
    companyType: 'Studio',
    foundation: 'People-first execution',
    philosophy: 'clarity, focus',
    vision: 'Ship reliable systems',
    coreValues: ['clarity', 'accountability'],
    aiGovernance: {
      roles: {
        ai: {
          name: 'AI',
          description: 'AI assistant',
          responsibilities: ['summarize']
        },
        human: {
          name: 'Human',
          description: 'Human owner',
          responsibilities: ['approve']
        }
      },
      boundaries: ['no guessing']
    },
    globalNonNegotiables: ['do not invent data']
  }
})

const makeProduct = () => ({
  id: 'product-1',
  name: 'Product One',
  goal: 'Deliver value',
  vision: 'A better workflow',
  problemSolved: 'Reduces manual work',
  usp: 'Fast and reliable',
  mvpFeatures: ['Draft'],
  validationMethodology: 'Pilot',
  successCriteria: 'Users adopt it',
  targetAudience: ['Operators']
})

const makeAgent = (): AgentDefinition =>
  ({
    uid: 'agent-1',
    name: 'Agent One'
  }) as AgentDefinition

describe('dharmaSyncService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.MAIN_VITE_DHI_DEFAULT_COMPANY = 'acme-company'
    mocks.loadCompany.mockImplementation((companyId: string) => makeCompanyRegistry(companyId))

    let cacheRows: Array<Record<string, unknown>> = []
    let syncRows: Array<Record<string, unknown>> = []

    mocks.sqliteGetAll.mockImplementation(async (table: string) => {
      if (table === 'dharma_company_cache') {
        return cacheRows
      }

      if (table === 'dharma_sync_status') {
        return syncRows
      }

      return []
    })

    mocks.sqliteSet.mockImplementation(async (table: string, value: Record<string, unknown>) => {
      if (table === 'dharma_company_cache') {
        cacheRows = [value]
        return undefined
      }

      if (table === 'dharma_sync_status') {
        syncRows = [...syncRows, value]
      }

      return undefined
    })
  })

  it('loads companies from the default company registry', async () => {
    const companies = await dharmaSyncService.getCompanies()

    expect(mocks.loadCompany).toHaveBeenCalledWith('acme-company')
    expect(companies).toEqual([
      {
        id: 'acme-company',
        name: 'Acme Company',
        createdAt: expect.any(String),
        updatedAt: expect.any(String)
      }
    ])
  })

  it('uses MAIN_VITE_DHI_DEFAULT_COMPANY when the direct env key is missing', async () => {
    process.env.MAIN_VITE_DHI_DEFAULT_COMPANY = 'vite-company'

    const companies = await dharmaSyncService.getCompanies()

    expect(mocks.loadCompany).toHaveBeenCalledWith('vite-company')
    expect(companies).toEqual([
      {
        id: 'vite-company',
        name: 'Acme Company',
        createdAt: expect.any(String),
        updatedAt: expect.any(String)
      }
    ])
  })
  it('throws and logs when a requested company cannot be loaded', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    mocks.loadCompany.mockReturnValueOnce(null as never)

    await expect(dharmaSyncService.getCompany('missing-company')).rejects.toThrow(
      'Company not found: missing-company'
    )

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '[DharmaSync] get company (missing-company) failed:',
      expect.any(Error)
    )
  })

  it('logs and returns an empty fallback when best-effort company loading fails', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    mocks.loadCompany.mockReturnValueOnce(null as never)

    const agents = await dharmaSyncService.getAgents('missing-company')

    expect(agents).toEqual({ companyId: 'missing-company', entries: [] })
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '[DharmaSync] get agents (missing-company) failed:',
      expect.any(Error)
    )
  })

  it('maps sync status rows into a status record', async () => {
    mocks.sqliteGetAll.mockResolvedValue([
      { entity_id: 'product-1', status: 'NEW' },
      { entity_id: 'product-2', status: 'SYNCED' }
    ])

    const status = await dharmaSyncService.getProductsSyncStatus('acme-company')

    expect(mocks.sqliteGetAll).toHaveBeenCalledWith('dharma_sync_status', {
      company_id: 'acme-company',
      category: 'products'
    })
    expect(status).toEqual({
      'product-1': 'NEW',
      'product-2': 'SYNCED'
    })
  })

  it('writes product cache payloads and updates sync state', async () => {
    mocks.writeJson.mockResolvedValue(undefined)
    mocks.sqliteSet.mockResolvedValue(undefined)

    const result = await dharmaSyncService.syncProductToCache('acme-company', makeProduct())

    expect(result.success).toBe(true)
    expect(result.entityId).toBe('product-1')
    expect(mocks.writeJson).toHaveBeenCalledWith(
      'dhi/companies/acme-company/cache/products/product-1.json',
      expect.objectContaining({ id: 'product-1', name: 'Product One' })
    )
    expect(mocks.sqliteSet).toHaveBeenCalledWith(
      'dharma_sync_status',
      expect.objectContaining({
        company_id: 'acme-company',
        category: 'products',
        entity_id: 'product-1',
        status: 'NEW',
        vault_path: 'dhi/companies/acme-company/cache/products/product-1.json'
      })
    )
  })

  it('writes product vault payloads, flushes pending writes, and updates sync state', async () => {
    mocks.writeJson.mockResolvedValue(undefined)
    mocks.flushPendingToVault.mockResolvedValue(undefined)
    mocks.sqliteSet.mockResolvedValue(undefined)

    const result = await dharmaSyncService.saveProductToVault('acme-company', makeProduct())

    expect(result.success).toBe(true)
    expect(result.entityId).toBe('product-1')
    expect(mocks.writeJson).toHaveBeenCalledWith(
      'dhi/companies/acme-company/products/product-1.json',
      expect.objectContaining({ id: 'product-1', name: 'Product One' })
    )
    expect(mocks.flushPendingToVault).toHaveBeenCalledWith('sync: save product product-1')
    expect(mocks.sqliteSet).toHaveBeenCalledWith(
      'dharma_sync_status',
      expect.objectContaining({
        company_id: 'acme-company',
        category: 'products',
        entity_id: 'product-1',
        status: 'SYNCED',
        vault_path: 'dhi/companies/acme-company/products/product-1.json'
      })
    )
  })

  it('syncs agent cache payloads through the shared document helper', async () => {
    mocks.writeJson.mockResolvedValue(undefined)
    mocks.sqliteSet.mockResolvedValue(undefined)

    const result = await dharmaSyncService.syncAgentToCache('acme-company', makeAgent())

    expect(result.success).toBe(true)
    expect(result.entityId).toBe('agent-1')
    expect(mocks.writeJson).toHaveBeenCalledWith(
      'dhi/companies/acme-company/cache/agents/agent-1.json',
      expect.objectContaining({ uid: 'agent-1', name: 'Agent One' })
    )
    expect(mocks.sqliteSet).toHaveBeenCalledWith(
      'dharma_sync_status',
      expect.objectContaining({
        company_id: 'acme-company',
        category: 'agents',
        entity_id: 'agent-1',
        status: 'NEW',
        vault_path: 'dhi/companies/acme-company/cache/agents/agent-1.json'
      })
    )
  })

  it('saves agent vault payloads through the shared vault helper', async () => {
    mocks.writeJson.mockResolvedValue(undefined)
    mocks.flushPendingToVault.mockResolvedValue(undefined)
    mocks.sqliteSet.mockResolvedValue(undefined)

    const result = await dharmaSyncService.saveAgentToVault('acme-company', makeAgent())

    expect(result.success).toBe(true)
    expect(result.entityId).toBe('agent-1')
    expect(mocks.writeJson).toHaveBeenCalledWith(
      'dhi/companies/acme-company/agents/agent-1.json',
      expect.objectContaining({ uid: 'agent-1', name: 'Agent One' })
    )
    expect(mocks.flushPendingToVault).toHaveBeenCalledWith('sync: save agent agent-1')
    expect(mocks.sqliteSet).toHaveBeenCalledWith(
      'dharma_sync_status',
      expect.objectContaining({
        company_id: 'acme-company',
        category: 'agents',
        entity_id: 'agent-1',
        status: 'SYNCED',
        vault_path: 'dhi/companies/acme-company/agents/agent-1.json'
      })
    )
  })

  it('logs and returns a failure result when cache sync write fails', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    mocks.writeJson.mockRejectedValue(new Error('cache write failed'))

    const result = await dharmaSyncService.syncProductToCache('acme-company', makeProduct())

    expect(result).toEqual(
      expect.objectContaining({
        success: false,
        entityId: 'product-1',
        error: 'cache write failed'
      })
    )
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '[DharmaSync] sync products to cache (product-1) failed:',
      expect.any(Error)
    )
  })

  it('logs and returns a failure result when vault save flush fails', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    mocks.writeJson.mockResolvedValue(undefined)
    mocks.flushPendingToVault.mockRejectedValue(new Error('flush failed'))

    const result = await dharmaSyncService.saveProductToVault('acme-company', makeProduct())

    expect(result).toEqual(
      expect.objectContaining({
        success: false,
        entityId: 'product-1',
        error: 'flush failed'
      })
    )
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '[DharmaSync] save products to vault (product-1) failed:',
      expect.any(Error)
    )
  })
})
