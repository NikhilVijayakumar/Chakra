import { contextBridge } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  app: {
    checkHostDependencies: () => electronAPI.ipcRenderer.invoke('app:check-host-dependencies'),
    getBootstrapConfig: () => electronAPI.ipcRenderer.invoke('app:get-bootstrap-config'),
    bootstrapHost: (payload?: { config?: unknown }) =>
      electronAPI.ipcRenderer.invoke('app:bootstrap-host', payload),
    getRuntimeConfig: () => electronAPI.ipcRenderer.invoke('app:get-runtime-config'),
    getBrandingConfig: () => electronAPI.ipcRenderer.invoke('app:get-branding-config'),
    getIntegrationStatus: () => electronAPI.ipcRenderer.invoke('app:get-integration-status'),
    getStartupStatus: () => electronAPI.ipcRenderer.invoke('app:get-startup-status'),
    getHostDependencyStatus: async () => {
      const startupStatus = await electronAPI.ipcRenderer.invoke('app:get-startup-status')
      const stages = Array.isArray(startupStatus?.stages) ? startupStatus.stages : []
      const dependencyStage = stages.find(
        (stage: any) => stage?.id === 'host-dependencies' || stage?.stage === 'host-dependencies'
      )
      const status = dependencyStage?.status ?? 'UNKNOWN'
      return {
        passed: status === 'SUCCESS' || status === 'READY',
        status,
        message:
          dependencyStage?.message ?? 'Host dependency capability status is not available yet.'
      }
    },
    getVaidyarReport: () => electronAPI.ipcRenderer.invoke('app:get-vaidyar-report'),
    runVaidyarPulse: () => electronAPI.ipcRenderer.invoke('app:run-vaidyar-pulse'),
    runVaidyarOnDemand: () => electronAPI.ipcRenderer.invoke('app:run-vaidyar-on-demand'),
    getVaidyarTelemetry: () => electronAPI.ipcRenderer.invoke('app:get-vaidyar-telemetry'),
    onStartupProgress: (callback: (data: unknown) => void) => {
      const listener = (_event: unknown, data: unknown) => callback(data)
      electronAPI.ipcRenderer.on('app:startup-progress', listener)
      return () => electronAPI.ipcRenderer.removeListener('app:startup-progress', listener)
    }
  },
  auth: {
    getStatus: () => electronAPI.ipcRenderer.invoke('auth:get-status'),
    login: (email: string, password: string) =>
      electronAPI.ipcRenderer.invoke('auth:login', { email, password }),
    forgotPassword: (email: string) =>
      electronAPI.ipcRenderer.invoke('auth:forgot-password', { email }),
    resetPassword: (newPassword: string) =>
      electronAPI.ipcRenderer.invoke('auth:reset-password', { newPassword })
  },
  settings: {
    load: () => electronAPI.ipcRenderer.invoke('settings:load'),
    save: (payload: {
      language: string
      preferredModelProvider: 'lmstudio' | 'openrouter' | 'gemini'
      themeMode: 'system' | 'light' | 'dark'
      reducedMotion: boolean
      syncPushIntervalMs?: number
      syncCronEnabled?: boolean
      syncPushCronEnabled?: boolean
      syncPullCronEnabled?: boolean
      syncPushCronExpression?: string
      syncPullCronExpression?: string
      syncHealthAutoRefreshEnabled?: boolean
      syncHealthAutoRefreshIntervalMs?: number
    }) => electronAPI.ipcRenderer.invoke('settings:save', payload)
  },
  sync: {
    getStatus: () => electronAPI.ipcRenderer.invoke('sync:get-status'),
    pushNow: () => electronAPI.ipcRenderer.invoke('sync:push-now'),
    pullNow: () => electronAPI.ipcRenderer.invoke('sync:pull-now')
  },
  vault: {
    listFiles: () => electronAPI.ipcRenderer.invoke('vault:list-files'),
    selectAndIngest: () => electronAPI.ipcRenderer.invoke('vault:select-and-ingest'),
    publish: (message?: string, approvedByUser = false) =>
      electronAPI.ipcRenderer.invoke('vault:publish', { message, approvedByUser }),
    createSnapshot: (label?: string) =>
      electronAPI.ipcRenderer.invoke('vault:create-snapshot', { label }),
    resumeFromSnapshot: (snapshotPath: string) =>
      electronAPI.ipcRenderer.invoke('vault:resume-from-snapshot', { snapshotPath })
  },
  vaultKnowledge: {
    getSnapshot: () => electronAPI.ipcRenderer.invoke('vault-knowledge:get-snapshot'),
    readFile: (relativePath: string) =>
      electronAPI.ipcRenderer.invoke('vault-knowledge:read-file', { relativePath }),
    approve: (relativePath: string) =>
      electronAPI.ipcRenderer.invoke('vault-knowledge:approve', { relativePath }),
    reject: (relativePath: string) =>
      electronAPI.ipcRenderer.invoke('vault-knowledge:reject', { relativePath })
  },
  modelGateway: {
    probe: () => electronAPI.ipcRenderer.invoke('model-gateway:probe')
  },
  contextEngine: {
    bootstrap: (
      sessionId: string,
      budget?: {
        maxTokens?: number
        reservedOutputTokens?: number
        compactThresholdTokens?: number
        highWaterMarkRatio?: number
      },
      modelConfig?: { provider: 'lmstudio' | 'openrouter' | 'gemini'; model?: string }
    ) =>
      electronAPI.ipcRenderer.invoke('context-engine:bootstrap', {
        sessionId,
        budget,
        modelConfig
      }),
    ingest: (sessionId: string, role: 'system' | 'user' | 'assistant' | 'tool', content: string) =>
      electronAPI.ipcRenderer.invoke('context-engine:ingest', { sessionId, role, content }),
    ingestBatch: (
      sessionId: string,
      messages: Array<{ role: 'system' | 'user' | 'assistant' | 'tool'; content: string }>
    ) => electronAPI.ipcRenderer.invoke('context-engine:ingest-batch', { sessionId, messages }),
    assemble: (sessionId: string, maxTokensOverride?: number) =>
      electronAPI.ipcRenderer.invoke('context-engine:assemble', { sessionId, maxTokensOverride }),
    compact: (sessionId: string, reason?: string) =>
      electronAPI.ipcRenderer.invoke('context-engine:compact', { sessionId, reason }),
    afterTurn: (sessionId: string) =>
      electronAPI.ipcRenderer.invoke('context-engine:after-turn', { sessionId }),
    prepareNewContext: (sessionId: string) =>
      electronAPI.ipcRenderer.invoke('context-engine:prepare-new-context', { sessionId }),
    startNewWithContext: (
      sourceSessionId: string,
      targetSessionId: string,
      summaryOverride?: string
    ) =>
      electronAPI.ipcRenderer.invoke('context-engine:start-new-with-context', {
        sourceSessionId,
        targetSessionId,
        summaryOverride
      }),
    getLatestDigest: (sessionId: string) =>
      electronAPI.ipcRenderer.invoke('context-engine:get-latest-digest', { sessionId }),
    listDigests: (sessionId: string, limit?: number) =>
      electronAPI.ipcRenderer.invoke('context-engine:list-digests', { sessionId, limit }),
    prepareSubagentSpawn: (parentSessionId: string, childSessionId: string) =>
      electronAPI.ipcRenderer.invoke('context-engine:prepare-subagent-spawn', {
        parentSessionId,
        childSessionId
      }),
    onSubagentEnded: (parentSessionId: string, childSessionId: string, summary: string) =>
      electronAPI.ipcRenderer.invoke('context-engine:on-subagent-ended', {
        parentSessionId,
        childSessionId,
        summary
      }),
    getSession: (sessionId: string) =>
      electronAPI.ipcRenderer.invoke('context-engine:get-session', { sessionId }),
    listSessions: () => electronAPI.ipcRenderer.invoke('context-engine:list-sessions'),
    getTelemetry: () => electronAPI.ipcRenderer.invoke('context-engine:get-telemetry'),
    dispose: (sessionId: string) =>
      electronAPI.ipcRenderer.invoke('context-engine:dispose', { sessionId })
  },
  subagents: {
    spawn: (payload: {
      agentName: string
      model?: string
      parentId?: string
      parentSessionId?: string
      sessionId?: string
      approvedByUser?: boolean
    }) => electronAPI.ipcRenderer.invoke('subagents:spawn', payload),
    heartbeat: (id: string) => electronAPI.ipcRenderer.invoke('subagents:heartbeat', { id }),
    complete: (id: string, summary?: string) =>
      electronAPI.ipcRenderer.invoke('subagents:complete', { id, summary }),
    fail: (id: string, error?: string) =>
      electronAPI.ipcRenderer.invoke('subagents:fail', { id, error }),
    cancel: (id: string, summary?: string) =>
      electronAPI.ipcRenderer.invoke('subagents:cancel', { id, summary }),
    timeoutSweep: (timeoutMs?: number) =>
      electronAPI.ipcRenderer.invoke('subagents:timeout-sweep', { timeoutMs }),
    list: () => electronAPI.ipcRenderer.invoke('subagents:list'),
    get: (id: string) => electronAPI.ipcRenderer.invoke('subagents:get', { id }),
    tree: () => electronAPI.ipcRenderer.invoke('subagents:tree'),
    telemetry: () => electronAPI.ipcRenderer.invoke('subagents:telemetry'),
    dispose: (id: string) => electronAPI.ipcRenderer.invoke('subagents:dispose', { id })
  },
  toolPolicy: {
    evaluate: (payload: {
      actor: string
      action: string
      target?: string
      approvedByUser?: boolean
      metadata?: Record<string, unknown>
    }) => electronAPI.ipcRenderer.invoke('tool-policy:evaluate', payload),
    listAudits: () => electronAPI.ipcRenderer.invoke('tool-policy:list-audits'),
    getTelemetry: () => electronAPI.ipcRenderer.invoke('tool-policy:get-telemetry')
  },
  hooks: {
    list: () => electronAPI.ipcRenderer.invoke('hooks:list'),
    setEnabled: (hookId: string, enabled: boolean) =>
      electronAPI.ipcRenderer.invoke('hooks:set-enabled', { hookId, enabled }),
    telemetry: () => electronAPI.ipcRenderer.invoke('hooks:get-telemetry'),
    executions: (limit?: number) =>
      electronAPI.ipcRenderer.invoke('hooks:get-executions', { limit }),
    notifications: (limit?: number) =>
      electronAPI.ipcRenderer.invoke('hooks:get-notifications', { limit }),
    emit: (
      event:
        | 'session.bootstrap'
        | 'session.message'
        | 'session.afterTurn'
        | 'schedule.tick'
        | 'vault.ingested'
        | 'vault.pending.approved'
        | 'vault.pending.rejected',
      data?: Record<string, unknown>,
      wait = false
    ) => electronAPI.ipcRenderer.invoke('hooks:emit', { event, data, wait }),
    events: () => electronAPI.ipcRenderer.invoke('hooks:events')
  },
  cron: {
    list: () => electronAPI.ipcRenderer.invoke('cron:list'),
    upsert: (payload: {
      id: string
      name: string
      expression: string
      target?: string
      recoveryPolicy?: 'SKIP' | 'RUN_ONCE' | 'CATCH_UP'
      enabled?: boolean
      retentionDays?: number
      maxRuntimeMs?: number
    }) => electronAPI.ipcRenderer.invoke('cron:upsert', payload),
    remove: (payload: { id: string } | string) =>
      electronAPI.ipcRenderer.invoke(
        'cron:remove',
        typeof payload === 'string' ? { id: payload } : payload
      ),
    pause: (payload: { id: string } | string) =>
      electronAPI.ipcRenderer.invoke(
        'cron:pause',
        typeof payload === 'string' ? { id: payload } : payload
      ),
    resume: (payload: { id: string } | string) =>
      electronAPI.ipcRenderer.invoke(
        'cron:resume',
        typeof payload === 'string' ? { id: payload } : payload
      ),
    runNow: (payload: { id: string } | string) =>
      electronAPI.ipcRenderer.invoke(
        'cron:run-now',
        typeof payload === 'string' ? { id: payload } : payload
      ),
    tick: () => electronAPI.ipcRenderer.invoke('cron:tick'),
    telemetry: () => electronAPI.ipcRenderer.invoke('cron:telemetry')
  },
  memory: {
    query: (payload: {
      query: string
      limit?: number
      allowedClassifications?: Array<'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'RESTRICTED'>
      pathPrefixes?: string[]
    }) => electronAPI.ipcRenderer.invoke('memory:query', payload),
    indexText: (payload: {
      relativePath: string
      content: string
      classification?: 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'RESTRICTED'
    }) => electronAPI.ipcRenderer.invoke('memory:index-text', payload),
    reindexDirectory: (rootPath?: string) =>
      electronAPI.ipcRenderer.invoke('memory:reindex-directory', { rootPath }),
    removePath: (relativePath: string) =>
      electronAPI.ipcRenderer.invoke('memory:remove-path', { relativePath }),
    health: () => electronAPI.ipcRenderer.invoke('memory:health')
  },
  skills: {
    list: () => electronAPI.ipcRenderer.invoke('skills:list'),
    execute: (skillId: string) => electronAPI.ipcRenderer.invoke('skills:execute', { skillId }),
    getRegistry: () => electronAPI.ipcRenderer.invoke('skills:get-registry'),
    getAgentSkills: (agentId: string) =>
      electronAPI.ipcRenderer.invoke('skills:get-agent-skills', { agentId }),
    getTypeSkills: (type: 'Skill' | 'Rule' | 'Script' | 'Tool') =>
      electronAPI.ipcRenderer.invoke('skills:get-type-skills', { type }),
    getTagSkills: (tag: string) => electronAPI.ipcRenderer.invoke('skills:get-tag-skills', { tag })
  },
  registry: {
    getSnapshot: () => electronAPI.ipcRenderer.invoke('registry:get-snapshot'),
    reload: () => electronAPI.ipcRenderer.invoke('registry:reload'),
    getVersion: () => electronAPI.ipcRenderer.invoke('registry:get-version'),
    getOnboardingBlueprint: () =>
      electronAPI.ipcRenderer.invoke('registry:get-onboarding-blueprint'),
    searchFiles: (payload?: { keyword?: string; section?: string; extensions?: string[] }) =>
      electronAPI.ipcRenderer.invoke('registry:search-files', payload),
    readFile: (relativePath: string) =>
      electronAPI.ipcRenderer.invoke('registry:read-file', { relativePath }),
    saveMarkdown: (payload: { relativePath: string; content: string }) =>
      electronAPI.ipcRenderer.invoke('registry:save-markdown', payload),
    uploadFile: (payload: { relativeDir: string; fileName: string; content: string }) =>
      electronAPI.ipcRenderer.invoke('registry:upload-file', payload)
  },
  providers: {
    listProviders: () => electronAPI.ipcRenderer.invoke('providers:list'),
    setMasterPassword: (password: string) =>
      electronAPI.ipcRenderer.invoke('providers:set-master-password', { password }),
    configureProvider: (
      type: 'lm-studio' | 'openrouter' | 'gemini-cli',
      config: Record<string, unknown>
    ) => electronAPI.ipcRenderer.invoke('providers:configure', { type, config }),
    enableProvider: (type: 'lm-studio' | 'openrouter' | 'gemini-cli') =>
      electronAPI.ipcRenderer.invoke('providers:enable', { type }),
    disableProvider: (type: 'lm-studio' | 'openrouter' | 'gemini-cli') =>
      electronAPI.ipcRenderer.invoke('providers:disable', { type }),
    validateProvider: (type: 'lm-studio' | 'openrouter' | 'gemini-cli') =>
      electronAPI.ipcRenderer.invoke('providers:validate', { type }),
    getMetrics: (type: 'lm-studio' | 'openrouter' | 'gemini-cli') =>
      electronAPI.ipcRenderer.invoke('providers:get-metrics', { type })
  },
  operations: {
    getQueueMonitor: () => electronAPI.ipcRenderer.invoke('operations:get-queue-monitor'),
    getNotifications: () => electronAPI.ipcRenderer.invoke('operations:get-notifications'),
    getDailyBrief: () => electronAPI.ipcRenderer.invoke('operations:get-daily-brief'),
    getWeeklyReview: () => electronAPI.ipcRenderer.invoke('operations:get-weekly-review'),
    getGovernance: () => electronAPI.ipcRenderer.invoke('operations:get-governance'),
    runGovernanceAction: (decisionId: string, action: 'APPROVE' | 'REJECT' | 'DEFER' | 'COMMIT') =>
      electronAPI.ipcRenderer.invoke('operations:governance-action', { decisionId, action }),
    getCompliance: () => electronAPI.ipcRenderer.invoke('operations:get-compliance'),
    getTriage: () => electronAPI.ipcRenderer.invoke('operations:get-triage'),
    runTriageAction: (itemId: string, action: 'ANALYZE' | 'CLEAR') =>
      electronAPI.ipcRenderer.invoke('operations:triage-action', { itemId, action }),
    getSuites: () => electronAPI.ipcRenderer.invoke('operations:get-suites'),
    getFundingDigest: () => electronAPI.ipcRenderer.invoke('operations:get-funding-digest'),
    getHiringSim: () => electronAPI.ipcRenderer.invoke('operations:get-hiring-sim'),
    getDesignAudit: () => electronAPI.ipcRenderer.invoke('operations:get-design-audit'),
    getDashboard: () => electronAPI.ipcRenderer.invoke('operations:get-dashboard'),
    getInfrastructure: () => electronAPI.ipcRenderer.invoke('operations:get-infrastructure'),
    getOnboardingKpis: () => electronAPI.ipcRenderer.invoke('operations:get-onboarding-kpis'),
    getOnboardingCommitStatus: () =>
      electronAPI.ipcRenderer.invoke('operations:get-onboarding-commit-status'),
    getOnboardingStageSnapshot: () =>
      electronAPI.ipcRenderer.invoke('operations:get-onboarding-stage-snapshot'),
    saveOnboardingStageSnapshot: (payload: {
      phases: Record<
        string,
        {
          status: 'PENDING' | 'DRAFT' | 'APPROVED'
          contextByKey: Record<string, string>
          requiresReverification: boolean
        }
      >
      currentStep: number
      modelAccess?: Record<string, unknown>
    }) => electronAPI.ipcRenderer.invoke('operations:save-onboarding-stage-snapshot', payload),
    generateOnboardingKpis: () =>
      electronAPI.ipcRenderer.invoke('operations:generate-onboarding-kpis'),
    removeOnboardingKpi: (agentId: string, kpiId: string) =>
      electronAPI.ipcRenderer.invoke('operations:remove-onboarding-kpi', { agentId, kpiId }),
    commitOnboarding: (payload: {
      kpiData: Record<string, string>
      contextByStep: Record<string, Record<string, string>>
      approvalByStep: Record<string, 'PENDING' | 'DRAFT' | 'APPROVED'>
      agentMappings: Record<
        string,
        {
          skills: string[]
          protocols: string[]
          kpis: string[]
          workflows: string[]
        }
      >
    }) => electronAPI.ipcRenderer.invoke('operations:commit-onboarding', payload),
    getEmployeeProfile: (employeeId: string) =>
      electronAPI.ipcRenderer.invoke('operations:get-employee-profile', { employeeId }),
    getLifecycleSnapshot: () => electronAPI.ipcRenderer.invoke('operations:get-lifecycle-snapshot'),
    listLifecycleDrafts: (status?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'OVERRIDDEN') =>
      electronAPI.ipcRenderer.invoke('operations:list-lifecycle-drafts', { status }),
    reviewLifecycleDraft: (payload: {
      draftId: string
      status: 'APPROVED' | 'REJECTED' | 'OVERRIDDEN'
      reviewer: string
      reviewNote?: string
    }) => electronAPI.ipcRenderer.invoke('operations:review-lifecycle-draft', payload),
    updateLifecycleProfile: (payload: {
      agentId: string
      goal: string
      backstory: string
      skills: string[]
      kpis: string[]
    }) => electronAPI.ipcRenderer.invoke('operations:update-lifecycle-profile', payload),
    updateLifecycleSkill: (payload: { skillId: string; markdown: string }) =>
      electronAPI.ipcRenderer.invoke('operations:update-lifecycle-skill', payload),
    updateLifecycleKpi: (payload: { kpiId: string; target: string; value?: string }) =>
      electronAPI.ipcRenderer.invoke('operations:update-lifecycle-kpi', payload),
    updateLifecycleDataInput: (payload: {
      dataInputId: string
      fileName: string
      content: string
    }) => electronAPI.ipcRenderer.invoke('operations:update-lifecycle-data-input', payload),
    createLifecycleDataInput: (payload: {
      dataInputId: string
      name: string
      description: string
      schemaType: string
      requiredFields: string[]
      sampleSource: string
      fileName?: string
      content?: string
    }) => electronAPI.ipcRenderer.invoke('operations:create-lifecycle-data-input', payload),
    createCronProposal: (payload: {
      id: string
      name: string
      expression: string
      retentionDays?: number
      maxRuntimeMs?: number
    }) => electronAPI.ipcRenderer.invoke('operations:create-cron-proposal', payload),
    listCronProposals: (payload?: {
      status?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'OVERRIDDEN'
    }) => electronAPI.ipcRenderer.invoke('operations:list-cron-proposals', payload),
    reviewCronProposal: (payload: {
      proposalId: string
      status: 'APPROVED' | 'REJECTED' | 'OVERRIDDEN'
      reviewer: string
      reviewNote?: string
    }) => electronAPI.ipcRenderer.invoke('operations:review-cron-proposal', payload),
    getTaskAuditLog: (limit?: number) =>
      electronAPI.ipcRenderer.invoke('operations:get-task-audit-log', { limit }),
    getRuntimeChannelConfiguration: () =>
      electronAPI.ipcRenderer.invoke('operations:get-runtime-channel-configuration'),
    updateRuntimeChannelConfiguration: (payload: {
      provider: string
      allowedChannels: string[]
      approvedAgentsForChannels: Record<string, string[]>
      channelAccessRules: string
      telegramChannelId: string
      webhookSubscriptionUri: string
      providerCredentials: string
    }) =>
      electronAPI.ipcRenderer.invoke('operations:update-runtime-channel-configuration', payload),
    getAdministrationIntegrationSnapshot: () =>
      electronAPI.ipcRenderer.invoke('operations:get-administration-integration-snapshot'),
    syncAdministrationStaffRegistry: () =>
      electronAPI.ipcRenderer.invoke('operations:sync-administration-staff-registry'),
    ingestAdministrationFeedback: () =>
      electronAPI.ipcRenderer.invoke('operations:ingest-administration-feedback'),
    convertDocumentContent: (payload: {
      sourceFormat: 'markdown' | 'html' | 'docx'
      targetFormat: 'markdown' | 'html' | 'docx'
      content: string
    }) => electronAPI.ipcRenderer.invoke('operations:convert-document-content', payload),
    convertDocumentFile: (payload: {
      inputPath: string
      outputPath: string
      sourceFormat?: 'markdown' | 'html' | 'docx'
      targetFormat: 'markdown' | 'html' | 'docx'
    }) => electronAPI.ipcRenderer.invoke('operations:convert-document-file', payload),
    runAdministrationKpiHappinessEvaluator: () =>
      electronAPI.ipcRenderer.invoke('operations:run-administration-kpi-happiness-evaluator'),
    runAdministrationSocialTrendIntelligence: () =>
      electronAPI.ipcRenderer.invoke('operations:run-administration-social-trend-intelligence'),
    getGoogleBridgeSnapshot: () =>
      electronAPI.ipcRenderer.invoke('operations:get-google-bridge-snapshot'),
    runGoogleDriveSync: (payload?: { source?: 'MANUAL' | 'CRON' }) =>
      electronAPI.ipcRenderer.invoke('operations:run-google-drive-sync', payload),
    ensureGoogleDriveSyncSchedule: () =>
      electronAPI.ipcRenderer.invoke('operations:ensure-google-drive-sync-schedule'),
    publishGooglePolicyDocument: (payload: { policyId: string; htmlContent: string }) =>
      electronAPI.ipcRenderer.invoke('operations:publish-google-policy-document', payload),
    pullGoogleDocumentToVault: (payload: { documentId: string; vaultTargetPath: string }) =>
      electronAPI.ipcRenderer.invoke('operations:pull-google-document-to-vault', payload)
  },
  channels: {
    routeMessage: (payload: {
      senderId: string
      senderName?: string
      channelId: string
      roomId: string
      accountId?: string
      messageText: string
      timestampIso?: string
      sessionId?: string
      explicitTargetPersonaId?: string
      isDirector?: boolean
      dataClassification?: 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'RESTRICTED'
      metadata?: Record<string, unknown>
    }) => electronAPI.ipcRenderer.invoke('channels:route-message', payload),
    getCapabilities: () => electronAPI.ipcRenderer.invoke('channels:get-capabilities'),
    routeInternalMessage: (payload: {
      message: string
      senderId: string
      senderName?: string
      moduleRoute: string
      targetPersonaId?: string
      roomId?: string
      sessionId?: string
      timestampIso?: string
      isDirector?: boolean
      metadata?: Record<string, unknown>
    }) => electronAPI.ipcRenderer.invoke('channels:route-internal-message', payload),
    routeTelegramMessage: (payload: {
      message: string
      senderId: string
      senderName?: string
      chatId?: string
      timestampIso?: string
      sessionId?: string
      explicitTargetPersonaId?: string
      isDirector?: boolean
      dataClassification?: 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'RESTRICTED'
      metadata?: Record<string, unknown>
    }) => electronAPI.ipcRenderer.invoke('channels:route-telegram-message', payload),
    listConversations: (payload?: {
      channel?: 'internal-chat' | 'telegram' | 'whatsapp' | 'webhook' | 'api' | string
      limit?: number
    }) => electronAPI.ipcRenderer.invoke('channels:list-conversations', payload),
    getConversationHistory: (payload: { conversationKey: string; limit?: number }) =>
      electronAPI.ipcRenderer.invoke('channels:get-conversation-history', payload),
    onEscalation: (
      callback: (event: unknown, payload: { taskId: string; reason: string }) => void
    ) => {
      electronAPI.ipcRenderer.on('app:escalation-required', callback)
      return () => electronAPI.ipcRenderer.removeListener('app:escalation-required', callback)
    },
    clearEscalation: (payload: { taskId: string }) =>
      electronAPI.ipcRenderer.invoke('app:escalation-cleared', payload)
  },
  workOrders: {
    submitDirectorRequest: (payload: {
      moduleRoute: string
      targetEmployeeId?: string
      message: string
      timestampIso?: string
    }) => electronAPI.ipcRenderer.invoke('work-orders:submit-director-request', payload),
    startNext: () => electronAPI.ipcRenderer.invoke('work-orders:start-next'),
    processNext: () => electronAPI.ipcRenderer.invoke('work-orders:process-next'),
    complete: (workOrderId: string, summary?: string) =>
      electronAPI.ipcRenderer.invoke('work-orders:complete', { workOrderId, summary }),
    fail: (workOrderId: string, error?: string) =>
      electronAPI.ipcRenderer.invoke('work-orders:fail', { workOrderId, error }),
    approve: (workOrderId: string, summary?: string) =>
      electronAPI.ipcRenderer.invoke('work-orders:approve', { workOrderId, summary }),
    reject: (workOrderId: string, error?: string) =>
      electronAPI.ipcRenderer.invoke('work-orders:reject', { workOrderId, error }),
    list: () => electronAPI.ipcRenderer.invoke('work-orders:list'),
    get: (id: string) => electronAPI.ipcRenderer.invoke('work-orders:get', { id }),
    queueList: () => electronAPI.ipcRenderer.invoke('work-orders:queue-list')
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}