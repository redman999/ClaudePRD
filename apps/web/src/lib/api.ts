export const API_BASE = import.meta.env.VITE_API_URL || ''

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  let res: Response
  try {
    res = await fetch(`${API_BASE}${path}`, options)
  } catch {
    throw new ApiError('Cannot connect to server. Check your network connection.', 0)
  }
  if (!res.ok) {
    const data = await res.json().catch(() => ({})) as { error?: string }
    throw new ApiError(data.error ?? `Request failed (${res.status})`, res.status)
  }
  // 204 No Content and other empty bodies — return undefined cast as T so
  // callers that ignore the result (e.g. DELETE) don't blow up on JSON parse.
  if (res.status === 204 || res.headers.get('content-length') === '0') {
    return undefined as T
  }
  return res.json() as Promise<T>
}
