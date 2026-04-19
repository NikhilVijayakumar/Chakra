import {
  loadCompany,
  loadProductCatalog,
  loadProductById,
  loadAgent,
  loadSkill,
  loadProtocol,
  loadKpi,
  loadDataInput,
  loadWorkflow,
  type CompanyRegistry,
  type ProductCatalog,
  type ProductDetails,
  type AgentDefinition,
  type SkillDoc,
  type ProtocolDoc,
  type KpiDefinition,
  type DataInputDefinition,
  type WorkflowDefinition
} from 'dharma/registry/loader'
import { runtimeDocumentStoreService } from 'prana/main/services/runtimeDocumentStoreService'
import { sqliteConfigStoreService } from 'prana/main/services/sqliteConfigStoreService'
import { readMainViteEnvValue } from './runtimeEnv'

const DHARMA_CACHE_TABLE = 'dharma_company_cache'
const DHARMA_SYNC_TABLE = 'dharma_sync_status'

export type DharmaSyncStatus = 'DRAFT' | 'NEW' | 'SYNCED'

export interface SyncResult {
  success: boolean
  entityId: string
  cachePath?: string
  error?: string
}

export interface SaveResult {
  success: boolean
  entityId: string
  vaultPath?: string
  error?: string
}

export interface Company {
  id: string
  name: string
  createdAt: string
  updatedAt: string
}

export interface CompanyMetadata {
  companyName: string
  companyType: string
  foundation: string
  philosophy: string
  vision: string
  coreValues: string[]
  aiGovernance: Record<string, unknown>
  globalNonNegotiables: string[]
  website?: Record<string, string>
}

export interface AgentsCatalog {
  companyId: string
  entries: AgentDefinition[]
}

export interface ProductCatalog {
  companyId: string
  products: ProductDetails[]
}

const getBootstrapCompany = (): string => {
  const envCompany = readMainViteEnvValue(process.env, 'DHI_DEFAULT_COMPANY')
  if (envCompany && envCompany.trim().length > 0) {
    return envCompany.trim()
  }
  throw new Error('Missing required startup config: MAIN_VITE_DHI_DEFAULT_COMPANY')
}

const reportDharmaSyncError = (operation: string, error: unknown): void => {
  console.error(`[DharmaSync] ${operation} failed:`, error)
}

const loadRequiredCompany = (companyId: string): CompanyRegistry => {
  const companyData = loadCompany(companyId)
  if (!companyData) {
    throw new Error(`Company not found: ${companyId}`)
  }

  return companyData
}

const initializeTables = async (): Promise<void> => {
  try {
    const existingCache = await sqliteConfigStoreService.getAll(DHARMA_CACHE_TABLE)
    if (existingCache.length === 0) {
      const bootstrapCompany = getBootstrapCompany()
      const companyData = loadRequiredCompany(bootstrapCompany)
      await sqliteConfigStoreService.set(DHARMA_CACHE_TABLE, {
        id: companyData.id,
        name: companyData.metadata.companyName,
        cached_at: new Date().toISOString()
      })
    }
  } catch (error) {
    reportDharmaSyncError('initialize tables', error)
    throw error
  }
}

const getActiveCompanyId = async (): Promise<string> => {
  await initializeTables()
  const cached = await sqliteConfigStoreService.getAll(DHARMA_CACHE_TABLE)
  if (cached.length > 0 && cached[0].id) {
    return cached[0].id as string
  }

  throw new Error('Missing required startup cache: dharma_company_cache')
}

const getSyncStatus = async (
  companyId: string,
  category: string
): Promise<Record<string, DharmaSyncStatus>> => {
  try {
    const records = await sqliteConfigStoreService.getAll(DHARMA_SYNC_TABLE, {
      company_id: companyId,
      category
    })
    const statusMap: Record<string, DharmaSyncStatus> = {}
    for (const record of records) {
      statusMap[record.entity_id as string] = record.status as DharmaSyncStatus
    }
    return statusMap
  } catch (error) {
    reportDharmaSyncError(`get sync status (${category})`, error)
    return {}
  }
}

const updateSyncStatus = async (
  companyId: string,
  category: string,
  entityId: string,
  status: DharmaSyncStatus,
  path?: string
): Promise<void> => {
  await sqliteConfigStoreService.set(DHARMA_SYNC_TABLE, {
    company_id: companyId,
    category,
    entity_id: entityId,
    status,
    last_synced_at: new Date().toISOString(),
    vault_path: path || null
  })
}

const getErrorMessage = (error: unknown): string => {
  return error instanceof Error ? error.message : 'Unknown error'
}

