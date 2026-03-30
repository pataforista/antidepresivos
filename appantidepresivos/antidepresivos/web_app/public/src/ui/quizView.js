/* ============================================================
   src/ui/quizView.js
   PharmaQuiz — Juego de repaso de Antidepresivos
   v2: Modos / Perlas Clínicas / Revisión Final / Anti-ambigüedad
   ============================================================ */

import { store } from "../core/store.js";
import { escapeHtml } from "../core/utils.js";
import { i18n } from "../core/i18n.js";

/* ── Estado del juego ──────────────────────────────────────── */
let Q = {
  questions: [], idx: 0, score: 0, streak: 0, maxStreak: 0,
  answered: false, selected: null, finished: false, total: 10,
  mode: "residente", wrong: [], // track incorrect for review
};

/* ── Modos de juego ─────────────────────────────────────────── */
const getModes = () => ({
  residente: {
    id: "residente",
    label: i18n.t("quiz_mode_residente"),
    icon: "🩺",
    desc: i18n.t("quiz_mode_residente_desc"),
    color: "#00e5ff",
    templateIds: ["clase", "mecanismo", "sedacion", "peso", "sexual", "utilidad"],
    count: 10,
  },
  especialista: {
    id: "especialista",
    label: i18n.t("quiz_mode_especialista"),
    icon: "🧬",
    desc: i18n.t("quiz_mode_especialista_desc"),
    color: "#c084fc",
    templateIds: ["clase", "mecanismo", "sedacion", "peso", "sexual", "utilidad", "enzima", "interacciones", "abstinencia", "qt"],
    count: 12,
  },
  clinico: {
    id: "clinico",
    label: i18n.t("quiz_mode_clinico"),
    icon: "🏥",
    desc: i18n.t("quiz_mode_clinico_desc"),
    color: "#ff6eb4",
    templateIds: ["utilidad_inversa", "clase", "mecanismo", "sexual", "peso", "interacciones"],
    count: 10,
  },
});

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

const getSedationLabels = () => ({
  "0": i18n.getLocale() === 'en' ? "None (no sedation)" : "Nulo (sin sedación)",
  "1": i18n.t("low") || (i18n.getLocale() === 'en' ? "Low" : "Leve"),
  "2": i18n.t("moderate") || (i18n.getLocale() === 'en' ? "Moderate" : "Moderado"),
  "3": i18n.t("high") || (i18n.getLocale() === 'en' ? "High / Very sedating" : "Alto / Muy sedante"),
});

/* ── Templates de preguntas ─────────────────────────────────── */
// PRINCIPIO ANTI-AMBIGÜEDAD:
// - Solo usar campos donde los valores sean claramente distintos entre sí.
// - pool() filtra valores inválidos/duplicados y debe tener ≥4 opciones únicas.
// - Las preguntas indican claramente QUÉ se pide.

