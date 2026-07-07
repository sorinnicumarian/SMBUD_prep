import type { CodeBlock as CodeBlockT } from '../types'

export function CodeBlock({ code }: { code: CodeBlockT }) {
  const lines = code.source.split('\n')
  return (
    <div className="my-3 overflow-hidden rounded-lg border border-slate-700 bg-slate-900">
      <div className="flex items-center justify-between border-b border-slate-700 px-3 py-1.5">
        <span className="text-xs font-medium uppercase tracking-wide text-slate-400">{code.language}</span>
      </div>
      <pre className="overflow-x-auto p-3 text-sm leading-relaxed">
        <code className="text-slate-100">
          {lines.map((ln, i) => (
            <div key={i} className="table-row">
              <span className="table-cell select-none pr-4 text-right text-slate-600">{i + 1}</span>
              <span className="table-cell whitespace-pre">{ln || ' '}</span>
            </div>
          ))}
        </code>
      </pre>
    </div>
  )
}
