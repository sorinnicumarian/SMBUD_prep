import { Link, useParams } from 'react-router-dom'
import { useData } from '../lib/data'
import { useProgress } from '../lib/progress'
import { QuestionCard } from '../components/QuestionCard'

export function QuestionPermalink() {
  const { id } = useParams()
  const { questions } = useData()
  const { record } = useProgress()
  const q = questions.find((x) => x.id === id)

  if (!q)
    return (
      <div className="text-slate-500">
        Question not found.{' '}
        <Link to="/browse" className="text-blue-600 underline">
          Browse all
        </Link>
      </div>
    )

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Link to="/browse" className="text-sm text-slate-500 hover:text-slate-800">
        ← Browse
      </Link>
      <QuestionCard question={q} mode="study" onGradeItem={record} />
    </div>
  )
}
