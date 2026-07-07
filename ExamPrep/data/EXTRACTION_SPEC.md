# Exam extraction spec

You are transcribing Politecnico di Milano "Machine Learning" exam PDFs (with solutions) into structured JSON for a study app. **Faithfulness matters**: transcribe the actual question text and the actual official solution. Do not invent content.

## Output
One JSON file **per exam** at `/home/janek/Studies/exam-prep/data/exams/<examId>.json`, where `examId` is `ML<YYYYMMDD>` derived from the filename date. The file is a **JSON array** of Question objects. Re-extract the whole exam (all exercises) into that one file.

## Question object schema
```jsonc
{
  "id": "ML20230620-e3",          // `${examId}-e${exerciseNo}`
  "examId": "ML20230620",
  "date": "2023-06-20",           // ISO, from the filename / cover page
  "academicYear": "AA2223",       // the folder name (AA1920, AA2021, AA2122, AA2223, AA2324, AA2425)
  "exerciseNo": 3,                 // integer, in document order (continue numbering across split PDFs)
  "marks": 7,                      // optional; from the exercise header or cover grid
  "type": "theory-essay",          // see enum below
  "topics": ["kernelsvm"],         // 1+ keys from the controlled vocabulary below
  "prompt": "…",                   // the question text (KaTeX math in $...$ / $$...$$)
  "code": {                        // ONLY for code-interpretation
    "language": "python",          // python | matlab | pseudocode
    "source": "verbatim code\n…"   // verbatim, real newlines, NOT latex
  },
  "subStatements": [               // ONLY for true-false-motivated
    { "id": "ML20230620-e3-s1", "statement": "…", "answer": true, "motivation": "…" }
  ],
  "solution": "…",                 // the official model solution (KaTeX math). For T/F put "See per-statement motivations."
  "solutionSource": "exam"          // "exam" if transcribed from the printed solution; "authored" if the solution box was BLANK and you wrote a concise correct model answer yourself
}
```

## type enum (pick the best single fit)
- `theory-essay` — "Explain / describe / discuss …" open-ended conceptual question.
- `true-false-motivated` — a list of statements to mark True/False with motivation. **Requires `subStatements`.** Also use this for old-format "Tell if the following statements are true or false" blocks.
- `code-interpretation` — a code snippet (Python/Matlab/pseudocode) to read/explain/debug. **Requires `code`.**
- `applied-modeling` — "model this real-world scenario as an ML problem (features, target/actions, loss/reward, method)".
- `numerical-computation` — compute a number/bound (VC/PAC error bounds, MAB regret/UCB/Thompson, hypothesis-space cardinality, etc.).

## topic keys (controlled vocabulary — use ONLY these; multi-tag when relevant)
- `linreg` — Linear Regression & Regularization (OLS, Ridge, Lasso, Bayesian LR, gradient descent)
- `modelsel` — Model Selection & Bias-Variance (over/underfit, bias-variance decomposition, complexity)
- `featsel` — Feature Selection & PCA (filter/wrapper/embedded, PCA, dimensionality reduction)
- `kernelsvm` — Kernels & SVM (kernel trick, Gram matrix, soft/hard margin, dual)
- `ensemble` — Ensemble Methods (Bagging, Boosting, AdaBoost, random forests)
- `classif` — Classification (Logistic Regression, Perceptron, loss functions, multiclass)
- `learntheory` — Learning Theory (VC dimension, PAC, sample complexity, generalization bounds, hypothesis space cardinality)
- `mab` — Multi-Armed Bandits (UCB1, Thompson Sampling, EXP3, regret, exploration)
- `rl` — Reinforcement Learning (MDP, Value/Policy Iteration, Q-learning, SARSA, MC, TD, Bellman, discount)
- `modeleval` — Model Evaluation & Cross-Validation (k-fold CV, train/val/test, metrics: precision/recall/F1, AIC/BIC)

## Math rules
- Wrap inline math in `$...$`, display math in `$$...$$`. Escape backslashes for JSON (`\\lambda`, `\\sqrt{...}`, `\\frac{a}{b}`, `\\mathcal{H}`, `\\Phi`, `\\sum`, `\\max`, `\\le`, `\\gamma`, etc.).
- Keep code OUT of math: put it in `code.source` verbatim with real `\n` newlines.
- Light markdown allowed in prompt/solution/motivation: `**bold**`, `` `inline code` ``, bullet lines starting with `- `, numbered lines `1.`.

## Format notes
- **NEW format** (2021→2026): 8 exercises, one per page, "Exercise N (M marks)", solution in a box below. Some exams leave the **theory-essay boxes (usually Ex 1–2) BLANK** — for those, write a concise correct model answer and set `"solutionSource": "authored"`. Objective exercises (T/F, code, numerical) almost always have printed solutions → `"exam"`.
- **OLD format** (AA1920, 2020-2021): grouped Q1/Q2/… by topic; many sub-statements; solutions inline (often red text). Number exercises e1, e2, … in document order. If one exam is split across two PDFs (e.g. `_Q1-Q4` and `_Q5_Q6`), merge into ONE file and continue exercise numbering.

## Process
1. Read the PDF fully with the Read tool (use the `pages` parameter; PDFs are 10–15 pages — read in chunks like "1-7" then "8-15").
2. Transcribe each exercise. Be faithful to wording and especially to the **solution** (answers, T/F booleans, numbers).
3. Write the array to `data/exams/<examId>.json`. Validate it is valid JSON.
4. After writing all your assigned files, you may run `node /home/janek/Studies/exam-prep/scripts/build-data.mjs` to confirm they validate (it will print errors with the offending id).

Return a short summary: which files you wrote, #exercises and types per exam, and any exercises whose solution box was blank (authored).
