import { useData } from '../lib/data'
import { useProgress } from '../lib/progress'
import { useProfiles } from '../lib/profiles'
import { allItems, itemsForQuestion } from '../lib/items'
import { summarize } from '../lib/mastery'

function Bar({ value, total, color }: { value: number; total: number; color: string }) {
  const pct = total ? Math.round((value / total) * 100) : 0
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="w-16 text-right text-xs text-slate-500">
        {value}/{total}
      </span>
    </div>
  )
}

export function Progress() {
  const { questions, taxonomy, stats } = useData()
  const { progress, reset } = useProgress()
  const { active } = useProfiles()

  const items = allItems(questions)
  const overall = summarize(items.map((i) => i.itemId), progress)
  const allDone = overall.total > 0 && overall.mastered === overall.total

  const perTopic = taxonomy
    .map((t) => {
      const ids = items.filter((i) => i.question.topics.includes(t.key)).map((i) => i.itemId)
      return { ...t, ...summarize(ids, progress) }
    })
    .filter((t) => t.total > 0)

  const perExam = (stats?.exams ?? [])
    .map((e) => {
      const ids = questions.filter((q) => q.examId === e.examId).flatMap((q) => itemsForQuestion(q).map((i) => i.itemId))
      return { ...e, ...summarize(ids, progress) }
    })
    .sort((a, b) => (a.date < b.date ? 1 : -1))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Progress</h1>
          {active && <p className="text-sm text-slate-500">Profile: {active.name}</p>}
        </div>
        <button
          onClick={() => {
            if (confirm('Reset all progress for this profile? This cannot be undone.')) reset()
          }}
          className="rounded-lg border border-rose-300 px-3 py-1.5 text-sm font-medium text-rose-600 hover:bg-rose-50"
        >
          Reset progress
        </button>
      </div>

      {allDone ? (
        <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-emerald-800">
          🎉 You've mastered every question in this course. Hit “Study all again” in Quiz/Practice to re-cram.
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-baseline justify-between">
            <span className="text-sm font-semibold text-slate-700">Overall mastery</span>
            <span className="text-sm text-slate-500">
              {overall.mastered}/{overall.total} mastered · {overall.remaining} left
            </span>
          </div>
          <div className="mt-2">
            <Bar value={overall.mastered} total={overall.total} color="#22c55e" />
          </div>
          <p className="mt-2 text-xs text-slate-400">
            A question is “mastered” once you rate it Good or Easy. Cram mode keeps showing the rest
            (and any you mark Again/Hard) until everything is cleared.
          </p>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h3 className="mb-3 text-sm font-semibold text-slate-700">Mastery by topic</h3>
          <div className="space-y-2.5">
            {perTopic.map((t) => (
              <div key={t.key}>
                <div className="mb-1 text-xs font-medium text-slate-600">{t.name}</div>
                <Bar value={t.mastered} total={t.total} color={t.color} />
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h3 className="mb-3 text-sm font-semibold text-slate-700">Mastery by exam</h3>
          <div className="space-y-2.5">
            {perExam.map((e) => (
              <div key={e.examId}>
                <div className="mb-1 flex justify-between text-xs font-medium text-slate-600">
                  <span>{e.date}</span>
                  {e.mastered === e.total && <span className="text-emerald-600">done</span>}
                </div>
                <Bar value={e.mastered} total={e.total} color="#6366f1" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
