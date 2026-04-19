import { FC } from 'react'
import { Alert, Box, CircularProgress } from '@mui/material'
import { useProductsViewModel } from '../viewmodel/useProductsViewModel'
import { ProductsListView, ProductDetailView } from './ProductsView'

export const ProductsContainer: FC = () => {
  const vm = useProductsViewModel()

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

  return (
    <Box sx={{ display: 'flex', height: '100%' }}>
      <Box
        sx={{
          width: 280,
          borderRight: '1px solid',
          borderColor: 'divider',
          p: 2,
          overflow: 'auto'
        }}
      >
        <ProductsListView
          catalog={vm.catalog}
          selectedProductId={
            vm.selectedProduct
              ? (vm.catalog?.productsOrder.find(
                  (id) => vm.catalog?.products[id] === vm.selectedProduct
                ) ?? null)
              : null
          }
          onSelectProduct={vm.selectProduct}
        />
      </Box>
      <Box sx={{ flex: 1, p: 2, overflow: 'auto' }}>
        <ProductDetailView product={vm.selectedProduct} />
      </Box>
    </Box>
  )
}
