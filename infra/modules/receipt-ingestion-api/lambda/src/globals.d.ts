declare const process: {
  env: Record<string, string | undefined>
}

type BufferLike = Uint8Array & {
  readonly length: number
  toString(encoding?: string): string
}

declare const Buffer: {
  byteLength(input: string, encoding?: string): number
  from(input: string, encoding?: string): BufferLike
  from(input: ArrayBuffer | ArrayBufferView): BufferLike
}
