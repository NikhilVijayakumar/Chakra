import type { FC } from 'react'
import { AppStateHandler, StateType } from 'astra'
import { useReportWeeklyReviewViewModel } from '../viewmodel/useReportWeeklyReviewViewModel'
import { ReportWeeklyReviewView } from './ReportWeeklyReviewView'

export const ReportWeeklyReviewContainer: FC = () => {
  const {
    reportState,
    selectedExportFormat,
    isExporting,
    setExportFormat,
    exportReport,
    scheduleReport,
    reload
  } = useReportWeeklyReviewViewModel()

  return (
    <AppStateHandler appState={reportState}>
      <ReportWeeklyReviewView
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
