import type { QType } from '../types'
import { QTYPE_LABELS } from '../types'
import { useData } from '../lib/data'

export interface FilterState {
  topics: string[]
  types: QType[]
  years: string[]
  parts: string[]
  query: string
}

export const emptyFilters: FilterState = { topics: [], types: [], years: [], parts: [], query: '' }

function toggle<T>(arr: T[], v: T): T[] {
  return arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]
}

export function Filters({
  filters,
  setFilters,
}: {
  filters: FilterState
  setFilters: (f: FilterState) => void
}) {
  const { taxonomy, stats, course } = useData()
  const years = stats ? Object.keys(stats.byYear).sort() : []
  const types = (Object.keys(QTYPE_LABELS) as QType[]).filter((t) => (stats?.byType[t] ?? 0) > 0)

  const pill = (active: boolean) =>
    `rounded-full border px-2.5 py-1 text-xs font-medium transition ${
      active
        ? 'border-slate-800 bg-slate-800 text-white'
        : 'border-slate-300 bg-white text-slate-600 hover:border-slate-400'
    }`

  return (
    <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
      <input
        value={filters.query}
        onChange={(e) => setFilters({ ...filters, query: e.target.value })}
        placeholder="Search questions & solutions…"
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
      />
      <div>
        <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Topic</div>
        <div className="flex flex-wrap gap-1.5">
          {taxonomy.map((t) => (
            <button
              key={t.key}
              onClick={() => setFilters({ ...filters, topics: toggle(filters.topics, t.key) })}
              className={pill(filters.topics.includes(t.key))}
            >
              {t.short}
            </button>
          ))}
        </div>
      </div>
      {course?.hasParts && (
        <div>
          <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Exam part</div>
          <div className="flex flex-wrap gap-1.5">
            {(['first', 'second'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setFilters({ ...filters, parts: toggle(filters.parts, p) })}
                className={pill(filters.parts.includes(p))}
              >
                {course.partLabels?.[p] ?? p}
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="flex flex-wrap gap-4">
        <div>
          <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Type</div>
          <div className="flex flex-wrap gap-1.5">
            {types.map((t) => (
              <button
                key={t}
                onClick={() => setFilters({ ...filters, types: toggle(filters.types, t) })}
                className={pill(filters.types.includes(t))}
              >
                {QTYPE_LABELS[t]}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Year</div>
          <div className="flex flex-wrap gap-1.5">
            {years.map((y) => (
              <button
                key={y}
                onClick={() => setFilters({ ...filters, years: toggle(filters.years, y) })}
                className={pill(filters.years.includes(y))}
              >
                {y}
              </button>
            ))}
          </div>
        </div>
      </div>
      {(filters.topics.length > 0 || filters.types.length > 0 || filters.years.length > 0 || filters.parts.length > 0 || filters.query.length > 0) && (
        <button
          onClick={() => setFilters(emptyFilters)}
          className="text-xs font-medium text-slate-500 underline hover:text-slate-800"
        >
          Clear all filters
        </button>
      )}
    </div>
  )
}

export function applyFilters<
  T extends { topics: string[]; type: QType; academicYear: string; part?: string },
>(items: T[], f: FilterState): T[] {
  return items.filter((q) => {
    if (f.topics.length && !f.topics.some((t) => q.topics.includes(t))) return false
    if (f.types.length && !f.types.includes(q.type)) return false
    if (f.years.length && !f.years.includes(q.academicYear)) return false
    if (f.parts.length && (!q.part || !f.parts.includes(q.part))) return false
    return true
  })
}
