import { useEffect } from 'react'
import { GRADES, type Grade } from '../lib/mastery'

const STYLE: Record<Grade, { label: string; sub: string; cls: string; key: string }> = {
  again: { label: 'Again', sub: 'soon', cls: 'border-rose-500 bg-rose-50 text-rose-700 hover:bg-rose-100', key: '1' },
  hard: { label: 'Hard', sub: 'later', cls: 'border-amber-500 bg-amber-50 text-amber-700 hover:bg-amber-100', key: '2' },
  good: { label: 'Good', sub: 'got it', cls: 'border-emerald-500 bg-emerald-50 text-emerald-700 hover:bg-emerald-100', key: '3' },
  easy: { label: 'Easy', sub: 'easy ✓', cls: 'border-sky-500 bg-sky-50 text-sky-700 hover:bg-sky-100', key: '4' },
}

// Rate how well you knew the card. Again/Hard return it later this session; Good/Easy clear it.
export function GradeBar({ onGrade, keyboard = false }: { onGrade: (g: Grade) => void; keyboard?: boolean }) {
  useEffect(() => {
    if (!keyboard) return
    const handler = (e: KeyboardEvent) => {
      const i = ['1', '2', '3', '4'].indexOf(e.key)
      if (i >= 0) {
        e.preventDefault()
        onGrade(GRADES[i])
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [keyboard, onGrade])

  return (
    <div className="flex flex-wrap gap-2">
      {GRADES.map((g) => (
        <button
          key={g}
          onClick={() => onGrade(g)}
          className={`flex min-w-[68px] flex-1 flex-col items-center rounded-lg border px-3 py-1.5 text-sm font-semibold transition ${STYLE[g].cls}`}
          title={`${STYLE[g].label} (key ${STYLE[g].key})`}
        >
          <span>{STYLE[g].label}</span>
          <span className="text-[11px] font-normal opacity-70">{STYLE[g].sub}</span>
        </button>
      ))}
    </div>
  )
}
