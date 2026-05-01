import { FC, useState } from 'react'
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  useTheme,
  IconButton,
  Menu,
  MenuItem,
  Breadcrumbs,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material'
import { motion } from 'framer-motion'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import FolderIcon from '@mui/icons-material/Folder'
import FileIcon from '@mui/icons-material/InsertDriveFile'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import DeleteIcon from '@mui/icons-material/Delete'
import DownloadIcon from '@mui/icons-material/Download'
import LinkIcon from '@mui/icons-material/Link'

export interface VirtualDriveFile {
  id: string
  name: string
  type: 'file' | 'folder'
  size: number
  createdAt: Date
  modifiedAt: Date
  path: string
}

export interface VirtualDriveViewProps {
  files: VirtualDriveFile[]
  currentPath: string
  totalSize: number
  usedSize: number
  isLoading: boolean
  error: string | null
  onNavigate: (path: string) => void
  onDelete: (fileId: string) => void
  onDownload: (fileId: string) => void
  onShare: (fileId: string) => void
  onCreateFolder: (name: string) => void
  onBack: () => void
}

const formatSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * VirtualDriveView
 * 
 * Features:
 * - File/folder browser with breadcrumb navigation
 * - Storage usage indicator
 * - File operations (delete, download, share)
 * - Create folder dialog
 * - File context menu
 */
