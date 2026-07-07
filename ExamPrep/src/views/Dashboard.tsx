import { Link } from 'react-router-dom'
import {
  Bar,
  BarChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useData } from '../lib/data'
import { useProgress } from '../lib/progress'
import { allItems } from '../lib/items'
import { summarize } from '../lib/mastery'
import { QTYPE_LABELS, type QType } from '../types'

function Tile({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="text-3xl font-bold text-slate-900">{value}</div>
      <div className="text-sm font-medium text-slate-500">{label}</div>
      {sub && <div className="mt-0.5 text-xs text-slate-400">{sub}</div>}
    </div>
  )
}

function Panel({ title, children, hint }: { title: string; children: React.ReactNode; hint?: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
      {hint && <p className="mb-2 text-xs text-slate-400">{hint}</p>}
      <div className="mt-2">{children}</div>
    </div>
  )
}

export function Dashboard() {
  const { stats, questions, taxonomy, topicMap, course } = useData()
  const { progress } = useProgress()
  if (!stats) return null

  const items = allItems(questions)
  const cov = summarize(items.map((i) => i.itemId), progress)

  // per-part coverage (CI: first/second exam)
  const partData = course?.hasParts
    ? (['first', 'second'] as const).map((p) => {
        const ids = items.filter((i) => i.question.part === p).map((i) => i.itemId)
        return { part: p, label: course.partLabels?.[p] ?? p, ...summarize(ids, progress) }
      })
    : []

  // topic frequency (sorted desc)
  const topicData = taxonomy
    .map((t) => ({ key: t.key, name: t.short, value: stats.byTopic[t.key] ?? 0, color: t.color }))
    .filter((d) => d.value > 0)
    .sort((a, b) => b.value - a.value)

  // type distribution
  const typeColors: Record<string, string> = {
    'theory-essay': '#7c3aed',
    'true-false-motivated': '#0ea5e9',
    'code-interpretation': '#f59e0b',
    'applied-modeling': '#14b8a6',
    'numerical-computation': '#f43f5e',
    'multiple-choice': '#6366f1',
  }
  const typeData = (Object.keys(QTYPE_LABELS) as QType[])
    .map((t) => ({ name: QTYPE_LABELS[t], value: stats.byType[t] ?? 0, color: typeColors[t] }))
    .filter((d) => d.value > 0)

  // topics over time (stacked)
  const years = Object.keys(stats.byYear).sort()
  const overTime = years.map((y) => {
    const row: Record<string, number | string> = { year: y }
    for (const t of taxonomy) row[t.key] = stats.topicByYear[t.key]?.[y] ?? 0
    return row
  })

  const coverageData = [
    { name: 'Mastered', value: cov.mastered, color: '#22c55e' },
    { name: 'Remaining', value: cov.remaining, color: '#e2e8f0' },
  ]
  const pct = cov.total ? Math.round((cov.mastered / cov.total) * 100) : 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500">
          {stats.totalQuestions} exercises from {stats.totalExams} exams · {stats.totalSubStatements} True/False statements
        </p>
      </div>

      {cov.remaining > 0 && (
        <Link
          to="/quiz"
          className="flex items-center justify-between rounded-xl border border-sky-300 bg-sky-50 px-4 py-3 transition hover:bg-sky-100"
        >
          <span className="text-sm font-medium text-sky-900">
            <span className="text-lg font-bold">{cov.remaining}</span> question{cov.remaining === 1 ? '' : 's'} left to master
            {cov.mastered === 0 ? ' — start cramming' : ''}
          </span>
          <span className="text-sm font-semibold text-sky-700">Cram →</span>
        </Link>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Tile label="Mastered" value={`${pct}%`} sub={`${cov.mastered}/${cov.total} cleared`} />
        <Tile label="Left" value={cov.remaining} sub="to master" />
        <Tile label="Questions" value={cov.total} sub="in this course" />
        <Tile label="Exams" value={stats.totalExams} sub={`${stats.totalQuestions} exercises`} />
      </div>

      {partData.length > 0 && (
        <Panel
          title="Exam-part coverage"
          hint="Your progress on first-exam vs second-exam topics. Use the Exam part filter in Quiz/Browse to focus."
        >
          <div className="grid gap-3 sm:grid-cols-2">
            {partData.map((p) => {
              const ppct = p.total ? Math.round((p.mastered / p.total) * 100) : 0
              return (
                <div key={p.part} className="rounded-lg border border-slate-200 p-3">
                  <div className="flex items-baseline justify-between">
                    <span className="font-semibold text-slate-800">{p.label}</span>
                    <span className="text-sm text-slate-500">{p.total} questions</span>
                  </div>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200">
                    <div className="h-full rounded-full bg-emerald-500" style={{ width: `${ppct}%` }} />
                  </div>
                  <div className="mt-1 flex justify-between text-xs text-slate-500">
                    <span>{ppct}% mastered ({p.mastered}/{p.total})</span>
                    <span>{p.remaining} left</span>
                  </div>
                </div>
              )
            })}
          </div>
        </Panel>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Most-asked concepts" hint="Number of exercises tagged with each topic across all exams.">
          <ResponsiveContainer width="100%" height={Math.max(220, topicData.length * 30)}>
            <BarChart data={topicData} layout="vertical" margin={{ left: 10, right: 20 }}>
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
              <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {topicData.map((d) => (
                  <Cell key={d.key} fill={d.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title="Question types">
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={typeData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>
                {typeData.map((d) => (
                  <Cell key={d.name} fill={d.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title="Topics over time" hint="Topic mix per academic year.">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={overTime} margin={{ left: 0, right: 10 }}>
              <XAxis dataKey="year" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              {taxonomy.map((t) => (
                <Bar key={t.key} dataKey={t.key} stackId="a" fill={t.color} name={topicMap[t.key]?.short} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title="Your coverage" hint="How much of the archive you've worked through.">
          <div className="flex flex-col items-center gap-4 sm:flex-row">
            <div className="w-full sm:w-1/2">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={coverageData} dataKey="value" innerRadius={55} outerRadius={85}>
                    {coverageData.map((d) => (
                      <Cell key={d.name} fill={d.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-1.5 text-sm">
              <div className="text-2xl font-bold">{pct}%</div>
              <div className="text-slate-500">{cov.mastered} of {cov.total} questions mastered</div>
              <ul className="space-y-1 text-slate-600">
                <li>🟢 <span className="font-semibold">{cov.mastered}</span> mastered</li>
                <li>⚪ <span className="font-semibold">{cov.remaining}</span> left to master</li>
              </ul>
              <Link to="/progress" className="inline-block text-xs font-medium text-blue-600 hover:underline">
                View progress →
              </Link>
            </div>
          </div>
        </Panel>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link to="/quiz" className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-500">
          Start a quiz
        </Link>
        <Link to="/practice" className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-500">
          Practice exercises
        </Link>
        <Link to="/exams" className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700">
          Simulate a full exam
        </Link>
      </div>
    </div>
  )
}
