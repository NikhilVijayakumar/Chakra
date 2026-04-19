import type { FC } from 'react'
import { AppStateHandler, StateType } from 'astra'
import { useReportFundingDigestViewModel } from '../viewmodel/useReportFundingDigestViewModel'
import { ReportFundingDigestView } from './ReportFundingDigestView'

export const ReportFundingDigestContainer: FC = () => {
  const {
    reportState,
    selectedExportFormat,
    isExporting,
    setExportFormat,
    exportReport,
    scheduleReport,
    reload
  } = useReportFundingDigestViewModel()

  return (
    <AppStateHandler appState={reportState}>
      <ReportFundingDigestView
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