const syncDocumentToCache = async <TDocument>(params: {
  companyId: string
  category: string
  entityId: string
  document: TDocument
  cachePath: string
}): Promise<SyncResult> => {
  const { companyId, category, entityId, document, cachePath } = params

  try {
    await runtimeDocumentStoreService.writeJson(cachePath, document)
    await updateSyncStatus(companyId, category, entityId, 'NEW', cachePath)
    return { success: true, entityId, cachePath }
  } catch (error) {
    reportDharmaSyncError(`sync ${category} to cache (${entityId})`, error)
    return { success: false, entityId, error: getErrorMessage(error) }
  }
}

const saveDocumentToVault = async <TDocument>(params: {
  companyId: string
  category: string
  entityId: string
  document: TDocument
  vaultPath: string
  flushLabel: string
}): Promise<SaveResult> => {
  const { companyId, category, entityId, document, vaultPath, flushLabel } = params

  try {
    await runtimeDocumentStoreService.writeJson(vaultPath, document)
    await runtimeDocumentStoreService.flushPendingToVault(flushLabel)
    await updateSyncStatus(companyId, category, entityId, 'SYNCED', vaultPath)
    return { success: true, entityId, vaultPath }
  } catch (error) {
    reportDharmaSyncError(`save ${category} to vault (${entityId})`, error)
    return { success: false, entityId, error: getErrorMessage(error) }
  }
}

