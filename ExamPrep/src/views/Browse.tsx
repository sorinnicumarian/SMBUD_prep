import { useMemo, useState } from 'react'
import { useData } from '../lib/data'
import { useProgress } from '../lib/progress'
import { buildIndex } from '../lib/search'
import { applyFilters, emptyFilters, Filters } from '../components/Filters'
import { QuestionCard } from '../components/QuestionCard'

export function Browse() {
  const { questions } = useData()
  const { record } = useProgress()
  const [filters, setFilters] = useState(emptyFilters)

  const fuse = useMemo(() => buildIndex(questions), [questions])

  const results = useMemo(() => {
    const base = filters.query.trim()
      ? fuse.search(filters.query.trim()).map((r) => r.item)
      : questions
    return applyFilters(base, filters)
  }, [questions, fuse, filters])

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Browse</h1>
        <span className="text-sm text-slate-500">{results.length} exercises</span>
      </div>
      <Filters filters={filters} setFilters={setFilters} />
      <div className="space-y-4">
        {results.map((q) => (
          <QuestionCard key={q.id} question={q} mode="study" onGradeItem={record} />
        ))}
        {results.length === 0 && (
          <p className="py-12 text-center text-slate-400">No exercises match these filters.</p>
        )}
      </div>
    </div>
  )
}
