import { useEffect, useState } from 'react'
import { useDataState } from 'astra'
import { SuiteRepo, SuitePayload } from '../repo/SuiteRepo'

export const useSuiteViewModel = () => {
  const repo = new SuiteRepo()
  const [suiteState, executeFetch] = useDataState<SuitePayload>()
  const [executionLog, setExecutionLog] = useState<string>('No skill executed yet.')

  const loadAgents = async () => {
    await executeFetch(() => repo.fetchSuiteData())
  }

  const runSkill = async (skillId: string) => {
    const response = await repo.executeSkill(skillId)
    const output = response.data?.output ?? 'Skill execution did not return output.'
    setExecutionLog(output)
  }

  useEffect(() => {
    loadAgents()
  }, [])

  return {
    state: suiteState,
    reload: loadAgents,
    runSkill,
    executionLog
  }
}
