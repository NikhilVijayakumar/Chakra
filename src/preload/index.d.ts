import { ElectronAPI } from '@electron-toolkit/preload'

interface AuthStatus {
  sshVerified: boolean
  repoReady: boolean
  clonedNow: boolean
  sshMessage: string
  repoPath: string
  repoUrl: string
}

interface AuthLoginResult {
  success: boolean
  reason?: 'invalid_credentials' | 'email_mismatch' | 'ssh_unavailable'
  directorName?: string
  email?: string
  isFirstInstall?: boolean
  sessionToken?: string
}

interface RuntimeConfig {
  directorName: string
  directorEmail: string
  governanceRepoUrl: string
  governanceRepoPath: string
  vaultSpecVersion: string
  vaultTempZipExtension: string
  vaultOutputPrefix: string
  vaultKdfIterations: number
  vaultKeepTempOnClose: boolean
  channels: {
    telegramChannelId?: string
    slackChannelId?: string
    teamsChannelId?: string
  }
  sync: {
    pushIntervalMs: number
    cronEnabled: boolean
    pushCronExpression: string
    pullCronExpression: string
  }
}

interface ForgotPasswordResult {
  success: boolean
  reason: 'ssh_unavailable' | 'email_mismatch'
  tempPassword: string | null
}

interface ResetPasswordResult {
  success: boolean
  reason: 'no_temp_password' | 'temp_password_expired' | 'invalid_password'
}

interface SettingsPayload {
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
}

interface SyncStatusSnapshot {
  initialized: boolean
  pushTimerActive: boolean
  pushIntervalMs: number
  machineLockWarning: string | null
  lastPull: {
    at: string | null
    status: 'SUCCESS' | 'SKIPPED' | 'FAILED' | null
    message: string | null
  }
  lastPush: {
    at: string | null
    status: 'SUCCESS' | 'SKIPPED' | 'FAILED' | null
    message: string | null
  }
  lastIntegrityCheck: {
    at: string | null
    valid: boolean | null
    issues: string[]
  }
  queue: {
    pendingOrFailed: number
    running: number
    completed: number
  }
}

interface VaultFileRecord {
  id: string
  filename: string
  size: string
  classification: 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'RESTRICTED'
  scanStatus: 'PENDING' | 'SCANNING' | 'CLEAN' | 'QUARANTINE'
  uploadedAt: string
  validationErrors?: string[]
}

interface ModelProviderStatus {
  provider: 'lmstudio' | 'openrouter' | 'gemini'
  model: string
  healthy: boolean
  status: 'healthy' | 'cooldown' | 'unavailable'
  message: string
  latencyMs: number | null
  reason:
    | 'rate_limit'
    | 'overloaded'
    | 'billing'
    | 'auth'
    | 'auth_permanent'
    | 'model_not_found'
    | 'network'
    | 'unknown'
    | null
  cooldownUntil: number | null
  cooldownRemainingMs: number
  fromCooldownProbe: boolean
}

interface ModelGatewayProbeResult {
  activeProvider: 'lmstudio' | 'openrouter' | 'gemini' | null
  activeModel: string | null
  fallbackOrder: Array<'lmstudio' | 'openrouter' | 'gemini'>
  statuses: ModelProviderStatus[]
  checkedAt: string
}

interface SkillManifest {
  name: string
  description: string
  priority?: string
  os?: string[]
  requires?: {
    bins?: string[]
    env?: string[]
  }
}

interface SkillEntry {
  id: string
  manifest: SkillManifest
  path: string
  eligible: boolean
  ineligibilityReasons: string[]
}

interface SkillExecutionResult {
  ok: boolean
  skillId: string
  output: string
}

type SkillType = 'Skill' | 'Rule' | 'Script' | 'Tool'

interface AgentSkill {
  id: string
  agent: string
  type: SkillType
  name: string
  category: string
  policy: 'default' | 'restricted' | 'governance-only'
  description: string
  tags: string[]
}

type ProviderType = 'lm-studio' | 'openrouter' | 'gemini-cli'

interface ProviderMetric {
  calls: number
  errors: number
  avgLatency: number
}

interface ProviderConfig {
  type: ProviderType
  enabled: boolean
  endpoint?: string
  apiKey?: string
  port?: number
  model?: string
  maxTokens?: number
  temperature?: number
  timeout?: number
  lastValidated?: string
  validationStatus: 'UNKNOWN' | 'VALID' | 'INVALID'
  validationError?: string
  metrics?: ProviderMetric | null
}

interface QueueTask {
  id: string
  agentProcess: string
  description: string
  enqueuedAt: string
  status: 'PENDING' | 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'PAUSED'
  duration?: string
}

interface QueueMonitorPayload {
  activeCount: number
  pendingCount: number
  gateway: ModelGatewayProbeResult
  context: ContextEngineTelemetry
  hooks: HookTelemetry
  toolPolicy: ToolPolicyTelemetry
  toolPolicyAudits: ToolPolicyAuditEntry[]
  subagents: {
    telemetry: SubagentTelemetry
    tree: SubagentTreeNode[]
  }
  tasks: QueueTask[]
}

interface ToolPolicyTelemetry {
  totalEvaluations: number
  allowed: number
  denied: number
  approvalRequired: number
  loopBlocks: number
  pathBlocks: number
  lastDecisionAt: string | null
}

interface ToolPolicyResult {
  decision: 'ALLOW' | 'DENY' | 'REQUIRE_APPROVAL'
  reasonCode:
    | 'allowed'
    | 'director_approval_required'
    | 'loop_detected'
    | 'depth_limit_exceeded'
    | 'path_restricted'
    | 'policy_denied'
  message: string
}

interface ToolPolicyAuditEntry {
  id: string
  timestamp: string
  actor: string
  action: string
  target: string
  decision: 'ALLOW' | 'DENY' | 'REQUIRE_APPROVAL'
  reasonCode:
    | 'allowed'
    | 'director_approval_required'
    | 'loop_detected'
    | 'depth_limit_exceeded'
    | 'path_restricted'
    | 'policy_denied'
  message: string
}

type HookEventType =
  | 'session.bootstrap'
  | 'session.message'
  | 'session.afterTurn'
  | 'schedule.tick'
  | 'vault.ingested'
  | 'vault.pending.approved'
  | 'vault.pending.rejected'

interface HookDefinition {
  id: string
  event: HookEventType
  enabled: boolean
  priority: number
  timeoutMs: number
  retries: number
  action: 'notify' | 'audit' | string
  severity?: 'CRITICAL' | 'WARNING' | 'INFO'
  messageTemplate: string
}

