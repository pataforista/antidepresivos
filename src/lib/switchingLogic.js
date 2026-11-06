// src/lib/switchingLogic.js
/**
 * Lógica clínica central para transición (switching) entre antidepresivos.
 * Basado en guías clínicas (NHS SPS, Maudsley, CANMAT, Keks et al., FDA).
 */

export function isMAOI(drug) {
  const cls = (drug?.clase_terapeutica || '').toLowerCase();
  const name = (drug?.nombre_generico || '').toLowerCase();
  return cls.includes('imao') || cls.includes('maoi') || name.includes('moclobemida') || name.includes('moclobemide') || name.includes('selegilina') || name.includes('selegiline') || name.includes('tranilcipromina') || name.includes('fenelzina');
}

export function isRIMA(drug) {
  const cls = (drug?.clase_terapeutica || '').toLowerCase();
  const name = (drug?.nombre_generico || '').toLowerCase();
  return name.includes('moclobemida') || name.includes('moclobemide') || cls.includes('rima');
}

export function isIrreversibleMAOI(drug) {
  return isMAOI(drug) && !isRIMA(drug);
}

export function isFluoxetine(drug) {
  const name = (drug?.nombre_generico || '').toLowerCase();
  return name.includes('fluoxetina') || name.includes('fluoxetine');
}

export function isVortioxetine(drug) {
  const name = (drug?.nombre_generico || '').toLowerCase();
  return name.includes('vortioxetina') || name.includes('vortioxetine');
}

export function isClomipramine(drug) {
  const name = (drug?.nombre_generico || '').toLowerCase();
  return name.includes('clomipramina') || name.includes('clomipramine');
}

export function isSelegiline(drug) {
  const name = (drug?.nombre_generico || '').toLowerCase();
  return name.includes('selegilina') || name.includes('selegiline');
}

export function isSSRI(drug) {
  const cls = (drug?.clase_terapeutica || '').toLowerCase();
  return cls.includes('isrs') || cls.includes('ssri');
}

export function isSNRI(drug) {
  const cls = (drug?.clase_terapeutica || '').toLowerCase();
  return cls.includes('irsn') || cls.includes('snri') || cls.includes('dual');
}

export function isTCA(drug) {
  const cls = (drug?.clase_terapeutica || '').toLowerCase();
  return cls.includes('tricíclico') || cls.includes('triciclico') || cls.includes('tca') || cls.includes('tricyclic');
}

export function isNonSwitchable(drug) {
  if (!drug) return false;
  const id = drug.id_farmaco || '';
  if (id.startsWith('ADP_AUG_') || id.startsWith('ADP_RAPID_')) return true;
  const name = (drug.nombre_generico || '').toLowerCase();
  return /litio|lithium|aripiprazol|aripiprazole|quetiapina|quetiapine|brexpiprazol|brexpiprazole|liotironina|liothyronine|modafinil|lisdexanfetamina|lisdexamfetamine|ketamina|ketamine|esketamina|esketamine|brexanolon|zuranolon/.test(name);
}

/**
 * Calcula el protocolo de switching seguro entre dos fármacos.
 * Retorna { strategy, taper_days, washout_days, isHighRisk, desc, rationale, notes, source }
 */
