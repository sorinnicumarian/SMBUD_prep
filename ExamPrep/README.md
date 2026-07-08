# Exam Prep

A study app for Politecnico di Milano exams. **One app, several courses**, switchable from the header dropdown
(courses are never mixed in a view):

| Course | data | content |
|--------|------|---------|
| **Machine Learning** (097683) | `data/exams/` | 30 exams · 485 questions (incl. split True/False statements) |
| **Computing Infrastructures** | `data/ci/exams/` | 21 exams · 369 questions · T/F + multiple-choice + numerical + open · tagged **first-exam vs second-exam** |
| **Advanced Computer Architectures** | `data/aca/exams/` | 7 exams · 27 questions · study guide included |
| **Ambient Intelligence & Domotics** | `data/ami/exams/` | 19 exams · 280 questions (mostly multiple-choice) · study guide included |
| **Systems and Methods for Big and Unstructured Data (SMBUD)** | `data/smbud/exams/` | 13 exams · 201 questions · study guide included |

Live (open — no login): **https://sorinnicumarian.github.io/ExamPrep/**

## Features

- **Dashboard** — per-course concept stats: most-asked topics, question-type mix, topics over time, your coverage.
- **Guide** — theory reference per course, one collapsible section per topic (expanded by default), written for the
  specific exam rather than as a generic textbook summary.
- **Browse & search** — filter by topic / year / exam / type (and **exam part** for CI); full-text search. Every
  matching question is listed at once — no session, just a reference lookup.
- **Quiz** — a graded **Cram session** for auto-checkable question types (True/False, multiple-choice). Every
  selected question is in play; anything you rate Again/Hard loops back within the same session until you've
  cleared it. Rate with the buttons or keys **1–4**.
- **Practice** — the same Cram session engine as Quiz, for question types that can't be auto-checked (theory-essay,
  applied-modeling, numerical-computation, code-interpretation) — you reveal the model solution and self-rate.
- **Exam Simulation** — work one specific full past exam against a timer, then reveal all solutions. Exams are
  grouped by academic year (newest first), each year color-coded.
- **Progress** — Leitner 5-box spaced repetition in `localStorage` (namespaced per course), per-topic / per-exam
  coverage.

There is currently **no day-based spaced-repetition scheduler** (despite the name "Cram" implying a counterpart) —
`useCramSession` (`src/lib/session.ts`) is the only session engine; both Quiz and Practice use it.

## Data model

Each course has `taxonomy.json` (controlled topic vocabulary), `course.json` (title, `hasParts`), an optional
`guide.json` (study-guide sections), and an `exams/` folder of per-exam JSON. `pnpm build:data` validates
everything with Zod and emits `public/<course>/{questions,stats,taxonomy,course,guide}.json` plus
`public/courses.json`. Question ids are stable, so `localStorage` progress survives re-extraction — **except**
when a True/False bundle gets split into standalone per-statement questions (each gets a new `<id>.<k>` id), which
resets progress on just those specific items.

True/False exercises are stored as one exercise per statement (`type: "true-false-motivated"` with a single
`subStatements` entry), each carrying only the topic(s) that specific statement is about — not the union of every
topic touched by the original bundled exercise.

- ML answers are transcribed from the official solutions; theory questions whose source box was blank carry an
  authored model answer (badged **MODEL ANSWER**).
- CI answers/explanations are grounded in the course lectures/exercises (`computing_infrastructures/materials/`,
  not committed); numeric results were cross-checked against the exams' answer keys. One representative variant is
  taken per exam (each exam file repeats the same questions in shuffled permutations).
- SMBUD answers are a mix: `solutionSource: "exam"` where an official/expected solution was printed in the source
  material, `"authored"` where none existed (blank exam paper) and a model answer was written instead — badged
  the same way as ML's authored answers.

## Develop / run

```bash
pnpm install
pnpm build:data                 # builds ALL courses → public/<course>/...
pnpm dev                        # http://localhost:5173/ExamPrep/
# production-style preview at root, served by the static server:
BASE_PATH=/ pnpm build && node server.js   # http://localhost:8080
```

`COURSE=smbud pnpm build:data` builds a single course (faster); the default builds all.

## Hosting

**GitHub Pages**, deployed via [.github/workflows/pages.yml](../.github/workflows/pages.yml) — pushes to `main`
that touch this folder trigger a build (`pnpm build:data` + `pnpm build`) and deploy through the official
`actions/deploy-pages` action. No server, no secrets, no subscription. It's **open** — no login, and the content is
just exam practice.

The repo used to be private and hosted on Azure App Service via a tiny Express static server ([server.js](server.js),
still present but unused) — see [.github/workflows/azure-appservice.yml](.github/workflows/azure-appservice.yml) for
that legacy setup. It was replaced because GitHub Pages requires the repo to be public (which this one now is) and
needs no paid infrastructure at all.

## Adding exams

Drop a `data/<course>/exams/<EXAMID>.json` (schema in `data/ci/EXTRACTION_SPEC.md`), then `pnpm build:data`.
Validation rejects unknown topic keys, duplicate ids, and malformed records. The `id`/`examId` regex accepts
course prefixes of 2–5 letters (e.g. `ML`, `CI`, `ACA`, `SMBUD`) followed by an 8-digit date, optionally suffixed
with `.N` for a split-out sub-question (e.g. `SMBUD20230113-e1.3`).
