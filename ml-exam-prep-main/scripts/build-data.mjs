#!/usr/bin/env node
// Validate per-exam JSON and emit the study dataset for EVERY course.
//
//   data/<course>/exams/*.json  --(Zod validate + merge)-->  public/<course>/questions.json
//                                                            public/<course>/stats.json
//                                                            public/<course>/taxonomy.json
//                                                            public/<course>/course.json
//   + public/courses.json  (index of available courses, for the in-app switcher)
//
// ML lives at the repo-root paths (data/exams, data/taxonomy.json) for backwards-compat.
// Access control is handled by the Basic-Auth server (server.js).

import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync, rmSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { z } from 'zod'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const PUBLIC_DIR = join(ROOT, 'public')

const COURSE_DEFS = {
  ml: {
    examsDir: join(ROOT, 'data', 'exams'),
    taxonomyPath: join(ROOT, 'data', 'taxonomy.json'),
    coursePath: join(ROOT, 'data', 'course.json'),
    fallback: { id: 'ml', title: 'Machine Learning', shortTitle: 'ML', hasParts: false },
  },
  ci: {
    examsDir: join(ROOT, 'data', 'ci', 'exams'),
    taxonomyPath: join(ROOT, 'data', 'ci', 'taxonomy.json'),
    coursePath: join(ROOT, 'data', 'ci', 'course.json'),
    fallback: {
      id: 'ci', title: 'Computing Infrastructures', shortTitle: 'CI', hasParts: true,
      partLabels: { first: 'First exam', second: 'Second exam' },
    },
  },
  aca: {
    examsDir: join(ROOT, 'data', 'aca', 'exams'),
    taxonomyPath: join(ROOT, 'data', 'aca', 'taxonomy.json'),
    coursePath: join(ROOT, 'data', 'aca', 'course.json'),
    fallback: { id: 'aca', title: 'Advanced Computer Architectures', shortTitle: 'ACA', hasParts: false },
  },
  ami: {
    examsDir: join(ROOT, 'data', 'ami', 'exams'),
    taxonomyPath: join(ROOT, 'data', 'ami', 'taxonomy.json'),
    coursePath: join(ROOT, 'data', 'ami', 'course.json'),
    fallback: { id: 'ami', title: 'Ambient Intelligence & Domotics', shortTitle: 'AmI', hasParts: false },
  },
  smbud: {
    examsDir: join(ROOT, 'data', 'smbud', 'exams'),
    taxonomyPath: join(ROOT, 'data', 'smbud', 'taxonomy.json'),
    coursePath: join(ROOT, 'data', 'smbud', 'course.json'),
    fallback: { id: 'smbud', title: 'Systems and Methods for Big and Unstructured Data', shortTitle: 'SMBUD', hasParts: false },
  },
}

const QTYPES = [
  'theory-essay', 'true-false-motivated', 'code-interpretation',
  'applied-modeling', 'numerical-computation', 'multiple-choice',
]

const SubStatement = z.object({
  id: z.string().min(1),
  statement: z.string().min(1),
  answer: z.boolean(),
  motivation: z.string().min(1),
})
const Choice = z.object({ label: z.string().min(1), text: z.string().min(1) })
const GuideSection = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  tag: z.string().optional(),
  body: z.string().min(1),
})
const FillCell = z.object({
  given: z.string().optional(),
  answer: z.union([z.string(), z.array(z.string().min(1)).min(1)]).optional(),
})
const FillTable = z.object({
  caption: z.string().optional(),
  columns: z.array(z.string().min(1)).min(1),
  rows: z.array(z.array(FillCell)).min(1),
})

function makeQuestionSchema(topicKeys) {
  return z
    .object({
      id: z.string().regex(/^[A-Za-z]{2,5}\d{8}-e\d+(\.\d+)?$/, 'id must be like ML20230620-e3 / CI20250612-e3 / SMBUD20230113-e1.3'),
      examId: z.string().regex(/^[A-Za-z]{2,5}\d{8}$/),
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      academicYear: z.string().min(1),
      exerciseNo: z.number().int().positive(),
      marks: z.number().positive().optional(),
      type: z.enum(QTYPES),
      topics: z.array(z.string()).min(1),
      prompt: z.string().min(1),
      code: z.object({ language: z.enum(['python', 'matlab', 'pseudocode']), source: z.string().min(1) }).optional(),
      fillTable: FillTable.optional(),
      subStatements: z.array(SubStatement).optional(),
      choices: z.array(Choice).optional(),
      correctChoice: z.string().optional(),
      part: z.enum(['first', 'second']).optional(),
      solution: z.string().min(1),
      solutionSource: z.enum(['exam', 'authored']).optional(),
    })
    .superRefine((q, ctx) => {
      for (const t of q.topics)
        if (!topicKeys.has(t)) ctx.addIssue({ code: 'custom', message: `unknown topic key "${t}"` })
      if (q.type === 'true-false-motivated' && !(q.subStatements?.length))
        ctx.addIssue({ code: 'custom', message: 'true-false-motivated requires subStatements' })
      if (q.type === 'code-interpretation' && !q.code)
        ctx.addIssue({ code: 'custom', message: 'code-interpretation requires a code block' })
      if (q.type === 'multiple-choice') {
        if (!q.choices || q.choices.length < 2)
          ctx.addIssue({ code: 'custom', message: 'multiple-choice requires >=2 choices' })
        else if (!q.correctChoice || !q.choices.some((c) => c.label === q.correctChoice))
          ctx.addIssue({ code: 'custom', message: 'multiple-choice correctChoice must match a choice label' })
      }
    })
}

