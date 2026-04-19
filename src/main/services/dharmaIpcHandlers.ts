import { ipcMain } from 'electron'
import { dharmaSyncService } from './dharmaSyncService'

export const registerDharmaIpcHandlers = (): void => {
  ipcMain.handle('dharma:get-companies', async () => {
    return dharmaSyncService.getCompanies()
  })

  ipcMain.handle('dharma:get-company', async (_event, { companyId }: { companyId: string }) => {
    return dharmaSyncService.getCompany(companyId)
  })

  ipcMain.handle('dharma:get-active-company', async () => {
    return dharmaSyncService.getActiveCompany()
  })

  ipcMain.handle(
    'dharma:set-active-company',
    async (_event, { companyId }: { companyId: string }) => {
      return dharmaSyncService.setActiveCompany(companyId)
    }
  )

  ipcMain.handle('dharma:get-agents', async (_event, { companyId }: { companyId: string }) => {
    return dharmaSyncService.getAgents(companyId)
  })

  ipcMain.handle(
    'dharma:get-agent',
    async (_event, { companyId, agentPath }: { companyId: string; agentPath: string }) => {
      return dharmaSyncService.getAgent(companyId, agentPath)
    }
  )

  ipcMain.handle('dharma:get-skills', async (_event, { companyId }: { companyId: string }) => {
    return dharmaSyncService.getSkills(companyId)
  })

  ipcMain.handle('dharma:get-protocols', async (_event, { companyId }: { companyId: string }) => {
    return dharmaSyncService.getProtocols(companyId)
  })

  ipcMain.handle('dharma:get-workflows', async (_event, { companyId }: { companyId: string }) => {
    return dharmaSyncService.getWorkflows(companyId)
  })

  ipcMain.handle('dharma:get-kpis', async (_event, { companyId }: { companyId: string }) => {
    return dharmaSyncService.getKpis(companyId)
  })

  ipcMain.handle('dharma:get-data-inputs', async (_event, { companyId }: { companyId: string }) => {
    return dharmaSyncService.getDataInputs(companyId)
  })

  ipcMain.handle('dharma:get-products', async (_event, { companyId }: { companyId: string }) => {
    return dharmaSyncService.getProductCatalog(companyId)
  })

  ipcMain.handle(
    'dharma:get-product',
    async (_event, { companyId, productId }: { companyId: string; productId: string }) => {
      return dharmaSyncService.getProduct(companyId, productId)
    }
  )

  ipcMain.handle(
    'dharma:get-agents-sync-status',
    async (_event, { companyId }: { companyId: string }) => {
      return dharmaSyncService.getAgentsSyncStatus(companyId)
    }
  )

  ipcMain.handle(
    'dharma:get-skills-sync-status',
    async (_event, { companyId }: { companyId: string }) => {
      return dharmaSyncService.getSkillsSyncStatus(companyId)
    }
  )

  ipcMain.handle(
    'dharma:get-protocols-sync-status',
    async (_event, { companyId }: { companyId: string }) => {
      return dharmaSyncService.getProtocolsSyncStatus(companyId)
    }
  )

  ipcMain.handle(
    'dharma:get-workflows-sync-status',
    async (_event, { companyId }: { companyId: string }) => {
      return dharmaSyncService.getWorkflowsSyncStatus(companyId)
    }
  )

  ipcMain.handle(
    'dharma:get-kpis-sync-status',
    async (_event, { companyId }: { companyId: string }) => {
      return dharmaSyncService.getKpisSyncStatus(companyId)
    }
  )

  ipcMain.handle(
    'dharma:get-data-inputs-sync-status',
    async (_event, { companyId }: { companyId: string }) => {
      return dharmaSyncService.getDataInputsSyncStatus(companyId)
    }
  )

  ipcMain.handle(
    'dharma:get-products-sync-status',
    async (_event, { companyId }: { companyId: string }) => {
      return dharmaSyncService.getProductsSyncStatus(companyId)
    }
  )

  ipcMain.handle(
    'dharma:sync-agent-to-cache',
    async (_event, { companyId, agent }: { companyId: string; agent: unknown }) => {
      return dharmaSyncService.syncAgentToCache(
        companyId,
        agent as Parameters<typeof dharmaSyncService.syncAgentToCache>[1]
      )
    }
  )

  ipcMain.handle(
    'dharma:sync-skill-to-cache',
    async (_event, { companyId, skill }: { companyId: string; skill: unknown }) => {
      return dharmaSyncService.syncSkillToCache(
        companyId,
        skill as Parameters<typeof dharmaSyncService.syncSkillToCache>[1]
      )
    }
  )

  ipcMain.handle(
    'dharma:sync-protocol-to-cache',
    async (_event, { companyId, protocol }: { companyId: string; protocol: unknown }) => {
      return dharmaSyncService.syncProtocolToCache(
        companyId,
        protocol as Parameters<typeof dharmaSyncService.syncProtocolToCache>[1]
      )
    }
  )

  ipcMain.handle(
    'dharma:sync-workflow-to-cache',
    async (_event, { companyId, workflow }: { companyId: string; workflow: unknown }) => {
      return dharmaSyncService.syncWorkflowToCache(
        companyId,
        workflow as Parameters<typeof dharmaSyncService.syncWorkflowToCache>[1]
      )
    }
  )

  ipcMain.handle(
    'dharma:sync-kpi-to-cache',
    async (_event, { companyId, kpi }: { companyId: string; kpi: unknown }) => {
      return dharmaSyncService.syncKpiToCache(
        companyId,
        kpi as Parameters<typeof dharmaSyncService.syncKpiToCache>[1]
      )
    }
  )

  ipcMain.handle(
    'dharma:sync-data-input-to-cache',
    async (_event, { companyId, dataInput }: { companyId: string; dataInput: unknown }) => {
      return dharmaSyncService.syncDataInputToCache(
        companyId,
        dataInput as Parameters<typeof dharmaSyncService.syncDataInputToCache>[1]
      )
    }
  )

  ipcMain.handle(
    'dharma:sync-product-to-cache',
    async (_event, { companyId, product }: { companyId: string; product: unknown }) => {
      return dharmaSyncService.syncProductToCache(
        companyId,
        product as Parameters<typeof dharmaSyncService.syncProductToCache>[1]
      )
    }
  )

  ipcMain.handle(
    'dharma:save-agent-to-vault',
    async (_event, { companyId, agent }: { companyId: string; agent: unknown }) => {
      return dharmaSyncService.saveAgentToVault(
        companyId,
        agent as Parameters<typeof dharmaSyncService.saveAgentToVault>[1]
      )
    }
  )

  ipcMain.handle(
    'dharma:save-skill-to-vault',
    async (_event, { companyId, skill }: { companyId: string; skill: unknown }) => {
      return dharmaSyncService.saveSkillToVault(
        companyId,
        skill as Parameters<typeof dharmaSyncService.saveSkillToVault>[1]
      )
    }
  )

  ipcMain.handle(
    'dharma:save-protocol-to-vault',
    async (_event, { companyId, protocol }: { companyId: string; protocol: unknown }) => {
      return dharmaSyncService.saveProtocolToVault(
        companyId,
        protocol as Parameters<typeof dharmaSyncService.saveProtocolToVault>[1]
      )
    }
  )

  ipcMain.handle(
    'dharma:save-workflow-to-vault',
    async (_event, { companyId, workflow }: { companyId: string; workflow: unknown }) => {
      return dharmaSyncService.saveWorkflowToVault(
        companyId,
        workflow as Parameters<typeof dharmaSyncService.saveWorkflowToVault>[1]
      )
    }
  )

  ipcMain.handle(
    'dharma:save-kpi-to-vault',
    async (_event, { companyId, kpi }: { companyId: string; kpi: unknown }) => {
      return dharmaSyncService.saveKpiToVault(
        companyId,
        kpi as Parameters<typeof dharmaSyncService.saveKpiToVault>[1]
      )
    }
  )

  ipcMain.handle(
    'dharma:save-data-input-to-vault',
    async (_event, { companyId, dataInput }: { companyId: string; dataInput: unknown }) => {
      return dharmaSyncService.saveDataInputToVault(
        companyId,
        dataInput as Parameters<typeof dharmaSyncService.saveDataInputToVault>[1]
      )
    }
  )

  ipcMain.handle(
    'dharma:save-product-to-vault',
    async (_event, { companyId, product }: { companyId: string; product: unknown }) => {
      return dharmaSyncService.saveProductToVault(
        companyId,
        product as Parameters<typeof dharmaSyncService.saveProductToVault>[1]
      )
    }
  )

  console.log('[Dhi] Dharma IPC handlers registered')
}
