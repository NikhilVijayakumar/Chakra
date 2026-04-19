import { useEffect, useState } from 'react'
import { useDataState } from 'astra'
import { TriageRepo, TriageItem, TriageMemoryHit } from '../repo/TriageRepo'

export const useTriageViewModel = () => {
  const repo = new TriageRepo()
  const [inboxState, executeFetch] = useDataState<TriageItem[]>()
  const [memoryState, executeMemorySearch] = useDataState<TriageMemoryHit[]>()
  const [isApplyingAction, setIsApplyingAction] = useState(false)
  const [memoryQuery, setMemoryQuery] = useState('')

  const loadInbox = async () => {
    await executeFetch(() => repo.fetchInbox())
  }

  useEffect(() => {
    loadInbox()
  }, [])

  const runTriageAction = async (itemId: string, action: 'ANALYZE' | 'CLEAR') => {
    if (isApplyingAction) return
    setIsApplyingAction(true)
    try {
      await repo.runAction(itemId, action)
      await loadInbox()
    } finally {
      setIsApplyingAction(false)
    }
  }

  const searchRelatedMemory = async (query: string) => {
    setMemoryQuery(query)
    if (!query.trim()) {
      return
    }
    await executeMemorySearch(() => repo.searchMemory(query))
  }

  return {
    state: inboxState,
    memoryState,
    memoryQuery,
    setMemoryQuery,
    reload: loadInbox,
    runTriageAction,
    searchRelatedMemory,
    isApplyingAction
  }
}
