import { successResponse } from 'prana/services/ipcResponseFactory'
import type { ServerResponse } from 'astra'

export interface TriageItem {
  id: string
  source: string
  topic: string
  receivedAt: string
  status: 'PENDING' | 'ANALYSIS' | 'CLEARED'
}

export interface TriageMemoryHit {
  chunkId: string
  relativePath: string
  title: string
  classification: 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'RESTRICTED'
  chunkIndex: number
  score: number
  excerpt: string
}

export class TriageRepo {
  async fetchInbox(): Promise<ServerResponse<TriageItem[]>> {
    const items = await window.api.operations.getTriage()
    return successResponse(items, 'Fetched successfully')
  }

  async runAction(
    itemId: string,
    action: 'ANALYZE' | 'CLEAR'
  ): Promise<ServerResponse<TriageItem[]>> {
    const items = await window.api.operations.runTriageAction(itemId, action)
    return successResponse(items, 'Triage action applied')
  }

  async searchMemory(query: string, limit = 5): Promise<ServerResponse<TriageMemoryHit[]>> {
    const payload = await window.api.memory.query({
      query,
      limit,
      pathPrefixes: ['data/processed/', 'agent-temp/'],
      allowedClassifications: ['PUBLIC', 'INTERNAL', 'CONFIDENTIAL', 'RESTRICTED']
    })

    return successResponse(
      payload.results.map((result) => ({
        chunkId: result.chunkId,
        relativePath: result.relativePath,
        title: result.title,
        classification: result.classification,
        chunkIndex: result.chunkIndex,
        score: result.score,
        excerpt: result.excerpt
      })),
      'Triage memory loaded'
    )
  }
}
