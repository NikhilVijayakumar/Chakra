import { FC } from 'react'
import { Box, Typography, Paper, List, ListItemButton, ListItemText, Chip } from '@mui/material'
import { spacing } from 'astra'
import type { ProductsCatalog, ProductEntry } from '../repo/ProductsRepo'

interface ProductsListViewProps {
  catalog: ProductsCatalog | null
  selectedProductId: string | null
  onSelectProduct: (productId: string) => void
}

export const ProductsListView: FC<ProductsListViewProps> = ({
  catalog,
  selectedProductId,
  onSelectProduct
}) => {
  if (!catalog) {
    return (
      <Box sx={{ p: spacing.xl }}>
        <Typography>No products found</Typography>
      </Box>
    )
  }

  const { products, productsOrder } = catalog

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
      <Typography variant="h6">Products</Typography>
      <List>
        {productsOrder.map((productId) => {
          const product = products[productId]
          if (!product?.details) return null

          return (
            <ListItemButton
              key={productId}
              selected={selectedProductId === productId}
              onClick={() => onSelectProduct(productId)}
              sx={{ borderRadius: 1, mb: 0.5 }}
            >
              <ListItemText
                primary={productId.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                secondary={product.details.goal.substring(0, 60) + '...'}
              />
            </ListItemButton>
          )
        })}
      </List>
    </Box>
  )
}

interface ProductDetailViewProps {
  product: ProductEntry | null
}

export const ProductDetailView: FC<ProductDetailViewProps> = ({ product }) => {
  if (!product?.details) {
    return (
      <Box sx={{ p: spacing.xl }}>
        <Typography color="text.secondary">Select a product to view details</Typography>
      </Box>
    )
  }

  const { details } = product

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
      <Typography variant="h5">
        {details.productId.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
      </Typography>

      <Paper sx={{ p: spacing.md }}>
        <Typography variant="subtitle2" color="text.secondary">
          Goal
        </Typography>
        <Typography>{details.goal}</Typography>
      </Paper>

      <Paper sx={{ p: spacing.md }}>
        <Typography variant="subtitle2" color="text.secondary">
          Vision
        </Typography>
        <Typography>{details.vision}</Typography>
      </Paper>

      <Paper sx={{ p: spacing.md }}>
        <Typography variant="subtitle2" color="text.secondary">
          Problem Solved
        </Typography>
        <Typography>{details.problemSolved}</Typography>
      </Paper>

      <Paper sx={{ p: spacing.md }}>
        <Typography variant="subtitle2" color="text.secondary">
          USP
        </Typography>
        <Typography>{details.usp}</Typography>
      </Paper>

      <Paper sx={{ p: spacing.md }}>
        <Typography variant="subtitle2" color="text.secondary">
          MVP
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: spacing.xs }}>
          {details.mvp.map((item, idx) => (
            <Chip key={idx} label={item} size="small" />
          ))}
        </Box>
      </Paper>

      <Paper sx={{ p: spacing.md }}>
        <Typography variant="subtitle2" color="text.secondary">
          Validation
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: spacing.xs }}>
          <Typography>
            <strong>Methodology:</strong> {details.validation.methodology}
          </Typography>
          <Typography>
            <strong>Success Criteria:</strong> {details.validation.successCriteria}
          </Typography>
        </Box>
      </Paper>

      {details.targetAudience && details.targetAudience.length > 0 && (
        <Paper sx={{ p: spacing.md }}>
          <Typography variant="subtitle2" color="text.secondary">
            Target Audience
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: spacing.xs }}>
            {details.targetAudience.map((audience, idx) => (
              <Chip key={idx} label={audience} size="small" variant="outlined" />
            ))}
          </Box>
        </Paper>
      )}

      {details.contentFormats && details.contentFormats.length > 0 && (
        <Paper sx={{ p: spacing.md }}>
          <Typography variant="subtitle2" color="text.secondary">
            Content Formats
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: spacing.xs }}>
            {details.contentFormats.map((format, idx) => (
              <Chip key={idx} label={format} size="small" variant="outlined" />
            ))}
          </Box>
        </Paper>
      )}
    </Box>
  )
}
