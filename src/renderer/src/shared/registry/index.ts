import type {
  AgentDefinition,
  DataInputDefinition,
  DynamicFieldRecord,
  FieldSchemaByStep,
  FieldSchemaRule,
  InitialDraftByStep,
  KpiDefinition,
  ModuleManifest
} from './types'

const moduleManifestFiles = import.meta.glob('./modules/*.manifest.json', { eager: true })
const agentFiles = import.meta.glob('./agents/*.json', { eager: true })
const kpiFiles = import.meta.glob('./kpis/*.json', { eager: true })
const dataInputFiles = import.meta.glob('./data-inputs/*.json', { eager: true })
const onboardingFieldSchemaFiles = import.meta.glob('./onboarding/schemas/field-schema.json', {
  eager: true
})
const onboardingInitialDraftFiles = import.meta.glob('./onboarding/defaults/initial-drafts.json', {
  eager: true
})

const asRecord = <T>(module: unknown): T | null => {
  if (!module || typeof module !== 'object') {
    return null
  }

  const maybeDefault = (module as { default?: unknown }).default
  if (maybeDefault && typeof maybeDefault === 'object') {
    return maybeDefault as T
  }

  // Fallback if Vite JSON import returns the object itself rather than { default: ... }
  return module as T
}

const toUidFromPath = (path: string): string => {
  const segments = path.replace(/\\/g, '/').split('/')
  const last = segments[segments.length - 1] ?? ''
  return last.replace(/\.json$/, '')
}

const listJsonModuleDefaults = <T>(files: Record<string, unknown>): T[] => {
  return Object.values(files)
    .map((entry) => asRecord<T>(entry))
    .filter((entry): entry is T => entry !== null)
}

const listJsonModulesWithUid = <T extends object>(
  files: Record<string, unknown>
): Array<T & { uid: string }> => {
  return Object.entries(files)
    .map(([path, entry]) => {
      const parsed = asRecord<T>(entry)
      if (!parsed) {
        return null
      }

      const parsedWithUid = parsed as T & Partial<{ uid: string }>
      return {
        ...parsed,
        uid:
          typeof parsedWithUid.uid === 'string' && parsedWithUid.uid.length > 0
            ? parsedWithUid.uid
            : toUidFromPath(path)
      }
    })
    .filter((entry): entry is T & { uid: string } => entry !== null)
}

const sanitizeAgents = (input: Array<AgentDefinition>): AgentDefinition[] => {
  return input.filter((entry) => {
    return (
      typeof entry.uid === 'string' &&
      typeof entry.name === 'string' &&
      typeof entry.role === 'string' &&
      typeof entry.backstory === 'string' &&
      typeof entry.goal === 'string' &&
      typeof entry.core_objective === 'string' &&
      typeof entry.individual_vision === 'string' &&
      Array.isArray(entry.role_non_negotiable_requirements) &&
      Array.isArray(entry.skills) &&
      Array.isArray(entry.kpis) &&
      Array.isArray(entry.data_requirements)
    )
  })
}

const sanitizeKpis = (input: KpiDefinition[]): KpiDefinition[] => {
  return input.filter((entry) => {
    return (
      typeof entry.uid === 'string' &&
      typeof entry.name === 'string' &&
      typeof entry.description === 'string' &&
      typeof entry.unit === 'string' &&
      typeof entry.target === 'string' &&
      typeof entry.value === 'string' &&
      typeof entry.goalMapping === 'string'
    )
  })
}

const sanitizeDataInputs = (input: DataInputDefinition[]): DataInputDefinition[] => {
  return input.filter((entry) => {
    return (
      typeof entry.uid === 'string' &&
      typeof entry.name === 'string' &&
      typeof entry.description === 'string' &&
      typeof entry.schemaType === 'string' &&
      Array.isArray(entry.requiredFields) &&
      typeof entry.sampleSource === 'string'
    )
  })
}

const sanitizeFieldSchemaByStep = (input: unknown): FieldSchemaByStep => {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return {}
  }

  const result: FieldSchemaByStep = {}
  Object.entries(input as Record<string, unknown>).forEach(([stepId, rules]) => {
    if (!Array.isArray(rules)) {
      return
    }

    const sanitized = rules.filter((rule): rule is FieldSchemaRule => {
      return (
        !!rule &&
        typeof rule === 'object' &&
        typeof (rule as FieldSchemaRule).key === 'string' &&
        typeof (rule as FieldSchemaRule).guidance === 'string' &&
        typeof (rule as FieldSchemaRule).mandatoryForEfficiency === 'boolean'
      )
    })

    result[stepId] = sanitized
  })

  return result
}

const sanitizeInitialDraftByStep = (input: unknown): InitialDraftByStep => {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return {}
  }

  const result: InitialDraftByStep = {}
  Object.entries(input as Record<string, unknown>).forEach(([stepId, fields]) => {
    if (!Array.isArray(fields)) {
      return
    }

    result[stepId] = fields.filter((field): field is DynamicFieldRecord => {
      return (
        !!field &&
        typeof field === 'object' &&
        typeof (field as DynamicFieldRecord).key === 'string' &&
        typeof (field as DynamicFieldRecord).value === 'string'
      )
    })
  })

  return result
}

