/**
 * cn — lightweight className merge helper (clsx-style, zero-dependency).
 *
 * Accepts strings, falsy values (skipped), arrays, and { class: boolean }
 * objects, then joins the truthy class names with a single space. Kept
 * dependency-free so the build stays offline-safe (Maersk-network friendly).
 */
export type ClassValue =
  | string
  | number
  | null
  | undefined
  | false
  | ClassValue[]
  | Record<string, boolean | null | undefined>

export function cn(...inputs: ClassValue[]): string {
  const out: string[] = []

  for (const input of inputs) {
    if (!input) continue

    if (typeof input === 'string' || typeof input === 'number') {
      out.push(String(input))
    } else if (Array.isArray(input)) {
      const nested = cn(...input)
      if (nested) out.push(nested)
    } else if (typeof input === 'object') {
      for (const [key, value] of Object.entries(input)) {
        if (value) out.push(key)
      }
    }
  }

  return out.join(' ')
}