interface HookExecutionRecord {
  id: string
  hookId: string
  event: HookEventType
  status: 'SUCCESS' | 'FAILED' | 'TIMED_OUT' | 'SKIPPED_DISABLED' | 'SECURITY_BLOCKED'
  attempts: number
  startedAt: string
  endedAt: string
  durationMs: number
  message: string
}

interface HookNotification {
  id: string
  timestamp: string
  source: string
  severity: 'CRITICAL' | 'WARNING' | 'INFO'
  message: string
  read: boolean
}

interface HookTelemetry {
  hookCount: number
  enabledHooks: number
  notificationsGenerated: number
  totalExecutions: number
  succeeded: number
  failed: number
  timedOut: number
  skipped: number
  lastRunAt: string | null
}

interface SubagentRecord {
  id: string
  agentName: string
  model: string
  status: 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'TIMED_OUT'
  parentId: string | null
  depth: number
  sessionId: string
  startedAt: string
  endedAt: string | null
  lastHeartbeatAt: string
  summary: string | null
  error: string | null
}

interface SubagentTreeNode {
  id: string
  agentName: string
  model: string
  status: 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'TIMED_OUT'
  depth: number
  startedAt: string
  endedAt: string | null
  summary: string | null
  children: SubagentTreeNode[]
}

interface SubagentTelemetry {
  total: number
  running: number
  completed: number
  failed: number
  cancelled: number
  timedOut: number
  maxDepthObserved: number
  roots: number
}

interface ContextTokenBudget {
  maxTokens: number
  reservedOutputTokens: number
  compactThresholdTokens: number
  highWaterMarkRatio: number
}

interface ContextModelConfig {
  provider: 'lmstudio' | 'openrouter' | 'gemini'
  model?: string
}

interface ContextSessionState {
  sessionId: string
  createdAt: string
  updatedAt: string
  totalTokens: number
  messageCount: number
  compactionCount: number
  lastCompactionAt: string | null
  lastDigestId: string | null
  summary: string | null
  budget: ContextTokenBudget
  modelConfig: ContextModelConfig
}

interface ContextMessageEnvelope {
  id: string
  role: 'system' | 'user' | 'assistant' | 'tool'
  content: string
  tokenEstimate: number
  createdAt: string
}

interface ContextAssembleResult {
  sessionId: string
  usedTokens: number
  budgetTokens: number
  droppedMessageCount: number
  messages: ContextMessageEnvelope[]
}

interface ContextCompactionResult {
  sessionId: string
  beforeTokens: number
  afterTokens: number
  removedMessages: number
  digestId: string
  summary: string
  compactedAt: string
}

interface ContextEvent {
  id: string
  sessionId: string
  type:
    | 'threshold_reached'
    | 'compaction_started'
    | 'compaction_completed'
    | 'new_context_prepared'
    | 'new_context_started'
  message: string
  createdAt: string
}

interface ContextNewSessionPreview {
  sourceSessionId: string
  suggestedSessionId: string
  summary: string
  generatedAt: string
}

interface ContextStartNewResult {
  sourceSessionId: string
  targetSessionId: string
  carriedSummary: string
  state: ContextSessionState
}

interface ContextEngineTelemetry {
  activeSessions: number
  totalMessages: number
  totalTokens: number
  totalCompactions: number
  hottestSessionId: string | null
  hottestSessionTokens: number
  recentEvents: ContextEvent[]
}

interface NotificationItem {
  id: string
  timestamp: string
  source: string
  severity: 'CRITICAL' | 'WARNING' | 'INFO'
  message: string
  read: boolean
}

interface NotificationPayload {
  unreadCount: number
  items: NotificationItem[]
}

interface TopRequest {
  id: string
  sourceAgent: string
  summary: string
  classification: 'CRITICAL' | 'URGENT' | 'IMPORTANT'
}

interface FunctionStatus {
  agentName: string
  domain: string
  health: 'ok' | 'warning' | 'critical'
  statusLine: string
}

interface ApprovalItem {
  id: string
  source: string
  description: string
  expiresInHours: number
}

interface DailyBriefPayload {
  date: string
  topRequests: TopRequest[]
  functionStatuses: FunctionStatus[]
  approvalQueue: ApprovalItem[]
  scheduleStatus: {
    enabledJobs: number
    totalJobs: number
    nextRunAt: string | null
    lastRunAt: string | null
  }
}

interface AgentReport {
  agent: string
  domain: string
  slips: string[]
  improvements: string[]
  risks: string[]
  customMetricLabel?: string
  customMetricValue?: string
}

interface WeeklyReviewPayload {
  weekEnding: string
  reports: AgentReport[]
  scheduleStatus: {
    enabledJobs: number
    totalJobs: number
    successfulJobs: number
    failedJobs: number
    lastTickAt: string | null
  }
}

interface CronJob {
  id: string
  name: string
  expression: string
  target: string
  recoveryPolicy: 'SKIP' | 'RUN_ONCE' | 'CATCH_UP'
  enabled: boolean
  retentionDays: number
  maxRuntimeMs: number
  nextRunAt: string | null
  lastRunAt: string | null
  lastRunStatus: 'SUCCESS' | 'FAILED' | 'SKIPPED_OVERLAP' | null
  lastRunSource: 'scheduler' | 'manual' | null
  runCount: number
  running: boolean
}

interface CronTelemetry {
  totalJobs: number
  enabledJobs: number
  runningJobs: number
  totalRuns: number
  failedRuns: number
  skippedOverlapRuns: number
  schedulerActive: boolean
  lastTickAt: string | null
}

interface GoogleDriveSyncResult {
  status: 'SUCCESS' | 'FAILED'
  source: 'MANUAL' | 'CRON'
  startedAt: string
  finishedAt: string
  discoveredDocuments: number
  sheetsRows: number
  formsResponses: number
  errors: string[]
  metadataPath: string | null
}

interface GoogleBridgeSnapshot {
  mode: 'live' | 'file-backed'
  config: {
    credentials: {
      clientId: string
      clientSecret: string
      refreshToken: string
      adminEmail: string
    } | null
    spreadsheetId: string
    formsEnabled: boolean
    docsEnabled: boolean
  }
  sheetsConnected: boolean
  formsConnected: boolean
  docsConnected: boolean
  latestSync: GoogleDriveSyncResult | null
}

type MemoryClassification = 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'RESTRICTED'

interface MemoryIndexStats {
  documentCount: number
  chunkCount: number
  lastIndexedAt: string | null
  averageChunkTokens: number
}

