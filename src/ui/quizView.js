/* ============================================================
   src/ui/quizView.js
   PharmaQuiz — Juego de repaso de Antidepresivos
   Estilo: Retrofuturista ✦ Kawaii
   ============================================================ */

import { store } from "../core/store.js";
import { escapeHtml } from "../core/utils.js";

/* ── Estado del juego (módulo local, no en el store global) ──────── */
let Q = {
  questions: [],
  idx: 0,
  score: 0,
  streak: 0,
  maxStreak: 0,
  answered: false,
  selected: null,
  finished: false,
  total: 10,
};

/* ── Plantillas de preguntas ─────────────────────────────────────── */
const SEDATION_LABEL = { "0": "Nulo ✧", "1": "Leve ✧✧", "2": "Moderado ✧✧✧", "3": "Alto ✧✧✧✧" };

const TEMPLATES = [
  {
    id: "clase",
    category: "Clasificación",
    icon: "🏷️",
    ask: (d) => `¿A qué <b>clase terapéutica</b> pertenece?`,
    correct: (d) => d.clase_terapeutica,
    pool: (all) => [...new Set(all.map((d) => d.clase_terapeutica).filter(Boolean))],
    label: (v) => v,
  },
  {
    id: "mecanismo",
    category: "Mecanismo",
    icon: "⚙️",
    ask: (d) => `¿Cuál es el <b>mecanismo principal</b>?`,
    correct: (d) => d.mecanismo_principal,
    pool: (all) => [...new Set(all.map((d) => d.mecanismo_principal).filter(Boolean))],
    label: (v) => v,
  },
  {
    id: "sedacion",
    category: "Sedación",
    icon: "😴",
    ask: (d) => `¿Cuál es el <b>nivel de sedación</b>?`,
    correct: (d) => String(d.nivel_sedacion ?? ""),
    pool: () => ["0", "1", "2", "3"],
    label: (v) => SEDATION_LABEL[v] ?? v,
  },
  {
    id: "peso",
    category: "Impacto Peso",
    icon: "⚖️",
    ask: (d) => `¿Cuál es el <b>impacto en peso</b>?`,
    correct: (d) => d.perfil_impacto_peso,
    pool: (all) => [...new Set(all.map((d) => d.perfil_impacto_peso).filter(Boolean))],
    label: (v) => v,
  },
  {
    id: "sexual",
    category: "Disfunción Sexual",
    icon: "💊",
    ask: (d) => `¿Cuál es el riesgo de <b>disfunción sexual</b>?`,
    correct: (d) => d.perfil_disfuncion_sexual,
    pool: (all) => [...new Set(all.map((d) => d.perfil_disfuncion_sexual).filter(Boolean))],
    label: (v) => v,
  },
  {
    id: "qt",
    category: "Riesgo QT",
    icon: "🫀",
    ask: (d) => `¿Cuál es el riesgo de <b>prolongación QT</b>?`,
    correct: (d) => d.riesgo_prolongacion_qt,
    pool: (all) => [...new Set(all.map((d) => d.riesgo_prolongacion_qt).filter(Boolean))],
    label: (v) => v,
  },
  {
    id: "abstinencia",
    category: "Abstinencia",
    icon: "🔴",
    ask: (d) => `¿Cuál es el riesgo de <b>síndrome de abstinencia</b>?`,
    correct: (d) => d.riesgo_sindrome_abstinencia,
    pool: (all) => [...new Set(all.map((d) => d.riesgo_sindrome_abstinencia).filter(Boolean))],
    label: (v) => v,
  },
];

/* ── Utilidades ─────────────────────────────────────────────────── */
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function starsFor(score, total) {
  const pct = score / total;
  if (pct >= 0.9) return "★★★★★";
  if (pct >= 0.7) return "★★★★☆";
  if (pct >= 0.5) return "★★★☆☆";
  if (pct >= 0.3) return "★★☆☆☆";
  return "★☆☆☆☆";
}

function buildQuestion(drug, allDrugs) {
  /* Intentar varias veces con template aleatorio hasta encontrar uno con datos */
  const shuffledTemplates = shuffle(TEMPLATES);
  for (const tmpl of shuffledTemplates) {
    const correct = tmpl.correct(drug);
    if (!correct || String(correct).trim() === "") continue;

    const pool = tmpl.pool(allDrugs).filter((v) => v !== correct);
    if (pool.length < 2) continue; // necesitamos al menos 2 distractores

    const distractors = shuffle(pool).slice(0, 3);
    const options = shuffle([correct, ...distractors]);

    return { drug, tmpl, correct, options };
  }
  return null; // no se pudo generar
}

