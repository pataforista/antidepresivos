/* ============================================================
   src/ui/quizView.js
   PharmaQuiz — Juego de repaso de Antidepresivos
   v2: Modos / Perlas Clínicas / Revisión Final / Anti-ambigüedad
   ============================================================ */

import { store } from "../core/store.js";
import { escapeHtml } from "../core/utils.js";

/* ── Estado del juego ──────────────────────────────────────── */
let Q = {
  questions: [], idx: 0, score: 0, streak: 0, maxStreak: 0,
  answered: false, selected: null, finished: false, total: 10,
  mode: "residente", wrong: [], // track incorrect for review
};

/* ── Modos de juego ─────────────────────────────────────────── */
const MODES = {
  residente: {
    id: "residente",
    label: "Residente",
    icon: "🩺",
    desc: "Conceptos esenciales: clase, mecanismo, efectos frecuentes.",
    color: "#00e5ff",
    templateIds: ["clase", "mecanismo", "sedacion", "peso", "sexual", "utilidad"],
    count: 10,
  },
  especialista: {
    id: "especialista",
    label: "Especialista",
    icon: "🧬",
    desc: "Farmacología avanzada: enzimas, vida media, interacciones, dosis.",
    color: "#c084fc",
    templateIds: ["clase", "mecanismo", "sedacion", "peso", "sexual", "utilidad", "enzima", "interacciones", "abstinencia", "qt"],
    count: 12,
  },
  clinico: {
    id: "clinico",
    label: "Ronda Clínica",
    icon: "🏥",
    desc: "¿Qué fármaco elegirías? Escenarios clínicos reales.",
    color: "#ff6eb4",
    templateIds: ["utilidad_inversa", "clase", "mecanismo", "sexual", "peso", "interacciones"],
    count: 10,
  },
};

/* ── Helpers de normalización ───────────────────────────────── */
function isValid(v) {
  if (v == null) return false;
  const s = String(v).trim();
  return s !== "" && s !== "N/D" && s !== "N/A" && s !== "No aplica" && s !== "-" && s.length > 1;
}

function shortStr(v, maxLen = 80) {
  const s = String(v).trim();
  return s.length > maxLen ? s.slice(0, maxLen - 1) + "…" : s;
}

const SEDATION_LABEL = {
  "0": "Nulo (sin sedación)",
  "1": "Leve",
  "2": "Moderado",
  "3": "Alto / Muy sedante",
};

/* ── Templates de preguntas ─────────────────────────────────── */
// PRINCIPIO ANTI-AMBIGÜEDAD:
// - Solo usar campos donde los valores sean claramente distintos entre sí.
// - pool() filtra valores inválidos/duplicados y debe tener ≥4 opciones únicas.
// - Las preguntas indican claramente QUÉ se pide.

