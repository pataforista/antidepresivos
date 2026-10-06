#!/usr/bin/env node
/**
 * Auditoría post-hoc de PRs generados por IA.
 * Cross-platform: Windows, Mac, Linux, CI.
 *
 * Uso: node scripts/audit-ai-pr.mjs [base-branch]
 */

import { execSync } from 'node:child_process'
import { readFileSync, existsSync } from 'node:fs'

const BASE = process.argv[2] || 'main'
let failures = 0

function log(msg) { console.log(msg) }
function fail(msg) { console.error(`  ❌ ${msg}`); failures++ }
function ok(msg) { console.log(`  ✅ ${msg}`) }
function warn(msg) { console.warn(`  ⚠️  ${msg}`) }

function sh(cmd) {
  try {
    return execSync(cmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] })
  } catch (e) {
    return e.stdout?.toString() || ''
  }
}

log(`🔍 Auditando cambios respecto a origin/${BASE}\n`)

// 1. Bloques catch vacíos
log('→ Bloques catch vacíos en src/:')
const catchHits = sh(`git grep -nE "catch\\s*\\([^)]*\\)\\s*\\{\\s*\\}" -- src/`)
if (catchHits.trim()) {
  fail('Bloques catch vacíos detectados:')
  log(catchHits)
} else {
  ok('Ninguno')
}

// 2. TODOs en el diff
log('\n→ TODOs/FIXME/HACK nuevos en el diff:')
const todos = sh(`git diff origin/${BASE}...HEAD -- src/ "*.js" "*.css" | findstr /R "^\\+.*TODO ^\\+.*FIXME ^\\+.*HACK ^\\+.*XXX"`)
// Nota: findstr es de Windows. Fallback a grep si no está:
const todosFallback = todos.trim() ? todos : sh(`git diff origin/${BASE}...HEAD -- src/ | grep -E "^\\+.*(TODO|FIXME|HACK|XXX)" || true`)
if (todosFallback.trim()) {
  fail('El PR introduce TODO/FIXME/HACK. Ábrelos como issue.')
  log(todosFallback)
} else {
  ok('Sin TODOs nuevos')
}

// 3. console.log en src/ (warning)
log('\n→ console.log en src/ (warning, no falla):')
const logs = sh(`git grep -nE "console\\.log" -- src/ ":!*.test.js" ":!sw.js"`)
if (logs.trim()) {
  warn('console.log encontrados:')
  log(logs)
} else {
  ok('Ninguno')
}

// 4. ¿Toca zonas clínicas?
log('\n→ ¿Toca zonas clínicas?')
const clinical = sh(`git diff origin/${BASE}...HEAD --name-only | findstr /R "switchingMatrix data.*csv data.*json"`)
// Fallback robusto:
const clinicalFallback = clinical.trim() || sh(`git diff origin/${BASE}...HEAD --name-only | grep -E "switchingMatrix|data/.*\\.(csv|json)$" || true`)
if (clinicalFallback.trim()) {
  fail('TOCA CONTENIDO CLÍNICO — requiere Revisor Médico:')
  log(clinicalFallback)
} else {
  ok('No toca zonas clínicas')
}

// 5. Tamaño del diff
log('\n→ Tamaño del diff:')
const stat = sh(`git diff origin/${BASE}...HEAD --shortstat`)
log(`  ${stat.trim()}`)
const linesMatch = stat.match(/(\d+) insertion/)
const lines = linesMatch ? parseInt(linesMatch[1], 10) : 0
if (lines > 500) {
  warn(`PR grande (${lines} líneas insertadas). Difícil de revisar bien.`)
}

// 6. Archivos borrados
log('\n→ Archivos borrados:')
const deleted = sh(`git diff origin/${BASE}...HEAD --name-only --diff-filter=D`)
if (deleted.trim()) {
  warn('Verificar que no eran load-bearing:')
  log(deleted)
} else {
  ok('Ninguno')
}

// 7. Verificar que existen los archivos nuevos mencionados en el diff
log('\n→ Verificar archivos nuevos existen físicamente:')
const added = sh(`git diff origin/${BASE}...HEAD --name-only --diff-filter=A`)
let missingCount = 0
if (added.trim()) {
  for (const f of added.trim().split('\n')) {
    if (!existsSync(f)) {
      fail(`Archivo declarado como nuevo pero no existe: ${f}`)
      missingCount++
    }
  }
}
if (missingCount === 0) ok('Todos los archivos nuevos existen')

// Resultado
log('')
if (failures > 0) {
  console.error(`❌ Auditoría encontró ${failures} problema(s). Revisar antes de mergear.`)
  process.exit(1)
} else {
  console.log('✅ Auditoría OK.')
}
