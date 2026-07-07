import { useData } from '../lib/data'

// Links to the original exam PDF(s) for a question, so answers can be verified against the source.
export function ExamLinks({ examId }: { examId: string }) {
  const { examSources } = useData()
  const sources = examSources[examId]
  if (!sources?.length) return null
  const base = import.meta.env.BASE_URL
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      {sources.map((s) => (
        <a
          key={s.file}
          href={`${base}exams/${s.file}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 rounded border border-slate-300 px-1.5 py-0.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
          title={`Open ${s.label} (PDF) in a new tab`}
        >
          📄 {s.label} ↗
        </a>
      ))}
    </span>
  )
}
