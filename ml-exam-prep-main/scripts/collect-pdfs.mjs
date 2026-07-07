#!/usr/bin/env node
// Copies the original exam PDFs into public/exams/<examId>.pdf (+ -key.pdf) and writes
// public/exams/index.json mapping examId -> [{label, file}], so the app can link each
// question to its source exam for verification.
//
// Run locally (the source trees are gitignored and not present in CI). The copied PDFs
// under public/exams/ ARE committed so the deployed site / CI build include them.
import { readdirSync, existsSync, copyFileSync, mkdirSync, writeFileSync, statSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = join(ROOT, 'public', 'exams')
const ML_ROOT = join(ROOT, 'Exams-20260609')
const CI = join(ROOT, 'computing_infrastructures')
const CIX = join(CI, 'extracted')
const ACA = join(ROOT, 'advanced_computing_architectures', 'Exams-20260417(1)')
const AMI = join(ROOT, 'ambient intelligent and domotics')

mkdirSync(OUT, { recursive: true })
const index = {}
let bytes = 0

function add(examId, srcAbs, label, suffix = '') {
  if (!existsSync(srcAbs)) {
    console.warn(`  ! missing ${examId}: ${srcAbs}`)
    return
  }
  const file = `${examId}${suffix}.pdf`
  copyFileSync(srcAbs, join(OUT, file))
  bytes += statSync(srcAbs).size
  ;(index[examId] ??= []).push({ label, file })
}

// ---- ML: glob Exams-20260609 for files containing the 8-digit date ----
function walk(dir) {
  const out = []
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name)
    if (e.isDirectory()) out.push(...walk(p))
    else if (e.name.toLowerCase().endsWith('.pdf')) out.push(p)
  }
  return out
}
if (existsSync(ML_ROOT)) {
  const mlFiles = walk(ML_ROOT)
  // collect distinct ML dates from the data folder
  const mlDates = new Set(
    readdirSync(join(ROOT, 'data', 'exams'))
      .filter((f) => f.startsWith('ML'))
      .map((f) => f.slice(2, 10)),
  )
  for (const date of [...mlDates].sort()) {
    const matches = mlFiles.filter((f) => f.includes(date)).sort()
    if (!matches.length) {
      console.warn(`  ! no ML pdf for ${date}`)
      continue
    }
    if (matches.length === 1) add(`ML${date}`, matches[0], 'Exam + solutions')
    else matches.forEach((m, i) => add(`ML${date}`, m, `Exam + solutions (part ${i + 1})`, `-${i + 1}`))
  }
}

