import type { FC } from 'react'
import { AppStateHandler, StateType } from 'astra'
import { ReportDailyBriefView } from './ReportDailyBriefView'
import { useReportDailyBriefViewModel } from '../viewmodel/useReportDailyBriefViewModel'

export const ReportDailyBriefContainer: FC = () => {
  const {
    reportState,
    selectedExportFormat,
    isExporting,
    setExportFormat,
    exportReport,
    scheduleReport,
    reload
  } = useReportDailyBriefViewModel()

  return (
    <AppStateHandler appState={reportState}>
      <ReportDailyBriefView
        payload={reportState.data || null}
        isLoading={reportState.state === StateType.LOADING}
        selectedExportFormat={selectedExportFormat}
        isExporting={isExporting}
        onFormatChange={setExportFormat}
        onExport={exportReport}
        onSchedule={scheduleReport}
        onRefresh={reload}
      />
    </AppStateHandler>
  )
}
