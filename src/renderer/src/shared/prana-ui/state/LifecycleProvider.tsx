import { useState, useEffect, useCallback } from 'react'

export interface LifecycleProfileDraft {
  agentId: string
  name: string
  role: string
  goal: string
  backstory: string
  skills: string[]
  kpis: string[]
  kpiStatus: Array<{ name: string; value: string; trend: 'up' | 'down' | 'neutral' }>
}

export interface LifecycleKpiDefinition {
  id: string
  name: string
  description: string
  unit: string
  target: string
  value: string
  linkedAgents: string[]
}

export interface LifecycleGlobalSkill {
  id: string
  title: string
  tags: string[]
  markdown: string
}

interface LifecycleApi {
  profiles: LifecycleProfileDraft[]
  kpis: LifecycleKpiDefinition[]
  globalSkills: LifecycleGlobalSkill[]
  updateProfileLocal: (agentId: string, updates: Partial<LifecycleProfileDraft>) => void
  saveProfile: (agentId: string) => Promise<{ success: boolean; error?: string }>
  updateKpiLocal: (id: string, updates: Partial<LifecycleKpiDefinition>) => void
  saveKpi: (id: string) => Promise<{ success: boolean; error?: string }>
}

export const useLifecycle = (): LifecycleApi => {
  const [profiles, setProfiles] = useState<LifecycleProfileDraft[]>([])
  const [kpis, setKpis] = useState<LifecycleKpiDefinition[]>([])
  const [globalSkills] = useState<LifecycleGlobalSkill[]>([])

  useEffect(() => {
    const api = (window as any).api
    if (!api?.operations?.getLifecycleSnapshot) return
    api.operations
      .getLifecycleSnapshot()
      .then((snapshot: any) => {
        if (snapshot?.profiles) setProfiles(snapshot.profiles)
        if (snapshot?.kpis) setKpis(snapshot.kpis)
      })
      .catch(() => {})
  }, [])

  const updateProfileLocal = useCallback(
    (agentId: string, updates: Partial<LifecycleProfileDraft>) => {
      setProfiles((prev) => prev.map((p) => (p.agentId === agentId ? { ...p, ...updates } : p)))
    },
    []
  )

  const saveProfile = useCallback(
    async (agentId: string): Promise<{ success: boolean; error?: string }> => {
      const profile = profiles.find((p) => p.agentId === agentId)
      if (!profile) return { success: false, error: 'Profile not found' }
      try {
        const api = (window as any).api
        if (!api?.operations?.updateLifecycleProfile)
          return { success: false, error: 'API not available' }
        const result = await api.operations.updateLifecycleProfile({
          agentId: profile.agentId,
          goal: profile.goal,
          backstory: profile.backstory,
          skills: profile.skills,
          kpis: profile.kpis
        })
        return { success: result?.success ?? false, error: result?.validationErrors?.[0] }
      } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : 'Save failed' }
      }
    },
    [profiles]
  )

  const updateKpiLocal = useCallback(
    (id: string, updates: Partial<LifecycleKpiDefinition>) => {
      setKpis((prev) => prev.map((k) => (k.id === id ? { ...k, ...updates } : k)))
    },
    []
  )

  const saveKpi = useCallback(
    async (id: string): Promise<{ success: boolean; error?: string }> => {
      const kpi = kpis.find((k) => k.id === id)
      if (!kpi) return { success: false, error: 'KPI not found' }
      try {
        const api = (window as any).api
        if (!api?.operations?.updateLifecycleKpi)
          return { success: false, error: 'API not available' }
        const result = await api.operations.updateLifecycleKpi({
          kpiId: kpi.id,
          target: kpi.target,
          value: kpi.value
        })
        return { success: result?.success ?? false, error: result?.validationErrors?.[0] }
      } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : 'Save failed' }
      }
    },
    [kpis]
  )

  return { profiles, kpis, globalSkills, updateProfileLocal, saveProfile, updateKpiLocal, saveKpi }
}