function generateQuestions(allDrugs, count = 10) {
  const shuffledDrugs = shuffle(allDrugs);
  const questions = [];
  const usedDrugsIdxs = new Set();

  let attempts = 0;
  while (questions.length < count && attempts < count * 4) {
    const drugIdx = attempts % shuffledDrugs.length;
    const drug = shuffledDrugs[drugIdx];
    attempts++;

    const q = buildQuestion(drug, allDrugs);
    if (q) {
      questions.push(q);
    }
  }

  return questions.slice(0, count);
}

/* ── Render principal ────────────────────────────────────────────── */
export function renderQuiz(view) {
  const allDrugs = store.getState().data?.dataset?.farmacos ?? [];

  if (!allDrugs.length) {
    view.innerHTML = `<div class="quiz-view"><p class="quiz-loading">Cargando datos… ✦</p></div>`;
    return;
  }

  renderStart(view, allDrugs);
}

/* ── Pantalla Inicio ─────────────────────────────────────────────── */
function renderStart(view, allDrugs) {
  view.innerHTML = `
    <div class="quiz-view animate-fade-in">
      <div class="quiz-scanlines" aria-hidden="true"></div>

      <div class="quiz-container">
        <!-- Mascot -->
        <div class="quiz-mascot-wrap">
          <div class="quiz-mascot">ʕ •ᴥ•ʔ</div>
          <div class="quiz-stars-deco" aria-hidden="true">✦ ✧ ✦</div>
        </div>

        <!-- Title -->
        <h1 class="quiz-title">
          PHARMA<span class="quiz-title-accent">QUIZ</span>
        </h1>
        <p class="quiz-subtitle">✦ Repaso de Antidepresivos ✦</p>

        <!-- Info chips -->
        <div class="quiz-info-row">
          <span class="quiz-info-chip">🧠 10 preguntas</span>
          <span class="quiz-info-chip">⚡ Mecanismos &amp; Perfiles</span>
          <span class="quiz-info-chip">🏆 Racha de aciertos</span>
        </div>

        <!-- How-to -->
        <div class="quiz-howto-card">
          <p class="quiz-howto-text">
            Aparecerá el nombre del fármaco y deberás seleccionar<br>
            la opción <b>correcta</b> de entre las 4 disponibles.
          </p>
        </div>

        <!-- CTA -->
        <button class="quiz-btn quiz-btn--primary" id="btnStartQuiz">
          ▶ INICIAR JUEGO
        </button>

        <a href="#/list" class="quiz-link-back">← Volver al listado</a>
      </div>
    </div>
  `;

  view.querySelector("#btnStartQuiz")?.addEventListener("click", () => {
    Q = {
      questions: generateQuestions(allDrugs, 10),
      idx: 0,
      score: 0,
      streak: 0,
      maxStreak: 0,
      answered: false,
      selected: null,
      finished: false,
      total: 10,
    };
    if (!Q.questions.length) {
      view.querySelector(".quiz-container").innerHTML =
        `<p class="quiz-loading">Error generando preguntas. Recarga la página.</p>`;
      return;
    }
    renderQuestion(view);
  });
}

