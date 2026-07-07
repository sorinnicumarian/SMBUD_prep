import type { MasteryMap } from './mastery'

// Cross-device progress sync via the server API (best-effort; offline falls back to localStorage).
const api = (key: string) => `${import.meta.env.BASE_URL}api/progress/${encodeURIComponent(key)}`

export function syncKeyFor(profileName: string, course: string): string {
  const id = profileName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'anon'
  return `${id}:${course}`
}

export async function fetchRemote(key: string): Promise<MasteryMap | null> {
  try {
    const r = await fetch(api(key))
    if (!r.ok) return null
    return (await r.json()) as MasteryMap
  } catch {
    return null
  }
}

// PUT merges server-side (union latest-wins) and returns the merged map; mode:'replace' overwrites.
export async function pushRemote(
  key: string,
  map: MasteryMap,
  mode?: 'replace',
): Promise<MasteryMap | null> {
  try {
    const r = await fetch(api(key), {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ map, mode }),
    })
    if (!r.ok) return null
    return (await r.json()) as MasteryMap
  } catch {
    return null
  }
}
