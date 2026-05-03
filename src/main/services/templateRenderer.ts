import handlebars from 'handlebars'
import fs from 'fs/promises'
import { join } from 'node:path'
import { app } from 'electron'

let astraTemplatesPath: string | null = null
let localTemplatesPath: string | null = null

export const initTemplateRenderer = (): void => {
  astraTemplatesPath = app.isPackaged
    ? join(process.resourcesPath, 'app.asar.unpacked', 'node_modules', 'astra', 'src', 'templates')
    : join(__dirname, '../../node_modules/astra/src/templates')

  localTemplatesPath = app.isPackaged
    ? join(process.resourcesPath, 'app.asar.unpacked', 'templates')
    : join(__dirname, '../../src/templates')

  console.log('[Chakra] Template renderer configured with local path:', localTemplatesPath, 'and astra path:', astraTemplatesPath)
}

export const renderEmailTemplate = async (
  templateName: string,
  data: Record<string, unknown>
): Promise<string> => {
  if (!astraTemplatesPath || !localTemplatesPath) {
    throw new Error('Template renderer not initialized')
  }

  const localFilePath = join(localTemplatesPath, `${templateName}.hbs`)
  const astraFilePath = join(astraTemplatesPath, `${templateName}.hbs`)

  let filePath = localFilePath
  try {
    await fs.access(localFilePath)
  } catch {
    filePath = astraFilePath
  }

  try {
    const source = await fs.readFile(filePath, 'utf-8')
    const compiled = handlebars.compile(source)
    return compiled(data)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('[Chakra] Template render error for', filePath, ':', message)
    throw new Error(message)
  }
}
