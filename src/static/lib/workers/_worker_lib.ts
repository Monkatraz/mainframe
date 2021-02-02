/**
 * @file Exports various functions commonly used by Mainframe workers.
 * @author Monkatraz
 */
import { Transfer } from 'threads'

interface TypedArray extends ArrayBuffer { buffer: ArrayBufferLike }
type TransferInput = string | ArrayBuffer | TypedArray

const decoder = new TextDecoder()
const encoder = new TextEncoder()
export const transfer = (buffer: TransferInput) => {
  if (typeof buffer === 'string')    return Transfer(encoder.encode(buffer).buffer)
  if ('buffer' in buffer)            return Transfer(buffer.buffer)
  if (buffer instanceof ArrayBuffer) return Transfer(buffer)
  throw new TypeError('Expected a string, ArrayBuffer, or typed array!')
}
export const decode = (buffer: ArrayBuffer) => decoder.decode(buffer)
