import { FC } from 'react'
import { Alert, Box, CircularProgress } from '@mui/material'
import { useKpisViewModel } from '../viewmodel/useKpisViewModel'
import { KpisListView, KpiDetailView } from './KpisView'

export const KpisContainer: FC = () => {
  const vm = useKpisViewModel()

  if (vm.isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress size={28} />
      </Box>
    )
  }

  if (vm.error) {
    return <Alert severity="error">{vm.error}</Alert>
  }

  const selectedKpiId = vm.selectedKpi?.kpi.uid ?? null

  return (
    <Box sx={{ display: 'flex', height: '100%' }}>
      <Box
        sx={{
          width: 300,
          borderRight: '1px solid',
          borderColor: 'divider',
          p: 2,
          overflow: 'auto'
        }}
      >
        <KpisListView kpis={vm.kpis} selectedKpiId={selectedKpiId} onSelectKpi={vm.selectKpi} />
      </Box>
      <Box sx={{ flex: 1, p: 2, overflow: 'auto' }}>
        <KpiDetailView
          kpiWithStatus={vm.selectedKpi}
          isSaving={vm.isSaving}
          onSaveToVault={vm.saveKpiToVault}
        />
      </Box>
    </Box>
  )
}