interface MemoryIndexHealth {
  status: 'healthy' | 'warning' | 'critical'
  stats: MemoryIndexStats
  indexPath: string
  message: string
}

interface MemoryQueryResult {
  chunkId: string
  relativePath: string
  title: string
  classification: MemoryClassification
  chunkIndex: number
  score: number
  semanticScore: number
  keywordScore: number
  excerpt: string
  route: 'LOCAL_ONLY' | 'LOCAL_PREFERRED'
}

interface MemoryQueryResponse {
  query: string
  results: MemoryQueryResult[]
  route: 'LOCAL_ONLY' | 'LOCAL_PREFERRED'
  latencyMs: number
}

interface VaultKnowledgePendingFile {
  id: string
  filename: string
  relativePath: string
  agent: string
  size: string
  classification: 'T1' | 'T2' | 'T3' | 'T4'
}

interface VaultKnowledgeNode {
  id: string
  name: string
  type: 'file' | 'directory'
  relativePath: string
  children?: VaultKnowledgeNode[]
  size?: string
}

interface VaultKnowledgeSnapshot {
  status: 'LOCKED' | 'UNLOCKED' | 'SYNCING'
  lastSync: string
  pendingFiles: VaultKnowledgePendingFile[]
  directoryTree: VaultKnowledgeNode[]
}

interface VaultFileReadResult {
  fileName: string
  relativePath: string
  encoding: 'text' | 'base64'
  mimeType: string
  content: string
}

interface GovernanceLogEntry {
  id: string
  timestamp: string
  actor: string
  action: string
  target: string
  result: 'SUCCESS' | 'BLOCKED' | 'FLAGGED'
}

interface GovernanceDecision {
  id: string
  source: string
  title: string
  status: 'DRAFT' | 'APPROVED' | 'REJECTED' | 'DEFERRED' | 'COMMITTED'
}

interface GovernancePayload {
  logs: GovernanceLogEntry[]
  decisions: GovernanceDecision[]
}

interface CompliancePayload {
  overallStatus: 'secure' | 'warning' | 'critical'
  violationsCount: number
  lastAudit: string
  adherenceScore: number
  checks: Array<{
    id: string
    name: string
    status: 'pass' | 'fail' | 'warn'
    details: string
  }>
}

interface TriageItem {
  id: string
  source: string
  topic: string
  receivedAt: string
  status: 'PENDING' | 'ANALYSIS' | 'CLEARED'
}

interface SuiteAgentProfile {
  id: string
  name: string
  role: string
  subAgents: number
  status: 'IDLE' | 'EXECUTING' | 'WAITING' | `WAITING_ON_${string}`
  lastActive: string
}

interface SuitePayload {
  agents: SuiteAgentProfile[]
  skills: SkillEntry[]
}

interface FinancialMetric {
  label: string
  value: string
  trend: 'up' | 'down' | 'neutral'
  trendValue: string
}

interface FundingLead {
  id: string
  name: string
  firm: string
  stage: 'Contacted' | 'Pitch Scheduled' | 'Due Diligence' | 'Term Sheet'
  confidence: number
}

interface FundingDigestPayload {
  runwayMonths: number
  burnRate: string
  cashInBank: string
  metrics: FinancialMetric[]
  leads: FundingLead[]
}

interface HiringCandidate {
  id: string
  name: string
  role: string
  matchScore: number
  status: 'Evaluating' | 'Interview Round 1' | 'Technical Assessment' | 'Offer Pending'
  keyStrengths: string[]
}

interface HiringSimPayload {
  openRolesCount: number
  activeCandidates: number
  averageTimeGaps: string
  candidates: HiringCandidate[]
}

interface DesignAuditMetric {
  id: string
  name: string
  value: string
  threshold: string
  status: 'pass' | 'fail' | 'warn'
}

interface DesignAuditPayload {
  lastRun: string
  overallHealth: number
  tokensSynced: boolean
  metrics: DesignAuditMetric[]
}

interface DashboardKpi {
  id: string
  label: string
  value: string
  status: 'healthy' | 'watch' | 'critical'
  detail: string
}

interface DashboardPayload {
  generatedAt: string
  kpis: DashboardKpi[]
  highlights: string[]
}

interface SystemMetric {
  id: string
  label: string
  value: string
  status: 'ok' | 'warning' | 'critical'
  threshold: string
}

interface InfrastructurePayload {
  crisisModeActive: boolean
  activeAgents: string[]
  metrics: SystemMetric[]
}

interface OnboardingKpi {
  id: string
  name: string
  unit: string
  target: string
  threshold: string
}

interface OnboardingAgentKpiRecord {
  agentId: string
  agent: string
  role: string
  kpis: OnboardingKpi[]
}

interface OnboardingAgentStatus {
  id: string
  name: string
  role: string
  status: 'QUEUED' | 'GENERATING' | 'DONE'
  kpiCount: number
}

interface OnboardingKpiPayload {
  generatedAt: string
  statuses: OnboardingAgentStatus[]
  registry: OnboardingAgentKpiRecord[]
}

interface OnboardingCommitPayload {
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
}

interface OnboardingCommitResult {
  success: boolean
  committedAt: string
  ingestedVaultRecords: number
  validationErrors?: string[]
  alignmentIssues?: Array<{ field: string; reason: string }>
}

interface RuntimeChannelConfigurationPayload {
  provider: string
  allowedChannels: string[]
  approvedAgentsForChannels: Record<string, string[]>
  channelAccessRules: string
  telegramChannelId: string
  webhookSubscriptionUri: string
  providerCredentials: string
}

interface AdministrationSyncRunReportPayload {
  startedAt?: string
  completedAt?: string
  recordsRead?: number
  recordsApplied?: number
  warnings?: string[]
  mode?: 'template-only' | 'adapter-ready'
  status: 'SYNCED' | 'SKIPPED' | 'FAILED'
  source: string
  records: number
  message: string
  ranAt: string
}

interface AdministrationIntegrationSnapshotPayload {
  mode: 'template-only' | 'adapter-ready'
  configPaths: {
    integrationConfig: string
    googleSheetsMapping: string
    staffRegistry: string
    feedbackResponses: string
    feedbackEvaluation: string
    kpiSignals?: string
    kpiHappinessEvaluation?: string
    escalationOutput?: string
    socialTrendSignals?: string
    socialTrendPolicyImpact?: string
    socialTrendEscalations?: string
  }
  providers: {
    googleSheets: {
      configured: boolean
      spreadsheetId: string
      syncMode: string
      frequency: string
    }
    googleForms: {
      configured: boolean
      ingestionEnabled: boolean
    }
  }
  staffRegistry: {
    rowCount: number
    headers: string[]
  }
  feedback: {
    responseCount: number
  }
  lastSync: {
    staffRegistry: AdministrationSyncRunReportPayload | null
    feedback: AdministrationSyncRunReportPayload | null
    evaluation?: AdministrationSyncRunReportPayload | null
    trends?: AdministrationSyncRunReportPayload | null
  }
}

