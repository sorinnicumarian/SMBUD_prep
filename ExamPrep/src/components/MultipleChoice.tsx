import { useState } from 'react'
import type { Choice } from '../types'
import type { Grade } from '../lib/mastery'
import { MathText } from './MathText'
import { GradeBar } from './GradeBar'

interface Props {
  choices: Choice[]
  correct: string // correct Choice.label
  mode?: 'quiz' | 'reveal'
  onAnswer?: (guessedCorrectly: boolean) => void
  onGrade?: (g: Grade) => void
  keyboard?: boolean
}

export function MultipleChoice({ choices, correct, mode = 'quiz', onAnswer, onGrade, keyboard }: Props) {
  const [picked, setPicked] = useState<string | null>(null)
  const revealed = mode === 'reveal' || picked !== null

  const pick = (label: string) => {
    if (picked !== null) return
    setPicked(label)
    onAnswer?.(label === correct)
  }

  return (
    <div className="mt-3 space-y-3">
      <div className="space-y-2">
      {choices.map((c) => {
        const isCorrect = c.label === correct
        const isPicked = picked === c.label
        let cls = 'border-slate-300 bg-white hover:bg-slate-50'
        if (revealed) {
          if (isCorrect) cls = 'border-emerald-500 bg-emerald-50'
          else if (isPicked) cls = 'border-rose-500 bg-rose-50'
          else cls = 'border-slate-200 bg-white opacity-70'
        }
        return (
          <button
            key={c.label}
            onClick={() => pick(c.label)}
            disabled={revealed}
            className={`flex w-full items-start gap-3 rounded-lg border px-3 py-2 text-left transition ${cls}`}
          >
            <span
              className={`mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-full border text-xs font-bold ${
                revealed && isCorrect
                  ? 'border-emerald-500 bg-emerald-500 text-white'
                  : revealed && isPicked
                    ? 'border-rose-500 bg-rose-500 text-white'
                    : 'border-slate-400 text-slate-600'
              }`}
            >
              {c.label}
            </span>
            <span className="text-sm text-slate-800">
              <MathText>{c.text}</MathText>
            </span>
            {revealed && isCorrect && <span className="ml-auto text-emerald-600">✓</span>}
            {revealed && isPicked && !isCorrect && <span className="ml-auto text-rose-600">✗</span>}
          </button>
        )
      })}
      </div>
      {mode === 'quiz' && picked !== null && onGrade && <GradeBar onGrade={onGrade} keyboard={keyboard} />}
    </div>
  )
}
