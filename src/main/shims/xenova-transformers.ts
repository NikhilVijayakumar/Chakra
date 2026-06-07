// Stub for @xenova/transformers — vector search is not used in this build.
// Returning null causes VectorSearchService.initExtractor() to fail silently
// (it already has a try/catch) and the service stays in a no-op state.
export const pipeline = async (): Promise<null> => null
export const env = {}