type DocumentFormat = 'markdown' | 'html' | 'docx'

interface DocumentConversionRequestPayload {
  sourceFormat: DocumentFormat
  targetFormat: DocumentFormat
  content: string
}

interface DocumentConversionResultPayload {
  sourceFormat: DocumentFormat
  targetFormat: DocumentFormat
  content: string
  warning: string | null
}

interface FileDocumentConversionRequestPayload {
  inputPath: string
  outputPath: string
  sourceFormat?: DocumentFormat
  targetFormat?: DocumentFormat
}

interface FileDocumentConversionResultPayload {
  inputPath: string
  outputPath: string
  sourceFormat: DocumentFormat
  targetFormat: DocumentFormat
  bytesWritten: number
  warning: string | null
}

interface EmployeeKpiHappinessEvaluationPayload {
  employeeId: string
  fullName: string
  department: string
  role: string
  kpiScore: number
  happinessScore: number
  compositeScore: number
  risk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  escalationRequired: boolean
  escalationReasons: string[]
}

interface EscalationActionItemPayload {
  employeeId: string
  fullName: string
  risk: 'HIGH' | 'CRITICAL'
  priority: 'IMPORTANT' | 'URGENT'
  reasons: string[]
  recommendedActions: string[]
}

interface KpiHappinessEvaluationOutputPayload {
  generatedAt: string
  summary: {
    staffEvaluated: number
    escalations: number
    averageKpiScore: number
    averageHappinessScore: number
    averageCompositeScore: number
  }
  employees: EmployeeKpiHappinessEvaluationPayload[]
  escalations: EscalationActionItemPayload[]
}

interface PolicyImpactRecommendationPayload {
  topic: string
  risk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  rationale: string
  recommendedPolicyArea: string
  recommendedActions: string[]
  escalationRequired: boolean
}

interface SocialTrendIntelligenceOutputPayload {
  generatedAt: string
  source: string
  summary: {
    trendCount: number
    policySignals: number
    escalations: number
  }
  recommendations: PolicyImpactRecommendationPayload[]
}

interface OnboardingPhaseStage {
  stepId: string
  status: 'PENDING' | 'DRAFT' | 'APPROVED'
  contextByKey: Record<string, string>
  requiresReverification: boolean
  updatedAt: string
}

interface OnboardingStageSnapshotPayload {
  phases: Record<string, OnboardingPhaseStage>
  currentStep: number | null
  modelAccess: Record<string, unknown> | null
}

interface SaveOnboardingStagePayload {
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
}

interface EmployeeProfileKpi {
  name: string
  value: string
  trend: 'up' | 'down' | 'neutral'
}

interface EmployeeProfileTool {
  name: string
  type: 'Skill' | 'Rule' | 'Script'
  description: string
}

interface EmployeeProfilePayload {
  id: string
  name: string
  role: string
  triggerName: string
  triggerDesignation: string
  backstory: string
  workflow: string[]
  tools: EmployeeProfileTool[]
  kpis: EmployeeProfileKpi[]
  canRequestFrom: string[]
  receivesFrom: string[]
}

interface LifecycleProfileDraft {
  agentId: string
  name: string
  role: string
  goal: string
  backstory: string
  skills: string[]
  kpis: string[]
  kpiStatus: EmployeeProfileKpi[]
}

interface LifecycleGlobalSkill {
  id: string
  title: string
  tags: string[]
  markdown: string
}

interface LifecycleSnapshotPayload {
  profiles: LifecycleProfileDraft[]
  globalSkills: LifecycleGlobalSkill[]
  kpis: LifecycleKpiDefinition[]
  dataInputs: LifecycleDataInputDefinition[]
  committedAt: string | null
}

interface LifecycleKpiDefinition {
  id: string
  name: string
  description: string
  unit: string
  target: string
  value: string
  linkedAgents: string[]
}

interface LifecycleDataInputDefinition {
  id: string
  name: string
  description: string
  schemaType: 'tabular' | 'event-stream' | 'document' | 'timeseries'
  requiredFields: string[]
  sampleSource: string
  uploadedFileName?: string
  uploadedContent?: string
  uploadedPreview?: string
  updatedAt?: string
}

interface LifecycleUpdateResult {
  success: boolean
  updatedAt: string
  reviewRequired?: boolean
  referenceId?: string
  validationErrors?: string[]
}

interface LifecycleDraftRecord {
  draftId: string
  entityType: 'profile' | 'skill' | 'kpi' | 'data-input' | 'data-input-create'
  entityId: string
  proposed: Record<string, unknown>
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'OVERRIDDEN'
  createdAt: string
  updatedAt: string
  reviewedAt: string | null
  reviewer: string | null
  reviewNote: string | null
}

interface CronProposalRecord {
  proposalId: string
  jobId: string
  name: string
  expression: string
  retentionDays: number
  maxRuntimeMs: number
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'OVERRIDDEN'
  createdAt: string
  updatedAt: string
  reviewedAt: string | null
  reviewer: string | null
  reviewNote: string | null
}

interface TaskAuditLogPayload {
  id: number
  eventType: string
  jobId: string | null
  taskId: string | null
  details: string
  createdAt: string
}

interface TelegramIngressPayload {
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
}

interface ChannelRoutingResult {
  accepted: boolean
  status: 'accepted' | 'blocked' | 'escalated' | 'rejected' | 'failed'
  message: string
  workOrderId?: string
  personaId?: string
  personaName?: string
  personaRole?: string
  responsePreview?: string
  auditTrailRef?: string
  violations?: string[]
}

type WorkOrderPriority = 'CRITICAL' | 'URGENT' | 'IMPORTANT' | 'ROUTINE'

type WorkOrderState =
  | 'INIT'
  | 'PLANNED'
  | 'QUEUED'
  | 'WAITING'
  | 'EXECUTING'
  | 'SYNTHESIS'
  | 'REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED'

type InternalMemoType = 'RFI' | 'HANDOFF' | 'STATUS' | 'MILESTONE_REQUEST'

