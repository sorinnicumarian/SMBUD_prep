import { useState } from 'react'
import { useProfiles } from '../lib/profiles'

// Shown until a profile is chosen. Progress is saved per profile, so this is what
// makes your work persist across refreshes and keeps friends' progress separate.
export function ProfileGate() {
  const { profiles, create, select, remove } = useProfiles()
  const [name, setName] = useState('')

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    create(name)
    setName('')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-lg">
        <h1 className="text-xl font-bold text-slate-900">Exam Prep</h1>
        <p className="mt-1 text-sm text-slate-500">
          Choose a profile so your progress is saved. Use the <strong>same name on another device</strong> to
          sync your progress across them.
        </p>

        {profiles.length > 0 && (
          <div className="mt-5 space-y-2">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Your profiles</div>
            {profiles.map((p) => (
              <div key={p.id} className="flex items-center gap-2">
                <button
                  onClick={() => select(p.id)}
                  className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-left font-medium text-slate-800 hover:border-slate-800 hover:bg-slate-50"
                >
                  {p.name}
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Delete profile "${p.name}" and its progress?`)) remove(p.id)
                  }}
                  className="rounded-md px-2 py-1 text-xs text-slate-400 hover:text-rose-600"
                  title="Delete profile"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={submit} className="mt-5">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            {profiles.length > 0 ? 'New profile' : 'Create your profile'}
          </label>
          <div className="mt-1 flex gap-2">
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              maxLength={40}
              className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 focus:border-slate-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!name.trim()}
              className="rounded-lg bg-slate-900 px-4 py-2 font-semibold text-white hover:bg-slate-700 disabled:opacity-50"
            >
              Start
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
