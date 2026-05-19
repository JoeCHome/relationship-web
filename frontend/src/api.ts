import type { GraphData, PickerResponse, NodePositionItem, User, Rating } from './types'

async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`${res.status} ${res.statusText}: ${text}`)
  }
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export const api = {
  fetchGraph: (base: string, ownerId: string): Promise<GraphData> =>
    apiFetch(`${base}/graph/${encodeURIComponent(ownerId)}`),

  searchUsers: (base: string, q: string, exclude?: string[]): Promise<User[]> => {
    const params = new URLSearchParams({ q })
    if (exclude?.length) params.set('exclude', exclude.join(','))
    return apiFetch(`${base}/users/search?${params}`)
  },

  createUser: (base: string, user: { id: string; display_name: string; host_user_id: string; photo_url?: string; notes?: string }): Promise<User> =>
    apiFetch(`${base}/users`, { method: 'POST', body: JSON.stringify(user) }),

  createConnection: (base: string, conn: { owner_user_id: string; target_user_id: string; types: string[] }) =>
    apiFetch(`${base}/connections`, { method: 'POST', body: JSON.stringify(conn) }),

  updateConnectionTypes: (base: string, connId: number, types: string[]) =>
    apiFetch(`${base}/connections/${connId}/types`, { method: 'PUT', body: JSON.stringify({ types }) }),

  deleteConnection: (base: string, connId: number): Promise<void> =>
    apiFetch(`${base}/connections/${connId}`, { method: 'DELETE' }),

  submitRating: (base: string, rating: { rated_user_id: string; rater_user_id: string; dimension_key: string; score: number; notes?: string }): Promise<Rating> =>
    apiFetch(`${base}/ratings`, { method: 'POST', body: JSON.stringify(rating) }),

  savePositions: (base: string, ownerId: string, positions: NodePositionItem[]): Promise<NodePositionItem[]> =>
    apiFetch(`${base}/positions/${encodeURIComponent(ownerId)}`, {
      method: 'PUT',
      body: JSON.stringify({ positions }),
    }),

  fetchPicker: (base: string, ownerId: string, opts: { maxDepth?: number; types?: string[]; requireAlongPath?: boolean }): Promise<PickerResponse> => {
    const params = new URLSearchParams()
    if (opts.maxDepth != null) params.set('max_depth', String(opts.maxDepth))
    if (opts.types?.length) params.set('types', opts.types.join(','))
    if (opts.requireAlongPath != null) params.set('require_along_path', String(opts.requireAlongPath))
    return apiFetch(`${base}/picker/${encodeURIComponent(ownerId)}?${params}`)
  },

  upsertRatingDimensions: (base: string, dimensions: Array<{ key: string; label: string; icon?: string; sort_order?: number }>) =>
    apiFetch(`${base}/rating-dimensions`, { method: 'POST', body: JSON.stringify({ dimensions }) }),
}
