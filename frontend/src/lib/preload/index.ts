import { contextBridge, ipcRenderer } from 'electron'
import { IPC } from '../shared/contract'
import type { ChakraApi } from '../shared/contract'

export const chakraApi: ChakraApi = {
  cli: {
    get: () => ipcRenderer.invoke(IPC.cliGet),
    verify: (p) => ipcRenderer.invoke(IPC.cliVerify, p),
    save: (p) => ipcRenderer.invoke(IPC.cliSave, p),
    status: () => ipcRenderer.invoke(IPC.cliStatus)
  },
  call: (op, payload) => ipcRenderer.invoke(IPC.call, { op, payload })
}

/** Call from the app's preload script. */
export const exposeChakra = (): void => contextBridge.exposeInMainWorld('chakra', chakraApi)
