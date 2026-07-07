import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useLocalStorage } from './useLocalStorage'
import { gradeMastery, mergeMastery, type Grade, type MasteryMap, type MasteryState } from './mastery'
import { useData } from './data'
import { useProfiles } from './profiles'
import { fetchRemote, pushRemote, syncKeyFor } from './sync'

// Mastery is namespaced per PROFILE and per COURSE in localStorage (survives refresh, separate per
// profile) AND synced to the server by profile NAME + course so the same profile works across devices.
export function useProgress() {
  const { activeCourse } = useData()
  const { activeId, active } = useProfiles()
  const key = `mlxp:progress:v3:${activeId ?? 'anon'}:${activeCourse || 'default'}`
  const [progress, setProgress] = useLocalStorage<MasteryMap>(key, {})

  const progressRef = useRef(progress)
  progressRef.current = progress

  const syncKey = useMemo(
    () => (active && activeCourse ? syncKeyFor(active.name, activeCourse) : null),
    [active, activeCourse],
  )

  // On profile/course change: pull remote and merge into local (union, latest-wins — never deletes).
  useEffect(() => {
    if (!syncKey) return
    let cancelled = false
    fetchRemote(syncKey).then((remote) => {
      if (cancelled || !remote) return
      const merged = mergeMastery(progressRef.current, remote)
      // only update if remote added/changed something
      if (JSON.stringify(merged) !== JSON.stringify(progressRef.current)) setProgress(merged)
    })
    return () => {
      cancelled = true
    }
  }, [syncKey, setProgress])

  // Push local -> server (debounced). Server merges, so this also uploads this device's progress.
  const pushTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (!syncKey) return
    if (pushTimer.current) clearTimeout(pushTimer.current)
    pushTimer.current = setTimeout(() => {
      pushRemote(syncKey, progressRef.current)
    }, 1200)
    return () => {
      if (pushTimer.current) clearTimeout(pushTimer.current)
    }
  }, [progress, syncKey])

  const record = useCallback(
    (id: string, grade: Grade) => {
      setProgress((prev) => ({ ...prev, [id]: gradeMastery(prev[id], grade, Date.now()) }))
    },
    [setProgress],
  )

  const restore = useCallback(
    (id: string, state: MasteryState | undefined) => {
      setProgress((prev) => {
        const next = { ...prev }
        if (state) next[id] = state
        else delete next[id]
        return next
      })
    },
    [setProgress],
  )

  const reset = useCallback(() => {
    setProgress({})
    if (syncKey) pushRemote(syncKey, {}, 'replace') // propagate the wipe across devices
  }, [setProgress, syncKey])

  const resetMany = useCallback(
    (ids: string[]) => {
      const next = { ...progressRef.current }
      for (const id of ids) delete next[id]
      setProgress(next)
      // replace (not merge) so the server doesn't re-add the cleared mastery on next pull
      if (syncKey) pushRemote(syncKey, next, 'replace')
    },
    [setProgress, syncKey],
  )

  return { progress, record, restore, reset, resetMany }
}
