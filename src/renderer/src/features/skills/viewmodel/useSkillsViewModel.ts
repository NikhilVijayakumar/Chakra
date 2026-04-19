import { useState, useEffect, useCallback } from 'react'
import { SkillsRepo, type SkillDoc, type SyncStatus } from '../repo/SkillsRepo'

const repo = new SkillsRepo()

export interface SkillWithStatus {
  skill: SkillDoc
  syncStatus: SyncStatus
  lastSyncedAt?: string
}

export interface SkillsViewState {
  skills: SkillWithStatus[]
  selectedSkill: SkillWithStatus | null
  isLoading: boolean
  error: string | null
  isSaving: boolean
}

export interface SkillsViewModel extends SkillsViewState {
  selectSkill: (skill: SkillWithStatus) => void
  saveSkillToVault: (skill: SkillDoc) => Promise<void>
  refreshSkills: () => Promise<void>
}

const DEFAULT_COMPANY_ID = 'bavans-publishing'

export const useSkillsViewModel = (companyId?: string): SkillsViewModel => {
  const actualCompanyId = companyId || DEFAULT_COMPANY_ID

  const [skills, setSkills] = useState<SkillWithStatus[]>([])
  const [selectedSkill, setSelectedSkill] = useState<SkillWithStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const loadSkills = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const [skillsResponse, syncResponse] = await Promise.all([
        repo.getSkills(actualCompanyId),
        repo.getSyncStatus(actualCompanyId)
      ])

      if (skillsResponse.isSuccess && skillsResponse.data) {
        const syncMap = syncResponse.isSuccess && syncResponse.data ? syncResponse.data : {}

        const skillsWithStatus: SkillWithStatus[] = skillsResponse.data.map((skill) => ({
          skill,
          syncStatus: syncMap[skill.id] || 'DRAFT'
        }))

        setSkills(skillsWithStatus)
      } else {
        setError(String(skillsResponse.statusMessage ?? 'Failed to load skills'))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }, [actualCompanyId])

  const selectSkill = useCallback((skillWithStatus: SkillWithStatus) => {
    setSelectedSkill(skillWithStatus)
  }, [])

  const saveSkillToVault = useCallback(
    async (skill: SkillDoc) => {
      try {
        setIsSaving(true)
        setError(null)

        const response = await repo.saveSkillToVault(actualCompanyId, skill)
        if (response.isSuccess) {
          setSkills((prev) =>
            prev.map((s) =>
              s.skill.id === skill.id
                ? {
                    ...s,
                    syncStatus: 'IN_VAULT' as SyncStatus,
                    lastSyncedAt: new Date().toISOString()
                  }
                : s
            )
          )
          if (selectedSkill?.skill.id === skill.id) {
            setSelectedSkill((prev) =>
              prev
                ? {
                    ...prev,
                    syncStatus: 'IN_VAULT' as SyncStatus,
                    lastSyncedAt: new Date().toISOString()
                  }
                : null
            )
          }
        } else {
          setError(String(response.statusMessage ?? 'Failed to save to vault'))
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to save to vault')
      } finally {
        setIsSaving(false)
      }
    },
    [actualCompanyId, selectedSkill]
  )

  useEffect(() => {
    loadSkills()
  }, [loadSkills])

  return {
    skills,
    selectedSkill,
    isLoading,
    error,
    isSaving,
    selectSkill,
    saveSkillToVault,
    refreshSkills: loadSkills
  }
}
