import { useMemo, useRef, useState } from 'react'
import { useData } from '../lib/data'
import { useProgress } from '../lib/progress'
import { applyFilters, emptyFilters, Filters, type FilterState } from '../components/Filters'
import { TrueFalseStatement } from '../components/TrueFalseStatement'
import { MultipleChoice } from '../components/MultipleChoice'
import { MathText } from '../components/MathText'
import { TopicBadge } from '../components/TopicBadge'
import { GradeBar } from '../components/GradeBar'
import { ExamLinks } from '../components/ExamLinks'
import { ContextBox } from '../components/ContextBox'
import { isMastered, summarize, type Grade } from '../lib/mastery'
import { shuffle, useCramSession } from '../lib/session'
import { formatExamDate } from '../lib/items'
import type { Question, SubStatement } from '../types'

type Card = { itemId: string; q: Question; sub?: SubStatement }

function flatten(questions: Question[]): Card[] {
  return questions.flatMap((q) => {
    if (q.type === 'true-false-motivated')
      return (q.subStatements ?? []).map((sub) => ({ itemId: sub.id, q, sub }))
    if (q.type === 'multiple-choice') return [{ itemId: q.id, q }]
    return []
  })
}

export function Quiz() {
  const { questions } = useData()
  const { progress, record, restore, resetMany } = useProgress()
  const [filters, setFilters] = useState<FilterState>(emptyFilters)
  const [showFilters, setShowFilters] = useState(false)
  const [reshuffle, setReshuffle] = useState(0)
  const [answered, setAnswered] = useState(false)

  const progressRef = useRef(progress)
  progressRef.current = progress

  const allCards = useMemo(() => flatten(applyFilters(questions, filters)), [questions, filters])
  const allIds = useMemo(() => allCards.map((c) => c.itemId), [allCards])
  // working set = not-yet-mastered, captured at (re)start so it doesn't reshuffle mid-session
  const workingCards = useMemo(
    () => shuffle(allCards.filter((c) => !isMastered(progressRef.current[c.itemId]))),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [allCards, reshuffle],
  )

  const session = useCramSession(workingCards, {
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
        <h1 className="text-2xl font-bold text-slate-900">Quiz</h1>
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
    </div>
  )

  if (allCards.length === 0)
    return (
      <div className="space-y-4">
        {header}
        <p className="py-12 text-center text-slate-400">
          No True/False or multiple-choice questions match these filters.
        </p>
      </div>
    )

  if (session.done || !session.current)
    return (
      <div className="space-y-4">
        {header}
        <div className="mx-auto max-w-md space-y-4 rounded-xl border border-slate-200 bg-white p-8 text-center">
          <h2 className="text-2xl font-bold">All cleared 🎉</h2>
          <p className="text-slate-500">
            You've mastered all {sum.total} questions in this selection.
          </p>
          <button
            onClick={() => {
              resetMany(allIds)
              setReshuffle((n) => n + 1)
            }}
            className="rounded-lg bg-sky-600 px-4 py-2 font-semibold text-white hover:bg-sky-500"
          >
            Study all again
          </button>
        </div>
      </div>
    )

  const card = session.current
  const onGrade = (g: Grade) => {
    session.grade(g)
    setAnswered(false)
  }

  return (
    <div className="space-y-4">
      {header}
      <div className="mx-auto max-w-2xl space-y-4">
        <div className="flex items-center justify-between gap-2 text-sm text-slate-500">
          <span>
            {sum.mastered}/{sum.total} mastered · {session.remaining} left
          </span>
          <div className="flex items-center gap-2">
            {card.q.topics.map((t) => (
              <TopicBadge key={t} topic={t} short />
            ))}
            <button
              onClick={() => {
                session.undo()
                setAnswered(false)
              }}
              disabled={!session.canUndo}
              className="rounded-md border border-slate-300 px-2 py-1 font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40"
              title="Undo last answer"
            >
              ↶ Undo
            </button>
          </div>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full bg-sky-500 transition-all"
            style={{ width: `${sum.total ? (sum.mastered / sum.total) * 100 : 0}%` }}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
          <span>
            {formatExamDate(card.q.examId)} · Ex {card.q.exerciseNo}
          </span>
          <ExamLinks examId={card.q.examId} />
        </div>

        {card.sub ? (
          <TrueFalseStatement key={card.itemId} sub={card.sub} mode="quiz" onGrade={onGrade} keyboard />
        ) : (
          <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-4">
            <ContextBox context={card.q.context} />
            <div className="text-slate-800">
              <MathText>{card.q.prompt}</MathText>
            </div>
            <MultipleChoice
              key={card.itemId}
              choices={card.q.choices!}
              correct={card.q.correctChoice!}
              mode="quiz"
              onAnswer={() => setAnswered(true)}
            />
            {answered && (
              <div className="border-t border-slate-100 pt-3 text-sm text-slate-600">
                <MathText>{card.q.solution}</MathText>
              </div>
            )}
            {answered && <GradeBar onGrade={onGrade} keyboard />}
          </div>
        )}
      </div>
    </div>
  )
}