function loadExams(examsDir, Question) {
  if (!existsSync(examsDir)) return []
  const files = readdirSync(examsDir).filter((f) => f.endsWith('.json')).sort()
  const all = []
  const seenIds = new Set()
  const seenSubIds = new Set()
  let errors = 0
  for (const file of files) {
    const path = join(examsDir, file)
    let arr
    try {
      arr = JSON.parse(readFileSync(path, 'utf8'))
    } catch (e) {
      console.error(`✗ ${file}: invalid JSON — ${e.message}`); errors++; continue
    }
    if (!Array.isArray(arr)) { console.error(`✗ ${file}: must be an array`); errors++; continue }
    for (const raw of arr) {
      const res = Question.safeParse(raw)
      if (!res.success) {
        console.error(`✗ ${file} [${raw?.id ?? '?'}]: ${res.error.issues.map((i) => i.message).join('; ')}`); errors++; continue
      }
      const q = res.data
      if (seenIds.has(q.id)) { console.error(`✗ duplicate id "${q.id}"`); errors++; continue }
      seenIds.add(q.id)
      for (const s of q.subStatements ?? []) {
        if (seenSubIds.has(s.id)) { console.error(`✗ duplicate sub-statement id "${s.id}"`); errors++ }
        seenSubIds.add(s.id)
      }
      all.push(q)
    }
  }
  if (errors > 0) { console.error(`\n${errors} validation error(s). Aborting.`); process.exit(1) }
  all.sort((a, b) => (a.date === b.date ? a.exerciseNo - b.exerciseNo : a.date < b.date ? -1 : 1))
  return all
}

// Numbers of earlier exercises (same exam) referenced by a prompt.
function referencedNumbers(prompt, self) {
  const nums = new Set()
  let m
  const re = /\bquestions?\s+(\d+)(?:\s*(?:and|,|&|\/)\s*(\d+))?/gi
  while ((m = re.exec(prompt))) {
    if (m[1]) nums.add(+m[1])
    if (m[2]) nums.add(+m[2])
  }
  // Negative lookahead excludes decimal self-numbering headers like "Exercise 1.3" (old-format
  // exams label their own sub-parts this way) from being misread as a cross-reference to
  // exercise "1" -- only bare whole-number mentions ("Exercise 3") count as a reference.
  const re2 = /\bexercises?\s+(\d+)(?!\.\d)/gi
  while ((m = re2.exec(prompt))) nums.add(+m[1])
  if (/\bprevious (question|exercise|point|one)\b/i.test(prompt)) nums.add(self - 1)
  if (
    nums.size === 0 &&
    /\b(same|described|considered) (system|scenario|setting|configuration|network|situation|model|data)\b/i.test(prompt)
  )
    nums.add(self - 1)
  return new Set([...nums].filter((n) => n > 0 && n < self))
}

// Attach a `context` field (the referenced earlier exercises' setup) so chained questions
// are self-contained even when shuffled in cram. Resolved backward within the same exam.
function addContext(questions) {
  const byExam = new Map()
  for (const q of questions) {
    if (!byExam.has(q.examId)) byExam.set(q.examId, new Map())
    byExam.get(q.examId).set(q.exerciseNo, q)
  }
  for (const q of questions) {
    const exam = byExam.get(q.examId)
    const direct = referencedNumbers(q.prompt, q.exerciseNo)
    if (direct.size === 0) continue
    const all = new Set()
    const stack = [...direct]
    while (stack.length) {
      const n = stack.pop()
      if (all.has(n) || n >= q.exerciseNo) continue
      all.add(n)
      const rq = exam.get(n)
      if (rq) for (const m of referencedNumbers(rq.prompt, rq.exerciseNo)) stack.push(m)
    }
    const nums = [...all].filter((n) => exam.has(n)).sort((a, b) => a - b)
    if (nums.length === 0) continue
    q.context = nums.map((n) => `**Question ${n}.** ${exam.get(n).prompt}`).join('\n\n')
  }
}

