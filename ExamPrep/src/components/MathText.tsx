import { Fragment, type ReactNode } from 'react'
import { InlineMath, BlockMath } from 'react-katex'

// One combined tokenizer for a logical line. Order matters: code spans and math are
// matched in the same pass so a `$` inside `code` is never treated as math.
//
// Inline math uses a Pandoc-style rule so register names ($1, $f0, $R1) and the like do
// NOT trigger math: the opening `$` must be followed by a non-space, the closing `$` must
// be preceded by a non-space AND not followed by a digit, and the body may not contain `$`.
// That rejects `$3 ... $2` / `$5 and $10` while still accepting real formulas like `$x_i$`.
const TOKEN_RE = new RegExp(
  [
    '\\$\\$[\\s\\S]+?\\$\\$', // block math $$...$$
    '`[^`]+`', // inline code
    '\\$(?=\\S)[^$\\n]*?(?<=\\S)\\$(?!\\d)', // inline math $...$
    '\\*\\*[^*]+\\*\\*', // **bold**
    '\\*[^*\\n]+\\*', // *italic*
  ].join('|'),
  'g',
)

// Render one logical line with inline math + markdown.
function InlineLine({ text, k }: { text: string; k: string }) {
  const out: ReactNode[] = []
  let last = 0
  let m: RegExpExecArray | null
  let i = 0
  while ((m = TOKEN_RE.exec(text)) !== null) {
    if (m.index > last) out.push(<Fragment key={`${k}-t${i}`}>{text.slice(last, m.index)}</Fragment>)
    const tok = m[0]
    if (tok.startsWith('$$')) {
      out.push(<BlockMath key={`${k}-m${i}`} math={tok.slice(2, -2)} />)
    } else if (tok.startsWith('$')) {
      out.push(<InlineMath key={`${k}-m${i}`} math={tok.slice(1, -1)} />)
    } else if (tok.startsWith('`')) {
      out.push(
        <code key={`${k}-c${i}`} className="rounded bg-slate-100 px-1 py-0.5 text-[0.85em] text-pink-700">
          {tok.slice(1, -1)}
        </code>,
      )
    } else if (tok.startsWith('**')) {
      out.push(<strong key={`${k}-b${i}`}>{tok.slice(2, -2)}</strong>)
    } else {
      out.push(<em key={`${k}-i${i}`}>{tok.slice(1, -1)}</em>)
    }
    last = m.index + tok.length
    i++
  }
  if (last < text.length) out.push(<Fragment key={`${k}-t${i}`}>{text.slice(last)}</Fragment>)
  return <>{out}</>
}

type Block =
  | { kind: 'p'; lines: string[] }
  | { kind: 'ul'; items: string[] }
  | { kind: 'ol'; items: string[] }
  | { kind: 'table'; rows: string[][] }

const isTableRow = (s: string) => /^\s*\|.*\|\s*$/.test(s)
const isTableSep = (s: string) => /^\s*\|?[\s:|-]*-[\s:|-]*\|?\s*$/.test(s) && s.includes('-')
const splitRow = (s: string) =>
  s.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim())

function parseBlocks(text: string): Block[] {
  const lines = text.split('\n')
  const blocks: Block[] = []
  for (const raw of lines) {
    const line = raw.trimEnd()
    if (isTableRow(line)) {
      if (isTableSep(line)) continue // skip the |---| separator row
      const prev = blocks[blocks.length - 1]
      const cells = splitRow(line)
      if (prev?.kind === 'table') prev.rows.push(cells)
      else blocks.push({ kind: 'table', rows: [cells] })
      continue
    }
    const bullet = /^\s*[-•]\s+(.*)$/.exec(line)
    const numbered = /^\s*\d+\.\s+(.*)$/.exec(line)
    if (bullet) {
      const prev = blocks[blocks.length - 1]
      if (prev?.kind === 'ul') prev.items.push(bullet[1])
      else blocks.push({ kind: 'ul', items: [bullet[1]] })
    } else if (numbered) {
      const prev = blocks[blocks.length - 1]
      if (prev?.kind === 'ol') prev.items.push(numbered[1])
      else blocks.push({ kind: 'ol', items: [numbered[1]] })
    } else if (line.trim() === '') {
      blocks.push({ kind: 'p', lines: [] }) // paragraph break marker
    } else {
      const prev = blocks[blocks.length - 1]
      if (prev?.kind === 'p' && prev.lines.length > 0) prev.lines.push(line)
      else blocks.push({ kind: 'p', lines: [line] })
    }
  }
  return blocks.filter((b) => (b.kind === 'p' ? b.lines.length > 0 : true))
}

export function MathText({ children, className }: { children: string; className?: string }) {
  const blocks = parseBlocks(children)
  return (
    <div className={`break-words ${className ?? ''}`}>
      {blocks.map((b, i) => {
        if (b.kind === 'ul')
          return (
            <ul key={i} className="my-2 list-disc space-y-1 pl-6">
              {b.items.map((it, j) => (
                <li key={j}>
                  <InlineLine text={it} k={`ul${i}-${j}`} />
                </li>
              ))}
            </ul>
          )
        if (b.kind === 'table')
          return (
            <div key={i} className="my-3 overflow-x-auto">
              <table className="border-collapse text-sm">
                <tbody>
                  {b.rows.map((row, r) => (
                    <tr key={r}>
                      {row.map((cell, c) => (
                        <td
                          key={c}
                          className={`border border-slate-300 px-2.5 py-1 ${r === 0 ? 'bg-slate-100 font-semibold' : ''}`}
                        >
                          <InlineLine text={cell} k={`tb${i}-${r}-${c}`} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        if (b.kind === 'ol')
          return (
            <ol key={i} className="my-2 list-decimal space-y-1 pl-6">
              {b.items.map((it, j) => (
                <li key={j}>
                  <InlineLine text={it} k={`ol${i}-${j}`} />
                </li>
              ))}
            </ol>
          )
        return (
          <p key={i} className="my-2 first:mt-0 last:mb-0">
            {b.lines.map((ln, j) => (
              <Fragment key={j}>
                {j > 0 && <br />}
                <InlineLine text={ln} k={`p${i}-${j}`} />
              </Fragment>
            ))}
          </p>
        )
      })}
    </div>
  )
}
