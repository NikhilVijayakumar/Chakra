import { successResponse } from 'prana/services/ipcResponseFactory'
import type { ServerResponse } from 'astra'

export interface ProductDetails {
  productId: string
  companyId: string
  goal: string
  vision: string
  problemSolved: string
  usp: string
  mvp: string[]
  validation: {
    methodology: string
    successCriteria: string
  }
  contentFormats?: string[]
  targetAudience?: string[]
  contentTrack?: string
  ageGroups?: string[]
  genres?: string[]
  updatedAt?: string
}

export interface ProductDoc {
  content: string
}

export interface ProductEntry {
  details: ProductDetails
  documentation?: ProductDoc
}

export interface ProductsCatalog {
  companyId: string
  products: Record<string, ProductEntry>
  productsOrder: string[]
}

export type SyncStatus = 'NEW' | 'SYNCED'

export interface SaveResult {
  success: boolean
  entityId: string
  vaultPath?: string
  error?: string
}

export interface SyncResult {
  success: boolean
  entityId: string
  cachePath?: string
  error?: string
}

interface DharmaProduct {
  id: string
  name: string
  goal: string
  vision?: string
  problemSolved?: string
  usp?: string
  mvpFeatures?: string[]
  validationMethodology?: string
  successCriteria?: string
  targetAudience?: string[]
  contentFormats?: string[]
}

interface DharmaProductCatalog {
  companyId: string
  products: DharmaProduct[]
}

const toProductEntry = (companyId: string, product: DharmaProduct): ProductEntry => ({
  details: {
    productId: product.id,
    companyId,
    goal: product.goal,
    vision: product.vision ?? '',
    problemSolved: product.problemSolved ?? '',
    usp: product.usp ?? '',
    mvp: product.mvpFeatures ?? [],
    validation: {
      methodology: product.validationMethodology ?? '',
      successCriteria: product.successCriteria ?? ''
    },
    contentFormats: product.contentFormats,
    targetAudience: product.targetAudience
  }
})

const toDharmaProduct = (entry: ProductEntry): DharmaProduct => ({
  id: entry.details.productId,
  name: entry.details.productId,
  goal: entry.details.goal,
  vision: entry.details.vision,
  problemSolved: entry.details.problemSolved,
  usp: entry.details.usp,
  mvpFeatures: entry.details.mvp,
  validationMethodology: entry.details.validation.methodology,
  successCriteria: entry.details.validation.successCriteria,
  targetAudience: entry.details.targetAudience,
  contentFormats: entry.details.contentFormats
})

export class ProductsRepo {
  async getProducts(companyId: string): Promise<ServerResponse<ProductsCatalog>> {
    const payload = (await window.api.dharma.getProducts(companyId)) as DharmaProductCatalog
    const response = successResponse(payload)

    if (response.isSuccess && response.data) {
      const productsMap = Object.fromEntries(
        response.data.products.map((product) => [product.id, toProductEntry(companyId, product)])
      )

      return {
        ...response,
        data: {
          companyId: response.data.companyId,
          products: productsMap,
          productsOrder: response.data.products.map((product) => product.id)
        }
      } as ServerResponse<ProductsCatalog>
    }

    return response as unknown as ServerResponse<ProductsCatalog>
  }

  async getProduct(companyId: string, productId: string): Promise<ServerResponse<ProductEntry>> {
    const payload = (await window.api.dharma.getProduct(companyId, productId)) as DharmaProduct
    const response = successResponse(payload)

    if (response.isSuccess && response.data) {
      return {
        ...response,
        data: toProductEntry(companyId, response.data)
      } as ServerResponse<ProductEntry>
    }

    return response as unknown as ServerResponse<ProductEntry>
  }

  async syncProductToCache(
    companyId: string,
    product: ProductEntry
  ): Promise<ServerResponse<SyncResult>> {
    const payload = await window.api.dharma.syncProductToCache(companyId, toDharmaProduct(product))
    return successResponse(payload)
  }

  async saveProduct(companyId: string, data: ProductEntry): Promise<ServerResponse<SaveResult>> {
    const payload = await window.api.dharma.saveProductToVault(companyId, toDharmaProduct(data))
    return successResponse(payload)
  }
}