export const dharmaSyncService = {
  async getActiveCompany(): Promise<string> {
    return getActiveCompanyId()
  },

  async setActiveCompany(companyId: string): Promise<void> {
    try {
      const companyData = loadRequiredCompany(companyId)
      await sqliteConfigStoreService.set(DHARMA_CACHE_TABLE, {
        id: companyData.id,
        name: companyData.metadata.companyName,
        cached_at: new Date().toISOString()
      })
    } catch (error) {
      reportDharmaSyncError(`set active company (${companyId})`, error)
      throw error
    }
  },

  async getCompanies(): Promise<Company[]> {
    try {
      const activeCompanyId = await getActiveCompanyId()
      const data = loadRequiredCompany(activeCompanyId)
      return [
        {
          id: data.id,
          name: data.metadata.companyName,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ]
    } catch (error) {
      reportDharmaSyncError('get companies', error)
      return []
    }
  },

  async getCompany(companyId: string): Promise<CompanyRegistry> {
    try {
      return loadRequiredCompany(companyId)
    } catch (error) {
      reportDharmaSyncError(`get company (${companyId})`, error)
      throw error
    }
  },

  async getProductCatalog(companyId: string): Promise<ProductCatalog> {
    try {
      return loadProductCatalog(companyId)
    } catch (error) {
      reportDharmaSyncError(`get product catalog (${companyId})`, error)
      return { companyId, products: [] }
    }
  },

  async getProduct(companyId: string, productId: string): Promise<ProductDetails | null> {
    try {
      return loadProductById(companyId, productId)
    } catch (error) {
      reportDharmaSyncError(`get product (${companyId}, ${productId})`, error)
      return null
    }
  },

  async getAgents(companyId: string): Promise<AgentsCatalog> {
    try {
      const company = loadRequiredCompany(companyId)
      const agents: AgentDefinition[] = []
      const agentPaths = company.metadata.agents?.entries || {}
      for (const [name, path] of Object.entries(agentPaths)) {
        try {
          const agent = loadAgent(path as string)
          if (agent) {
            agents.push(agent)
          }
        } catch (error) {
          reportDharmaSyncError(`load agent ${name} (${companyId})`, error)
        }
      }
      return { companyId, entries: agents }
    } catch (error) {
      reportDharmaSyncError(`get agents (${companyId})`, error)
      return { companyId, entries: [] }
    }
  },

  async getAgent(companyId: string, agentPath: string): Promise<AgentDefinition | null> {
    try {
      return loadAgent(agentPath)
    } catch (error) {
      reportDharmaSyncError(`load agent (${companyId})`, error)
      return null
    }
  },

  async getSkills(companyId: string): Promise<SkillDoc[]> {
    try {
      const company = loadRequiredCompany(companyId)
      const skills: SkillDoc[] = []
      const skillPaths = company.metadata.skills?.entries || {}
      for (const [name, path] of Object.entries(skillPaths)) {
        try {
          const skill = loadSkill(path as string)
          if (skill) {
            skills.push(skill)
          }
        } catch (error) {
          reportDharmaSyncError(`load skill ${name} (${companyId})`, error)
        }
      }
      return skills
    } catch (error) {
      reportDharmaSyncError(`get skills (${companyId})`, error)
      return []
    }
  },

  async getProtocols(companyId: string): Promise<ProtocolDoc[]> {
    try {
      const company = loadRequiredCompany(companyId)
      const protocols: ProtocolDoc[] = []
      const protocolPaths = company.metadata.protocols?.entries || {}
      for (const [name, path] of Object.entries(protocolPaths)) {
        try {
          const protocol = loadProtocol(path as string)
          if (protocol) {
            protocols.push(protocol)
          }
        } catch (error) {
          reportDharmaSyncError(`load protocol ${name} (${companyId})`, error)
        }
      }
      return protocols
    } catch (error) {
      reportDharmaSyncError(`get protocols (${companyId})`, error)
      return []
    }
  },

  async getWorkflows(companyId: string): Promise<WorkflowDefinition[]> {
    try {
      const company = loadRequiredCompany(companyId)
      const workflows: WorkflowDefinition[] = []
      const workflowPaths = company.metadata.workflows?.entries || {}
      for (const [name, path] of Object.entries(workflowPaths)) {
        try {
          const workflow = loadWorkflow(path as string)
          if (workflow) {
            workflows.push(workflow)
          }
        } catch (error) {
          reportDharmaSyncError(`load workflow ${name} (${companyId})`, error)
        }
      }
      return workflows
    } catch (error) {
      reportDharmaSyncError(`get workflows (${companyId})`, error)
      return []
    }
  },

  async getKpis(companyId: string): Promise<KpiDefinition[]> {
    try {
      const company = loadRequiredCompany(companyId)
      const kpis: KpiDefinition[] = []
      const kpiPaths = company.metadata.kpis?.entries || {}
      for (const [name, path] of Object.entries(kpiPaths)) {
        try {
          const kpi = loadKpi(path as string)
          if (kpi) {
            kpis.push(kpi)
          }
        } catch (error) {
          reportDharmaSyncError(`load kpi ${name} (${companyId})`, error)
        }
      }
      return kpis
    } catch (error) {
      reportDharmaSyncError(`get kpis (${companyId})`, error)
      return []
    }
  },

  async getDataInputs(companyId: string): Promise<DataInputDefinition[]> {
    try {
      const company = loadRequiredCompany(companyId)
      const dataInputs: DataInputDefinition[] = []
      const inputPaths = company.metadata.dataInputs?.entries || {}
      for (const [name, path] of Object.entries(inputPaths)) {
        try {
          const input = loadDataInput(path as string)
          if (input) {
            dataInputs.push(input)
          }
        } catch (error) {
          reportDharmaSyncError(`load data input ${name} (${companyId})`, error)
        }
      }
      return dataInputs
    } catch (error) {
      reportDharmaSyncError(`get data inputs (${companyId})`, error)
      return []
    }
  },

  async getAgentsSyncStatus(companyId: string): Promise<Record<string, DharmaSyncStatus>> {
    return getSyncStatus(companyId, 'agents')
  },

  async getSkillsSyncStatus(companyId: string): Promise<Record<string, DharmaSyncStatus>> {
    return getSyncStatus(companyId, 'skills')
  },

  async getProtocolsSyncStatus(companyId: string): Promise<Record<string, DharmaSyncStatus>> {
    return getSyncStatus(companyId, 'protocols')
  },

  async getWorkflowsSyncStatus(companyId: string): Promise<Record<string, DharmaSyncStatus>> {
    return getSyncStatus(companyId, 'workflows')
  },

  async getKpisSyncStatus(companyId: string): Promise<Record<string, DharmaSyncStatus>> {
    return getSyncStatus(companyId, 'kpis')
  },

  async getDataInputsSyncStatus(companyId: string): Promise<Record<string, DharmaSyncStatus>> {
    return getSyncStatus(companyId, 'data-inputs')
  },

  async getProductsSyncStatus(companyId: string): Promise<Record<string, DharmaSyncStatus>> {
    return getSyncStatus(companyId, 'products')
  },

  async syncAgentToCache(companyId: string, agent: AgentDefinition): Promise<SyncResult> {
    return syncDocumentToCache({
      companyId,
      category: 'agents',
      entityId: agent.uid,
      document: agent,
      cachePath: `dhi/companies/${companyId}/cache/agents/${agent.uid}.json`
    })
  },

  async syncSkillToCache(companyId: string, skill: SkillDoc): Promise<SyncResult> {
    const entityId = skill.id || skill.name
    return syncDocumentToCache({
      companyId,
      category: 'skills',
      entityId,
      document: skill,
      cachePath: `dhi/companies/${companyId}/cache/skills/${entityId}.json`
    })
  },

  async syncProtocolToCache(companyId: string, protocol: ProtocolDoc): Promise<SyncResult> {
    const entityId = protocol.id || protocol.name
    return syncDocumentToCache({
      companyId,
      category: 'protocols',
      entityId,
      document: protocol,
      cachePath: `dhi/companies/${companyId}/cache/protocols/${entityId}.json`
    })
  },

  async syncWorkflowToCache(companyId: string, workflow: WorkflowDefinition): Promise<SyncResult> {
    const entityId = workflow.id || workflow.name
    return syncDocumentToCache({
      companyId,
      category: 'workflows',
      entityId,
      document: workflow,
      cachePath: `dhi/companies/${companyId}/cache/workflows/${entityId}.json`
    })
  },

  async syncKpiToCache(companyId: string, kpi: KpiDefinition): Promise<SyncResult> {
    const entityId = kpi.id || kpi.name
    return syncDocumentToCache({
      companyId,
      category: 'kpis',
      entityId,
      document: kpi,
      cachePath: `dhi/companies/${companyId}/cache/kpis/${entityId}.json`
    })
  },

  async syncDataInputToCache(
    companyId: string,
    dataInput: DataInputDefinition
  ): Promise<SyncResult> {
    const entityId = dataInput.id || dataInput.name
    return syncDocumentToCache({
      companyId,
      category: 'data-inputs',
      entityId,
      document: dataInput,
      cachePath: `dhi/companies/${companyId}/cache/data-inputs/${entityId}.json`
    })
  },

  async syncProductToCache(companyId: string, product: ProductDetails): Promise<SyncResult> {
    const entityId = product.id || product.name
    return syncDocumentToCache({
      companyId,
      category: 'products',
      entityId,
      document: product,
      cachePath: `dhi/companies/${companyId}/cache/products/${entityId}.json`
    })
  },

  async saveAgentToVault(companyId: string, agent: AgentDefinition): Promise<SaveResult> {
    return saveDocumentToVault({
      companyId,
      category: 'agents',
      entityId: agent.uid,
      document: agent,
      vaultPath: `dhi/companies/${companyId}/agents/${agent.uid}.json`,
      flushLabel: `sync: save agent ${agent.uid}`
    })
  },

  async saveSkillToVault(companyId: string, skill: SkillDoc): Promise<SaveResult> {
    const entityId = skill.id || skill.name
    return saveDocumentToVault({
      companyId,
      category: 'skills',
      entityId,
      document: skill,
      vaultPath: `dhi/companies/${companyId}/skills/${entityId}.json`,
      flushLabel: `sync: save skill ${entityId}`
    })
  },

  async saveProtocolToVault(companyId: string, protocol: ProtocolDoc): Promise<SaveResult> {
    const entityId = protocol.id || protocol.name
    return saveDocumentToVault({
      companyId,
      category: 'protocols',
      entityId,
      document: protocol,
      vaultPath: `dhi/companies/${companyId}/protocols/${entityId}.json`,
      flushLabel: `sync: save protocol ${entityId}`
    })
  },

  async saveWorkflowToVault(companyId: string, workflow: WorkflowDefinition): Promise<SaveResult> {
    const entityId = workflow.id || workflow.name
    return saveDocumentToVault({
      companyId,
      category: 'workflows',
      entityId,
      document: workflow,
      vaultPath: `dhi/companies/${companyId}/workflows/${entityId}.json`,
      flushLabel: `sync: save workflow ${entityId}`
    })
  },

  async saveKpiToVault(companyId: string, kpi: KpiDefinition): Promise<SaveResult> {
    const entityId = kpi.id || kpi.name
    return saveDocumentToVault({
      companyId,
      category: 'kpis',
      entityId,
      document: kpi,
      vaultPath: `dhi/companies/${companyId}/kpis/${entityId}.json`,
      flushLabel: `sync: save kpi ${entityId}`
    })
  },

  async saveDataInputToVault(
    companyId: string,
    dataInput: DataInputDefinition
  ): Promise<SaveResult> {
    const entityId = dataInput.id || dataInput.name
    return saveDocumentToVault({
      companyId,
      category: 'data-inputs',
      entityId,
      document: dataInput,
      vaultPath: `dhi/companies/${companyId}/data-inputs/${entityId}.json`,
      flushLabel: `sync: save data input ${entityId}`
    })
  },

  async saveProductToVault(companyId: string, product: ProductDetails): Promise<SaveResult> {
    const entityId = product.id || product.name
    return saveDocumentToVault({
      companyId,
      category: 'products',
      entityId,
      document: product,
      vaultPath: `dhi/companies/${companyId}/products/${entityId}.json`,
      flushLabel: `sync: save product ${entityId}`
    })
  }
}
