import { useMemo, useState } from 'react'
import type { FillTable } from '../types'
import { MathText } from './MathText'

// Normalize a cell value for lenient comparison: lowercase, collapse whitespace,
// drop spaces around punctuation, strip a leading "$" on register names, trim trailing dots.
function norm(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/\$/g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s*([(),/])\s*/g, '$1')
    .replace(/\.+$/, '')
}

// An `answer` of "" (or all-"" variants) marks a cell that should be LEFT BLANK —
// e.g. an empty slot in a VLIW schedule grid. The whole grid is editable so the table
// never reveals where the operations go; a blank slot is correct only when left empty.
function isEmptyExpected(answer: string | string[]): boolean {
  const answers = Array.isArray(answer) ? answer : [answer]
  return answers.every((a) => norm(a) === '')
}

function isCorrect(input: string, answer: string | string[]): boolean {
  const answers = Array.isArray(answer) ? answer : [answer]
  const u = norm(input)
  if (isEmptyExpected(answer)) return u === ''
  if (!u) return false
  return answers.some((a) => norm(a) === u)
}

// A cell is editable when it has an `answer` and no `given`.
export function InteractiveTable({ table }: { table: FillTable }) {
  const { columns, rows, caption } = table
  const [values, setValues] = useState<Record<string, string>>({})
  const [checked, setChecked] = useState(false)
  const [revealed, setRevealed] = useState(false)

  const blanks = useMemo(() => {
    const out: string[] = []
    rows.forEach((row, r) =>
      row.forEach((cell, c) => {
        if (cell.answer != null && cell.given == null) out.push(`${r},${c}`)
      }),
    )
    return out
  }, [rows])

  // Score only "relevant" cells: those expecting a value, plus any blank-slot the
  // student filled by mistake. Empty slots left empty aren't counted, so a full VLIW
  // grid scores out of the number of operations (e.g. 8/8), not out of every cell.
  const score = useMemo(() => {
    let ok = 0
    let total = 0
    for (const key of blanks) {
      const [r, c] = key.split(',').map(Number)
      const cell = rows[r][c]
      const userVal = values[key] ?? ''
      const relevant = !isEmptyExpected(cell.answer!) || norm(userVal) !== ''
      if (!relevant) continue
      total++
      if (isCorrect(userVal, cell.answer!)) ok++
    }
    return { ok, total }
  }, [blanks, values, rows])

  const set = (key: string, v: string) => {
    setValues((prev) => ({ ...prev, [key]: v }))
    if (checked) setChecked(false)
  }

  const canonical = (answer: string | string[]) => (Array.isArray(answer) ? answer[0] : answer)

  // A table with no blanks is a "given" table (e.g. a Scoreboard/Tomasulo execution
  // shown for analysis): render it read-only, without the Check / Reveal / Clear controls.
  const readOnly = blanks.length === 0

  return (
    <div className="my-3 space-y-2">
      {caption && <div className="text-xs font-medium uppercase tracking-wide text-slate-500">{caption}</div>}
      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="border-collapse text-sm">
          <thead>
            <tr>
              {columns.map((col, c) => (
                <th
                  key={c}
                  className="border border-slate-300 bg-slate-100 px-2.5 py-1.5 text-left align-bottom font-semibold text-slate-700"
                >
                  <MathText>{col}</MathText>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, r) => (
              <tr key={r}>
                {row.map((cell, c) => {
                  const key = `${r},${c}`
                  const editable = cell.answer != null && cell.given == null
                  if (!editable) {
                    return (
                      <td
                        key={c}
                        className="whitespace-nowrap border border-slate-300 bg-slate-50/60 px-2.5 py-1 text-slate-700"
                      >
                        {cell.given != null ? <MathText>{cell.given}</MathText> : ''}
                      </td>
                    )
                  }
                  const userVal = values[key] ?? ''
                  // A blank NOP slot left blank is neutral (not scored, not coloured);
                  // only cells expecting a value, or that the student filled, get a verdict.
                  const relevant = !isEmptyExpected(cell.answer!) || norm(userVal) !== ''
                  const ok = checked && relevant ? isCorrect(userVal, cell.answer!) : null
                  const show = revealed ? canonical(cell.answer!) : userVal
                  return (
                    <td
                      key={c}
                      className={`border border-slate-300 px-1 py-0.5 ${
                        ok === true ? 'bg-emerald-50' : ok === false ? 'bg-rose-50' : ''
                      }`}
                    >
                      <div className="flex items-center gap-1">
                        <input
                          value={show}
                          readOnly={revealed}
                          onChange={(e) => set(key, e.target.value)}
                          className={`w-24 min-w-[3.5rem] rounded border px-1.5 py-0.5 text-sm outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-300 ${
                            ok === true
                              ? 'border-emerald-300 text-emerald-800'
                              : ok === false
                                ? 'border-rose-300 text-rose-800'
                                : 'border-slate-300'
                          } ${revealed ? 'bg-amber-50 font-medium text-amber-800' : ''}`}
                        />
                        {ok === false && !revealed && (
                          <span className="whitespace-nowrap text-xs text-rose-500" title="Correct answer">
                            → {isEmptyExpected(cell.answer!) ? '(blank)' : canonical(cell.answer!)}
                          </span>
                        )}
                      </div>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!readOnly && (
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => {
            setChecked(true)
            setRevealed(false)
          }}
          className="rounded-md bg-sky-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-sky-500"
        >
          Check
        </button>
        <button
          onClick={() => setRevealed((v) => !v)}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          {revealed ? 'Hide answers' : 'Reveal answers'}
        </button>
        <button
          onClick={() => {
            setValues({})
            setChecked(false)
            setRevealed(false)
          }}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          Clear
        </button>
        {checked && !revealed && (
          <span
            className={`text-sm font-semibold ${
              score.ok === score.total ? 'text-emerald-600' : 'text-slate-600'
            }`}
          >
            {score.ok}/{score.total} correct{score.ok === score.total ? ' 🎉' : ''}
          </span>
        )}
      </div>
      )}
    </div>
  )
}
