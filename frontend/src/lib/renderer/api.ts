import type { ChakraApi, Envelope, Op } from '../shared/contract'

export const getApi = (): ChakraApi => {
  if (!window.chakra) throw new Error('window.chakra is missing: call exposeChakra() in your preload script')
  return window.chakra
}

/** Typed call that never throws: bridge failures become an error envelope. */
export const call = async <T,>(op: Op, payload?: Record<string, unknown>): Promise<Envelope<T>> => {
  try {
    return await getApi().call<T>(op, payload)
  } catch {
    return { ok: false, error: { code: 'internal', message: 'bridge failure' } }
  }
}
