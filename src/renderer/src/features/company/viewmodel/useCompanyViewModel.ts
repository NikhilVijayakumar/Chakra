import { useState, useEffect, useCallback } from 'react'
import { CompanyRepo, type CompanyData } from '../repo/CompanyRepo'

const repo = new CompanyRepo()

export interface CompanyViewState {
  company: CompanyData | null
  isLoading: boolean
  error: string | null
  isDirty: boolean
  isSaving: boolean
}

export interface CompanyViewModel extends CompanyViewState {
  updateCompany: (updates: Partial<CompanyData>) => void
  saveCompany: () => Promise<void>
  refreshCompany: () => Promise<void>
}

const DEFAULT_COMPANY_ID = 'bavans-publishing'

export const useCompanyViewModel = (companyId?: string): CompanyViewModel => {
  const actualCompanyId = companyId || DEFAULT_COMPANY_ID

  const [company, setCompany] = useState<CompanyData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDirty, setIsDirty] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const loadCompany = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await repo.getCompany(actualCompanyId)
      if (response.isSuccess && response.data) {
        setCompany(response.data)
      } else {
        setError(String(response.statusMessage ?? 'Failed to load company'))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }, [actualCompanyId])

  useEffect(() => {
    loadCompany()
  }, [loadCompany])

  const updateCompany = useCallback((updates: Partial<CompanyData>) => {
    setCompany((prev) => {
      if (!prev) return null
      return { ...prev, ...updates }
    })
    setIsDirty(true)
  }, [])

  const saveCompany = useCallback(async () => {
    if (!company) return

    try {
      setIsSaving(true)
      setError(null)
      await repo.saveCompany(actualCompanyId, company)
      setIsDirty(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save company')
    } finally {
      setIsSaving(false)
    }
  }, [company, actualCompanyId])

  return {
    company,
    isLoading,
    error,
    isDirty,
    isSaving,
    updateCompany,
    saveCompany,
    refreshCompany: loadCompany
  }
}
