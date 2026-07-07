import { useMemo, useState } from 'react'
import { useData } from '../lib/data'
import { MathText } from '../components/MathText'

export function Guide() {
  const { guide, course } = useData()
  const [open, setOpen] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(guide.map((g) => [g.id, true])),
  )
  const [tag, setTag] = useState<string>('All')
  const [query, setQuery] = useState('')

  const tags = useMemo(() => {
    const seen: string[] = []
    for (const g of guide) if (g.tag && !seen.includes(g.tag)) seen.push(g.tag)
    return ['All', ...seen]
  }, [guide])

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return guide.filter(
      (g) =>
        (tag === 'All' || g.tag === tag) &&
        (!q || g.title.toLowerCase().includes(q) || g.body.toLowerCase().includes(q)),
    )
  }, [guide, tag, query])

  const allOpen = visible.length > 0 && visible.every((g) => open[g.id])
  const toggleAll = () => {
    const next = { ...open }
    for (const g of visible) next[g.id] = !allOpen
    setOpen(next)
  }

  if (guide.length === 0)
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-slate-900">Guide</h1>
        <p className="py-12 text-center text-slate-400">
          No study guide for {course?.shortTitle ?? 'this course'} yet.
        </p>
      </div>
    )

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Guide</h1>
          <p className="text-sm text-slate-500">
            The theory behind the exercises — {course?.title}. Tap a topic to expand.
          </p>
        </div>
        <button
          onClick={toggleAll}
          className="shrink-0 rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          {allOpen ? 'Collapse all' : 'Expand all'}
        </button>
      </div>

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search the guide…"
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sky-400 focus:outline-none focus:ring-1 focus:ring-sky-300"
      />

      {tags.length > 1 && (
        <div className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
          {tags.map((t) => (
            <button
              key={t}
              onClick={() => setTag(t)}
              className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold transition ${
                tag === t ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      )}

      <div className="space-y-2">
        {visible.map((g) => {
          const isOpen = !!open[g.id]
          return (
            <div key={g.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              <button
                onClick={() => setOpen((o) => ({ ...o, [g.id]: !o[g.id] }))}
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-slate-50"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <span className="font-semibold text-slate-800">{g.title}</span>
                  {g.tag && (
                    <span className="shrink-0 rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-sky-700">
                      {g.tag}
                    </span>
                  )}
                </span>
                <span className="shrink-0 text-slate-400">{isOpen ? '▾' : '▸'}</span>
              </button>
              {isOpen && (
                <div className="border-t border-slate-100 px-4 py-3 text-sm text-slate-700">
                  <MathText>{g.body}</MathText>
                </div>
              )}
            </div>
          )
        })}
        {visible.length === 0 && (
          <p className="py-8 text-center text-slate-400">No topics match your search.</p>
        )}
      </div>
    </div>
  )
}
