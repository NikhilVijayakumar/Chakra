import { useEffect, useState } from 'react'
import { useDataState } from 'astra'
import type { FundingDigestPayload } from '../../funding-digest/repo/FundingRepo'
import { ReportFundingDigestRepo } from '../repo/ReportFundingDigestRepo'

export const useReportFundingDigestViewModel = () => {
  const repo = new ReportFundingDigestRepo()
  const [reportState, executeLoad] = useDataState<FundingDigestPayload>()
  const [selectedExportFormat, setSelectedExportFormat] = useState<'pdf' | 'csv'>('pdf')
  const [isExporting, setIsExporting] = useState(false)

  useEffect(() => {
    executeLoad(() => repo.getReport())
  }, [])

  const reload = async (): Promise<void> => {
    await executeLoad(() => repo.getReport())
  }

  const setExportFormat = (format: 'pdf' | 'csv'): void => {
    setSelectedExportFormat(format)
  }

  const exportReport = async (): Promise<void> => {
    setIsExporting(true)
    try {
      const blobResponse = await repo.exportReport(selectedExportFormat)
      const blob = blobResponse.data ?? new Blob([], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `funding-digest-report.${selectedExportFormat}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } finally {
      setIsExporting(false)
    }
  }

  const scheduleReport = async (cronExpression: string): Promise<void> => {
    await repo.scheduleReport(cronExpression)
    await reload()
  }

  return {
    reportState,
    selectedExportFormat,
    isExporting,
    setExportFormat,
    exportReport,
    scheduleReport,
    reload
  }
}