function computeStats(questions) {
  const byType = {}, byTopic = {}, byYear = {}, byPart = {}, topicByYear = {}
  const examMap = new Map()
  const examExerciseNos = new Map() // examId -> Set of distinct exerciseNo (format-stable, unaffected by tf-motivated splitting)
  let totalSub = 0
  for (const q of questions) {
    byType[q.type] = (byType[q.type] ?? 0) + 1
    byYear[q.academicYear] = (byYear[q.academicYear] ?? 0) + 1
    if (q.part) byPart[q.part] = (byPart[q.part] ?? 0) + 1
    totalSub += q.subStatements?.length ?? 0
    for (const t of q.topics) {
      byTopic[t] = (byTopic[t] ?? 0) + 1
      topicByYear[t] ??= {}
      topicByYear[t][q.academicYear] = (topicByYear[t][q.academicYear] ?? 0) + 1
    }
    if (!examMap.has(q.examId))
      examMap.set(q.examId, { examId: q.examId, date: q.date, academicYear: q.academicYear, questionCount: 0, format: 'new' })
    examMap.get(q.examId).questionCount++
    if (!examExerciseNos.has(q.examId)) examExerciseNos.set(q.examId, new Set())
    examExerciseNos.get(q.examId).add(q.exerciseNo)
  }
  // Format heuristic is based on the count of DISTINCT exercise numbers per exam, not the raw
  // question count — splitting bundled true-false-motivated questions into one-per-statement
  // inflates questionCount without changing exerciseNo, so exerciseNo count stays format-stable.
  const exams = [...examMap.values()].map((e) => ({ ...e, format: examExerciseNos.get(e.examId).size <= 4 ? 'old' : 'new' }))
  exams.sort((a, b) => (a.date < b.date ? -1 : 1))
  return {
    totalExams: examMap.size, totalQuestions: questions.length, totalSubStatements: totalSub,
    byType, byTopic, byYear, byPart, topicByYear, exams,
  }
}

function buildCourse(courseId) {
  const def = COURSE_DEFS[courseId]
  const taxonomy = JSON.parse(readFileSync(def.taxonomyPath, 'utf8'))
  const topicKeys = new Set(taxonomy.map((t) => t.key))
  const Question = makeQuestionSchema(topicKeys)
  const questions = loadExams(def.examsDir, Question)
  addContext(questions)
  const stats = computeStats(questions)
  const course = existsSync(def.coursePath) ? JSON.parse(readFileSync(def.coursePath, 'utf8')) : def.fallback

  const outDir = join(PUBLIC_DIR, courseId)
  rmSync(outDir, { recursive: true, force: true })
  mkdirSync(outDir, { recursive: true })
  writeFileSync(join(outDir, 'questions.json'), JSON.stringify(questions))
  writeFileSync(join(outDir, 'stats.json'), JSON.stringify(stats))
  writeFileSync(join(outDir, 'taxonomy.json'), JSON.stringify(taxonomy))
  writeFileSync(join(outDir, 'course.json'), JSON.stringify(course))

  // Optional study guide (data/<course>/guide.json) → public/<course>/guide.json (always written).
  const guidePath = join(def.examsDir, '..', 'guide.json')
  let guide = []
  if (existsSync(guidePath)) {
    const raw = JSON.parse(readFileSync(guidePath, 'utf8'))
    if (!Array.isArray(raw)) { console.error(`✗ ${courseId}/guide.json must be an array`); process.exit(1) }
    guide = raw.map((g) => {
      const res = GuideSection.safeParse(g)
      if (!res.success) { console.error(`✗ ${courseId} guide [${g?.id ?? '?'}]: ${res.error.issues.map((i) => i.message).join('; ')}`); process.exit(1) }
      return res.data
    })
  }
  writeFileSync(join(outDir, 'guide.json'), JSON.stringify(guide))

  console.log(`✓ [${courseId}] ${questions.length} questions from ${stats.totalExams} exams${guide.length ? ` · ${guide.length} guide sections` : ''}`)
  console.log(`    types:  ${Object.entries(stats.byType).map(([k, v]) => `${k}=${v}`).join('  ')}`)
  if (Object.keys(stats.byPart).length) console.log(`    parts:  ${JSON.stringify(stats.byPart)}`)
  return { id: course.id, title: course.title, shortTitle: course.shortTitle, totalQuestions: questions.length, totalExams: stats.totalExams }
}

// Build one course (COURSE=ci) or all (default).
const only = process.env.COURSE
const ids = only ? [only] : Object.keys(COURSE_DEFS)
if (only && !COURSE_DEFS[only]) {
  console.error(`Unknown COURSE "${only}" (expected: ${Object.keys(COURSE_DEFS).join(', ')})`)
  process.exit(1)
}
mkdirSync(PUBLIC_DIR, { recursive: true })
const summaries = ids.map(buildCourse)
// courses.json always lists every defined course (so the switcher is stable even on a single-course build)
const index = Object.keys(COURSE_DEFS).map((id) => {
  const s = summaries.find((x) => x.id === id)
  const f = COURSE_DEFS[id].fallback
  return { id, title: s?.title ?? f.title, shortTitle: s?.shortTitle ?? f.shortTitle }
})
writeFileSync(join(PUBLIC_DIR, 'courses.json'), JSON.stringify(index))
console.log(`→ public/{${ids.join(',')}}/*.json + public/courses.json`)
