import { configureTemplateRenderer, renderTemplate } from 'astra/services/templateRenderer'
import { app } from 'electron'
import { join } from 'node:path'

export const initTemplateRenderer = (): void => {
  const templatesPath = app.isPackaged
    ? join(process.resourcesPath, 'app.asar.unpacked', 'node_modules', 'astra', 'src', 'templates')
    : join(__dirname, '../../node_modules/astra/src/templates')

  configureTemplateRenderer({
    basePath: templatesPath
  })

  console.log('[Chakra] Template renderer configured with path:', templatesPath)
}

export const renderEmailTemplate = async (
  templateName: string,
  data: Record<string, unknown>
): Promise<string> => {
  const result = await renderTemplate({ templateName, data })

  if (!result.success) {
    console.error('[Chakra] Template render error:', result.error)
    throw new Error(result.error)
  }

  return result.html ?? ''
}