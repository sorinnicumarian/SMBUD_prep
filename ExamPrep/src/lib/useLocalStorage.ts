import { useCallback, useEffect, useState } from 'react'

function read<T>(key: string, initial: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : initial
  } catch {
    return initial
  }
}

// localStorage-backed state that correctly re-reads when `key` changes (e.g. switching course),
// with cross-tab sync. Never writes one key's value under another key.
export function useLocalStorage<T>(key: string, initial: T): [T, (v: T | ((p: T) => T)) => void] {
  const [state, setState] = useState<{ key: string; value: T }>(() => ({ key, value: read(key, initial) }))

  // Adjust state during render when the key changes (React-recommended pattern).
  if (state.key !== key) setState({ key, value: read(key, initial) })

  useEffect(() => {
    if (state.key !== key) return // wait for the render-time adjustment to land
    try {
      localStorage.setItem(key, JSON.stringify(state.value))
    } catch {
      /* quota / private mode */
    }
  }, [key, state])

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === key) setState({ key, value: read(key, initial) })
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [key, initial])

  const set = useCallback(
    (v: T | ((p: T) => T)) => {
      setState((s) => ({ key: s.key, value: typeof v === 'function' ? (v as (p: T) => T)(s.value) : v }))
    },
    [],
  )

  return [state.value, set]
}
