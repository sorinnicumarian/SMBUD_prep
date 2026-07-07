import type { Question } from '../types'

// A "study item" is the unit tracked by spaced repetition:
//  - for True/False questions, each sub-statement is its own item
//  - for every other type, the whole question is one item
export interface StudyItem {
  itemId: string
  question: Question
  subId?: string
}

export function itemsForQuestion(q: Question): StudyItem[] {
  if (q.type === 'true-false-motivated' && q.subStatements)
    return q.subStatements.map((s) => ({ itemId: s.id, question: q, subId: s.id }))
  return [{ itemId: q.id, question: q }]
}

export function allItems(questions: Question[]): StudyItem[] {
  return questions.flatMap(itemsForQuestion)
}

// examId = <letters prefix><YYYYMMDD>, e.g. "SMBUD20260130" -> "2026-01-30". Prefix length
// varies by course (ML/CI = 2 letters, ACA/AMI = 3, SMBUD = 5), so strip it dynamically
// instead of assuming a fixed offset.
export function formatExamDate(examId: string): string {
  const digits = examId.replace(/^[A-Za-z]+/, '')
  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`
}