const buildAgentSetupSchema = (
  agents: AgentDefinition[],
  kpiByUid: Map<string, KpiDefinition>
): FieldSchemaRule[] => {
  return agents.flatMap((agent) => [
    {
      key: `${agent.uid}.core_objective`,
      mandatoryForEfficiency: true,
      guidance: `${agent.name} core objective should define the primary measurable mission for this role.`,
      minWords: 12
    },
    {
      key: `${agent.uid}.individual_vision`,
      mandatoryForEfficiency: true,
      guidance: `${agent.name} individual vision must align with company vision and role scope.`,
      minWords: 16
    },
    {
      key: `${agent.uid}.role_non_negotiable_requirements`,
      mandatoryForEfficiency: true,
      guidance: `${agent.name} role-specific non-negotiables must define hard boundaries.`,
      minWords: 3
    },
    {
      key: `${agent.uid}.goal`,
      mandatoryForEfficiency: true,
      guidance: `${agent.name} goal should be role-specific, outcome-oriented, and measurable.`,
      minWords: 14
    },
    {
      key: `${agent.uid}.backstory`,
      mandatoryForEfficiency: true,
      guidance: `${agent.name} backstory should explain professional context and operating style.`,
      minWords: 18
    },
    {
      key: `${agent.uid}.skills`,
      mandatoryForEfficiency: true,
      guidance: `${agent.name} skill list should map to core capabilities in the shared skill library.`,
      minWords: 2
    },
    {
      key: `${agent.uid}.required_kpis`,
      mandatoryForEfficiency: true,
      guidance: `${agent.name} KPI linkage should map to goals: ${agent.kpis.map((uid) => kpiByUid.get(uid)?.name ?? uid).join(', ')}.`,
      minWords: 2
    }
  ])
}

const buildAgentSetupDraft = (agents: AgentDefinition[]): DynamicFieldRecord[] => {
  return agents.flatMap((agent) => [
    {
      key: `${agent.uid}.core_objective`,
      value: agent.core_objective
    },
    {
      key: `${agent.uid}.individual_vision`,
      value: agent.individual_vision
    },
    {
      key: `${agent.uid}.role_non_negotiable_requirements`,
      value: agent.role_non_negotiable_requirements.join(', ')
    },
    {
      key: `${agent.uid}.goal`,
      value: agent.goal
    },
    {
      key: `${agent.uid}.backstory`,
      value: agent.backstory
    },
    {
      key: `${agent.uid}.skills`,
      value: agent.skills.join(', ')
    },
    {
      key: `${agent.uid}.required_kpis`,
      value: agent.kpis.join(', ')
    }
  ])
}

export const listModuleManifests = (): ModuleManifest[] => {
  return Object.values(moduleManifestFiles)
    .map((entry) => asRecord<ModuleManifest>(entry))
    .filter((entry): entry is ModuleManifest => {
      return (
        !!entry &&
        typeof entry.id === 'string' &&
        typeof entry.title === 'string' &&
        typeof entry.enabled === 'boolean' &&
        typeof entry.ownership === 'string'
      )
    })
    .sort((left, right) => left.id.localeCompare(right.id))
}

export const getModuleManifest = (moduleId: string): ModuleManifest | undefined => {
  return listModuleManifests().find((manifest) => manifest.id === moduleId)
}

export const getRegistryAgents = (): AgentDefinition[] => {
  const parsed = listJsonModulesWithUid<Omit<AgentDefinition, 'uid'>>(agentFiles).map((entry) => ({
    uid: entry.uid,
    name: entry.name,
    role: entry.role,
    backstory: entry.backstory,
    goal: entry.goal,
    core_objective:
      typeof entry.core_objective === 'string' && entry.core_objective.trim().length > 0
        ? entry.core_objective
        : entry.goal,
    individual_vision:
      typeof entry.individual_vision === 'string' && entry.individual_vision.trim().length > 0
        ? entry.individual_vision
        : entry.goal,
    role_non_negotiable_requirements:
      Array.isArray(entry.role_non_negotiable_requirements) &&
      entry.role_non_negotiable_requirements.length > 0
        ? entry.role_non_negotiable_requirements
        : ['Align with company vision and non-negotiables before execution'],
    skills: entry.skills,
    kpis: entry.kpis,
    data_requirements: entry.data_requirements
  }))

  return sanitizeAgents(parsed)
}

export const getRegistryKpis = (): KpiDefinition[] => {
  return sanitizeKpis(listJsonModuleDefaults<KpiDefinition>(kpiFiles))
}

export const getRegistryDataInputs = (): DataInputDefinition[] => {
  return sanitizeDataInputs(listJsonModuleDefaults<DataInputDefinition>(dataInputFiles))
}

export const getOnboardingFieldSchema = (
  agents?: AgentDefinition[],
  kpis?: KpiDefinition[]
): FieldSchemaByStep => {
  const first = Object.values(onboardingFieldSchemaFiles)[0]
  const parsed = asRecord<FieldSchemaByStep>(first)
  const currentAgents = agents ?? getRegistryAgents()
  const currentKpis = kpis ?? getRegistryKpis()
  const kpiByUid = new Map(currentKpis.map((entry) => [entry.uid, entry]))

  return {
    ...sanitizeFieldSchemaByStep(parsed),
    'agent-profile-persona': buildAgentSetupSchema(currentAgents, kpiByUid)
  }
}

export const getOnboardingInitialDraftByStep = (
  agents?: AgentDefinition[],
  kpis?: KpiDefinition[]
): InitialDraftByStep => {
  const first = Object.values(onboardingInitialDraftFiles)[0]
  const parsed = asRecord<InitialDraftByStep>(first)
  const currentAgents = agents ?? getRegistryAgents()
  void kpis

  return {
    ...sanitizeInitialDraftByStep(parsed),
    'agent-profile-persona': buildAgentSetupDraft(currentAgents)
  }
}

export type {
  AgentDefinition,
  DataInputDefinition,
  FieldSchemaRule,
  InitialDraftByStep,
  KpiDefinition,
  ModuleManifest
} from './types'
export type {
  OnboardingFieldSchemaMap,
  OnboardingSchemaFieldKey,
  OnboardingSchemaStepId
} from './generated/onboarding-schema.generated'
