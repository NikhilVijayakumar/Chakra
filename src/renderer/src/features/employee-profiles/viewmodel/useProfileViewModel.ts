import { useMemo } from 'react'
import { getEmployeeAvatarPath } from 'prana/ui/constants/employeeDirectory'
import { useLifecycle } from 'prana/ui/state/LifecycleProvider'

export const useProfileViewModel = (employeeId: string) => {
  const lifecycle = useLifecycle()

  const profile = useMemo(() => {
    const source = lifecycle.profiles.find((entry) => entry.agentId === employeeId)
    if (!source) {
      return null
    }

    return source
  }, [employeeId, lifecycle.globalSkills, lifecycle.profiles])

  return {
    profile,
    avatar: profile ? getEmployeeAvatarPath(profile.agentId) : '',
    globalSkills: lifecycle.globalSkills,
    isLoading: lifecycle.isLoading,
    error: lifecycle.error,
    dirtyProfile: lifecycle.dirtyProfiles[employeeId] === true,
    updateProfile: (patch: {
      goal?: string
      backstory?: string
      skills?: string[]
      kpis?: string[]
    }) => {
      lifecycle.updateProfileLocal(employeeId, patch)
    },
    saveProfile: () => lifecycle.saveProfile(employeeId),
    updateSkill: (skillId: string, markdown: string) =>
      lifecycle.updateGlobalSkillLocal(skillId, markdown),
    saveSkill: (skillId: string) => lifecycle.saveSkill(skillId)
  }
}
