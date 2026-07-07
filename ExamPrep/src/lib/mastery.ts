// Persistent cram mastery. Each study item is "mastered" once you mark it Good/Easy.
// Stored per profile+course in localStorage, so progress survives refresh and resumes.
export type Grade = 'again' | 'hard' | 'good' | 'easy'
export const GRADES: Grade[] = ['again', 'hard', 'good', 'easy']

export interface MasteryState {
  streak: number // consecutive good/easy; >=1 means mastered
  reps: number // total times graded
  last: number // epoch ms
}

export type MasteryMap = Record<string, MasteryState>

export function gradeMastery(prev: MasteryState | undefined, g: Grade, now: number): MasteryState {
  const reps = (prev?.reps ?? 0) + 1
  // again/hard => still needs work (not mastered); good/easy => mastered
  const streak = g === 'good' || g === 'easy' ? (prev?.streak ?? 0) + 1 : 0
  return { streak, reps, last: now }
}

export const isMastered = (s: MasteryState | undefined): boolean => (s?.streak ?? 0) >= 1

// Union of two maps, latest-wins per item (by `last`, tie-break higher streak). Never drops items.
export function mergeMastery(a: MasteryMap, b: MasteryMap): MasteryMap {
  const out: MasteryMap = { ...a }
  for (const [id, s] of Object.entries(b)) {
    const cur = out[id]
    if (!cur || s.last > cur.last || (s.last === cur.last && s.streak > cur.streak)) out[id] = s
  }
  return out
}

export interface Summary {
  total: number
  mastered: number
  remaining: number
  seen: number
}

export function summarize(ids: string[], map: MasteryMap): Summary {
  let mastered = 0
  let seen = 0
  for (const id of ids) {
    const s = map[id]
    if (s) {
      seen++
      if (s.streak >= 1) mastered++
    }
  }
  return { total: ids.length, mastered, remaining: ids.length - mastered, seen }
}
