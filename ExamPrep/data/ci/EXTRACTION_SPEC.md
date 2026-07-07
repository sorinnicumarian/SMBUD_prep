# CI exam extraction spec

Transcribe Politecnico di Milano **Computing Infrastructures** exams into structured JSON for the study app.
Exams have three sections: **multiple-choice**, **True/False** (A/B, position shuffled), **numerical exercises**,
and sometimes one **open question**.

## Source of truth for answers
Ground every answer and explanation in the **course lectures and worked exercises** at
`/home/janek/Studies/exam-prep/computing_infrastructures/materials/` :
- `Lectures/Infrastructures/` (Lesson 1–10: DC, servers, storage, HDD/SSD, RAID, storage systems, building, networking)
- `Lectures/Dependability/`, `Lectures/Performance/`, `Lectures/SW-Infrastructure/` (cloud, virtualization, ML-aaS)
- `Exercises/Dependability/`, `Exercises/Performance/`, `Exercises/RAID/` (worked solutions with formulas)

Read the relevant lecture/exercise PDF(s) to determine and justify each answer. For numerical exercises, **work the
math** using the methods in the exercise PDFs and end with the final result + unit.

If a question paper has a matching scanned answer sheet, you MAY read it to cross-check the correct A/B box, but the
**explanation** must come from the lectures.

## Output
One JSON file per exam at `data/ci/exams/<examId>.json` where `examId = CI<YYYYMMDD>` (from the exam date).
A JSON array of Question objects.

## Question schema
```jsonc
{
  "id": "CI20250612-e3",          // `${examId}-e${n}`, n = sequential question number
  "examId": "CI20250612",
  "date": "2025-06-12",
  "academicYear": "AA2425",        // map: 2022-23→AA2223, 2023-24→AA2324, 2024-25→AA2425, etc.
  "exerciseNo": 3,
  "marks": 2,                      // T/F=0.5 (use 1), MC=2, exercise=2, open=5 — record the section's points
  "type": "...",                   // see below
  "topics": ["raid"],              // 1+ keys from data/ci/taxonomy.json
  "part": "second",                // "first" or "second" — see split below (REQUIRED for CI)
  "prompt": "...",                 // question text, KaTeX math in $...$ / $$...$$
  "choices": [                     // ONLY multiple-choice
    { "label": "A", "text": "..." }, { "label": "B", "text": "..." },
    { "label": "C", "text": "..." }, { "label": "D", "text": "..." }
  ],
  "correctChoice": "B",            // ONLY multiple-choice — the correct label
  "subStatements": [               // ONLY true-false-motivated
    { "id": "CI20250612-e3-s1", "statement": "...", "answer": true, "motivation": "...(grounded in lecture)" }
  ],
  "solution": "...",               // worked solution / explanation (KaTeX). For T/F: "See per-statement motivations."
  "solutionSource": "authored"     // "authored" = answer/explanation derived from lectures (the norm here);
                                    // "exam" only if a typeset official solution was transcribed verbatim
}
```

## type enum
- `multiple-choice` — one correct option among A/B/C/D. Requires `choices` + `correctChoice`.
- `true-false-motivated` — a single statement judged True/False. Use ONE sub-statement per T/F question
  (each numbered T/F item becomes its own Question of this type with one sub-statement), OR group a section's
  10 T/F items into one Question with 10 sub-statements — **prefer one Question per T/F item** so each is quizzed
  and tracked separately. Set the sub-statement `answer` to the real truth value of the statement (NOT the A/B box).
- `numerical-computation` — compute a value (HDD I/O time, SCAN order, MTTF, reliability/availability, RAID
  capacity/MTTF, queuing: utilization/throughput/response time/bottleneck/N*, PUE, #parallel instances, …).
- `theory-essay` — open question (e.g. "describe DAS vs NAS vs SAN", "geographic areas / regions / AZ").

## Exam-part split (set `part` per question by topic) — from the syllabus
**FIRST exam** (`part: "first"`): `dc-intro`, `servers`, `storage-devices`, `dependability`
(intro, datacenters, WSC, edge/continuum, form factors, NVLink, HDD/SSD, wear, disk scheduling, locality;
reliability AND availability, MTTF, MTTR, series/parallel, RBD, k-of-n).

**SECOND exam** (`part: "second"`): `raid`, `storage-systems`, `performance`, `networking`, `cloud`,
`virtualization`, `xaas` (RAID levels/capacity/MTTF; DAS/NAS/SAN, cooling/PUE/power; queuing networks &
operational laws, bounds, bottleneck; 3-tier/fat-tree; cloud provisioning/elasticity; hypervisors/containers;
IaaS/PaaS/SaaS, ML-aaS).

> Note: RAID-array *reliability/MTTF* is **second** (RAID is second-part); general reliability/availability theory
> is **first**. Tag by the question's actual subject.

## Math rules
KaTeX in `$...$` / `$$...$$`, escape backslashes for JSON (`\\frac`, `\\sqrt`, `\\approx`, `\\times`, `\\mu`).
Light markdown (`**bold**`, `- bullets`, `1.` numbered, markdown tables with `|`) is fine.

## Process
1. Read the exam question paper fully (Read with `pages`).
2. For each question, read the matching lecture/exercise PDF to determine + justify the answer.
3. Write the array to `data/ci/exams/<examId>.json`.
4. Validate: `COURSE=ci node /home/janek/Studies/exam-prep/scripts/build-data.mjs` (prints errors with the offending id).

Return a concise summary: files written, #questions by type, part split, and any answers you were unsure about.
