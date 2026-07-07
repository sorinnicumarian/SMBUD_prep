import { useCallback, useEffect, useRef, useState } from 'react'
import type { Grade, MasteryState } from './mastery'

// Fisher–Yates (Math.random is fine in the browser).
export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Grading the head card either clears it (good/easy) or pushes it back a few
// positions so it returns soon within the session (again ~2, hard ~5).
function requeue<T>(queue: T[], grade: Grade): { queue: T[]; cleared: boolean } {
  const [head, ...rest] = queue
  if (grade === 'good' || grade === 'easy') return { queue: rest, cleared: true }
  const gap = Math.min(grade === 'again' ? 2 : 5, rest.length)
  return { queue: [...rest.slice(0, gap), head, ...rest.slice(gap)], cleared: false }
}

interface Handlers {
  onRecord: (id: string, g: Grade) => void
  onRestore: (id: string, prev: MasteryState | undefined) => void
  getPrev: (id: string) => MasteryState | undefined
}

interface UndoEntry<T> {
  queue: T[]
  doneCount: number
  itemId: string
  prevMastery: MasteryState | undefined
}

export interface CramSession<T> {
  current: T | undefined
  done: boolean
  total: number
  doneCount: number
  remaining: number
  grade: (g: Grade) => void
  undo: () => void
  canUndo: boolean
  restart: () => void
}

// `cards` is the working set (caller passes the not-yet-mastered items, shuffled).
export function useCramSession<T extends { itemId: string }>(
  cards: T[],
  { onRecord, onRestore, getPrev }: Handlers,
): CramSession<T> {
  const [queue, setQueue] = useState<T[]>(cards)
  const [doneCount, setDoneCount] = useState(0)
  const undoRef = useRef<UndoEntry<T>[]>([])
  const [undoCount, setUndoCount] = useState(0)

  useEffect(() => {
    setQueue(cards)
    setDoneCount(0)
    undoRef.current = []
    setUndoCount(0)
  }, [cards])

  const grade = useCallback(
    (g: Grade) => {
      setQueue((q) => {
        const head = q[0]
        if (!head) return q
        undoRef.current.push({ queue: q, doneCount, itemId: head.itemId, prevMastery: getPrev(head.itemId) })
        setUndoCount((c) => c + 1)
        onRecord(head.itemId, g)
        const { queue: next, cleared } = requeue(q, g)
        if (cleared) setDoneCount((c) => c + 1)
        return next
      })
    },
    [doneCount, getPrev, onRecord],
  )

  const undo = useCallback(() => {
    const e = undoRef.current.pop()
    if (!e) return
    setUndoCount((c) => c - 1)
    setQueue(e.queue)
    setDoneCount(e.doneCount)
    onRestore(e.itemId, e.prevMastery)
  }, [onRestore])

  const restart = useCallback(() => {
    setQueue(cards)
    setDoneCount(0)
    undoRef.current = []
    setUndoCount(0)
  }, [cards])

  return {
    current: queue[0],
    done: queue.length === 0,
    total: cards.length,
    doneCount,
    remaining: queue.length,
    grade,
    undo,
    canUndo: undoCount > 0,
    restart,
  }
}
