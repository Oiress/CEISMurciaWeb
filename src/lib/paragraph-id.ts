// Deterministic paragraph ID using Node.js crypto (sha256, truncated to 12 hex chars)
// Same input always produces same output regardless of runtime or execution order.
// Format: p-<12hexchars>
// Input: type string + index number + first 32 chars of plain text content
import { createHash } from 'crypto'

export function computeParagraphId(type: string, index: number, text: string): string {
  const snippet = text.slice(0, 32)
  const hash = createHash('sha256')
    .update(`${type}:${index}:${snippet}`)
    .digest('hex')
    .slice(0, 12)
  return `p-${hash}`
}