export function computeSwitchProtocol(fromDrug, toDrug, matrix = [], locale = 'es') {
  const isEn = locale === 'en';

  if (!fromDrug || !toDrug) {
    return null;
  }

  // 1. Agentes especiales no intercambiables
  if (isNonSwitchable(fromDrug) || isNonSwitchable(toDrug)) {
    const target = isNonSwitchable(fromDrug) ? fromDrug : toDrug;
    const name = target.nombre_generico || (isEn ? 'This drug' : 'Este fármaco');
    return {
      strategy: 'not_applicable',
      taper_days: 0,
      washout_days: 0,
      isHighRisk: true,
      source: 'clinical_restriction',
      desc: isEn
        ? `${name} is an augmenting agent or an acute/infusion therapy; cross-tapering is not applicable.`
        : `${name} es un agente de potenciación o un esquema agudo/de infusión; no debe usarse el módulo de cross-tapering.`,
      rationale: isEn
        ? "Augmenting drugs are added to baseline therapy, and rapid-acting agents have specific clinical protocols."
        : "Los fármacos coadyuvantes se añaden al tratamiento existente y los de acción rápida siguen protocolos especializados independientes.",
      notes: [
        isEn
          ? `${name} is an augmenting agent or acute/infusion therapy; do NOT use the cross-tapering module to substitute current therapy. It should be added to existing treatment or follow an independent specialized plan.`
          : `${name} es un agente de potenciación o un esquema agudo/de infusión; NO debe usarse el módulo de cross-tapering para sustituir el antidepresivo actual. Se añade al tratamiento existente o requiere un plan especializado independiente.`
      ]
    };
  }

  // 2. Revisar si existe un par curado en la matriz
  const fromName = (fromDrug.nombre_generico || '').toLowerCase();
  const toName = (toDrug.nombre_generico || '').toLowerCase();

  const curated = matrix.find(m =>
    m.from.toLowerCase() === fromName &&
    m.to.toLowerCase() === toName
  );

  if (curated) {
    const isMaoiContraindication = Array.isArray(curated.contraindications) &&
      curated.contraindications.some(c => /imao|maoi/i.test(c));

    return {
      strategy: curated.strategy,
      taper_days: curated.taper_days || 0,
      washout_days: curated.washout_days || 0,
      isHighRisk: isMaoiContraindication,
      source: 'matrix',
      desc: isEn
        ? `Curated guideline protocol: ${curated.taper_days || 0} days reduction, ${curated.washout_days || 0} days washout.`
        : `Protocolo curado por guías: ${curated.taper_days || 0} días de reducción, ${curated.washout_days || 0} días de lavado.`,
      rationale: isEn
        ? "Protocol verified in international clinical guidelines (Maudsley, CANMAT, NICE)."
        : "Protocolo verificado en guías clínicas internacionales (Maudsley, CANMAT, NICE).",
      notes: curated.notes || []
    };
  }

  // 3. Reglas clínicas basadas en evidencia (Fallback)

  // Caso 3.1: Moclobemida (RIMA) de origen (Moclobemida -> cualquier serotoninérgico)
  if (isRIMA(fromDrug)) {
    return {
      strategy: 'washout',
      taper_days: 0,
      washout_days: 1,
      isHighRisk: false,
      source: 'clinical_rule',
      desc: isEn
        ? "Requires gradually stopping moclobemide and a 24-hour drug-free washout before starting the new antidepressant. Cross-tapering is contraindicated."
        : "Requiere retirar moclobemida gradualmente y esperar un lavado de 24 horas antes de iniciar el nuevo antidepresivo. La reducción cruzada está contraindicada.",
      rationale: isEn
        ? "Moclobemide is a reversible inhibitor of MAO-A (RIMA) with a short half-life (1–4 h). Enzymatic function recovers rapidly, allowing transition after 24 hours without cross-tapering."
        : "Moclobemida es un inhibidor reversible de la MAO-A (RIMA) con semivida corta (1–4 h). La actividad enzimática se recupera rápidamente, permitiendo la rotación tras 24 horas sin reducción cruzada.",
      notes: [
        isEn
          ? "Moclobemide → Serotonergic antidepressant: Wait 24 hours after discontinuation before starting the new drug (NHS Specialist Pharmacy Service, PsychDB)."
          : "Moclobemida → Antidepresivo serotoninérgico: Esperar 24 horas tras suspender antes de iniciar el nuevo fármaco (NHS Specialist Pharmacy Service, PsychDB).",
        isEn
          ? "Do NOT cross-taper: concurrent administration causes risk of serotonin syndrome."
          : "NO realizar reducción cruzada: la administración concurrente acarrea riesgo de síndrome serotoninérgico."
      ]
    };
  }

  // Caso 3.2: Entrada a Moclobemida (Cualquier serotoninérgico -> Moclobemida)
  if (isRIMA(toDrug)) {
    const isFluox = isFluoxetine(fromDrug);
    const washoutDays = isFluox ? 35 : 14;
    return {
      strategy: 'washout',
      taper_days: 0,
      washout_days: washoutDays,
      isHighRisk: true,
      source: 'clinical_rule',
      desc: isEn
        ? (isFluox
            ? "Requires a 5-week (35 days) drug-free washout period due to long norfluoxetine half-life."
            : "Requires a strict drug-free washout period of at least 14 days before starting moclobemide.")
        : (isFluox
            ? "Requiere un periodo de lavado libre de fármaco de 5 semanas (35 días) por la vida media prolongada de la norfluoxetina."
            : "Requiere un periodo de lavado estricto de al menos 14 días antes de iniciar moclobemida."),
      rationale: isEn
        ? "Transitioning to any MAO inhibitor (including RIMA) requires clearing circulating serotonin reuptake inhibitors to avoid serotonin toxicity."
        : "La transición hacia cualquier inhibidor de la MAO (incluyendo RIMA) exige eliminar los fármacos serotoninérgicos previos para prevenir el síndrome serotoninérgico.",
      notes: [
        isEn
          ? `Strict washout of ${washoutDays} days required before starting moclobemide.`
          : `Lavado estricto de ${washoutDays} días requerido antes de iniciar moclobemida.`,
        isEn
          ? "Monitor closely for emerging depressive symptoms or withdrawal during washout."
          : "Vigilar estrechamente la reaparición de síntomas depresivos o de discontinuación durante el lavado."
      ]
    };
  }

  // Caso 3.3: Involucra IMAO irreversible (Fenelzina, Tranilcipromina, Selegilina, etc.)
  if (isIrreversibleMAOI(fromDrug) || isIrreversibleMAOI(toDrug)) {
    let washoutDays = 14;
    const notes = [];

    if (isFluoxetine(fromDrug) && isIrreversibleMAOI(toDrug)) {
      washoutDays = 35;
      notes.push(
        isEn
          ? "Fluoxetine → MAOI: a 5-week (35-day) washout is MANDATORY due to the long half-life of norfluoxetine (~7–15 days)."
          : "Fluoxetina → IMAO: el lavado obligatorio es de 5 semanas (35 días) por la vida media prolongada de la norfluoxetina (~7–15 días)."
      );
    } else if (isVortioxetine(fromDrug) && isIrreversibleMAOI(toDrug)) {
      washoutDays = 21;
      notes.push(
        isEn
          ? "Vortioxetine → MAOI: at least 21 days (3 weeks) must elapse after stopping vortioxetine before starting an MAOI (FDA labeling, half-life ~66 h)."
          : "Vortioxetina → IMAO: deben transcurrir al menos 21 días (3 semanas) tras suspender vortioxetina antes de iniciar un IMAO (Ficha técnica FDA, semivida ~66 h)."
      );
    } else {
      notes.push(
        isEn
          ? "GOLDEN RULE: 14 mandatory waiting days to avoid hypertensive or serotonergic crises."
          : "REGLA DE ORO: 14 días de espera obligatorios para evitar crisis hipertensivas o serotoninérgicas."
      );
    }

    if (isClomipramine(fromDrug) && isIrreversibleMAOI(toDrug)) {
      notes.push(
        isEn
          ? "Clomipramine → MAOI: FDA label states 14 days, but clinical guidelines (NHS, Keks et al.) recommend considering 21 days; individualize carefully."
          : "Clomipramina → IMAO: Ficha técnica indica 14 días, pero guías clínicas (NHS, Keks et al.) recomiendan considerar 21 días; individualizar cuidadosamente."
      );
    }

    if (isSelegiline(fromDrug)) {
      notes.push(
        isEn
          ? "Selegiline patch: with 9 mg or 12 mg doses, maintain dietary tyramine restrictions for 2 weeks after stopping."
          : "Selegilina parche: con dosis de 9 mg o 12 mg, mantener la restricción dietética de tiramina durante 2 semanas tras la suspensión."
      );
    }

    return {
      strategy: 'washout',
      taper_days: 0,
      washout_days: washoutDays,
      isHighRisk: true,
      source: 'clinical_rule',
      desc: isEn
        ? `Requires a strict drug-free period of ${washoutDays} days.`
        : `Requiere un periodo libre de fármaco de ${washoutDays} días.`,
      rationale: isEn
        ? "Irreversible MAOIs require a strict washout to permit synthesis of new MAO enzymes and prevent fatal serotonin syndrome or hypertensive crises."
        : "Los IMAO irreversibles requieren un lavado estricto para permitir la síntesis de nuevas enzimas MAO y prevenir el síndrome serotoninérgico o crisis hipertensivas.",
      notes
    };
  }

  // Caso 3.4: Salida de Fluoxetina hacia antidepresivo NO-IMAO
  if (isFluoxetine(fromDrug)) {
    return {
      strategy: 'fluoxetine_switch',
      taper_days: 0,
      washout_days: 7,
      isHighRisk: false,
      source: 'clinical_rule',
      desc: isEn
        ? "Fluoxetine has an exceptionally long half-life. Stop fluoxetine, wait 7 days, then initiate new drug at the lowest therapeutic dose."
        : "Fluoxetina tiene una semivida excepcionalmente larga. Suspender fluoxetina, esperar 7 días e iniciar el nuevo fármaco a dosis terapéutica baja.",
      rationale: isEn
        ? "Because active metabolite norfluoxetine and CYP2D6 inhibition persist for weeks, initiating the next antidepressant at low doses after a 7-day interval minimizes cumulative serotonergic and metabolic toxicity."
        : "Dado que el metabolito activo norfluoxetina y la inhibición de CYP2D6 persisten semanas, iniciar el siguiente fármaco a dosis baja tras un intervalo de 7 días minimiza la toxicidad serotoninérgica y metabólica acumulativa.",
      notes: [
        isEn
          ? "Norfluoxetine active metabolite half-life is 7–15 days; CYP2D6 inhibition persists for several weeks."
          : "La semivida de la norfluoxetina es de 7–15 días; la inhibición de CYP2D6 persiste varias semanas.",
        isEn
          ? "Start the new antidepressant at low doses and titrate slowly (Keks et al., Aust Prescr 2016)."
          : "Iniciar el nuevo antidepresivo a dosis bajas y titular lentamente (Keks et al., Aust Prescr 2016).",
        isEn
          ? "If switching to TCA or CYP2D6-dependent drugs, monitor drug levels and anticholinergic/cardiac side effects."
          : "Si se rota a ATC o fármacos dependientes de CYP2D6, monitorizar niveles plasmáticos y efectos anticolinérgicos/cardíacos."
      ]
    };
  }

  // Caso 3.5: ISRS <-> IRSN
  if ((isSSRI(fromDrug) && isSNRI(toDrug)) || (isSNRI(fromDrug) && isSSRI(toDrug))) {
    return {
      strategy: 'cross_taper',
      taper_days: 14,
      washout_days: 0,
      isHighRisk: false,
      source: 'clinical_rule',
      desc: isEn
        ? "Standard cross-taper: reduce current medication while gradually introducing the new SNRI/SSRI."
        : "Reducción cruzada estándar: reducir el fármaco actual mientras se introduce gradualmente el nuevo IRSN/ISRS.",
      rationale: isEn
        ? "Switching between SSRI and SNRI usually allows cross-tapering as they share mechanisms, but monitor for cumulative serotonergic effects."
        : "El cambio entre ISRS e IRSN suele permitir una reducción cruzada ya que comparten mecanismos, pero vigile efectos serotoninérgicos acumulativos.",
      notes: [
        isEn ? "Monitor for discontinuation symptoms." : "Vigilar síntomas de discontinuación.",
        isEn ? "Titrate new drug based on clinical tolerance." : "Titular el nuevo fármaco según tolerancia clínica.",
        isEn ? "Monitor for cumulative serotonergic or adrenergic effects." : "Monitorizar efectos serotoninérgicos o adrenérgicos acumulativos."
      ]
    };
  }

  // Caso 3.6: Fallback estándar entre antidepresivos convencionales
  return {
    strategy: 'cross_taper',
    taper_days: 14,
    washout_days: 0,
    isHighRisk: false,
    source: 'fallback',
    desc: isEn
      ? "Standard strategy: decrease current drug while introducing new one at low doses."
      : "Estrategia estándar: disminuir el fármaco actual mientras se introduce el nuevo a dosis bajas.",
    rationale: isEn
      ? "A standard cross-taper minimizes withdrawal symptoms while allowing the new medication to reach therapeutic levels."
      : "Una reducción cruzada estándar minimiza los síntomas de abstinencia mientras permite que el nuevo medicamento alcance niveles terapéuticos.",
    notes: [
      isEn ? "Monitor for discontinuation symptoms." : "Vigilar síntomas de discontinuación.",
      isEn ? "Titrate new drug based on clinical tolerance." : "Titular el nuevo fármaco según tolerancia clínica.",
      isEn ? "Risk of persistent pharmacodynamic interaction." : "Riesgo de interacción farmacodinámica persistente."
    ]
  };
}
