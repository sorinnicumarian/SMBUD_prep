import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { CourseMeta, GuideSection, Question, Stats, TopicMeta } from '../types'

interface CourseListItem {
  id: string
  title: string
  shortTitle: string
}

interface DataState {
  status: 'loading' | 'ready' | 'error'
  questions: Question[]
  stats: Stats | null
  taxonomy: TopicMeta[]
  topicMap: Record<string, TopicMeta>
  course: CourseMeta | null
  guide: GuideSection[]
  courses: CourseListItem[]
  activeCourse: string
  setCourse: (id: string) => void
  examSources: Record<string, { label: string; file: string }[]>
  error: string | null
}

const Ctx = createContext<DataState | null>(null)
const COURSE_KEY = 'mlxp:course'
const base = import.meta.env.BASE_URL
const url = (p: string) => `${base}${p}`

export function DataProvider({ children }: { children: ReactNode }) {
  const [courses, setCourses] = useState<CourseListItem[]>([])
  const [activeCourse, setActiveCourse] = useState<string>(
    () => localStorage.getItem(COURSE_KEY) || '',
  )
  const [status, setStatus] = useState<DataState['status']>('loading')
  const [questions, setQuestions] = useState<Question[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [taxonomy, setTaxonomy] = useState<TopicMeta[]>([])
  const [course, setCourse] = useState<CourseMeta | null>(null)
  const [guide, setGuide] = useState<GuideSection[]>([])
  const [examSources, setExamSources] = useState<Record<string, { label: string; file: string }[]>>({})
  const [error, setError] = useState<string | null>(null)

  // exam-PDF index (global; examIds are unique across courses). Best-effort.
  useEffect(() => {
    fetch(url('exams/index.json'))
      .then((r) => (r.ok ? r.json() : {}))
      .then(setExamSources)
      .catch(() => setExamSources({}))
  }, [])

  // 1) load the course index once, resolve the active course
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch(url('courses.json'))
        if (!res.ok) throw new Error('courses.json missing')
        const list: CourseListItem[] = await res.json()
        if (cancelled) return
        setCourses(list)
        setActiveCourse((prev) => (prev && list.some((c) => c.id === prev) ? prev : list[0]?.id ?? ''))
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'failed to load courses')
          setStatus('error')
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  // 2) (re)load the active course's data whenever it changes
  useEffect(() => {
    if (!activeCourse) return
    let cancelled = false
    setStatus('loading')
    setGuide([])
    // study guide is optional — load best-effort so a missing guide never breaks the course
    fetch(url(`${activeCourse}/guide.json`))
      .then((r) => (r.ok ? r.json() : []))
      .then((g) => { if (!cancelled) setGuide(g) })
      .catch(() => { if (!cancelled) setGuide([]) })
    ;(async () => {
      try {
        const [qRes, statsRes, taxRes, courseRes] = await Promise.all([
          fetch(url(`${activeCourse}/questions.json`)),
          fetch(url(`${activeCourse}/stats.json`)),
          fetch(url(`${activeCourse}/taxonomy.json`)),
          fetch(url(`${activeCourse}/course.json`)),
        ])
        if (!qRes.ok || !statsRes.ok || !taxRes.ok || !courseRes.ok) throw new Error('data files missing')
        const [qs, statsJson, taxJson, courseJson] = await Promise.all([
          qRes.json(), statsRes.json(), taxRes.json(), courseRes.json(),
        ])
        if (cancelled) return
        setQuestions(qs)
        setStats(statsJson)
        setTaxonomy(taxJson)
        setCourse(courseJson)
        setStatus('ready')
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'failed to load data')
          setStatus('error')
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [activeCourse])

  const setCourseId = useCallback((id: string) => {
    localStorage.setItem(COURSE_KEY, id)
    setActiveCourse(id)
  }, [])

  const topicMap = useMemo(() => Object.fromEntries(taxonomy.map((t) => [t.key, t])), [taxonomy])

  const value: DataState = {
    status, questions, stats, taxonomy, topicMap, course, guide,
    courses, activeCourse, setCourse: setCourseId, examSources, error,
  }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useData(): DataState {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useData must be used within DataProvider')
  return ctx
}
