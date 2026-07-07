import { NavLink, Route, Routes } from 'react-router-dom'
import { useData } from './lib/data'
import { useProfiles } from './lib/profiles'
import { ProfileGate } from './components/ProfileGate'
import { Dashboard } from './views/Dashboard'
import { Browse } from './views/Browse'
import { Quiz } from './views/Quiz'
import { Practice } from './views/Practice'
import { ExamSim } from './views/ExamSim'
import { Progress } from './views/Progress'
import { Guide } from './views/Guide'
import { QuestionPermalink } from './views/QuestionPermalink'

const NAV = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/guide', label: 'Guide' },
  { to: '/browse', label: 'Browse' },
  { to: '/quiz', label: 'Quiz' },
  { to: '/practice', label: 'Practice' },
  { to: '/exams', label: 'Exam Sim' },
  { to: '/progress', label: 'Progress' },
]

export function App() {
  const { status, error, courses, activeCourse, setCourse } = useData()
  const { active, signOut } = useProfiles()

  // Require a profile first — this is what makes progress persist per person.
  if (!active) return <ProfileGate />

  if (status === 'loading')
    return <div className="flex min-h-screen items-center justify-center text-slate-400">Loading…</div>
  if (status === 'error')
    return (
      <div className="flex min-h-screen items-center justify-center px-4 text-center text-rose-600">
        Failed to load data: {error}. Did you run <code className="mx-1 rounded bg-slate-100 px-1">pnpm build:data</code>?
      </div>
    )

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto max-w-5xl px-4 py-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="shrink-0 text-lg font-bold tracking-tight text-slate-900">Exam Prep</span>
            <div className="flex min-w-0 items-center gap-2">
              {courses.length > 1 && (
                <select
                  value={activeCourse}
                  onChange={(e) => setCourse(e.target.value)}
                  className="min-w-0 truncate rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm font-medium text-slate-700 focus:border-slate-500 focus:outline-none"
                  title="Switch course"
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              )}
              <button
                onClick={signOut}
                className="shrink-0 rounded-md border border-slate-300 px-2 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
                title="Switch profile"
              >
                {active.name} ▾
              </button>
            </div>
          </div>
          <nav className="no-scrollbar -mx-1 mt-2 flex gap-1 overflow-x-auto">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.end}
                className={({ isActive }) =>
                  `whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition ${
                    isActive ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                  }`
                }
              >
                {n.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/guide" element={<Guide />} />
          <Route path="/browse" element={<Browse />} />
          <Route path="/quiz" element={<Quiz />} />
          <Route path="/practice" element={<Practice />} />
          <Route path="/exams" element={<ExamSim />} />
          <Route path="/exams/:examId" element={<ExamSim />} />
          <Route path="/progress" element={<Progress />} />
          <Route path="/q/:id" element={<QuestionPermalink />} />
        </Routes>
      </main>
    </div>
  )
}
