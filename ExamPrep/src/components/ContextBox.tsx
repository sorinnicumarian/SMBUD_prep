import { useState } from 'react'
import { MathText } from './MathText'

// Shows the setup of earlier exercises a question depends on (chained questions),
// collapsed by default so it doesn't clutter standalone questions.
export function ContextBox({ context }: { context?: string }) {
  const [open, setOpen] = useState(false)
  if (!context) return null
  return (
    <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50/60 px-3 py-2 text-sm">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between font-medium text-amber-800"
      >
        <span>↪ Refers to an earlier exercise — show its setup</span>
        <span className="text-amber-600">{open ? '▾' : '▸'}</span>
      </button>
      {open && (
        <div className="mt-2 border-t border-amber-200 pt-2 text-slate-700">
          <MathText>{context}</MathText>
        </div>
      )}
    </div>
  )
}
