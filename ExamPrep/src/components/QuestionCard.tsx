import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { Question } from '../types'
import { QTYPE_LABELS } from '../types'
import type { Grade } from '../lib/mastery'
import { useData } from '../lib/data'
import { MathText } from './MathText'
import { CodeBlock } from './CodeBlock'
import { TopicBadge } from './TopicBadge'
import { TrueFalseStatement } from './TrueFalseStatement'
import { MultipleChoice } from './MultipleChoice'
import { GradeBar } from './GradeBar'
import { ExamLinks } from './ExamLinks'
import { ContextBox } from './ContextBox'
import { InteractiveTable } from './InteractiveTable'
import { formatExamDate } from '../lib/items'

interface Props {
  question: Question
  // 'study' = interactive (rate with Again/Hard/Good/Easy). 'reveal' = show everything.
  mode?: 'study' | 'reveal'
  onGradeItem?: (itemId: string, grade: Grade) => void
  showMeta?: boolean
  keyboard?: boolean
}

const TYPE_COLOR: Record<string, string> = {
  'theory-essay': 'bg-violet-100 text-violet-700',
  'true-false-motivated': 'bg-sky-100 text-sky-700',
  'code-interpretation': 'bg-amber-100 text-amber-700',
  'applied-modeling': 'bg-teal-100 text-teal-700',
  'numerical-computation': 'bg-rose-100 text-rose-700',
  'multiple-choice': 'bg-indigo-100 text-indigo-700',
}

function SolutionBox({ q }: { q: Question }) {
  return (
    <div className="rounded-lg bg-slate-50 p-4">
      <div className="mb-2 flex items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Solution</span>
        {q.solutionSource === 'authored' && (
          <span
            className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700"
            title="Model answer grounded in the course lectures — not an official typeset solution."
          >
            MODEL ANSWER
          </span>
        )}
      </div>
      <div className="prose-solution text-slate-700">
        <MathText>{q.solution}</MathText>
      </div>
    </div>
  )
}

export function QuestionCard({ question: q, mode = 'study', onGradeItem, showMeta = true, keyboard }: Props) {
  const { topicMap } = useData()
  const [revealed, setRevealed] = useState(mode === 'reveal')
  const [graded, setGraded] = useState(false)
  const [mcAnswered, setMcAnswered] = useState(mode === 'reveal')
  const primary = topicMap[q.topics[0]]
  const isTF = q.type === 'true-false-motivated'
  const isMC = q.type === 'multiple-choice'

  const grade = (itemId: string, g: Grade) => {
    onGradeItem?.(itemId, g)
    setGraded(true)
  }

  return (
    <article
      className="rounded-xl border border-slate-200 bg-white shadow-sm"
      style={{ borderLeft: `4px solid ${primary?.color ?? '#94a3b8'}` }}
    >
      {showMeta && (
        <header className="flex flex-wrap items-center gap-2 border-b border-slate-100 px-5 py-3 text-sm">
          <span className={`rounded px-2 py-0.5 text-xs font-semibold ${TYPE_COLOR[q.type]}`}>
            {QTYPE_LABELS[q.type]}
          </span>
          <Link to={`/q/${q.id}`} className="font-medium text-slate-500 hover:text-slate-800">
            {formatExamDate(q.examId)} · Ex {q.exerciseNo}
          </Link>
          {q.marks != null && <span className="text-xs text-slate-400">{q.marks} marks</span>}
          <ExamLinks examId={q.examId} />
          <span className="ml-auto flex flex-wrap gap-1">
            {q.topics.map((t) => (
              <TopicBadge key={t} topic={t} short />
            ))}
          </span>
        </header>
      )}

      <div className="px-5 py-4">
        <ContextBox context={q.context} />
        <div className="text-slate-800">
          <MathText>{q.prompt}</MathText>
        </div>
        {q.code && <CodeBlock code={q.code} />}
        {q.fillTable && <InteractiveTable table={q.fillTable} />}

        {isTF ? (
          <div className="mt-4 space-y-3">
            {q.subStatements!.map((s) => (
              <TrueFalseStatement
                key={s.id}
                sub={s}
                mode={mode === 'reveal' ? 'reveal' : 'quiz'}
                onGrade={onGradeItem ? (g) => onGradeItem(s.id, g) : undefined}
                keyboard={keyboard}
              />
            ))}
          </div>
        ) : isMC ? (
          <div className="mt-2 space-y-3">
            <MultipleChoice
              choices={q.choices!}
              correct={q.correctChoice!}
              mode={mode === 'reveal' ? 'reveal' : 'quiz'}
              onAnswer={() => setMcAnswered(true)}
            />
            {mcAnswered && <SolutionBox q={q} />}
            {mode === 'study' && mcAnswered && onGradeItem && !graded && (
              <GradeBar onGrade={(g) => grade(q.id, g)} keyboard={keyboard} />
            )}
            {graded && <p className="text-sm text-slate-400">Recorded ✓</p>}
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {!revealed ? (
              <button
                onClick={() => setRevealed(true)}
                className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
              >
                Show solution
              </button>
            ) : (
              <SolutionBox q={q} />
            )}
            {mode === 'study' && revealed && onGradeItem && !graded && (
              <GradeBar onGrade={(g) => grade(q.id, g)} keyboard={keyboard} />
            )}
            {graded && <p className="text-sm text-slate-400">Recorded ✓</p>}
          </div>
        )}
      </div>
    </article>
  )
}
