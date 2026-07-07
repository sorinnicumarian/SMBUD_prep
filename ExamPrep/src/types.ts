export type QType =
  | 'theory-essay'
  | 'true-false-motivated'
  | 'code-interpretation'
  | 'applied-modeling'
  | 'numerical-computation'
  | 'multiple-choice'

export interface SubStatement {
  id: string // `${questionId}-s${k}`
  statement: string
  answer: boolean
  motivation: string
}

export interface Choice {
  label: string // "A" | "B" | "C" | "D"
  text: string
}

export interface CodeBlock {
  language: 'python' | 'matlab' | 'pseudocode'
  source: string
}

// Interactive "fill the table" exercise (VLIW schedules, Scoreboard/Tomasulo timing,
// MESI state transitions). The student types into the blank cells and validates.
export interface FillCell {
  given?: string // pre-filled, locked cell (row label / provided value) — shown as-is
  answer?: string | string[] // blank cell to fill; correct value(s), first is canonical
  // a cell with neither is an empty spacer
}
export interface FillTable {
  caption?: string
  columns: string[] // header row labels (may contain $math$)
  rows: FillCell[][] // body rows; each row's length should equal columns.length
}

export interface Question {
  id: string // `${examId}-e${n}` e.g. "ML20230620-e3"
  examId: string // "ML20230620"
  date: string // ISO "2023-06-20"
  academicYear: string // "AA2223"
  exerciseNo: number
  marks?: number
  type: QType
  topics: string[] // controlled-vocab keys from taxonomy.json
  prompt: string // KaTeX math in $...$ / $$...$$
  context?: string // setup from referenced earlier exercises (chained questions), added at build time
  code?: CodeBlock
  fillTable?: FillTable // interactive table the student fills in and validates (VLIW/Scoreboard/Tomasulo/MESI)
  subStatements?: SubStatement[] // true-false-motivated
  choices?: Choice[] // multiple-choice
  correctChoice?: string // multiple-choice: the correct Choice.label
  part?: 'first' | 'second' // exam-part split (used by CI: first-exam vs second-exam topics)
  solution: string
  // 'exam' = transcribed from the official solution; 'authored' = model answer grounded in
  // the course lectures/exercises (badged in the UI).
  solutionSource?: 'exam' | 'authored'
}

// A study-guide section (theory reference), rendered as a collapsible pill in the Guide view.
export interface GuideSection {
  id: string
  title: string
  tag?: string // category label for the filter pills
  body: string // markdown + $math$ + tables, rendered by MathText
}

export interface CourseMeta {
  id: string
  title: string
  shortTitle: string
  hasParts: boolean
  partLabels?: { first: string; second: string }
}

export interface TopicMeta {
  key: string
  name: string
  short: string
  color: string
}

export interface Stats {
  totalExams: number
  totalQuestions: number
  totalSubStatements: number
  byType: Record<string, number>
  byTopic: Record<string, number>
  byYear: Record<string, number>
  byPart?: Record<string, number> // 'first' | 'second' counts (courses with parts)
  topicByYear: Record<string, Record<string, number>> // topicKey -> year -> count
  exams: { examId: string; date: string; academicYear: string; questionCount: number; format: 'new' | 'old' }[]
}

export const QTYPE_LABELS: Record<QType, string> = {
  'theory-essay': 'Theory',
  'true-false-motivated': 'True / False',
  'code-interpretation': 'Code',
  'applied-modeling': 'Modeling',
  'numerical-computation': 'Numerical',
  'multiple-choice': 'Multiple Choice',
}
