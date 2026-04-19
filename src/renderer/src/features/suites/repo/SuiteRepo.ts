import { successResponse } from 'prana/services/ipcResponseFactory'
import type { ServerResponse } from 'astra'
import { SkillRepo } from 'prana/ui/repo/skills'
import type { SkillEntry } from 'prana/ui/repo/skills'

export interface AgentProfile {
  id: string
  name: string
  role: string
  subAgents: number
  status: 'IDLE' | 'EXECUTING' | 'WAITING' | `WAITING_ON_${string}`
  lastActive: string
}

export interface SuitePayload {
  agents: AgentProfile[]
  skills: SkillEntry[]
}

export class SuiteRepo {
  private readonly skillRepo = new SkillRepo()

  async fetchSuiteData(): Promise<ServerResponse<SuitePayload>> {
    const payload = await window.api.operations.getSuites()
    return successResponse(payload, 'Agents fetched')
  }

  async executeSkill(skillId: string) {
    return this.skillRepo.executeSkill(skillId)
  }
}
