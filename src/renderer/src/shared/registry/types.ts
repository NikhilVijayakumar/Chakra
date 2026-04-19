export interface ModuleManifest {
  id: string
  title: string
  route: string | null
  enabled: boolean
  ownership: string
}

export interface AgentDefinition {
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
  data_requirements: string[]
}

export interface KpiDefinition {
  uid: string
  name: string
  description: string
  unit: string
  target: string
  value: string
  goalMapping: string
}

export interface DataInputDefinition {
  uid: string
  name: string
  description: string
  schemaType: 'tabular' | 'event-stream' | 'document' | 'timeseries'
  requiredFields: string[]
  sampleSource: string
}

export interface DynamicFieldRecord {
  key: string
  value: string
}

export interface FieldSchemaRule {
  key: string
  mandatoryForEfficiency: boolean
  guidance: string
  minWords?: number
  exampleText?: string
}

export type FieldSchemaByStep = Record<string, FieldSchemaRule[]>
export type InitialDraftByStep = Record<string, DynamicFieldRecord[]>
