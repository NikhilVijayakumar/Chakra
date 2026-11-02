// Reference consumer: the smallest Electron app that mounts Chakra UI.
import { app, BrowserWindow } from 'electron'
import { join } from 'node:path'
import { registerChakra } from '../lib/main'

registerChakra({ appId: 'chakra-demo' })

app.whenReady().then(() => {
  const win = new BrowserWindow({
    width: 1000,
    height: 720,
    webPreferences: { preload: join(__dirname, '../preload/index.js'), contextIsolation: true, sandbox: true }
  })
  if (process.env['ELECTRON_RENDERER_URL']) void win.loadURL(process.env['ELECTRON_RENDERER_URL'])
  else void win.loadFile(join(__dirname, '../renderer/index.html'))
})
app.on('window-all-closed', () => app.quit())