const TEMPLATES = [
  {
    id: "clase",
    category: i18n.getLocale() === 'en' ? "Classification" : "Clasificación",
    icon: "🏷️",
    difficulty: ["residente", "especialista", "clinico"],
    ask: () => i18n.t("quiz_question_class"),
    correct: (d) => d.clase_terapeutica,
    pool: (all) => [...new Set(all.map(d => d.clase_terapeutica).filter(isValid))],
    label: (v) => shortStr(v, 60),
    validate: (d) => isValid(d.clase_terapeutica),
  },
  {
    id: "mecanismo",
    category: i18n.getLocale() === 'en' ? "Mechanism" : "Mecanismo de Acción",
    icon: "⚙️",
    difficulty: ["residente", "especialista", "clinico"],
    ask: () => i18n.t("quiz_question_mech"),
    correct: (d) => d.mecanismo_principal,
    pool: (all) => [...new Set(all.map(d => d.mecanismo_principal).filter(isValid))],
    label: (v) => shortStr(v, 70),
    validate: (d) => isValid(d.mecanismo_principal),
  },
  {
    id: "sedacion",
    category: i18n.getLocale() === 'en' ? "Sedation" : "Perfil de Sedación",
    icon: "😴",
    difficulty: ["residente", "especialista"],
    ask: () => i18n.t("quiz_question_sedation"),
    correct: (d) => String(d.nivel_sedacion ?? ""),
    pool: () => ["0", "1", "2", "3"],
    label: (v) => getSedationLabels()[v] ?? v,
    validate: (d) => isValid(d.nivel_sedacion) && ["0","1","2","3"].includes(String(d.nivel_sedacion)),
  },
  {
    id: "peso",
    category: i18n.getLocale() === 'en' ? "Weight" : "Impacto en Peso",
    icon: "⚖️",
    difficulty: ["residente", "especialista"],
    ask: () => i18n.t("quiz_question_weight"),
    correct: (d) => d.perfil_impacto_peso,
    pool: (all) => [...new Set(all.map(d => d.perfil_impacto_peso).filter(isValid))],
    label: (v) => v,
    validate: (d) => isValid(d.perfil_impacto_peso),
  },
  {
    id: "sexual",
    category: i18n.getLocale() === 'en' ? "Sexual dysfunction" : "Disfunción Sexual",
    icon: "💊",
    difficulty: ["residente", "especialista", "clinico"],
    ask: () => i18n.t("quiz_question_sexual"),
    correct: (d) => d.perfil_disfuncion_sexual,
    pool: (all) => [...new Set(all.map(d => d.perfil_disfuncion_sexual).filter(isValid))],
    label: (v) => v,
    validate: (d) => isValid(d.perfil_disfuncion_sexual),
  },
  {
    id: "utilidad",
    category: i18n.getLocale() === 'en' ? "Clinical Utility" : "Utilidad Clínica",
    icon: "🎯",
    difficulty: ["residente", "especialista", "clinico"],
    ask: () => i18n.t("quiz_question_utility"),
    correct: (d) => d.utilidad_sintomatica_clave,
    pool: (all) => [...new Set(all.map(d => d.utilidad_sintomatica_clave).filter(isValid))],
    label: (v) => shortStr(v, 70),
    validate: (d) => isValid(d.utilidad_sintomatica_clave),
  },
  {
    id: "enzima",
    category: i18n.getLocale() === 'en' ? "Metabolism" : "Metabolismo Enzimático",
    icon: "🧪",
    difficulty: ["especialista"],
    ask: () => i18n.t("quiz_question_enzime"),
    correct: (d) => d.sustrato_enzimatico_principal,
    pool: (all) => [...new Set(all.map(d => d.sustrato_enzimatico_principal).filter(isValid))],
    label: (v) => shortStr(v, 60),
    validate: (d) => isValid(d.sustrato_enzimatico_principal),
  },
  {
    id: "interacciones",
    category: i18n.getLocale() === 'en' ? "Interactions" : "Interacciones Peligrosas",
    icon: "⚠️",
    difficulty: ["especialista", "clinico"],
    ask: () => i18n.t("quiz_question_interact"),
    correct: (d) => d.interacciones_contraindicadas,
    pool: (all) => [...new Set(all.map(d => d.interacciones_contraindicadas).filter(isValid))],
    label: (v) => shortStr(v, 70),
    validate: (d) => isValid(d.interacciones_contraindicadas) && d.interacciones_contraindicadas.length > 5,
  },
  {
    id: "abstinencia",
    category: i18n.getLocale() === 'en' ? "Withdrawal" : "Síndrome de Abstinencia",
    icon: "🔴",
    difficulty: ["especialista"],
    ask: () => i18n.t("quiz_question_withdrawal"),
    correct: (d) => d.riesgo_sindrome_abstinencia,
    pool: (all) => [...new Set(all.map(d => d.riesgo_sindrome_abstinencia).filter(isValid))],
    label: (v) => v,
    validate: (d) => isValid(d.riesgo_sindrome_abstinencia),
  },
  {
    id: "qt",
    category: i18n.getLocale() === 'en' ? "QT Risk" : "Riesgo QT",
    icon: "💓",
    difficulty: ["especialista"],
    ask: () => i18n.t("quiz_question_qt"),
    correct: (d) => d.riesgo_prolongacion_qt,
    pool: (all) => [...new Set(all.map(d => d.riesgo_prolongacion_qt).filter(isValid))],
    label: (v) => v,
    validate: (d) => isValid(d.riesgo_prolongacion_qt),
  },
  // MODO CLÍNICO: pregunta invertida — se da la utilidad, se elige el fármaco.
  {
    id: "utilidad_inversa",
    category: i18n.getLocale() === 'en' ? "Clinical Round" : "Ronda Clínica",
    icon: "🏥",
    difficulty: ["clinico"],
    // ask() and correct() are set dynamically in buildClinicalQuestion
    ask: (d, ctx) => ctx?.question ?? (i18n.getLocale() === 'en' ? `Which drug would you choose for <b>${escapeHtml(d.utilidad_sintomatica_clave)}</b>?` : `¿Qué fármaco elegirías para <b>${escapeHtml(d.utilidad_sintomatica_clave)}</b>?`),
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
  if (pct >= 0.9) return { stars: "★★★★★", label: i18n.t("quiz_excellent"), emoji: "🏆" };
  if (pct >= 0.7) return { stars: "★★★★☆", label: i18n.t("quiz_very_good"), emoji: "🎓" };
  if (pct >= 0.5) return { stars: "★★★☆☆", label: i18n.t("quiz_good"), emoji: "📚" };
  if (pct >= 0.3) return { stars: "★★☆☆☆", label: i18n.t("quiz_study_more"), emoji: "📖" };
  return { stars: "★☆☆☆☆", label: i18n.t("quiz_at_study"), emoji: "😅" };
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
  const MODES = getModes();
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
    view.innerHTML = `<div class="quiz-view"><p class="quiz-loading">${i18n.t("quiz_loading")}</p></div>`;
    return;
  }
  renderStart(view, allDrugs);
}