export const VirtualDriveView: FC<VirtualDriveViewProps> = ({
  files,
  currentPath,
  totalSize,
  usedSize,
  isLoading,
  error,
  onNavigate,
  onDelete,
  onDownload,
  onShare,
  onCreateFolder,
  onBack
}) => {
  const theme = useTheme()
  const [createFolderOpen, setCreateFolderOpen] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [contextMenuAnchor, setContextMenuAnchor] = useState<null | HTMLElement>(null)
  const [selectedFile, setSelectedFile] = useState<VirtualDriveFile | null>(null)

  const usagePercent = totalSize > 0 ? (usedSize / totalSize) * 100 : 0
  const pathParts = currentPath.split('/').filter(Boolean)

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      onCreateFolder(newFolderName)
      setNewFolderName('')
      setCreateFolderOpen(false)
    }
  }

  const handleContextMenu = (event: React.MouseEvent<HTMLElement>, file: VirtualDriveFile) => {
    setContextMenuAnchor(event.currentTarget)
    setSelectedFile(file)
  }

  const handleCloseContextMenu = () => {
    setContextMenuAnchor(null)
    setSelectedFile(null)
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: theme.palette.background.default, p: { xs: 2, md: 4 } }}>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={onBack}
        sx={{
          mb: 4,
          textTransform: 'none',
          color: theme.palette.text.secondary,
          '&:hover': { color: theme.palette.text.primary }
        }}
      >
        Back to Dashboard
      </Button>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
          {/* Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              Virtual Drive
            </Typography>
            <Button
              variant="contained"
              onClick={() => setCreateFolderOpen(true)}
              sx={{ textTransform: 'none' }}
            >
              New Folder
            </Button>
          </Box>

          {/* Storage Usage Card */}
          <Card sx={{ mb: 4 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle2">Storage Usage</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {formatSize(usedSize)} / {formatSize(totalSize)}
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={usagePercent}
                sx={{
                  height: 8,
                  borderRadius: 1,
                  backgroundColor: theme.palette.action.disabledBackground,
                  '& .MuiLinearProgress-bar': {
                    backgroundColor:
                      usagePercent > 90
                        ? theme.palette.error.main
                        : usagePercent > 70
                        ? theme.palette.warning.main
                        : theme.palette.primary.main
                  }
                }}
              />
              <Typography variant="caption" sx={{ mt: 1, display: 'block', color: theme.palette.text.secondary }}>
                {usagePercent.toFixed(1)}% of capacity used
              </Typography>
            </CardContent>
          </Card>

          {/* Breadcrumb Navigation */}
          {pathParts.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Breadcrumbs>
                <Button
                  variant="text"
                  size="small"
                  onClick={() => onNavigate('/')}
                  sx={{ textTransform: 'none', color: theme.palette.primary.main }}
                >
                  Root
                </Button>
                {pathParts.map((part, index) => {
                  const path = '/' + pathParts.slice(0, index + 1).join('/')
                  const isLast = index === pathParts.length - 1
                  return isLast ? (
                    <Typography key={path} sx={{ color: theme.palette.text.primary }}>
                      {part}
                    </Typography>
                  ) : (
                    <Button
                      key={path}
                      variant="text"
                      size="small"
                      onClick={() => onNavigate(path)}
                      sx={{ textTransform: 'none', color: theme.palette.primary.main }}
                    >
                      {part}
                    </Button>
                  )
                })}
              </Breadcrumbs>
            </Box>
          )}

          {/* Files List */}
          <Card>
            <CardContent sx={{ p: 0 }}>
              {isLoading ? (
                <Box sx={{ p: 3, textAlign: 'center' }}>
                  <LinearProgress />
                </Box>
              ) : error ? (
                <Box sx={{ p: 3 }}>
                  <Typography color="error">{error}</Typography>
                </Box>
              ) : files.length === 0 ? (
                <Box sx={{ p: 3, textAlign: 'center' }}>
                  <Typography sx={{ color: theme.palette.text.secondary }}>
                    This folder is empty
                  </Typography>
                </Box>
              ) : (
                <List sx={{ width: '100%' }}>
                  {files.map((file, index) => (
                    <motion.div
                      key={file.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2, delay: 0.02 * index }}
                      style={{ width: '100%' }}
                    >
                      <ListItem
                        component="li"
                        onClick={() => {
                          if (file.type === 'folder') {
                            onNavigate(file.path)
                          }
                        }}
                        secondaryAction={
                          <IconButton
                            edge="end"
                            onClick={(e) => handleContextMenu(e, file)}
                          >
                            <MoreVertIcon />
                          </IconButton>
                        }
                        sx={{
                          transition: 'background-color 0.2s',
                          '&:hover': {
                            backgroundColor: theme.palette.action.hover
                          }
                        }}
                      >
                        <ListItemIcon>
                          {file.type === 'folder' ? (
                            <FolderIcon sx={{ color: theme.palette.primary.main }} />
                          ) : (
                            <FileIcon sx={{ color: theme.palette.text.secondary }} />
                          )}
                        </ListItemIcon>
                        <ListItemText
                          primary={file.name}
                          secondary={`${formatSize(file.size)} • ${new Date(file.modifiedAt).toLocaleDateString()}`}
                        />
                      </ListItem>
                    </motion.div>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Box>
      </motion.div>

      {/* Create Folder Dialog */}
      <Dialog open={createFolderOpen} onClose={() => setCreateFolderOpen(false)}>
        <DialogTitle>Create New Folder</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="Folder Name"
            placeholder="New Folder"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateFolderOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleCreateFolder}
            disabled={!newFolderName.trim()}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Context Menu */}
      <Menu
        anchorEl={contextMenuAnchor}
        open={Boolean(contextMenuAnchor)}
        onClose={handleCloseContextMenu}
      >
        {selectedFile?.type === 'file' && (
          <>
            <MenuItem
              onClick={() => {
                if (selectedFile) onDownload(selectedFile.id)
                handleCloseContextMenu()
              }}
            >
              <DownloadIcon sx={{ mr: 1 }} /> Download
            </MenuItem>
            <MenuItem
              onClick={() => {
                if (selectedFile) onShare(selectedFile.id)
                handleCloseContextMenu()
              }}
            >
              <LinkIcon sx={{ mr: 1 }} /> Share
            </MenuItem>
          </>
        )}
        <MenuItem
          onClick={() => {
            if (selectedFile) onDelete(selectedFile.id)
            handleCloseContextMenu()
          }}
          sx={{ color: theme.palette.error.main }}
        >
          <DeleteIcon sx={{ mr: 1 }} /> Delete
        </MenuItem>
      </Menu>
    </Box>
  )
}
