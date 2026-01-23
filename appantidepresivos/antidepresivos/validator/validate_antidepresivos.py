#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
validate_antidepresivos.py
Validador canónico — Dataset de Antidepresivos (Fase 2)

Uso (PowerShell):
  python .\DATASET_PSICOFARMACOLOGIA\antidepresivos\validator\validate_antidepresivos.py `
    --csv .\DATASET_PSICOFARMACOLOGIA\antidepresivos\fase_2_canonic\antidepresivos_fase2_completo.csv `
    --rules .\DATASET_PSICOFARMACOLOGIA\antidepresivos\validator\rules_antidepresivos.yaml

Notas:
- Estricto con estructura y dominios categóricos.
- Acepta tokens de "no disponible": N_D / N/D / ND / (vacío)
- Detecta comas sin comillas de forma indirecta: si rompen el número de columnas.
"""

from __future__ import annotations

import argparse
import csv
import re
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List, Optional, Set, Tuple, Any

try:
    import yaml  # PyYAML
except Exception as e:
    print("ERROR: Falta PyYAML. Instala con: pip install pyyaml", file=sys.stderr)
    raise


# -----------------------------
# Utilidades
# -----------------------------
MISSING_TOKENS = {"", "N_D", "N/D", "ND", "NA", "N_A", "N/A", None}


def is_missing(x: Optional[str]) -> bool:
    if x is None:
        return True
    return x.strip() in MISSING_TOKENS


def norm(x: Optional[str]) -> str:
    return "" if x is None else x.strip()


def fail(msg: str) -> str:
    return f"ERROR: {msg}"


def warn(msg: str) -> str:
    return f"WARNING: {msg}"


def contains_any(haystack: str, needles: List[str]) -> bool:
    hs = haystack.lower()
    return any(n.lower() in hs for n in needles)


# -----------------------------
# Carga reglas
# -----------------------------
@dataclass
class Rules:
    expected_header: Optional[List[str]]
    id_col: str
    id_pattern: re.Pattern
    require_unique_id: bool

    # numeric
    integer_only: Set[str]
    integer_ranges: Dict[str, Tuple[int, int]]

    # categorical
    categorical_allowed: Dict[str, Set[str]]

    # text required
    required_non_empty: Set[str]

    # clinical
    ped_col: str
    ped_allowed: Set[str]
    bb_col: str
    bb_allowed: Set[str]
    pregnancy_col: str

    # PK / metabolism
    lineality_col: str
    require_enzyme_if_non_linear: bool
    enzyme_cols: Tuple[str, str]  # (sustrato_enzimatico_principal, inhibicion_enzimatica_relevante)

    # consistency
    qt_col: str
    rare_col: str
    sed_col: str
    act_col: str
    tit_col: str
    contra_col: str
    freq_col: str
    restr_col: str


def load_rules(rules_path: Path) -> Dict[str, Any]:
    with rules_path.open("r", encoding="utf-8") as f:
        return yaml.safe_load(f)


def build_rules(r: Dict[str, Any]) -> Rules:
    # Header esperado: opcional.
    # Si el YAML no lo trae, solo exigimos consistencia interna del CSV.
    expected_header = None

    # Id
    id_info = r.get("id", {})
    id_col = id_info.get("column", "id_farmaco")
    id_pattern = re.compile(id_info.get("pattern", r"^ADP_[A-Z]+_[0-9]{2}$"))
    require_unique_id = bool(id_info.get("unique", True))

    # Numeric
    numeric = r.get("numeric_fields", {})
    integer_only = set(numeric.get("integer_only", []))

    int_ranges_raw = numeric.get("integer_ranges", {}) or {}
    integer_ranges: Dict[str, Tuple[int, int]] = {}
    for k, v in int_ranges_raw.items():
        if isinstance(v, list) and len(v) == 2:
            integer_ranges[k] = (int(v[0]), int(v[1]))

    # Categorical
    categorical = r.get("categorical_fields", {}) or {}
    categorical_allowed: Dict[str, Set[str]] = {}
    for field, meta in categorical.items():
        allowed = meta.get("allowed")
        if allowed is None:
            continue
        # numeric allowed (sedation) viene como ints -> pasamos a str para comparar
        categorical_allowed[field] = {str(x) for x in allowed}

    # Text
    text_fields = r.get("text_fields", {}) or {}
    required_non_empty = set(text_fields.get("required_non_empty", []))

    # Clinical
    clin = r.get("clinical_rules", {}) or {}
    ped = clin.get("uso_pediatrico", {}) or {}
    ped_col = ped.get("column", "aprobado_uso_pediatrico")
    ped_allowed = set(ped.get("allowed", ["Sí", "No"]))

    bb = clin.get("black_box", {}) or {}
    bb_col = bb.get("column", "black_box_warning")
    bb_allowed = set(bb.get("allowed", ["Sí", "No"]))

    preg_col = (clin.get("embarazo", {}) or {}).get("column", "riesgo_embarazo_multifuente")

    metabolism = clin.get("metabolismo", {}) or {}
    lineality_col = "linealidad_farmacocinetica"
    require_enzyme_if_non_linear = bool(metabolism.get("require_enzyme_if_non_linear", True))
    enzyme_cols = ("sustrato_enzimatico_principal", "inhibicion_enzimatica_relevante")

    # Consistency columns
    return Rules(
        expected_header=expected_header,
        id_col=id_col,
        id_pattern=id_pattern,
        require_unique_id=require_unique_id,
        integer_only=integer_only,
        integer_ranges=integer_ranges,
        categorical_allowed=categorical_allowed,
        required_non_empty=required_non_empty,
        ped_col=ped_col,
        ped_allowed=ped_allowed,
        bb_col=bb_col,
        bb_allowed=bb_allowed,
        pregnancy_col=preg_col,
        lineality_col=lineality_col,
        require_enzyme_if_non_linear=require_enzyme_if_non_linear,
        enzyme_cols=enzyme_cols,
        qt_col="riesgo_prolongacion_qt",
        rare_col="efectos_raros_graves",
        sed_col="nivel_sedacion",
        act_col="perfil_activacion",
        tit_col="titulacion_paso",
        contra_col="interacciones_contraindicadas",
        freq_col="efectos_frecuentes",
        restr_col="restricciones_ue",
    )


# -----------------------------
# Validación CSV
# -----------------------------
@dataclass
class ValidationResult:
    errors: List[str]
    warnings: List[str]
    rows: int


def validate_csv(csv_path: Path, rules: Rules) -> ValidationResult:
    errors: List[str] = []
    warnings: List[str] = []
    seen_ids: Set[str] = set()

    with csv_path.open("r", encoding="utf-8", newline="") as f:
        reader = csv.DictReader(f)
        header = reader.fieldnames

        if not header:
            return ValidationResult(errors=[fail(f"{csv_path}: CSV vacío o sin header.")], warnings=[], rows=0)

        # Estructura: columnas obligatorias (no faltantes)
        # (No tenemos lista canónica aquí; exigimos consistencia por DictReader + reglas)
        required_cols = set([rules.id_col, rules.ped_col, rules.bb_col, rules.pregnancy_col, rules.lineality_col])
        required_cols |= rules.integer_only
        required_cols |= set(rules.categorical_allowed.keys())
        required_cols |= rules.required_non_empty
        required_cols |= set(rules.enzyme_cols)
        required_cols |= {rules.qt_col, rules.rare_col, rules.sed_col, rules.act_col, rules.tit_col, rules.contra_col}

        missing_cols = [c for c in required_cols if c not in header]
        if missing_cols:
            errors.append(fail(f"{csv_path}: faltan columnas requeridas: {', '.join(sorted(missing_cols))}"))

        # Extra columns no se consideran error aquí porque el header “canónico” vive fuera de este script.
        # Si quieres forzar "no extras", pásanos el header canónico y lo anclamos.

        row_count = 0
        for i, row in enumerate(reader, start=2):  # línea 1 = header
            row_count += 1

            # --- ID ---
            rid = norm(row.get(rules.id_col))
            if is_missing(rid):
                errors.append(fail(f"{csv_path}:{i}: {rules.id_col} vacío."))
                continue

            if not rules.id_pattern.match(rid):
                errors.append(fail(f"{csv_path}:{i}: {rules.id_col}='{rid}' no cumple patrón {rules.id_pattern.pattern}."))

            if rules.require_unique_id:
                if rid in seen_ids:
                    errors.append(fail(f"{csv_path}:{i}: {rules.id_col} duplicado: {rid}."))
                seen_ids.add(rid)

            # --- requeridos no vacíos ---
            for col in rules.required_non_empty:
                if col in header and is_missing(row.get(col)):
                    errors.append(fail(f"{csv_path}:{i}: '{col}' es requerido y está vacío."))

            # --- Pediátrico ---
            pedv = norm(row.get(rules.ped_col))
            if pedv and pedv not in rules.ped_allowed:
                errors.append(fail(f"{csv_path}:{i}: {rules.ped_col}='{pedv}' debe ser uno de {sorted(rules.ped_allowed)}."))

            # --- Black box ---
            bbv = norm(row.get(rules.bb_col))
            if bbv and bbv not in rules.bb_allowed:
                errors.append(fail(f"{csv_path}:{i}: {rules.bb_col}='{bbv}' debe ser uno de {sorted(rules.bb_allowed)}."))

            # --- Embarazo multifuente (no categorías simples) ---
            preg = norm(row.get(rules.pregnancy_col))
            if preg:
                # Prohibir "A" "B" "C" "D" "X" como celda completa
                if re.fullmatch(r"[A-EX]", preg.strip(), flags=re.IGNORECASE):
                    errors.append(fail(f"{csv_path}:{i}: {rules.pregnancy_col}='{preg}' parece categoría única (prohibido)."))
                # Señales típicas de categorización FDA antigua
                if re.search(r"\bcategory\s*[A-DX]\b", preg, flags=re.IGNORECASE) or re.search(r"\bFDA\s*[A-DX]\b", preg, flags=re.IGNORECASE):
                    warnings.append(warn(f"{csv_path}:{i}: {rules.pregnancy_col} menciona categorías FDA antiguas; verificar trazabilidad."))

            # --- Numéricos enteros ---
            for col in rules.integer_only:
                if col not in header:
                    continue
                val = norm(row.get(col))
                if is_missing(val):
                    continue
                if not re.fullmatch(r"-?\d+", val):
                    errors.append(fail(f"{csv_path}:{i}: '{col}' debe ser entero (sin %), encontrado: '{val}'."))
                    continue
                ival = int(val)
                if col in rules.integer_ranges:
                    lo, hi = rules.integer_ranges[col]
                    if not (lo <= ival <= hi):
                        errors.append(fail(f"{csv_path}:{i}: '{col}' fuera de rango [{lo},{hi}]: {ival}."))

            # --- Categóricos ---
            for col, allowed in rules.categorical_allowed.items():
                if col not in header:
                    continue
                val = norm(row.get(col))
                if is_missing(val):
                    continue
                # sedation puede venir como 0/1/2/3 ya validado arriba, pero reiteramos aquí
                if val not in allowed:
                    errors.append(fail(f"{csv_path}:{i}: '{col}'='{val}' no permitido. Allowed={sorted(allowed)}"))

            # --- Metabolismo / no linealidad ---
            lineal = norm(row.get(rules.lineality_col))
            if rules.require_enzyme_if_non_linear and lineal in {"No lineal", "Dependiente de dosis"}:
                sustr = norm(row.get(rules.enzyme_cols[0]))
                inhib = norm(row.get(rules.enzyme_cols[1]))
                if is_missing(sustr) and is_missing(inhib):
                    errors.append(
                        fail(f"{csv_path}:{i}: {rules.lineality_col}='{lineal}' requiere '{rules.enzyme_cols[0]}' o '{rules.enzyme_cols[1]}' no vacío.")
                    )

            # --- Consistency: QT alto implica mención en raros graves ---
            qt = norm(row.get(rules.qt_col))
            raros = norm(row.get(rules.rare_col))
            if qt == "Alto":
                if not contains_any(raros, ["qt", "torsade", "arritm", "ventric", "intervalo"]):
                    warnings.append(
                        warn(f"{csv_path}:{i}: QT='Alto' pero '{rules.rare_col}' no menciona QT/arritmia explícitamente (revisar).")
                    )

            # --- Consistency: sedación 3 no puede coexistir con activación alta ---
            sed = norm(row.get(rules.sed_col))
            act = norm(row.get(rules.act_col))
            if sed == "3" and act == "Alto":
                errors.append(fail(f"{csv_path}:{i}: nivel_sedacion=3 incompatible con perfil_activacion='Alto'."))

            # --- Reglas IMAO (por heurística robusta) ---
            # Aplicar si id indica MAOI o si mecanismo menciona MAO
            nombre = norm(row.get("nombre_generico"))
            mecanismo = norm(row.get("mecanismo_principal"))
            is_maoi = ("MAOI" in rid) or contains_any(mecanismo, ["mao", "monoaminooxidasa"]) or contains_any(nombre, ["fenelzina", "tranilcipromina", "isocarboxazida", "selegilina"])
            if is_maoi:
                tit = norm(row.get(rules.tit_col))
                contra = norm(row.get(rules.contra_col))
                # requeridos conceptuales
                if not contains_any(contra, ["tiramina", "meperidina", "petidina", "dextrometorfano", "linezolid", "methylene blue", "azul de metileno"]):
                    warnings.append(warn(f"{csv_path}:{i}: IMAO sin lista fuerte de interacciones críticas (tiramina/meperidina/dextrometorfano/linezolid/azul de metileno)."))
                if not contains_any(tit, ["14", "2 semanas", "lavado", "washout"]):
                    warnings.append(warn(f"{csv_path}:{i}: IMAO: '{rules.tit_col}' debería documentar lavado ~14 días/2 semanas."))

            # --- Reglas Ketamina/Esketamina ---
            is_ket = contains_any(nombre, ["ketamina", "esketamina"]) or contains_any(rid, ["RAPID"]) and contains_any(mecanismo, ["nmda", "glutam"])
            if is_ket:
                frec = norm(row.get(rules.freq_col))
                restr = norm(row.get(rules.restr_col))
                if not contains_any(frec, ["disoci", "disociation", "dissoci"]):
                    warnings.append(warn(f"{csv_path}:{i}: Ketamina/Esketamina: se espera mención de disociación en '{rules.freq_col}'."))
                if not contains_any(restr, ["monitore", "2 hora", "rems", "observ", "supervis"]):
                    warnings.append(warn(f"{csv_path}:{i}: Ketamina/Esketamina: se espera mención de monitoreo/observación/REMS en '{rules.restr_col}'."))

        # Si no hay filas, advertir
        if row_count == 0:
            warnings.append(warn(f"{csv_path}: CSV sin filas de datos (solo header)."))

    return ValidationResult(errors=errors, warnings=warnings, rows=row_count)


# -----------------------------
# CLI
# -----------------------------
def main() -> int:
    p = argparse.ArgumentParser(description="Validador canónico de Antidepresivos (Fase 2)")
    p.add_argument("--csv", dest="csv_files", action="append", required=True,
                   help="Ruta a CSV a validar. Repetible: --csv file1 --csv file2")
    p.add_argument("--rules", required=True, help="Ruta a rules_antidepresivos.yaml")
    p.add_argument("--strict", action="store_true", help="Modo estricto (convierte warnings seleccionados en errores).")
    args = p.parse_args()

    rules_path = Path(args.rules).expanduser().resolve()
    if not rules_path.exists():
        print(f"ERROR: No existe rules file: {rules_path}", file=sys.stderr)
        return 2

    rules_raw = load_rules(rules_path)
    rules = build_rules(rules_raw)

    total_errors: List[str] = []
    total_warnings: List[str] = []
    total_rows = 0

    for f in args.csv_files:
        csv_path = Path(f).expanduser().resolve()
        if not csv_path.exists():
            total_errors.append(fail(f"No existe CSV: {csv_path}"))
            continue

        res = validate_csv(csv_path, rules)
        total_rows += res.rows
        total_errors.extend(res.errors)
        total_warnings.extend(res.warnings)

    # strict: elevar algunas warnings a error (si lo quieres, crece aquí)
    if args.strict:
        elevate_patterns = [
            r"QT='Alto'",
            r"IMAO",
            r"Ketamina/Esketamina",
        ]
        elevated: List[str] = []
        remaining: List[str] = []
        for w in total_warnings:
            if any(re.search(pat, w, flags=re.IGNORECASE) for pat in elevate_patterns):
                elevated.append("ERROR(STRICT): " + w.replace("WARNING:", "").strip())
            else:
                remaining.append(w)
        total_errors.extend(elevated)
        total_warnings = remaining

    # Reporte
    print("============================================================")
    print("VALIDACIÓN — ANTIDEPRESIVOS (FASE 2)")
    print("============================================================")
    print(f"Rules: {rules_path}")
    print(f"Archivos: {len(args.csv_files)}")
    print(f"Filas leídas (total): {total_rows}")
    print("------------------------------------------------------------")

    if total_errors:
        for e in total_errors:
            print(e)
    if total_warnings:
        for w in total_warnings:
            print(w)

    print("------------------------------------------------------------")
    print(f"ERRORES: {len(total_errors)} | WARNINGS: {len(total_warnings)}")

    if total_errors:
        print("RESULTADO: ❌ FAIL")
        return 1

    print("RESULTADO: ✅ PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