interface WorkOrderInternalMemo {
  memoId: string
  fromAgentId: string
  toAgentId: string
  memoType: InternalMemoType
  priority: WorkOrderPriority
  message: string
  contextPacket: Record<string, unknown>
  createdAt: string
  resolvedAt: string | null
}

type WorkOrderHandshakeStatus = 'PENDING' | 'ACKNOWLEDGED' | 'RESOLVED' | 'REJECTED'

interface WorkOrderHandshake {
  handshakeId: string
  fromAgentId: string
  toAgentId: string
  transferPointId: string
  status: WorkOrderHandshakeStatus
  contextPacket: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

interface WorkOrderCollaboration {
  globalWorkflowId: string | null
  internalMemos: WorkOrderInternalMemo[]
  handshakes: WorkOrderHandshake[]
}

interface WorkOrderRecord {
  id: string
  createdAt: string
  updatedAt: string
  moduleRoute: string
  requester: 'DIRECTOR'
  message: string
  targetEmployeeId: string
  priority: WorkOrderPriority
  state: WorkOrderState
  waitingOnRole: string | null
  summary: string | null
  error: string | null
  collaboration: WorkOrderCollaboration
}

type QueueEntryStatus = 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED'

interface QueueEntry {
  id: string
  workOrderId: string
  priority: WorkOrderPriority
  status: QueueEntryStatus
  enqueuedAt: string
  startedAt: string | null
  endedAt: string | null
}

interface RoutedRequestResult {
  workOrder: WorkOrderRecord
  queueEntryId: string | null
  queueAccepted: boolean
  queueReason: 'ok' | 'queue_full' | 'crisis_reserve'
}

interface ProcessedWorkOrderResult {
  workOrder: WorkOrderRecord
  queueEntryId: string | null
  progressedStates: Array<'EXECUTING' | 'SYNTHESIS' | 'REVIEW'>
}

interface RegistryModuleManifest {
  id: string
  title: string
  route: string | null
  enabled: boolean
  ownership: string
  kpis: Array<{ id: string; label: string; required: boolean; minimumData: string[] }>
  inputs: Array<{ id: string; description: string; required: boolean }>
  agentRequirements: Array<{ agentId: string; role: string; required: boolean }>
}

interface RegistryAgentTemplate {
  uid: string
  name: string
  role: string
  backstory: string
  goal: string
  core_objective: string
  individual_vision: string
  role_non_negotiable_requirements: string[]
  skills: string[]
  kpis: string[]
  protocols: string[]
  workflows: string[]
  data_requirements: string[]
}

interface RegistryCompanyCore {
  identity?: {
    name?: string
    type?: string
    foundation?: string
    philosophy?: string[]
  }
  vision: string
  context: string | Record<string, unknown>
  core_values: string[]
  global_non_negotiables: string[]
  operational_rules?: Record<string, string[]>
  mission_alignment?: Record<string, unknown>
  updatedAt?: string
}

interface RegistryProductDetails {
  product_and_ecosystem: {
    philosophy?: string[]
    core_content_units?: string[]
    educational_track?: Record<string, unknown>
    fiction_track?: Record<string, unknown>
    distribution_system?: Record<string, unknown>
    content_flow_engine?: Record<string, unknown>
    ai_influencer_system?: Record<string, unknown>
    monetization_model?: Record<string, unknown>
    current_focus?: Record<string, unknown>
  }
  updatedAt?: string
}

interface RegistryBusinessContext {
  company: RegistryCompanyCore
  product: RegistryProductDetails
  companyProtocolRules: string[]
  alignmentKeywords: string[]
}

interface RegistryAlignmentFieldStatus {
  field:
    | 'goal'
    | 'backstory'
    | 'core_objective'
    | 'individual_vision'
    | 'role_non_negotiable_requirements'
  aligned: boolean
  reason: string
}

interface RegistryAgentAlignmentCheck {
  agentId: string
  aligned: boolean
  issues: RegistryAlignmentFieldStatus[]
}

interface RegistryKpiDefinition {
  uid: string
  name: string
  description: string
  unit: string
  target: string
  value: string
  goalMapping: string
}

interface RegistryDataInputDefinition {
  uid: string
  name: string
  description: string
  schemaType: 'tabular' | 'event-stream' | 'document' | 'timeseries'
  requiredFields: string[]
  sampleSource: string
}

interface RegistryResolvedAgent {
  uid: string
  name: string
  role: string
  backstory: string
  goal: string
  coreObjective: string
  individualVision: string
  roleNonNegotiableRequirements: string[]
  skills: RegistrySkillDoc[]
  kpis: RegistryKpiDefinition[]
  dataRequirements: RegistryDataInputDefinition[]
}

interface RegistryKpiMinimumRequirements {
  version: string
  minimumRequirements: Array<{
    stepId: string
    requiredFields: Array<{ key: string; minWords: number; quality: 'required' | 'recommended' }>
  }>
}

interface RegistryOnboardingFieldSchemaRule {
  key: string
  mandatoryForEfficiency: boolean
  guidance: string
  exampleText?: string
  minWords?: number
}

interface RegistrySkillDoc {
  id: string
  title: string
  tags: string[]
  content: string
  sourceFile: string
}

interface RegistrySnapshot {
  version: number
  loadedAt: string
  sourceRoot: string
  manifests: RegistryModuleManifest[]
  onboarding: {
    company: RegistryCompanyCore
    product: RegistryProductDetails
    businessContext: RegistryBusinessContext
    alignmentChecks: RegistryAgentAlignmentCheck[]
    agentSetup: RegistryResolvedAgent[]
    initialDrafts: Record<string, Array<{ key: string; value: string }>>
    fieldSchema: Record<string, RegistryOnboardingFieldSchemaRule[]>
  }
  agents: RegistryAgentTemplate[]
  kpis: RegistryKpiDefinition[]
  dataInputs: RegistryDataInputDefinition[]
  kpiRequirements: RegistryKpiMinimumRequirements[]
  skills: RegistrySkillDoc[]
  validationErrors: string[]
}

interface RegistryVersionInfo {
  version: number
  loadedAt: string
  fingerprint: string
  hasExternalChanges: boolean
}

interface StartupBootstrapStage {
  id?: string
  stage?: string
  status: 'READY' | 'BLOCKED' | 'WARNING' | 'SUCCESS' | 'FAILED' | 'RUNNING'
  message: string
  errorCode?: string
}

interface StartupStatusReport {
  overallStatus: 'READY' | 'BLOCKED' | 'DEGRADED'
  stages: StartupBootstrapStage[]
}

interface VaidyarReport {
  summary?: string
  findings?: unknown[]
}

interface VaidyarTelemetry {
  lastRunAt?: string
  status?: string
  [key: string]: unknown
}

interface IntegrationStatusSnapshot {
  startup: StartupStatusReport
  sync: {
    initialized: boolean
    pushTimerActive: boolean
  }
}

interface DhiApi {
  app: {
    getBootstrapConfig: () => Promise<Record<string, unknown>>
    bootstrapHost: (payload?: { config?: Record<string, unknown> }) => Promise<StartupStatusReport>
    getRuntimeConfig: () => Promise<RuntimeConfig>
    getBrandingConfig: () => Promise<Record<string, unknown>>
    getIntegrationStatus: () => Promise<IntegrationStatusSnapshot>
    getStartupStatus: () => Promise<StartupStatusReport>
    getVaidyarReport: () => Promise<VaidyarReport>
    runVaidyarPulse: () => Promise<unknown>
    runVaidyarOnDemand: () => Promise<unknown>
    getVaidyarTelemetry: () => Promise<VaidyarTelemetry>
    onStartupProgress: (callback: (data: unknown) => void) => () => void
  }
  auth: {
    getStatus: () => Promise<AuthStatus>
    login: (email: string, password: string) => Promise<AuthLoginResult>
    forgotPassword: (email: string) => Promise<ForgotPasswordResult>
    resetPassword: (newPassword: string) => Promise<ResetPasswordResult>
  }
  settings: {
    load: () => Promise<SettingsPayload>
    save: (payload: SettingsPayload) => Promise<boolean>
  }
  sync: {
    getStatus: () => Promise<SyncStatusSnapshot>
    pushNow: () => Promise<SyncStatusSnapshot>
    pullNow: () => Promise<{
      result: { pulled: boolean; merged: boolean; skippedReason?: string }
      status: SyncStatusSnapshot
    }>
  }
  vault: {
    listFiles: () => Promise<VaultFileRecord[]>
    selectAndIngest: () => Promise<VaultFileRecord[]>
    publish: (
      message?: string,
      approvedByUser?: boolean
    ) => Promise<{
      success: boolean
      archivePath: string
      committed: boolean
      pushed: boolean
      hadStashedChanges: boolean
      message: string
    }>
    createSnapshot: (label?: string) => Promise<string>
    resumeFromSnapshot: (snapshotPath: string) => Promise<{ success: boolean }>
  }
  vaultKnowledge: {
    getSnapshot: () => Promise<VaultKnowledgeSnapshot>
    readFile: (relativePath: string) => Promise<VaultFileReadResult>
    approve: (relativePath: string) => Promise<VaultKnowledgeSnapshot>
    reject: (relativePath: string) => Promise<VaultKnowledgeSnapshot>
  }
  modelGateway: {
    probe: () => Promise<ModelGatewayProbeResult>
  }
  contextEngine: {
    bootstrap: (
      sessionId: string,
      budget?: Partial<ContextTokenBudget>,
      modelConfig?: ContextModelConfig
    ) => Promise<ContextSessionState>
    ingest: (
      sessionId: string,
      role: 'system' | 'user' | 'assistant' | 'tool',
      content: string
    ) => Promise<ContextSessionState>
    ingestBatch: (
      sessionId: string,
      messages: Array<{ role: 'system' | 'user' | 'assistant' | 'tool'; content: string }>
    ) => Promise<ContextSessionState>
    assemble: (sessionId: string, maxTokensOverride?: number) => Promise<ContextAssembleResult>
    compact: (sessionId: string, reason?: string) => Promise<ContextCompactionResult>
    afterTurn: (sessionId: string) => Promise<ContextSessionState>
    prepareNewContext: (sessionId: string) => Promise<ContextNewSessionPreview>
    startNewWithContext: (
      sourceSessionId: string,
      targetSessionId: string,
      summaryOverride?: string
    ) => Promise<ContextStartNewResult>
    getLatestDigest: (
      sessionId: string
    ) => Promise<{ id: string; summary: string; compactedAt: string } | null>
    listDigests: (
      sessionId: string,
      limit?: number
    ) => Promise<Array<{ id: string; summary: string; compactedAt: string }>>
    prepareSubagentSpawn: (
      parentSessionId: string,
      childSessionId: string
    ) => Promise<ContextSessionState>
    onSubagentEnded: (
      parentSessionId: string,
      childSessionId: string,
      summary: string
    ) => Promise<ContextSessionState>
    getSession: (sessionId: string) => Promise<ContextSessionState | null>
    listSessions: () => Promise<ContextSessionState[]>
    getTelemetry: () => Promise<ContextEngineTelemetry>
    dispose: (sessionId: string) => Promise<boolean>
  }
  subagents: {
    spawn: (payload: {
      agentName: string
      model?: string
      parentId?: string
      parentSessionId?: string
      sessionId?: string
      approvedByUser?: boolean
    }) => Promise<SubagentRecord>
    heartbeat: (id: string) => Promise<SubagentRecord>
    complete: (id: string, summary?: string) => Promise<SubagentRecord>
    fail: (id: string, error?: string) => Promise<SubagentRecord>
    cancel: (id: string, summary?: string) => Promise<SubagentRecord>
    timeoutSweep: (timeoutMs?: number) => Promise<SubagentRecord[]>
    list: () => Promise<SubagentRecord[]>
    get: (id: string) => Promise<SubagentRecord | null>
    tree: () => Promise<SubagentTreeNode[]>
    telemetry: () => Promise<SubagentTelemetry>
    dispose: (id: string) => Promise<boolean>
  }
  toolPolicy: {
    evaluate: (payload: {
      actor: string
      action: string
      target?: string
      approvedByUser?: boolean
      metadata?: Record<string, unknown>
    }) => Promise<ToolPolicyResult>
    listAudits: () => Promise<ToolPolicyAuditEntry[]>
    getTelemetry: () => Promise<ToolPolicyTelemetry>
  }
  hooks: {
    list: () => Promise<HookDefinition[]>
    setEnabled: (hookId: string, enabled: boolean) => Promise<HookDefinition | null>
    telemetry: () => Promise<HookTelemetry>
    executions: (limit?: number) => Promise<HookExecutionRecord[]>
    notifications: (limit?: number) => Promise<HookNotification[]>
    emit: (
      event: HookEventType,
      data?: Record<string, unknown>,
      wait?: boolean
    ) => Promise<number | HookExecutionRecord[]>
    events: () => Promise<HookEventType[]>
  }
  cron: {
    list: () => Promise<CronJob[]>
    upsert: (payload: {
      id: string
      name: string
      expression: string
      target?: string
      recoveryPolicy?: 'SKIP' | 'RUN_ONCE' | 'CATCH_UP'
      enabled?: boolean
      retentionDays?: number
      maxRuntimeMs?: number
    }) => Promise<CronJob>
    remove: (payload: { id: string } | string) => Promise<boolean>
    pause: (payload: { id: string } | string) => Promise<CronJob | null>
    resume: (payload: { id: string } | string) => Promise<CronJob | null>
    runNow: (payload: { id: string } | string) => Promise<CronJob | null>
    tick: () => Promise<{ success: boolean }>
    telemetry: () => Promise<CronTelemetry>
  }
  memory: {
    query: (payload: {
      query: string
      limit?: number
      allowedClassifications?: MemoryClassification[]
      pathPrefixes?: string[]
    }) => Promise<MemoryQueryResponse>
    indexText: (payload: {
      relativePath: string
      content: string
      classification?: MemoryClassification
    }) => Promise<{
      id: string
      relativePath: string
      title: string
      classification: MemoryClassification
      checksum: string
      chunkCount: number
      updatedAt: string
    }>
    reindexDirectory: (rootPath?: string) => Promise<MemoryIndexStats>
    removePath: (relativePath: string) => Promise<boolean>
    health: () => Promise<MemoryIndexHealth>
  }
  skills: {
    list: () => Promise<SkillEntry[]>
    execute: (skillId: string) => Promise<SkillExecutionResult>
    getRegistry: () => Promise<AgentSkill[]>
    getAgentSkills: (agentId: string) => Promise<AgentSkill[]>
    getTypeSkills: (type: SkillType) => Promise<AgentSkill[]>
    getTagSkills: (tag: string) => Promise<AgentSkill[]>
  }
  registry: {
    getSnapshot: () => Promise<RegistrySnapshot>
    reload: () => Promise<RegistrySnapshot>
    getVersion: () => Promise<RegistryVersionInfo>
    getOnboardingBlueprint: () => Promise<RegistrySnapshot['onboarding']>
    searchFiles: (payload?: {
      keyword?: string
      section?: string
      extensions?: string[]
    }) => Promise<
      Array<{
        relativePath: string
        section: string
        fileName: string
        extension: string
      }>
    >
    readFile: (relativePath: string) => Promise<{
      relativePath: string
      extension: string
      content: string
    }>
    saveMarkdown: (payload: { relativePath: string; content: string }) => Promise<{
      success: boolean
      updatedAt: string
    }>
    uploadFile: (payload: { relativeDir: string; fileName: string; content: string }) => Promise<{
      success: boolean
      relativePath: string
      updatedAt: string
    }>
  }
  providers: {
    listProviders: () => Promise<ProviderConfig[]>
    setMasterPassword: (password: string) => Promise<{ success: boolean }>
    configureProvider: (
      type: ProviderType,
      config: Record<string, unknown>
    ) => Promise<{ success: boolean }>
    enableProvider: (type: ProviderType) => Promise<boolean>
    disableProvider: (type: ProviderType) => Promise<boolean>
    validateProvider: (type: ProviderType) => Promise<boolean>
    getMetrics: (type: ProviderType) => Promise<ProviderMetric | null>
  }
  operations: {
    getQueueMonitor: () => Promise<QueueMonitorPayload>
    getNotifications: () => Promise<NotificationPayload>
    getDailyBrief: () => Promise<DailyBriefPayload>
    getWeeklyReview: () => Promise<WeeklyReviewPayload>
    getGovernance: () => Promise<GovernancePayload>
    runGovernanceAction: (
      decisionId: string,
      action: 'APPROVE' | 'REJECT' | 'DEFER' | 'COMMIT'
    ) => Promise<GovernancePayload>
    getCompliance: () => Promise<CompliancePayload>
    getTriage: () => Promise<TriageItem[]>
    runTriageAction: (itemId: string, action: 'ANALYZE' | 'CLEAR') => Promise<TriageItem[]>
    getSuites: () => Promise<SuitePayload>
    getFundingDigest: () => Promise<FundingDigestPayload>
    getHiringSim: () => Promise<HiringSimPayload>
    getDesignAudit: () => Promise<DesignAuditPayload>
    getDashboard: () => Promise<DashboardPayload>
    getInfrastructure: () => Promise<InfrastructurePayload>
    getOnboardingKpis: () => Promise<OnboardingKpiPayload>
    getOnboardingCommitStatus: () => Promise<boolean>
    getOnboardingStageSnapshot: () => Promise<OnboardingStageSnapshotPayload>
    saveOnboardingStageSnapshot: (payload: SaveOnboardingStagePayload) => Promise<boolean>
    generateOnboardingKpis: () => Promise<OnboardingKpiPayload>
    removeOnboardingKpi: (agentId: string, kpiId: string) => Promise<OnboardingKpiPayload>
    commitOnboarding: (payload: OnboardingCommitPayload) => Promise<OnboardingCommitResult>
    getEmployeeProfile: (employeeId: string) => Promise<EmployeeProfilePayload>
    getLifecycleSnapshot: () => Promise<LifecycleSnapshotPayload>
    listLifecycleDrafts: (
      status?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'OVERRIDDEN'
    ) => Promise<LifecycleDraftRecord[]>
    reviewLifecycleDraft: (payload: {
      draftId: string
      status: 'APPROVED' | 'REJECTED' | 'OVERRIDDEN'
      reviewer: string
      reviewNote?: string
    }) => Promise<LifecycleUpdateResult>
    updateLifecycleProfile: (payload: {
      agentId: string
      goal: string
      backstory: string
      skills: string[]
      kpis: string[]
    }) => Promise<LifecycleUpdateResult>
    updateLifecycleSkill: (payload: {
      skillId: string
      markdown: string
    }) => Promise<LifecycleUpdateResult>
    updateLifecycleKpi: (payload: {
      kpiId: string
      target: string
      value?: string
    }) => Promise<LifecycleUpdateResult>
    updateLifecycleDataInput: (payload: {
      dataInputId: string
      fileName: string
      content: string
    }) => Promise<LifecycleUpdateResult>
    createLifecycleDataInput: (payload: {
      dataInputId: string
      name: string
      description: string
      schemaType: string
      requiredFields: string[]
      sampleSource: string
      fileName?: string
      content?: string
    }) => Promise<LifecycleUpdateResult>
    createCronProposal: (payload: {
      id: string
      name: string
      expression: string
      retentionDays?: number
      maxRuntimeMs?: number
    }) => Promise<CronProposalRecord>
    listCronProposals: (payload?: {
      status?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'OVERRIDDEN'
    }) => Promise<CronProposalRecord[]>
    reviewCronProposal: (payload: {
      proposalId: string
      status: 'APPROVED' | 'REJECTED' | 'OVERRIDDEN'
      reviewer: string
      reviewNote?: string
    }) => Promise<LifecycleUpdateResult>
    getTaskAuditLog: (limit?: number) => Promise<TaskAuditLogPayload[]>
    getRuntimeChannelConfiguration: () => Promise<RuntimeChannelConfigurationPayload>
    updateRuntimeChannelConfiguration: (
      payload: RuntimeChannelConfigurationPayload
    ) => Promise<RuntimeChannelConfigurationPayload>
    getAdministrationIntegrationSnapshot: () => Promise<AdministrationIntegrationSnapshotPayload>
    syncAdministrationStaffRegistry: () => Promise<AdministrationSyncRunReportPayload>
    ingestAdministrationFeedback: () => Promise<AdministrationSyncRunReportPayload>
    convertDocumentContent: (
      payload: DocumentConversionRequestPayload
    ) => Promise<DocumentConversionResultPayload>
    convertDocumentFile: (
      payload: FileDocumentConversionRequestPayload
    ) => Promise<FileDocumentConversionResultPayload>
    runAdministrationKpiHappinessEvaluator: () => Promise<KpiHappinessEvaluationOutputPayload>
    runAdministrationSocialTrendIntelligence: () => Promise<SocialTrendIntelligenceOutputPayload>
    getGoogleBridgeSnapshot: () => Promise<GoogleBridgeSnapshot | null>
    runGoogleDriveSync: (payload?: { source?: 'MANUAL' | 'CRON' }) => Promise<GoogleDriveSyncResult>
    ensureGoogleDriveSyncSchedule: () => Promise<{
      jobId: string
      target: string
      expression: string
    }>
    publishGooglePolicyDocument: (payload: {
      policyId: string
      htmlContent: string
    }) => Promise<unknown>
    pullGoogleDocumentToVault: (payload: {
      documentId: string
      vaultTargetPath: string
    }) => Promise<unknown>
  }
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
    }) => Promise<ChannelRoutingResult>
    getCapabilities: () => Promise<unknown[]>
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
    }) => Promise<ChannelRoutingResult>
    routeTelegramMessage: (payload: TelegramIngressPayload) => Promise<ChannelRoutingResult>
    listConversations: (payload?: {
      channel?: 'internal-chat' | 'telegram' | 'whatsapp' | 'webhook' | 'api' | string
      limit?: number
    }) => Promise<unknown[]>
    getConversationHistory: (payload: {
      conversationKey: string
      limit?: number
    }) => Promise<unknown>
    onEscalation: (
      callback: (event: unknown, payload: { taskId: string; reason: string }) => void
    ) => () => void
    clearEscalation: (payload: { taskId: string }) => Promise<boolean>
  }
  workOrders: {
    submitDirectorRequest: (payload: {
      moduleRoute: string
      targetEmployeeId?: string
      message: string
      timestampIso?: string
    }) => Promise<RoutedRequestResult>
    startNext: () => Promise<RoutedRequestResult | null>
    processNext: () => Promise<ProcessedWorkOrderResult | null>
    complete: (workOrderId: string, summary?: string) => Promise<WorkOrderRecord | null>
    fail: (workOrderId: string, error?: string) => Promise<WorkOrderRecord | null>
    approve: (workOrderId: string, summary?: string) => Promise<WorkOrderRecord | null>
    reject: (workOrderId: string, error?: string) => Promise<WorkOrderRecord | null>
    list: () => Promise<WorkOrderRecord[]>
    get: (id: string) => Promise<WorkOrderRecord | null>
    queueList: () => Promise<QueueEntry[]>
  }
  dharma: {
    getCompanies: () => Promise<any>
    getCompany: (companyId: string) => Promise<any>
    getActiveCompany: () => Promise<string | null>
    setActiveCompany: (companyId: string) => Promise<void>
    getAgents: (companyId: string) => Promise<any>
    getAgent: (companyId: string, agentPath: string) => Promise<any>
    getSkills: (companyId: string) => Promise<any>
    getProtocols: (companyId: string) => Promise<any>
    getWorkflows: (companyId: string) => Promise<any>
    getKpis: (companyId: string) => Promise<any>
    getDataInputs: (companyId: string) => Promise<any>
    getProducts: (companyId: string) => Promise<any>
    getProduct: (companyId: string, productId: string) => Promise<any>
    getAgentsSyncStatus: (companyId: string) => Promise<Record<string, any>>
    getSkillsSyncStatus: (companyId: string) => Promise<Record<string, any>>
    getProtocolsSyncStatus: (companyId: string) => Promise<Record<string, any>>
    getWorkflowsSyncStatus: (companyId: string) => Promise<Record<string, any>>
    getKpisSyncStatus: (companyId: string) => Promise<Record<string, any>>
    getDataInputsSyncStatus: (companyId: string) => Promise<Record<string, any>>
    getProductsSyncStatus: (companyId: string) => Promise<Record<string, any>>
    syncAgentToCache: (companyId: string, agent: unknown) => Promise<any>
    syncSkillToCache: (companyId: string, skill: unknown) => Promise<any>
    syncProtocolToCache: (companyId: string, protocol: unknown) => Promise<any>
    syncWorkflowToCache: (companyId: string, workflow: unknown) => Promise<any>
    syncKpiToCache: (companyId: string, kpi: unknown) => Promise<any>
    syncDataInputToCache: (companyId: string, dataInput: unknown) => Promise<any>
    syncProductToCache: (companyId: string, product: unknown) => Promise<any>
    saveAgentToVault: (companyId: string, agent: unknown) => Promise<any>
    saveSkillToVault: (companyId: string, skill: unknown) => Promise<any>
    saveProtocolToVault: (companyId: string, protocol: unknown) => Promise<any>
    saveWorkflowToVault: (companyId: string, workflow: unknown) => Promise<any>
    saveKpiToVault: (companyId: string, kpi: unknown) => Promise<any>
    saveDataInputToVault: (companyId: string, dataInput: unknown) => Promise<any>
    saveProductToVault: (companyId: string, product: unknown) => Promise<any>
  }
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: DhiApi
    __pranaBootstrapConfig?: Record<string, unknown>
    __pranaBrandingConfig?: Record<string, unknown>
    __pranaTestBrandingConfig?: Record<string, unknown>
  }
}