/* ── Pantalla Inicio ─────────────────────────────────────────── */
function renderStart(view, allDrugs) {
  const MODES = getModes();
  view.innerHTML = `
    <div class="quiz-view animate-fade-in">
      <div class="quiz-scanlines" aria-hidden="true"></div>
      <div class="quiz-container">
        <div class="quiz-mascot-wrap">
          <div class="quiz-mascot">ʕ •ᴥ•ʔ</div>
          <div class="quiz-stars-deco" aria-hidden="true">✦ ✧ ✦</div>
        </div>
        <h1 class="quiz-title">${i18n.t("quiz_title").slice(0,6)}<span class="quiz-title-accent">${i18n.t("quiz_title").slice(6)}</span></h1>
        <p class="quiz-subtitle">${i18n.t("quiz_subtitle")}</p>
 
        <p class="quiz-mode-title">${i18n.t("quiz_select_level")}</p>
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
              <span class="quiz-mode-count">${i18n.t("quiz_questions_count").replace("{count}", m.count)}</span>
            </button>
          `).join("")}
        </div>
 
        <button class="quiz-btn quiz-btn--primary" id="btnStartQuiz">
          ${i18n.t("quiz_start_btn")}
        </button>
        <a href="#/list" class="quiz-link-back">← ${i18n.t("btn_back")} ${i18n.t("btn_list")}</a>
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
        `<p class="quiz-loading">${i18n.getLocale() === 'en' ? "Error generating questions. Reload page." : "Error generando preguntas. Recarga la página."}</p>`;
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
  const MODES = getModes();
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
      <span>${i18n.t("quiz_mode_clinico")}</span>
    </div>
    <div class="quiz-clinical-scenario">
      <p class="quiz-clinical-prompt">${i18n.t("quiz_clinical_scenario_p")}</p>
      <p class="quiz-clinical-need">${escapeHtml(q.clinicalPrompt)}</p>
      <p class="quiz-question-text" style="border-top:none;padding-top:0.5rem;">${i18n.t("quiz_clinical_scenario_q")}</p>
    </div>
  `;

  view.innerHTML = `
    <div class="quiz-view animate-fade-in">
      <div class="quiz-scanlines" aria-hidden="true"></div>
      <div class="quiz-container">
        <div class="quiz-hud">
          <div class="quiz-hud-left">
            <span class="quiz-score-badge">⭐ ${Q.score} ${i18n.t("quiz_score")}</span>
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
          ${Q.idx + 1 >= Q.total ? i18n.t("quiz_see_results") : i18n.t("quiz_next")}
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
          ? `<span class="quiz-feedback-icon">✓</span> ${i18n.t("quiz_correct")} <b>+${bonus} ${i18n.t("quiz_score")}</b>${Q.streak > 2 ? ` <span class="quiz-combo">🔥 ${i18n.t("quiz_combo")} ×${Q.streak}</span>` : ""}`
          : `<span class="quiz-feedback-icon">✗</span> ${i18n.t("quiz_era")} <b>${escapeHtml(q.tmpl.label(q.correct))}</b>`;
      }

      // Pearl card — shown after every answer for learning
      if (pearlCard && q.pearl) {
        pearlCard.classList.remove("quiz-hidden");
        pearlCard.innerHTML = `
          <div class="quiz-pearl-header">
            <span class="quiz-pearl-icon">💎</span>
            <span class="quiz-pearl-label">${i18n.t("clinical_pearl")}</span>
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
  const MODES = getModes();
  const modeConfig = MODES[Q.mode];

  // Review section for wrong answers
  const reviewHTML = Q.wrong.length ? `
    <div class="quiz-review-section">
      <h3 class="quiz-review-title">📋 ${i18n.t("quiz_review_title").replace("{count}", Q.wrong.length)}</h3>
      <div class="quiz-review-list">
        ${Q.wrong.map(w => `
          <div class="quiz-review-item">
            <div class="quiz-review-drug">${escapeHtml(w.drug)}</div>
            <div class="quiz-review-category">${escapeHtml(w.category)}</div>
            <div class="quiz-review-row">
              <span class="quiz-review-wrong-label">${i18n.t("quiz_your_answer")}</span>
              <span class="quiz-review-wrong">${escapeHtml(w.selected)}</span>
            </div>
            <div class="quiz-review-row">
              <span class="quiz-review-correct-label">${i18n.t("quiz_correct_label")}</span>
              <span class="quiz-review-correct">${escapeHtml(w.correct)}</span>
            </div>
            ${w.pearl ? `<div class="quiz-review-pearl">💎 ${escapeHtml(w.pearl).slice(0, 150)}…</div>` : ""}
          </div>
        `).join("")}
      </div>
    </div>
  ` : `
    <div class="quiz-review-section" style="text-align:center; padding:1rem;">
      <p style="color: #34d399; font-weight:700; font-size:1.1rem;">${i18n.t("quiz_no_errors")}</p>
    </div>
  `;

  view.innerHTML = `
    <div class="quiz-view animate-fade-in">
      <div class="quiz-scanlines" aria-hidden="true"></div>
      <div class="quiz-container">
        <div class="quiz-mascot-wrap">
          <div class="quiz-mascot quiz-mascot--result">${emoji}</div>
        </div>
        <h2 class="quiz-results-title">${i18n.t("quiz_results")}</h2>
        <div class="quiz-results-card">
          <div class="quiz-results-stars">${stars}</div>
          <div class="quiz-results-score">
            <span class="quiz-results-pts">${Q.score}</span>
            <span class="quiz-results-pts-label">/ ${maxScore}+ ${i18n.t("quiz_score")}</span>
          </div>
          <p class="quiz-results-msg">${label} — ${i18n.getLocale() === 'en' ? 'Mode' : 'Modo'} ${modeConfig.label}</p>
          <div class="quiz-results-stats">
            <div class="quiz-results-stat">
              <span class="quiz-results-stat-val" style="color:#34d399">${correctCount}</span>
              <span class="quiz-results-stat-label">${i18n.t("quiz_correct_stat")}</span>
            </div>
            <div class="quiz-results-stat">
              <span class="quiz-results-stat-val" style="color:#f87171">${Q.wrong.length}</span>
              <span class="quiz-results-stat-label">${i18n.t("quiz_incorrect_stat")}</span>
            </div>
            <div class="quiz-results-stat">
              <span class="quiz-results-stat-val" style="color:var(--quiz-neon-purp)">🔥×${Q.maxStreak}</span>
              <span class="quiz-results-stat-label">${i18n.t("quiz_streak_stat")}</span>
            </div>
          </div>
        </div>

        ${reviewHTML}

        ${Q.score >= 1000 ? `
          <div id="guruCertificate" style="display:none; padding:40px; background:white; color:#111; font-family:'Outfit',sans-serif; border:10px double #4f46e5; text-align:center; position:relative;">
            <div style="font-size:1.5rem; letter-spacing:4px; color:#4f46e5; font-weight:800; margin-bottom:20px;">${i18n.getLocale() === 'en' ? 'EXPERT CERTIFICATE' : 'CERTIFICADO DE EXPERTO'}</div>
            <div style="font-size:0.9rem; text-transform:uppercase; margin-bottom:10px;">${i18n.getLocale() === 'en' ? 'Antidepressants 2026 recognizes:' : 'Antidepresivos 2026 reconoce a:'}</div>
            <div style="font-size:2.5rem; font-weight:900; color:#111; border-bottom:2px solid #ddd; display:inline-block; padding:0 40px 5px; margin-bottom:24px;">${i18n.getLocale() === 'en' ? 'PSYCHOPHARMACOLOGY GURU' : 'GURU DE LA PSICOFARMACOLOGÍA'}</div>
            <div style="font-size:1rem; line-height:1.6; max-width:500px; margin:0 auto 30px;">
              ${i18n.getLocale() === 'en' ? `For achieving a score of <b>${Q.score} Points</b> in the professional PharmaQuiz level, demonstrating exceptional knowledge in clinical antidepressants mechanism and safety.` : `Por haber alcanzado un puntaje de <b>${Q.score} Puntos</b> en el modo PhamaQuiz de nivel profesional, demostrando un conocimiento excepcional en clases, mecanismos y seguridad clínica de antidepresivos.`}
            </div>
            <div style="display:flex; justify-content:space-between; align-items:flex-end; padding:0 40px;">
              <div style="text-align:left;">
                <div style="font-weight:800; font-size:1.1rem;">${i18n.getLocale() === 'en' ? '2026 Edition' : 'Edición 2026'}</div>
                <div style="font-size:0.8rem; color:#666;">${i18n.getLocale() === 'en' ? 'Smart Clinical Support' : 'Soporte Clínico Inteligente'}</div>
              </div>
              <div style="text-align:right; font-family:monospace; font-size:0.7rem; color:#999;">
                HASH_VAL: ${Math.random().toString(36).substr(2, 9).toUpperCase()}
              </div>
            </div>
          </div>
          <div class="alert alert--success animate-bounce" style="margin-bottom:24px; text-align:center;">
            <div style="font-size:1.5rem; margin-bottom:8px;">🏆 ${i18n.getLocale() === 'en' ? 'GURU LEVEL REACHED!' : '¡NIVEL GURU ALCANZADO!'} 🏆</div>
            <p class="text-sm">${i18n.t("quiz_guru_unlocked")}</p>
            <button id="btnDownloadCert" class="btn btn--primary" style="margin-top:12px; background:var(--quiz-neon-purp); border:none; box-shadow:var(--quiz-glow-md);">
              ${i18n.t("quiz_download_cert")}
            </button>
          </div>
        ` : ""}

        <div class="quiz-results-actions">
          <button class="quiz-btn quiz-btn--primary" id="btnPlayAgain">
            ${i18n.t("quiz_play_again")}
          </button>
          <a href="#/list" class="quiz-btn quiz-btn--ghost">
            ← ${i18n.t("btn_back")} ${i18n.t("btn_list")}
          </a>
        </div>
      </div>
    </div>
  `;

  view.querySelector("#btnPlayAgain")?.addEventListener("click", () => {
    renderStart(view, allDrugs);
  });

  // Certificate download logic
  view.querySelector("#btnDownloadCert")?.addEventListener("click", () => {
    const cert = view.querySelector("#guruCertificate");
    cert.style.display = "block";
    
    const opt = {
      margin: 10,
      filename: `Certificado_Guru_Antidepresivos_2026.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 3 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
    };

    html2pdf().set(opt).from(cert).save().then(() => {
      cert.style.display = "none";
      window.appAnalytics?.track('certificate_download', { score: Q.score });
    });
  });
}
