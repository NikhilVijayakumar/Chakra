export const enOnboardingTranslations: Record<string, string> = {
  'onboarding.action.approveAndCommit': 'Approve and Commit',
  'onboarding.action.approveStep': 'Approve Current Step',
  'onboarding.action.back': 'Previous',
  'onboarding.action.commit': 'Commit To Vault',
  'onboarding.action.complete': 'Mount Environment',
  'onboarding.action.continue': 'Continue',
  'onboarding.action.directorApproveAll': 'Director Approve All',
  'onboarding.action.home': 'Home',
  'onboarding.action.next': 'Next Phase',
  'onboarding.action.reloadCommitted': 'Reload Committed',
  'onboarding.commit.error.generic': 'Commit failed. Please review your draft and try again.',
  'onboarding.dashboard.openDetail': 'Open Detail',
  'onboarding.dashboard.phaseTracker': 'Phase Tracker',
  'onboarding.dashboard.title': 'Master Status Dashboard',
  'onboarding.dynamic.addField': 'Add Field',
  'onboarding.dynamic.keyLabel': 'Field Label',
  'onboarding.dynamic.modeHelp':
    'Dual-entry mode: manually add fields or upload a JSON file. Uploaded keys become labels and values become editable inputs.',
  'onboarding.dynamic.noGuidance': 'No schema guidance available for this field.',
  'onboarding.dynamic.removeField': 'Remove field',
  'onboarding.dynamic.uploadJson': 'Upload JSON',
  'onboarding.dynamic.valueLabel': 'Field Value',
  'onboarding.final.emptySection': 'No fields entered for this section.',
  'onboarding.final.kpiCommitPreview': 'KPI Commit Payload Preview',
  'onboarding.final.modelAccessTitle': 'Model Access Summary (volatile)',
  'onboarding.final.noKpis':
    'No KPI fields detected yet. Go back and enter KPI data before committing.',
  'onboarding.final.openLifecycleManager': 'Open Lifecycle Manager',
  'onboarding.final.openRegistryViewer': 'Open Registry Viewer',
  'onboarding.final.registryToolsBody':
    'Need keyword-based registry browsing, markdown editing, or full file upload? Open the lifecycle manager and registry viewer.',
  'onboarding.final.registryToolsTitle': 'Registry Tools',
  'onboarding.final.summaryHelp':
    'Final review: verify KPI and model access details before approving one-time commit.',
  'onboarding.guard.commitCurrentStepFirst': 'Approve the current step before moving forward.',
  'onboarding.guard.conflict':
    'Vault data differs from your current session state. Reload committed data or recommit.',
  'onboarding.guard.dependencyBlocked': 'This screen depends on committed data from:',
  'onboarding.guard.emptyVault':
    'No committed data exists for this screen owner. Provide initial data and commit to Vault.',
  'onboarding.guard.masterCommitBlocked':
    'Master commit is blocked until all dependency steps are approved.',
  'onboarding.guard.missingInput':
    'This step requires at least one non-empty field before moving forward.',
  'onboarding.guard.modelConfigRequired':
    'Enable at least one model endpoint and provide endpoint/model values before approval.',
  'onboarding.guard.phase2Quality':
    'Phase 2 has unresolved mandatory quality fields. Complete all vision and KPI requirements before entering Model Access.',
  'onboarding.json.error.invalidObject': 'JSON upload must contain an object with key/value pairs.',
  'onboarding.json.error.parse': 'Unable to parse JSON file. Please verify syntax and try again.',
  'onboarding.modelAccess.apiKey': 'API Key',
  'onboarding.modelAccess.contextWindow': 'Context Window (tokens)',
  'onboarding.modelAccess.contextWindowHelper':
    'Optional: Specify if your model has a different context limit',
  'onboarding.modelAccess.enabled': 'Enabled',
  'onboarding.modelAccess.endpoint': 'Endpoint',
  'onboarding.modelAccess.gemini.title': 'Gemini',
  'onboarding.modelAccess.lmstudio.title': 'LM Studio',
  'onboarding.modelAccess.model': 'Model',
  'onboarding.modelAccess.openrouter.title': 'OpenRouter',
  'onboarding.modelAccess.reservedOutputTokens': 'Reserved Output Tokens',
  'onboarding.modelAccess.reservedOutputTokensHelper':
    'Optional: Reserve tokens for model output if different from default',
  'onboarding.modelAccess.volatileNotice':
    'Model Access details are volatile and remain local to this running session. They are never committed to Vault.',
  'onboarding.phase.requiresReverification': 'Requires Re-Verification',
  'onboarding.phase.state.approved': 'APPROVED',
  'onboarding.phase.state.draft': 'DRAFT',
  'onboarding.phase.state.inProgress': 'IN-PROGRESS',
  'onboarding.phase.state.locked': 'LOCKED',
  'onboarding.phase.state.validated': 'VALIDATED',
  'onboarding.schema.mandatoryComplete': '✅ Mandatory field complete',
  'onboarding.schema.mandatoryMissing': '⚠️ Mandatory for Efficiency',
  'onboarding.schema.optionalComplete': '✅ Optional field complete',
  'onboarding.schema.optionalMissing': '⚠️ Optional (recommended to improve output quality)',
  'onboarding.schema.stepNeedsAttention': 'This step still has mandatory quality gaps.',
  'onboarding.schema.stepReady': 'This step satisfies the minimum quality schema.',
  'onboarding.status.committed': 'Committed',
  'onboarding.status.draft': 'Draft',
  'onboarding.step1.body':
    'Define company vision, context, values, and global non-negotiables. Director approval is required before the next stage unlocks.',
  'onboarding.step1.title': 'Step 1: Company Core',
  'onboarding.step2.body':
    'Define product value proposition, features, and technical constraints that refine downstream agent decisions.',
  'onboarding.step2.title': 'Step 2: Product Contextualization',
  'onboarding.step3.body':
    'Approve shared Skills and KPIs validated against Company and Product context.',
  'onboarding.step3.title': 'Step 3: Global Asset Alignment (Skills and KPIs)',
  'onboarding.step4.body':
    'Approve communication and security protocols, plus raw data input schemas required for runtime.',
  'onboarding.step4.title': 'Step 4: Global Operational Guardrails',
  'onboarding.step5.body':
    'Finalize each virtual employee profile, including core objective and vision aligned to company context.',
  'onboarding.step5.title': 'Step 5: Agent Profile and Persona',
  'onboarding.step6.body':
    'Approve workflow definitions and execution chains for each approved agent profile.',
  'onboarding.step6.title': 'Step 6: Dedicated Agent Workflows',
  'onboarding.step7.body':
    'Configure model access and channel routing. Director Approve All unlocks only when this phase is approved.',
  'onboarding.step7.title': 'Step 7: Infrastructure Finalization',
  'onboarding.unknownBody': 'Unknown step',
  'onboarding.unknownTitle': 'Unknown',
  'splash.booting': 'INITIALIZING SECURE ENVIRONMENT',
  'splash.check.models': 'Pinging local Model Gateway...',
  'splash.check.ssh': 'Establishing secure SSH tunnel...',
  'splash.check.vault': 'Mounting encrypted vault container...',
  'splash.ready': 'SYSTEM READY'
}
