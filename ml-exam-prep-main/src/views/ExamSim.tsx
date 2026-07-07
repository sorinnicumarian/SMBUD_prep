import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useData } from '../lib/data'
import { QuestionCard } from '../components/QuestionCard'

const DEFAULT_MINUTES = 120

function fmt(secs: number): string {
  const s = Math.max(0, secs)
  const m = Math.floor(s / 60)
  return `${m}:${String(s % 60).padStart(2, '0')}`
}

function ExamList() {
  const { stats } = useData()
  if (!stats) return null
  const exams = [...stats.exams].sort((a, b) => (a.date < b.date ? 1 : -1))
  const years = Array.from(new Set(exams.map((e) => e.academicYear))).sort((a, b) => (a < b ? 1 : -1))
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Exam Simulation</h1>
      <p className="text-sm text-slate-500">
        Pick a past exam, set a timer, and work through every exercise before revealing the solutions.
      </p>
      {years.map((year) => (
        <div key={year} className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">{year}</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {exams
              .filter((e) => e.academicYear === year)
              .map((e) => (
                <Link
                  key={e.examId}
                  to={`/exams/${e.examId}`}
                  className="rounded-xl border border-slate-200 bg-white p-4 transition hover:border-slate-400 hover:shadow-sm"
                >
                  <div className="text-lg font-bold text-slate-900">{e.date}</div>
                  <div className="text-sm text-slate-500">{e.academicYear}</div>
                  <div className="mt-2 flex items-center gap-2 text-xs text-slate-400">
                    <span>{e.questionCount} exercises</span>
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 font-medium uppercase">{e.format}</span>
                  </div>
                </Link>
              ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export function ExamSim() {
  const { examId } = useParams()
  if (!examId) return <ExamList />
  return <ExamRunner examId={examId} />
}

function ExamRunner({ examId }: { examId: string }) {
  const { questions } = useData()
  const navigate = useNavigate()
  const items = useMemo(
    () => questions.filter((q) => q.examId === examId).sort((a, b) => a.exerciseNo - b.exerciseNo),
    [questions, examId],
  )
  const [minutes, setMinutes] = useState(DEFAULT_MINUTES)
  const [startedAt, setStartedAt] = useState<number | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const [revealed, setRevealed] = useState(false)

  useEffect(() => {
    if (startedAt === null) return
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - startedAt) / 1000)), 1000)
    return () => clearInterval(id)
  }, [startedAt])

  const remaining = minutes * 60 - elapsed
  useEffect(() => {
    if (startedAt !== null && remaining <= 0 && !revealed) setRevealed(true)
  }, [remaining, startedAt, revealed])

  if (items.length === 0)
    return (
      <div className="text-slate-500">
        Exam not found.{' '}
        <Link to="/exams" className="text-blue-600 underline">
          Back to list
        </Link>
      </div>
    )

  const date = items[0].date

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-slate-200 bg-white px-4 py-3">
        <Link to="/exams" className="text-sm text-slate-500 hover:text-slate-800">
          ← Exams
        </Link>
        <h1 className="text-lg font-bold text-slate-900">{date}</h1>
        <span className="text-sm text-slate-500">{items.length} exercises</span>
        <div className="ml-auto flex items-center gap-3">
          {startedAt === null ? (
            <>
              <label className="flex items-center gap-1 text-sm text-slate-500">
                <input
                  type="number"
                  value={minutes}
                  min={1}
                  onChange={(e) => setMinutes(Number(e.target.value) || DEFAULT_MINUTES)}
                  className="w-16 rounded border border-slate-300 px-2 py-1 text-right"
                />
                min
              </label>
              <button
                onClick={() => {
                  setStartedAt(Date.now())
                  setElapsed(0)
                }}
                className="rounded-lg bg-emerald-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-emerald-500"
              >
                Start timer
              </button>
            </>
          ) : (
            <span
              className={`font-mono text-lg font-bold ${remaining <= 60 ? 'text-rose-600' : 'text-slate-800'}`}
            >
              {fmt(remaining)}
            </span>
          )}
          <button
            onClick={() => setRevealed((r) => !r)}
            className="rounded-lg bg-slate-900 px-4 py-1.5 text-sm font-semibold text-white hover:bg-slate-700"
          >
            {revealed ? 'Hide solutions' : 'Reveal solutions'}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {items.map((q) => (
          <div key={q.id}>
            <div className="mb-1 text-sm font-bold text-slate-400">Exercise {q.exerciseNo}</div>
            <QuestionCard question={q} mode={revealed ? 'reveal' : 'study'} showMeta={false} />
          </div>
        ))}
      </div>

      <div className="flex justify-center gap-3 py-4">
        <button
          onClick={() => {
            setRevealed(true)
            window.scrollTo({ top: 0, behavior: 'smooth' })
          }}
          className="rounded-lg bg-emerald-600 px-6 py-2.5 font-semibold text-white hover:bg-emerald-500"
        >
          Submit & reveal all
        </button>
        <button
          onClick={() => navigate('/exams')}
          className="rounded-lg border border-slate-300 px-6 py-2.5 font-semibold text-slate-700 hover:bg-white"
        >
          Exit
        </button>
      </div>
    </div>
  )
}
