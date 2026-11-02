type ManifestProvider = () => unknown[]

let _provider: ManifestProvider | null = null

export const setManifestProvider = (fn: ManifestProvider): void => {
  _provider = fn
}

export const getManifests = (): unknown[] => _provider?.() ?? []