const TEMPLATES = [
  {
    id: "clase",
    category: "Clasificación",
    icon: "🏷️",
    difficulty: ["residente", "especialista", "clinico"],
    ask: () => `¿A qué <b>clase terapéutica</b> pertenece este fármaco?`,
    correct: (d) => d.clase_terapeutica,
    pool: (all) => [...new Set(all.map(d => d.clase_terapeutica).filter(isValid))],
    label: (v) => shortStr(v, 60),
    validate: (d) => isValid(d.clase_terapeutica),
  },
  {
    id: "mecanismo",
    category: "Mecanismo de Acción",
    icon: "⚙️",
    difficulty: ["residente", "especialista", "clinico"],
    ask: () => `¿Cuál es el <b>mecanismo principal</b> de acción?`,
    correct: (d) => d.mecanismo_principal,
    pool: (all) => [...new Set(all.map(d => d.mecanismo_principal).filter(isValid))],
    label: (v) => shortStr(v, 70),
    validate: (d) => isValid(d.mecanismo_principal),
  },
  {
    id: "sedacion",
    category: "Perfil de Sedación",
    icon: "😴",
    difficulty: ["residente", "especialista"],
    ask: () => `¿Cuál es el <b>nivel de sedación</b>?`,
    correct: (d) => String(d.nivel_sedacion ?? ""),
    pool: () => ["0", "1", "2", "3"],
    label: (v) => SEDATION_LABEL[v] ?? v,
    validate: (d) => isValid(d.nivel_sedacion) && ["0","1","2","3"].includes(String(d.nivel_sedacion)),
  },
  {
    id: "peso",
    category: "Impacto en Peso",
    icon: "⚖️",
    difficulty: ["residente", "especialista"],
    ask: () => `¿Cuál es el <b>impacto en el peso corporal</b>?`,
    correct: (d) => d.perfil_impacto_peso,
    pool: (all) => [...new Set(all.map(d => d.perfil_impacto_peso).filter(isValid))],
    label: (v) => v,
    validate: (d) => isValid(d.perfil_impacto_peso),
  },
  {
    id: "sexual",
    category: "Disfunción Sexual",
    icon: "💊",
    difficulty: ["residente", "especialista", "clinico"],
    ask: () => `¿Cuál es el riesgo de <b>disfunción sexual</b>?`,
    correct: (d) => d.perfil_disfuncion_sexual,
    pool: (all) => [...new Set(all.map(d => d.perfil_disfuncion_sexual).filter(isValid))],
    label: (v) => v,
    validate: (d) => isValid(d.perfil_disfuncion_sexual),
  },
  {
    id: "utilidad",
    category: "Utilidad Clínica",
    icon: "🎯",
    difficulty: ["residente", "especialista", "clinico"],
    ask: () => `¿Cuál es la <b>utilidad sintomática clave</b> de este fármaco?`,
    correct: (d) => d.utilidad_sintomatica_clave,
    pool: (all) => [...new Set(all.map(d => d.utilidad_sintomatica_clave).filter(isValid))],
    label: (v) => shortStr(v, 70),
    validate: (d) => isValid(d.utilidad_sintomatica_clave),
  },
  {
    id: "enzima",
    category: "Metabolismo Enzimático",
    icon: "🧪",
    difficulty: ["especialista"],
    ask: () => `¿Cuál es el <b>sustrato enzimático principal</b> (metabolismo)?`,
    correct: (d) => d.sustrato_enzimatico_principal,
    pool: (all) => [...new Set(all.map(d => d.sustrato_enzimatico_principal).filter(isValid))],
    label: (v) => shortStr(v, 60),
    validate: (d) => isValid(d.sustrato_enzimatico_principal),
  },
  {
    id: "interacciones",
    category: "Interacciones Peligrosas",
    icon: "⚠️",
    difficulty: ["especialista", "clinico"],
    ask: () => `¿Con qué <b>medicamentos está contraindicada</b> la combinación?`,
    correct: (d) => d.interacciones_contraindicadas,
    pool: (all) => [...new Set(all.map(d => d.interacciones_contraindicadas).filter(isValid))],
    label: (v) => shortStr(v, 70),
    validate: (d) => isValid(d.interacciones_contraindicadas) && d.interacciones_contraindicadas.length > 5,
  },
  {
    id: "abstinencia",
    category: "Síndrome de Abstinencia",
    icon: "🔴",
    difficulty: ["especialista"],
    ask: () => `¿Cuál es el riesgo de <b>síndrome de abstinencia</b> al suspender?`,
    correct: (d) => d.riesgo_sindrome_abstinencia,
    pool: (all) => [...new Set(all.map(d => d.riesgo_sindrome_abstinencia).filter(isValid))],
    label: (v) => v,
    validate: (d) => isValid(d.riesgo_sindrome_abstinencia),
  },
  {
    id: "qt",
    category: "Riesgo QT",
    icon: "💓",
    difficulty: ["especialista"],
    ask: () => `¿Cuál es el riesgo de <b>prolongación del QT</b>?`,
    correct: (d) => d.riesgo_prolongacion_qt,
    pool: (all) => [...new Set(all.map(d => d.riesgo_prolongacion_qt).filter(isValid))],
    label: (v) => v,
    validate: (d) => isValid(d.riesgo_prolongacion_qt),
  },
  // MODO CLÍNICO: pregunta invertida — se da la utilidad, se elige el fármaco.
  {
    id: "utilidad_inversa",
    category: "Ronda Clínica",
    icon: "🏥",
    difficulty: ["clinico"],
    // ask() and correct() are set dynamically in buildClinicalQuestion
    ask: (d, ctx) => ctx?.question ?? `¿Qué fármaco elegirías para <b>${escapeHtml(d.utilidad_sintomatica_clave)}</b>?`,
    correct: (d) => d.nombre_generico,
    pool: (all) => [...new Set(all.map(d => d.nombre_generico).filter(isValid))],
    label: (v) => v,
    validate: (d) => isValid(d.utilidad_sintomatica_clave) && isValid(d.nombre_generico),
    isClinical: true,
  },
];

