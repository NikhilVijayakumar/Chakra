import handlebars from 'handlebars'
import fs from 'fs/promises'
import { join } from 'node:path'
import { app } from 'electron'

let templatesPath: string | null = null

export const initTemplateRenderer = (): void => {
  templatesPath = app.isPackaged
    ? join(process.resourcesPath, 'app.asar.unpacked', 'node_modules', 'astra', 'src', 'templates')
    : join(__dirname, '../../node_modules/astra/src/templates')

  console.log('[Chakra] Template renderer configured with path:', templatesPath)
}

export const renderEmailTemplate = async (
  templateName: string,
  data: Record<string, unknown>
): Promise<string> => {
  if (!templatesPath) {
    throw new Error('Template renderer not initialized')
  }

  const filePath = join(templatesPath, `${templateName}.hbs`)

  try {
    const source = await fs.readFile(filePath, 'utf-8')
    const compiled = handlebars.compile(source)
    return compiled(data)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('[Chakra] Template render error:', message)
    throw new Error(message)
  }
}
