export interface SkillEntry {
  id: string
  name: string
  description?: string
  tags?: string[]
}

export const SkillRepo = {
  list: (): SkillEntry[] => [],
  getById: (_id: string): SkillEntry | null => null
}