/* ── Utilidades de juego ─────────────────────────────────────── */
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function starsFor(score, max) {
  const pct = score / max;
  if (pct >= 0.9) return { stars: "★★★★★", label: "Excelente", emoji: "🏆" };
  if (pct >= 0.7) return { stars: "★★★★☆", label: "Muy bien", emoji: "🎓" };
  if (pct >= 0.5) return { stars: "★★★☆☆", label: "Bien", emoji: "📚" };
  if (pct >= 0.3) return { stars: "★★☆☆☆", label: "Repasa más", emoji: "📖" };
  return { stars: "★☆☆☆☆", label: "¡A estudiar!", emoji: "😅" };
}

/* ── Construcción de preguntas anti-ambigüedad ───────────────── */
function buildQuestion(drug, allDrugs, modeTemplateIds) {
  const eligibleTemplates = TEMPLATES.filter(t => modeTemplateIds.includes(t.id) && !t.isClinical);
  const shuffledTemplates = shuffle(eligibleTemplates);

  for (const tmpl of shuffledTemplates) {
    if (!tmpl.validate(drug)) continue;

    const correct = tmpl.correct(drug);
    if (!isValid(correct)) continue;

    // Build a pool of CLEARLY DIFFERENT distractors
    let fullPool = tmpl.pool(allDrugs)
      .filter(v => v !== correct)
      // Anti-ambiguity: remove options that are substrings of correct or vice versa
      .filter(v => {
        const vc = correct.toLowerCase().slice(0, 15);
        const vv = String(v).toLowerCase().slice(0, 15);
        return vc !== vv;
      });

    // Deduplicate normalized
    const seen = new Set();
    fullPool = fullPool.filter(v => {
      const key = String(v).slice(0, 20).toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    if (fullPool.length < 3) continue; // need at least 3 distractors

    const distractors = shuffle(fullPool).slice(0, 3);
    const options = shuffle([correct, ...distractors]);

    return { drug, tmpl, correct, options, pearl: drug.perlas_clinicas ?? null };
  }
  return null;
}

function buildClinicalQuestion(drug, allDrugs) {
  if (!isValid(drug.utilidad_sintomatica_clave) || !isValid(drug.nombre_generico)) return null;

  const tmpl = TEMPLATES.find(t => t.id === "utilidad_inversa");
  const correct = drug.nombre_generico;

  // Distractors: other drugs of SAME class (harder) or random
  let pool = allDrugs
    .filter(d => d.nombre_generico !== correct && isValid(d.nombre_generico))
    .map(d => d.nombre_generico);

  const seen = new Set([correct]);
  pool = pool.filter(v => {
    if (seen.has(v)) return false;
    seen.add(v);
    return true;
  });

  if (pool.length < 3) return null;

  const distractors = shuffle(pool).slice(0, 3);
  const options = shuffle([correct, ...distractors]);

  return {
    drug,
    tmpl,
    correct,
    options,
    pearl: drug.perlas_clinicas ?? null,
    clinicalPrompt: drug.utilidad_sintomatica_clave,
  };
}

function generateQuestions(allDrugs, mode) {
  const modeConfig = MODES[mode];
  const count = modeConfig.count;
  const isClinical = mode === "clinico";
  const shuffledDrugs = shuffle(allDrugs.filter(d => isValid(d.nombre_generico)));
  const questions = [];
  const usedDrugIds = new Set();

  let attempts = 0;
  while (questions.length < count && attempts < count * 5) {
    const drug = shuffledDrugs[attempts % shuffledDrugs.length];
    attempts++;

    if (usedDrugIds.has(drug.id_farmaco)) continue;

    let q = null;
    if (isClinical && Math.random() > 0.4) {
      // 60% of clinical questions are scenario-based
      q = buildClinicalQuestion(drug, allDrugs);
    }
    if (!q) {
      q = buildQuestion(drug, allDrugs, modeConfig.templateIds);
    }

    if (q) {
      questions.push(q);
      usedDrugIds.add(drug.id_farmaco);
    }
  }

  return questions.slice(0, count);
}

/* ── Render principal ────────────────────────────────────────── */
export function renderQuiz(view) {
  const allDrugs = store.getState().data?.dataset?.farmacos ?? [];
  if (!allDrugs.length) {
    view.innerHTML = `<div class="quiz-view"><p class="quiz-loading">Cargando datos… ✦</p></div>`;
    return;
  }
  renderStart(view, allDrugs);
}

/* ── Pantalla Inicio ─────────────────────────────────────────── */
function renderStart(view, allDrugs) {
  view.innerHTML = `
    <div class="quiz-view animate-fade-in">
      <div class="quiz-scanlines" aria-hidden="true"></div>
      <div class="quiz-container">
        <div class="quiz-mascot-wrap">
          <div class="quiz-mascot">ʕ •ᴥ•ʔ</div>
          <div class="quiz-stars-deco" aria-hidden="true">✦ ✧ ✦</div>
        </div>
        <h1 class="quiz-title">PHARMA<span class="quiz-title-accent">QUIZ</span></h1>
        <p class="quiz-subtitle">✦ Repaso de Antidepresivos ✦</p>

        <p class="quiz-mode-title">Selecciona tu nivel</p>
        <div class="quiz-mode-selector" id="quizModeSelector">
          ${Object.values(MODES).map(m => `
            <button
              type="button"
              class="quiz-mode-card ${m.id === "residente" ? "quiz-mode-card--active" : ""}"
              data-mode="${m.id}"
              style="--mode-color: ${m.color}"
            >
              <span class="quiz-mode-icon">${m.icon}</span>
              <span class="quiz-mode-label">${m.label}</span>
              <span class="quiz-mode-desc">${m.desc}</span>
              <span class="quiz-mode-count">${m.count} preguntas</span>
            </button>
          `).join("")}
        </div>

        <button class="quiz-btn quiz-btn--primary" id="btnStartQuiz">
          ▶ INICIAR JUEGO
        </button>
        <a href="#/list" class="quiz-link-back">← Volver al listado</a>
      </div>
    </div>
  `;

  // Mode selector logic
  let selectedMode = "residente";
  view.querySelectorAll(".quiz-mode-card").forEach(card => {
    card.addEventListener("click", () => {
      view.querySelectorAll(".quiz-mode-card").forEach(c => c.classList.remove("quiz-mode-card--active"));
      card.classList.add("quiz-mode-card--active");
      selectedMode = card.dataset.mode;
    });
  });

  view.querySelector("#btnStartQuiz")?.addEventListener("click", () => {
    Q = {
      questions: generateQuestions(allDrugs, selectedMode),
      idx: 0, score: 0, streak: 0, maxStreak: 0,
      answered: false, selected: null, finished: false,
      total: MODES[selectedMode].count,
      mode: selectedMode,
      wrong: [],
    };
    if (!Q.questions.length) {
      view.querySelector(".quiz-container").innerHTML =
        `<p class="quiz-loading">Error generando preguntas. Recarga la página.</p>`;
      return;
    }
    Q.total = Q.questions.length; // use actual count
    renderQuestion(view);
  });
}

/* ── Pantalla Pregunta ───────────────────────────────────────── */
function renderQuestion(view) {
  const q = Q.questions[Q.idx];
  if (!q) { renderResults(view); return; }

  const pct = Math.round((Q.idx / Q.total) * 100);
  const streakDisplay = Q.streak > 1 ? `🔥×${Q.streak}` : "✦";
  const streakClass = Q.streak >= 3 ? "quiz-streak--hot" : "";
  const modeConfig = MODES[Q.mode];

  // Clinical questions show the prompt differently
  const isDrugQuestion = !q.clinicalPrompt;
  const cardTop = isDrugQuestion ? `
    <div class="quiz-drug-category">
      <span>${q.tmpl.icon}</span>
      <span>${escapeHtml(q.tmpl.category)}</span>
    </div>
    <div class="quiz-drug-name">${escapeHtml(q.drug.nombre_generico)}</div>
    <div class="quiz-drug-class text-muted">${escapeHtml(q.drug.clase_terapeutica ?? "")}</div>
    <div class="quiz-question-text">${q.tmpl.ask(q.drug)}</div>
  ` : `
    <div class="quiz-drug-category" style="--mode-color:${modeConfig.color}; background: rgba(255,110,180,0.1); border-color: rgba(255,110,180,0.3); color: var(--quiz-neon-pink);">
      <span>${q.tmpl.icon}</span>
      <span>Ronda Clínica</span>
    </div>
    <div class="quiz-clinical-scenario">
      <p class="quiz-clinical-prompt">Un paciente necesita tratamiento para:</p>
      <p class="quiz-clinical-need">${escapeHtml(q.clinicalPrompt)}</p>
      <p class="quiz-question-text" style="border-top:none;padding-top:0.5rem;">¿Qué antidepresivo sería ideal?</p>
    </div>
  `;

  view.innerHTML = `
    <div class="quiz-view animate-fade-in">
      <div class="quiz-scanlines" aria-hidden="true"></div>
      <div class="quiz-container">
        <div class="quiz-hud">
          <div class="quiz-hud-left">
            <span class="quiz-score-badge">⭐ ${Q.score} pts</span>
          </div>
          <div class="quiz-hud-center">
            <span class="quiz-progress-text">${Q.idx + 1} / ${Q.total}</span>
          </div>
          <div class="quiz-hud-right">
            <span class="quiz-streak-badge ${streakClass}">${streakDisplay}</span>
          </div>
        </div>

        <div class="quiz-progress-track">
          <div class="quiz-progress-fill" style="width: ${pct}%"></div>
        </div>

        <div class="quiz-drug-card">
          ${cardTop}
        </div>

        <div class="quiz-options-grid" id="quizOptions">
          ${q.options.map((opt, i) => `
            <button
              class="quiz-option"
              data-value="${escapeHtml(opt)}"
              data-idx="${i}"
              type="button"
            >
              <span class="quiz-option-letter">${["A", "B", "C", "D"][i]}</span>
              <span class="quiz-option-text">${escapeHtml(q.tmpl.label(opt))}</span>
            </button>
          `).join("")}
        </div>

        <div class="quiz-feedback" id="quizFeedback" aria-live="polite"></div>
        <div class="quiz-pearl-card quiz-hidden" id="quizPearl"></div>

        <button class="quiz-btn quiz-btn--next quiz-hidden" id="btnNextQuestion" type="button">
          ${Q.idx + 1 >= Q.total ? "Ver resultados →" : "Siguiente →"}
        </button>
      </div>
    </div>
  `;

  attachOptionListeners(view, q);
}

function attachOptionListeners(view, q) {
  const optionsGrid = view.querySelector("#quizOptions");
  const feedback = view.querySelector("#quizFeedback");
  const pearlCard = view.querySelector("#quizPearl");
  const nextBtn = view.querySelector("#btnNextQuestion");

  optionsGrid?.querySelectorAll(".quiz-option").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (Q.answered) return;
      Q.answered = true;
      Q.selected = btn.dataset.value;

      const isCorrect = Q.selected === q.correct;
      if (isCorrect) {
        const streakBonus = Math.max(0, Q.streak) * 5;
        Q.score += 10 + streakBonus;
        Q.streak += 1;
        Q.maxStreak = Math.max(Q.maxStreak, Q.streak);
      } else {
        Q.streak = 0;
        Q.wrong.push({
          drug: q.drug.nombre_generico,
          category: q.tmpl.category,
          question: q.tmpl.ask(q.drug, q),
          correct: q.tmpl.label(q.correct),
          selected: q.tmpl.label(Q.selected),
          pearl: q.pearl,
        });
      }

      // Mark options visually
      optionsGrid.querySelectorAll(".quiz-option").forEach((b) => {
        b.disabled = true;
        if (b.dataset.value === q.correct) b.classList.add("quiz-option--correct");
        else if (b === btn && !isCorrect) b.classList.add("quiz-option--wrong");
      });

      // Feedback
      if (feedback) {
        const bonus = isCorrect ? 10 + Math.max(0, Q.streak - 1) * 5 : 0;
        feedback.className = `quiz-feedback quiz-feedback--${isCorrect ? "ok" : "ko"}`;
        feedback.innerHTML = isCorrect
          ? `<span class="quiz-feedback-icon">✓</span> ¡Correcto! <b>+${bonus} pts</b>${Q.streak > 2 ? ` <span class="quiz-combo">🔥 COMBO ×${Q.streak}</span>` : ""}`
          : `<span class="quiz-feedback-icon">✗</span> Era: <b>${escapeHtml(q.tmpl.label(q.correct))}</b>`;
      }

      // Pearl card — shown after every answer for learning
      if (pearlCard && q.pearl) {
        pearlCard.classList.remove("quiz-hidden");
        pearlCard.innerHTML = `
          <div class="quiz-pearl-header">
            <span class="quiz-pearl-icon">💎</span>
            <span class="quiz-pearl-label">Perla Clínica</span>
          </div>
          <p class="quiz-pearl-text">${escapeHtml(q.pearl)}</p>
        `;
      }

      if (nextBtn) {
        nextBtn.classList.remove("quiz-hidden");
        nextBtn.focus();
      }
    });
  });

  nextBtn?.addEventListener("click", () => {
    Q.idx += 1;
    Q.answered = false;
    Q.selected = null;
    if (Q.idx >= Q.total || Q.idx >= Q.questions.length) renderResults(view);
    else renderQuestion(view);
  });
}