/* ── Pantalla Pregunta ───────────────────────────────────────────── */
function renderQuestion(view) {
  const q = Q.questions[Q.idx];
  if (!q) { renderResults(view); return; }

  const pct = Math.round((Q.idx / Q.total) * 100);
  const streakDisplay = Q.streak > 1 ? `✦×${Q.streak}` : "✦";
  const streakClass = Q.streak >= 3 ? "quiz-streak--hot" : "";

  view.innerHTML = `
    <div class="quiz-view animate-fade-in">
      <div class="quiz-scanlines" aria-hidden="true"></div>

      <div class="quiz-container">
        <!-- HUD -->
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

        <!-- Progress bar -->
        <div class="quiz-progress-track">
          <div class="quiz-progress-fill" style="width: ${pct}%"></div>
        </div>

        <!-- Drug card -->
        <div class="quiz-drug-card">
          <div class="quiz-drug-category">
            <span>${q.tmpl.icon}</span>
            <span>${escapeHtml(q.tmpl.category)}</span>
          </div>
          <div class="quiz-drug-name">${escapeHtml(q.drug.nombre_generico)}</div>
          <div class="quiz-drug-class text-muted">${escapeHtml(q.drug.clase_terapeutica ?? "")}</div>
          <div class="quiz-question-text">${q.tmpl.ask(q.drug)}</div>
        </div>

        <!-- Options -->
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

        <!-- Feedback (hidden initially) -->
        <div class="quiz-feedback" id="quizFeedback" aria-live="polite"></div>

        <!-- Next button (hidden initially) -->
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
  const nextBtn = view.querySelector("#btnNextQuestion");

  optionsGrid?.querySelectorAll(".quiz-option").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (Q.answered) return;
      Q.answered = true;
      Q.selected = btn.dataset.value;

      const isCorrect = Q.selected === q.correct;

      // Score & streak
      if (isCorrect) {
        const streakBonus = Math.max(0, Q.streak - 1) * 2;
        Q.score += 10 + streakBonus;
        Q.streak += 1;
        Q.maxStreak = Math.max(Q.maxStreak, Q.streak);
      } else {
        Q.streak = 0;
      }

      // Mark options
      optionsGrid.querySelectorAll(".quiz-option").forEach((b) => {
        b.disabled = true;
        if (b.dataset.value === q.correct) {
          b.classList.add("quiz-option--correct");
        } else if (b === btn && !isCorrect) {
          b.classList.add("quiz-option--wrong");
        }
      });

      // Feedback message
      if (feedback) {
        feedback.className = `quiz-feedback quiz-feedback--${isCorrect ? "ok" : "ko"}`;
        feedback.innerHTML = isCorrect
          ? `<span class="quiz-feedback-icon">✓</span> ¡Correcto! <b>+${10 + Math.max(0, Q.streak - 1) * 2} pts</b>${Q.streak > 2 ? ` <span class="quiz-combo">¡COMBO x${Q.streak}!</span>` : ""}`
          : `<span class="quiz-feedback-icon">✗</span> Incorrecto — Era: <b>${escapeHtml(q.tmpl.label(q.correct))}</b>`;
      }

      // Show next button
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

    if (Q.idx >= Q.total || Q.idx >= Q.questions.length) {
      renderResults(view);
    } else {
      renderQuestion(view);
    }
  });
}

/* ── Pantalla Resultados ─────────────────────────────────────────── */
function renderResults(view) {
  Q.finished = true;
  const pct = Math.round((Q.score / (Q.total * 10)) * 100);
  const stars = starsFor(Q.score, Q.total * 10);
  const mascotsMap = [
    [90, "ʕ ★ᴥ★ʔ", "¡Increíble, MaestroFarma!"],
    [70, "ʕ •ᴥ•ʔ", "¡Muy bien! Sigue así ✦"],
    [50, "ʕ ·ᴥ·ʔ", "Bien, pero puedes mejorar~"],
    [0, "ʕ •ᴥ• ʔ…", "¡Repasa y vuelve a intentarlo!"],
  ];
  const [, mascot, msg] = mascotsMap.find(([min]) => pct >= min);

  const allDrugs = store.getState().data?.dataset?.farmacos ?? [];

  view.innerHTML = `
    <div class="quiz-view animate-fade-in">
      <div class="quiz-scanlines" aria-hidden="true"></div>

      <div class="quiz-container">
        <!-- Mascot -->
        <div class="quiz-mascot-wrap">
          <div class="quiz-mascot quiz-mascot--result">${mascot}</div>
        </div>

        <h2 class="quiz-results-title">RESULTADOS</h2>

        <!-- Score board -->
        <div class="quiz-results-card">
          <div class="quiz-results-stars">${stars}</div>
          <div class="quiz-results-score">
            <span class="quiz-results-pts">${Q.score}</span>
            <span class="quiz-results-pts-label">/ ${Q.total * 10} pts</span>
          </div>
          <p class="quiz-results-msg">${msg}</p>

          <div class="quiz-results-stats">
            <div class="quiz-results-stat">
              <span class="quiz-results-stat-val">${Q.score / 10 | 0}</span>
              <span class="quiz-results-stat-label">Correctas</span>
            </div>
            <div class="quiz-results-stat">
              <span class="quiz-results-stat-val">${Q.total - (Q.score / 10 | 0)}</span>
              <span class="quiz-results-stat-label">Incorrectas</span>
            </div>
            <div class="quiz-results-stat">
              <span class="quiz-results-stat-val">✦×${Q.maxStreak}</span>
              <span class="quiz-results-stat-label">Racha máx.</span>
            </div>
          </div>
        </div>

        <!-- Actions -->
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
    Q = {
      questions: generateQuestions(allDrugs, 10),
      idx: 0,
      score: 0,
      streak: 0,
      maxStreak: 0,
      answered: false,
      selected: null,
      finished: false,
      total: 10,
    };
    renderQuestion(view);
  });
}