// ---- CI: explicit mapping (messy filenames); some have a separate scanned answer key ----
const P = (...parts) => join(CIX, ...parts)
const ciMap = {
  CI20220615: [['Exam + answer key', P('PastExams(1)/PastExams/Exam_1_SOL.pdf')]],
  CI20220713: [['Exam + answer key', P('PastExams(1)/PastExams/Exam_01_SOL.pdf')]],
  CI20220902: [['Exam + answer key', P('PastExams(1)/PastExams/Exam_02_SOL.pdf')]],
  CI20230124: [['Exam + answer key', P('PastExams(1)/PastExams/CI-2023_01_24_SOLUZIONI.pdf')]],
  CI20230210: [['Exam + answer key', P('PastExams(1)/PastExams/CI-2023_02_10_with_SOLUTION.pdf')]],
  CI20230615: [['Exam + answer key', P('Exams-2022-23(1)/Exams-2022-23/Exam-15062023/Solutions/CI-2023_06_15_N1.pdf')]],
  CI20230707: [['Exam + answer key', P('Exams-2022-23(1)/Exams-2022-23/Exam-07072023/Solutions/CI-2023_07_07_N1.pdf')]],
  CI20230906: [['Exam + answer key', P('Exams-2022-23(1)/Exams-2022-23/Exam-06092023/Solutions/CI-2023_09_06_N1.pdf')]],
  CI20240116: [['Exam + answer key', P('Exams-2022-23(1)/Exams-2022-23/Exam-16012024/Solutions/CI-2024_01_16_SOLUTIONS.pdf')]],
  CI20240207: [['Exam + answer key', P('Exams-2022-23(1)/Exams-2022-23/Exam-07022024/Solutions.pdf')]],
  CI20240612: [
    ['Exam paper', P('Exams-2023-24(1)/Exam-12062024/CI-2024_06_12.pdf')],
    ['Answer key (handwritten scan)', P('Exams-2023-24(1)/Exam-12062024/Solutions.pdf')],
  ],
  CI20240710: [
    ['Exam paper', P('Exams-2023-24(1)/Exam10072024/CI-2024_07_10.pdf')],
    ['Answer key (handwritten scan)', P('Exams-2023-24(1)/Exam10072024/Solutions.pdf')],
  ],
  CI20240905: [
    ['Exam paper', P('Exams-2023-24(1)/Exam-05092924/CI-2024_09_05.pdf')],
    ['Answer key (handwritten scan)', P('Exams-2023-24(1)/Exam-05092924/Solutions.pdf')],
  ],
  CI20250113: [
    ['Exam paper', P('Exams-2023-24(1)/Exam-13012025/CI-2025_01_13.pdf')],
    ['Answer key (handwritten scan)', P('Exams-2023-24(1)/Exam-13012025/Solutions.pdf')],
  ],
  CI20250203: [
    ['Exam paper', P('Exams-2023-24(1)/Exam-03022025/CI-2025_02_03.pdf')],
    ['Answer key (handwritten scan)', P('Exams-2023-24(1)/Exam-03022025/Solutions.pdf')],
  ],
  CI20250612: [
    ['Exam paper', P('Exams-2024-25(1)/Exams-2024-2025/Exam-12-06-2025/CI-2025_06.pdf')],
    ['Answer key (handwritten scan)', P('Exams-2024-25(1)/Exams-2024-2025/Exam-12-06-2025/Solutions.pdf')],
  ],
  CI20250704: [
    ['Exam paper', P('Exams-2024-25(1)/Exams-2024-2025/Exam-04-07-2025/CI-2025_07.pdf')],
    ['Answer key (handwritten scan)', P('Exams-2024-25(1)/Exams-2024-2025/Exam-04-07-2025/Solutions.pdf')],
  ],
  CI20250911: [
    ['Exam paper', P('Exams-2024-25(1)/Exams-2024-2025/Exam-11-09-2025/CI-2025_09.pdf')],
    ['Answer key (handwritten scan)', P('Exams-2024-25(1)/Exams-2024-2025/Exam-11-09-2025/Solutions.pdf')],
  ],
  CI20260113: [
    ['Exam paper', P('Exams-2024-25(1)/Exams-2024-2025/Exam-13-01-2026/CI-2026_01.pdf')],
    ['Answer key (handwritten scan)', P('Exams-2024-25(1)/Exams-2024-2025/Exam-13-01-2026/Solutions.pdf')],
  ],
  CI20260204: [
    ['Exam paper', P('Exams-2024-25(1)/Exams-2024-2025/Exam-04-02-2026/CI-2026_02.pdf')],
    ['Answer key (handwritten scan)', P('Exams-2024-25(1)/Exams-2024-2025/Exam-04-02-2026/Solutions.pdf')],
  ],
  CI20260410: [['Exam + worked solutions', join(CI, 'CI-2026_04_SOLUTIONS.pdf')]],
}
for (const [examId, entries] of Object.entries(ciMap)) {
  entries.forEach(([label, src], i) => add(examId, src, label, i === 0 ? '' : `-key`))
}

// ---- ACA: 2024/25 exam papers (no official solutions — answers in this app are model answers) ----
const A = (...parts) => join(ACA, ...parts)
const acaMap = {
  ACA20240509: [['Exam + official solutions', A('20240509-aca24-exe-sol.pdf')]],
  ACA20240619: [['Exam + official solutions', A('20240619-aca24-sol.pdf')]],
  ACA20240715: [['Exam + official solutions', A('20240715-aca24-sol.pdf')]],
  ACA20250120: [['Exam paper (no official solutions)', A('20250120-aca25.pdf')]],
  ACA20250610: [['Exam paper (exercises, no solutions)', A('20250610-aca25-exeonly.pdf')]],
  ACA20250710: [['Exam paper (exercises, no solutions)', A('20250710-aca25-exeonly.pdf')]],
  ACA20250903: [['Exam paper (exercises, no solutions)', A('20250903-aca25-exeonly.pdf')]],
}
for (const [examId, entries] of Object.entries(acaMap)) {
  entries.forEach(([label, src], i) => add(examId, src, label, i === 0 ? '' : `-key`))
}

