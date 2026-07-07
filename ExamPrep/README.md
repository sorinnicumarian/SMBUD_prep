# Exam Prep

A study app for Politecnico di Milano exams. **One app, two courses**, switchable from the header (the two are
never mixed in a view):

| Course | data | content |
|--------|------|---------|
| **Machine Learning** (097683) | `data/exams/` | 30 exams · 230 exercises |
| **Computing Infrastructures** | `data/ci/exams/` | 21 exams · 369 questions · T/F + multiple-choice + numerical + open · tagged **first-exam vs second-exam** |

Live (open — no login): **https://ml-exam-prep-jw.azurewebsites.net**

## Features

- **Dashboard** — per-course concept stats: most-asked topics, question-type mix, topics over time, your coverage.
- **Browse & search** — filter by topic / year / exam / type (and **exam part** for CI); full-text search.
- **Quiz / Practice** — two study modes (toggle, remembered):
  - **Cram** (default) — every selected question is in play; cards you rate Again/Hard loop back within the
    same session until you've cleared them all. Built for the 1–2 days before the exam.
  - **Spaced** — Anki-style SM-2 day intervals (Again/Hard/Good/Easy), due-first, for studying over weeks.
  Rate with the buttons or keys **1–4**. Filters (incl. CI exam-part) are inline; no "start session" screen.
- **Exam Simulation** — work a full past exam against a timer, then reveal all solutions.
- **Progress** — Leitner 5-box spaced repetition in `localStorage` (namespaced per course), per-topic / per-exam coverage.

## Data model

Each course has `taxonomy.json` (controlled topic vocabulary), `course.json` (title, `hasParts`), and an `exams/`
folder of per-exam JSON. `pnpm build:data` validates everything with Zod and emits `public/<course>/{questions,stats,taxonomy,course}.json`
plus `public/courses.json`. Question ids are stable, so `localStorage` progress survives re-extraction.

- ML answers are transcribed from the official solutions; theory questions whose source box was blank carry an
  authored model answer (badged **MODEL ANSWER**).
- CI answers/explanations are grounded in the course lectures/exercises (`computing_infrastructures/materials/`,
  not committed); numeric results were cross-checked against the exams' answer keys. One representative variant is
  taken per exam (each exam file repeats the same questions in shuffled permutations).

## Develop / run

```bash
pnpm install
pnpm build:data                 # builds ALL courses → public/<course>/...
pnpm dev                        # http://localhost:5173/ExamPrep/
# production-style preview at root, served by the static server:
BASE_PATH=/ pnpm build && node server.js   # http://localhost:8080
```

`COURSE=ci pnpm build:data` builds a single course (faster); the default builds all.

## Hosting

Azure App Service (Free F1) in the Polimi *Azure for Students* subscription (`rg-ml-exam-prep` / `mlxp-plan`),
a tiny Express static server ([server.js](server.js)). It's **open** — the URL is unguessable and the content is
just exam practice. Push to `main` auto-deploys via [.github/workflows/azure-appservice.yml](.github/workflows/azure-appservice.yml)
(builds all courses, deploys `dist/` with the `AZURE_WEBAPP_PUBLISH_PROFILE` secret).

> Static Web Apps (built-in auth) is blocked by the student subscription's region policy, and the student account
> can't register a Microsoft Entra app — so there's no managed-login option here. To re-add a gate later, put Basic
> Auth back in `server.js`.

## Adding exams

Drop a `data/<course>/exams/<EXAMID>.json` (schema in `data/ci/EXTRACTION_SPEC.md`), then `pnpm build:data`.
Validation rejects unknown topic keys, duplicate ids, and malformed records.
