// jsdom treats canvas as optional; this shim keeps optional imports resolvable in bundled dev runtime.
export const createCanvas = undefined
export const Image = undefined
export const Canvas = undefined

export default {}
