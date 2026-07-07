import { useMemo, useRef, useState } from 'react'
import { useData } from '../lib/data'
import { useProgress } from '../lib/progress'
import { applyFilters, emptyFilters, Filters, type FilterState } from '../components/Filters'
import { QuestionCard } from '../components/QuestionCard'
import { isMastered, summarize } from '../lib/mastery'
import { shuffle, useCramSession } from '../lib/session'
import type { Question } from '../types'

type Item = { itemId: string; q: Question }

export function Practice() {
  const { questions } = useData()
  const { progress, record, restore, resetMany } = useProgress()
  const [filters, setFilters] = useState<FilterState>(emptyFilters)
  const [showFilters, setShowFilters] = useState(false)
  const [reshuffle, setReshuffle] = useState(0)

  const progressRef = useRef(progress)
  progressRef.current = progress

  const allItems = useMemo<Item[]>(
    () =>
      applyFilters(questions, filters)
        .filter((q) => q.type !== 'true-false-motivated' && q.type !== 'multiple-choice')
        .map((q) => ({ itemId: q.id, q })),
    [questions, filters],
  )
  const allIds = useMemo(() => allItems.map((i) => i.itemId), [allItems])
  const workingItems = useMemo(
    () => shuffle(allItems.filter((i) => !isMastered(progressRef.current[i.itemId]))),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [allItems, reshuffle],
  )

  const session = useCramSession(workingItems, {
    onRecord: record,
    onRestore: restore,
    getPrev: (id) => progressRef.current[id],
  })

  const sum = summarize(allIds, progress)
  const activeFilterCount =
    filters.topics.length + filters.types.length + filters.years.length + filters.parts.length

  const header = (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold text-slate-900">Practice</h1>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <button
            onClick={() => setShowFilters((s) => !s)}
            className="rounded-md border border-slate-300 px-3 py-1.5 font-medium text-slate-600 hover:bg-slate-50"
          >
            Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
          </button>
          <button
            onClick={() => setReshuffle((n) => n + 1)}
            className="rounded-md border border-slate-300 px-3 py-1.5 font-medium text-slate-600 hover:bg-slate-50"
          >
            Restart
          </button>
        </div>
      </div>
      {showFilters && <Filters filters={filters} setFilters={setFilters} />}
      <p className="text-sm text-slate-500">
        Open-ended exercises — try it, reveal the solution, then rate yourself. Again/Hard return later this session.
      </p>
    </div>
  )

  if (allItems.length === 0)
    return (
      <div className="space-y-4">
        {header}
        <p className="py-12 text-center text-slate-400">No open-ended exercises match these filters.</p>
      </div>
    )

  if (session.done || !session.current)
    return (
      <div className="space-y-4">
        {header}
        <div className="mx-auto max-w-md space-y-4 rounded-xl border border-slate-200 bg-white p-8 text-center">
          <h2 className="text-2xl font-bold">All cleared 🎉</h2>
          <p className="text-slate-500">You've worked through all {sum.total} exercises in this selection.</p>
          <button
            onClick={() => {
              resetMany(allIds)
              setReshuffle((n) => n + 1)
            }}
            className="rounded-lg bg-violet-600 px-4 py-2 font-semibold text-white hover:bg-violet-500"
          >
            Study all again
          </button>
        </div>
      </div>
    )

  const q = session.current.q
  return (
    <div className="space-y-4">
      {header}
      <div className="mx-auto max-w-2xl space-y-4">
        <div className="flex items-center justify-between gap-2 text-sm text-slate-500">
          <span>
            {sum.mastered}/{sum.total} mastered · {session.remaining} left
          </span>
          <button
            onClick={() => session.undo()}
            disabled={!session.canUndo}
            className="rounded-md border border-slate-300 px-2 py-1 font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40"
            title="Undo last answer"
          >
            ↶ Undo
          </button>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full bg-violet-500 transition-all"
            style={{ width: `${sum.total ? (sum.mastered / sum.total) * 100 : 0}%` }}
          />
        </div>

        <QuestionCard
          key={q.id}
          question={q}
          mode="study"
          keyboard
          onGradeItem={(_id, grade) => session.grade(grade)}
        />
      </div>
    </div>
  )
}
