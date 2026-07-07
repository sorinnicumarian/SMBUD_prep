import { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react'
import { useLocalStorage } from './useLocalStorage'

export interface Profile {
  id: string
  name: string
  createdAt: number
}

interface ProfileCtx {
  profiles: Profile[]
  activeId: string | null
  active: Profile | null
  create: (name: string) => void
  select: (id: string) => void
  remove: (id: string) => void
  signOut: () => void
}

const Ctx = createContext<ProfileCtx | null>(null)

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profiles, setProfiles] = useLocalStorage<Profile[]>('mlxp:profiles', [])
  const [activeId, setActiveId] = useLocalStorage<string | null>('mlxp:activeProfile', null)

  const create = useCallback(
    (name: string) => {
      const trimmed = name.trim()
      if (!trimmed) return
      const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
      setProfiles((prev) => [...prev, { id, name: trimmed, createdAt: Date.now() }])
      setActiveId(id)
    },
    [setProfiles, setActiveId],
  )

  const select = useCallback((id: string) => setActiveId(id), [setActiveId])
  const signOut = useCallback(() => setActiveId(null), [setActiveId])
  const remove = useCallback(
    (id: string) => {
      setProfiles((prev) => prev.filter((p) => p.id !== id))
      setActiveId((cur) => (cur === id ? null : cur))
      try {
        // drop this profile's stored progress
        for (let i = localStorage.length - 1; i >= 0; i--) {
          const k = localStorage.key(i)
          if (k && k.startsWith(`mlxp:progress:v3:${id}:`)) localStorage.removeItem(k)
        }
      } catch {
        /* ignore */
      }
    },
    [setProfiles, setActiveId],
  )

  const active = useMemo(
    () => profiles.find((p) => p.id === activeId) ?? null,
    [profiles, activeId],
  )

  const value: ProfileCtx = { profiles, activeId: active ? active.id : null, active, create, select, remove, signOut }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useProfiles(): ProfileCtx {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useProfiles must be used within ProfileProvider')
  return ctx
}
