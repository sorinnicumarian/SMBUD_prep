import Fuse from 'fuse.js'
import type { Question } from '../types'

export function buildIndex(questions: Question[]): Fuse<Question> {
  return new Fuse(questions, {
    includeScore: true,
    threshold: 0.38,
    ignoreLocation: true,
    keys: [
      { name: 'prompt', weight: 0.5 },
      { name: 'solution', weight: 0.3 },
      { name: 'subStatements.statement', weight: 0.3 },
      { name: 'subStatements.motivation', weight: 0.2 },
      { name: 'topics', weight: 0.2 },
      { name: 'code.source', weight: 0.1 },
    ],
  })
}
