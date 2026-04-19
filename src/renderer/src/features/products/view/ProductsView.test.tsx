// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ProductEntry, ProductsCatalog } from '../repo/ProductsRepo'
import { ProductDetailView, ProductsListView } from './ProductsView'

const makeCatalog = (): ProductsCatalog => ({
  companyId: 'acme-company',
  products: {
    'product-one': {
      details: {
        productId: 'product-one',
        companyId: 'acme-company',
        goal: 'Deliver value quickly and reliably',
        vision: 'A better workflow',
        problemSolved: 'Reduces manual work',
        usp: 'Fast and reliable',
        mvp: ['Draft', 'Review'],
        validation: {
          methodology: 'Pilot',
          successCriteria: 'Teams adopt it'
        },
        targetAudience: ['Operators']
      }
    },
    'product-two': {
      details: {
        productId: 'product-two',
        companyId: 'acme-company',
        goal: 'Improve governance throughput',
        vision: 'Safer operations',
        problemSolved: 'Removes repetitive work',
        usp: 'Clear and reliable',
        mvp: ['Plan'],
        validation: {
          methodology: 'Interviews',
          successCriteria: 'Positive feedback'
        }
      }
    }
  },
  productsOrder: ['product-one', 'product-two']
})

const makeProduct = (): ProductEntry => ({
  details: {
    productId: 'product-one',
    companyId: 'acme-company',
    goal: 'Deliver value quickly and reliably',
    vision: 'A better workflow',
    problemSolved: 'Reduces manual work',
    usp: 'Fast and reliable',
    mvp: ['Draft', 'Review'],
    validation: {
      methodology: 'Pilot',
      successCriteria: 'Teams adopt it'
    },
    targetAudience: ['Operators'],
    contentFormats: ['Markdown']
  }
})

describe('Products views', () => {
  it('renders the list view and invokes selection callbacks', async () => {
    const user = userEvent.setup()
    const onSelectProduct = vi.fn()

    render(
      <ProductsListView
        catalog={makeCatalog()}
        selectedProductId={'product-two'}
        onSelectProduct={onSelectProduct}
      />
    )

    expect(screen.getByRole('heading', { name: 'Products' })).toBeTruthy()
    expect(screen.getByRole('button', { name: /Product One/i }).className).not.toContain(
      'Mui-selected'
    )
    expect(screen.getByRole('button', { name: /Product Two/i }).className).toContain('Mui-selected')
    expect(screen.getByText('Deliver value quickly and reliably...')).toBeTruthy()

    await user.click(screen.getByRole('button', { name: /Product One/i }))

    expect(onSelectProduct).toHaveBeenCalledWith('product-one')
  })

  it('renders empty catalog and detail fallback states', () => {
    const { rerender } = render(
      <ProductsListView catalog={null} selectedProductId={null} onSelectProduct={() => {}} />
    )

    expect(screen.getByText('No products found')).toBeTruthy()

    rerender(<ProductDetailView product={null} />)
    expect(screen.getByText('Select a product to view details')).toBeTruthy()

    rerender(<ProductDetailView product={makeProduct()} />)
    expect(screen.getByRole('heading', { name: 'Product One' })).toBeTruthy()
    expect(screen.getByText('Goal')).toBeTruthy()
    expect(screen.getByText('Deliver value quickly and reliably')).toBeTruthy()
    expect(screen.getByText('Markdown')).toBeTruthy()
  })
})