// ---- AmI: per-deck question sets link to their source lecture slides ----
const M = (...parts) => join(AMI, ...parts)
const amiMap = {
  AMI20260101: [['Course slides — 01 Intro to Ambient Intelligence', M('01-IntroAmbientIntelligence.pdf')]],
  AMI20260102: [['Course slides — 02 IoT & Sensor Data Management', M('02-IoTSensorDataManagement.pdf')]],
  AMI20260103: [['Course slides — 03 Time Series', M('03-TimeSeries.pdf')]],
  AMI20260104: [['Course slides — 04 Advanced Time Series', M('04-AdvancedTimeSeries (1).pdf')]],
  AMI20260105: [['Course slides — 05 Indoor Localization', M('05-IndoorLocalization.pdf')]],
  AMI20260106: [['Course slides — 06 Smart Energy', M('06-SmartEnergy.pdf')]],
  AMI20260107: [['Course slides — 07a HAR: Intro', M('07.a-HumanActivityRecognition-Intro.pdf')]],
  AMI20260108: [['Course slides — 07b HAR: Mobile', M('07.b-HumanActivityRecognition-Mobile.pdf')]],
  AMI20260109: [['Course slides — 08 HAR: Smart-home', M('08-HumanActivityRecognition-Smarthome.pdf')]],
  AMI20260110: [['Course slides — 09 Multi-Inhabitant HAR', M('09-MultiInhabitantHAR.pdf')]],
  AMI20260111: [['Course slides — 10 Incremental Learning', M('10-IncrementalLearning.pdf')]],
  AMI20260112: [['Course slides — 11 Transfer Learning', M('11-TransferLearning.pdf')]],
  AMI20260113: [['Course slides — 12 Federated Learning', M('12-FederatedLearning.pdf')]],
  AMI20260114: [['Course slides — 13 Explainable AI', M('13-XAI.pdf')]],
  AMI20260115: [['Course slides — 14 Generative AI', M('14-GenerativeAI.pdf')]],
  AMI20260116: [['Course slides — 15 Graph Neural Networks', M('15-GNNs.pdf')]],
}
for (const [examId, entries] of Object.entries(amiMap)) {
  entries.forEach(([label, src], i) => add(examId, src, label, i === 0 ? '' : `-key`))
}

// ---- SMBUD: past exams (source PDFs, mostly blank/no official solutions) ----
const SMBUD = '/Users/sorin/Library/CloudStorage/GoogleDrive-sorinnicumarian@gmail.com/My Drive/Career/Masters/Lectures/1.1/BD/Past Exams'
const S = (...parts) => join(SMBUD, ...parts)
const smbudMap = {
  SMBUD20220118: [['Exam + official solutions', S('18_01_2022.pdf')]],
  SMBUD20230113: [['Exam paper (no official solutions)', S('13_01_2023.pdf')]],
  SMBUD20240606: [['Exam paper (no official solutions)', S('SMBUD Exam - 06_06_2024.pdf')]],
  SMBUD20240624: [['Exam paper (no official solutions)', S('SMBUD Exam - 24_06_2024.pdf')]],
  SMBUD20240906: [['Exam paper (no official solutions)', S('SMBUD Exam - 06_09_2024.pdf')]],
  SMBUD20250121: [['Exam paper (no official solutions)', S('SMBUD Exam - 21_01_2025.pdf')]],
  SMBUD20250211: [['Exam paper (no official solutions)', S('SMBUD Exam - 11_02_2025.pdf')]],
  SMBUD20250530: [['Exam paper (no official solutions)', S('SMBUD Exam - 30_05_2025.pdf')]],
  SMBUD20250613: [['Exam paper (no official solutions)', S('SMBUD Exam - 13_06_2025.pdf')]],
  SMBUD20250912: [['Exam paper (no official solutions)', S('SMBUD Exam - 12_09_2025.pdf')]],
}
for (const [examId, entries] of Object.entries(smbudMap)) {
  entries.forEach(([label, src], i) => add(examId, src, label, i === 0 ? '' : `-key`))
}

writeFileSync(join(OUT, 'index.json'), JSON.stringify(index))
console.log(`✓ collected PDFs for ${Object.keys(index).length} exams (${(bytes / 1048576).toFixed(1)} MB) → public/exams/`)
