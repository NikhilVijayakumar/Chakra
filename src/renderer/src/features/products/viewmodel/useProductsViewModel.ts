import { useState, useEffect, useCallback } from 'react'
import { ProductsRepo, type ProductsCatalog, type ProductEntry } from '../repo/ProductsRepo'

const repo = new ProductsRepo()

export interface ProductsViewState {
  catalog: ProductsCatalog | null
  isLoading: boolean
  error: string | null
}

export interface ProductsViewModel extends ProductsViewState {
  selectedProduct: ProductEntry | null
  selectProduct: (productId: string) => void
  refreshCatalog: () => Promise<void>
}

const DEFAULT_COMPANY_ID = 'bavans-publishing'

export const useProductsViewModel = (companyId?: string): ProductsViewModel => {
  const actualCompanyId = companyId || DEFAULT_COMPANY_ID

  const [catalog, setCatalog] = useState<ProductsCatalog | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<ProductEntry | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadCatalog = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await repo.getProducts(actualCompanyId)
      if (response.isSuccess && response.data) {
        setCatalog(response.data)
      } else {
        setError(String(response.statusMessage ?? 'Failed to load products'))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }, [actualCompanyId])

  const selectProduct = useCallback(
    (productId: string) => {
      if (catalog?.products[productId]) {
        setSelectedProduct(catalog.products[productId])
      }
    },
    [catalog]
  )

  useEffect(() => {
    loadCatalog()
  }, [loadCatalog])

  return {
    catalog,
    selectedProduct,
    isLoading,
    error,
    selectProduct,
    refreshCatalog: loadCatalog
  }
}
