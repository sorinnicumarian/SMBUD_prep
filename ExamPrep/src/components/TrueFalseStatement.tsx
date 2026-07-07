import { useState } from 'react'
import type { SubStatement } from '../types'
import type { Grade } from '../lib/mastery'
import { MathText } from './MathText'
import { GradeBar } from './GradeBar'

interface Props {
  sub: SubStatement
  // 'quiz': user guesses, then reveal + rate. 'reveal': show answer immediately.
  mode?: 'quiz' | 'reveal'
  onAnswer?: (guessedCorrectly: boolean) => void
  onGrade?: (g: Grade) => void
  keyboard?: boolean
}

export function TrueFalseStatement({ sub, mode = 'quiz', onAnswer, onGrade, keyboard }: Props) {
  const [guess, setGuess] = useState<boolean | null>(null)
  const revealed = mode === 'reveal' || guess !== null

  const pick = (g: boolean) => {
    if (guess !== null) return
    setGuess(g)
    onAnswer?.(g === sub.answer)
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="text-slate-800">
        <MathText>{sub.statement}</MathText>
      </div>

      {mode === 'quiz' && (
        <div className="mt-3 flex gap-2">
          {[true, false].map((opt) => {
            const isPicked = guess === opt
            const correctOpt = opt === sub.answer
            let cls = 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
            if (revealed) {
              if (correctOpt) cls = 'border-emerald-500 bg-emerald-50 text-emerald-700'
              else if (isPicked) cls = 'border-rose-500 bg-rose-50 text-rose-700'
              else cls = 'border-slate-200 bg-white text-slate-400'
            }
            return (
              <button
                key={String(opt)}
                onClick={() => pick(opt)}
                disabled={revealed}
                className={`rounded-md border px-4 py-1.5 text-sm font-semibold transition ${cls}`}
              >
                {opt ? 'True' : 'False'}
                {revealed && correctOpt && ' ✓'}
                {revealed && isPicked && !correctOpt && ' ✗'}
              </button>
            )
          })}
        </div>
      )}

      {revealed && (
        <div className="mt-3 border-t border-slate-100 pt-3">
          <div className="mb-1 text-sm font-semibold">
            <span className={sub.answer ? 'text-emerald-600' : 'text-rose-600'}>
              {sub.answer ? 'TRUE' : 'FALSE'}
            </span>
            {mode === 'quiz' && guess !== null && (
              <span className="ml-2 text-xs font-normal text-slate-500">
                {guess === sub.answer ? 'You got it right' : 'You guessed wrong'}
              </span>
            )}
          </div>
          <div className="text-sm text-slate-600">
            <MathText>{sub.motivation}</MathText>
          </div>
        </div>
      )}

      {mode === 'quiz' && guess !== null && onGrade && (
        <div className="mt-3">
          <GradeBar onGrade={onGrade} keyboard={keyboard} />
        </div>
      )}
    </div>
  )
}