/* ── Pantalla Resultados ─────────────────────────────────────── */
function renderResults(view) {
  Q.finished = true;
  const maxScore = Q.total * 10;
  const { stars, label, emoji } = starsFor(Q.score, maxScore);
  const correctCount = Q.total - Q.wrong.length;
  const allDrugs = store.getState().data?.dataset?.farmacos ?? [];
  const modeConfig = MODES[Q.mode];

  // Review section for wrong answers
  const reviewHTML = Q.wrong.length ? `
    <div class="quiz-review-section">
      <h3 class="quiz-review-title">📋 Repaso — errores (${Q.wrong.length})</h3>
      <div class="quiz-review-list">
        ${Q.wrong.map(w => `
          <div class="quiz-review-item">
            <div class="quiz-review-drug">${escapeHtml(w.drug)}</div>
            <div class="quiz-review-category">${escapeHtml(w.category)}</div>
            <div class="quiz-review-row">
              <span class="quiz-review-wrong-label">Tu respuesta:</span>
              <span class="quiz-review-wrong">${escapeHtml(w.selected)}</span>
            </div>
            <div class="quiz-review-row">
              <span class="quiz-review-correct-label">Correcto:</span>
              <span class="quiz-review-correct">${escapeHtml(w.correct)}</span>
            </div>
            ${w.pearl ? `<div class="quiz-review-pearl">💎 ${escapeHtml(w.pearl).slice(0, 150)}…</div>` : ""}
          </div>
        `).join("")}
      </div>
    </div>
  ` : `
    <div class="quiz-review-section" style="text-align:center; padding:1rem;">
      <p style="color: #34d399; font-weight:700; font-size:1.1rem;">🎉 ¡Sin errores! Perfecto.</p>
    </div>
  `;

  view.innerHTML = `
    <div class="quiz-view animate-fade-in">
      <div class="quiz-scanlines" aria-hidden="true"></div>
      <div class="quiz-container">
        <div class="quiz-mascot-wrap">
          <div class="quiz-mascot quiz-mascot--result">${emoji}</div>
        </div>
        <h2 class="quiz-results-title">RESULTADOS</h2>
        <div class="quiz-results-card">
          <div class="quiz-results-stars">${stars}</div>
          <div class="quiz-results-score">
            <span class="quiz-results-pts">${Q.score}</span>
            <span class="quiz-results-pts-label">/ ${maxScore}+ pts</span>
          </div>
          <p class="quiz-results-msg">${label} — Modo ${modeConfig.label}</p>
          <div class="quiz-results-stats">
            <div class="quiz-results-stat">
              <span class="quiz-results-stat-val" style="color:#34d399">${correctCount}</span>
              <span class="quiz-results-stat-label">Correctas</span>
            </div>
            <div class="quiz-results-stat">
              <span class="quiz-results-stat-val" style="color:#f87171">${Q.wrong.length}</span>
              <span class="quiz-results-stat-label">Incorrectas</span>
            </div>
            <div class="quiz-results-stat">
              <span class="quiz-results-stat-val" style="color:var(--quiz-neon-purp)">🔥×${Q.maxStreak}</span>
              <span class="quiz-results-stat-label">Racha máx.</span>
            </div>
          </div>
        </div>

        ${reviewHTML}

        <div class="quiz-results-actions">
          <button class="quiz-btn quiz-btn--primary" id="btnPlayAgain">
            ↺ Jugar de nuevo
          </button>
          <a href="#/list" class="quiz-btn quiz-btn--ghost">
            ← Ver listado
          </a>
        </div>
      </div>
    </div>
  `;

  view.querySelector("#btnPlayAgain")?.addEventListener("click", () => {
    renderStart(view, allDrugs);
  });
}
