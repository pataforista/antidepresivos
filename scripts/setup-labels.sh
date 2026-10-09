#!/bin/bash
# Script para crear las etiquetas de GitHub requeridas por GOBERNANZA.md
# Uso: 
# 1. Exporta tu token: export GITHUB_TOKEN="ghp_xxxx..."
# 2. Exporta el repo: export REPO="usuario/antidepresivos"
# 3. ./setup-labels.sh

if [ -z "$GITHUB_TOKEN" ]; then
  echo "Error: GITHUB_TOKEN no est definido."
  exit 1
fi

if [ -z "$REPO" ]; then
  echo "Error: REPO no est definido. (Ej: drcelada/antidepresivos)"
  exit 1
fi

API_URL="https://api.github.com/repos/$REPO/labels"

# Lista de etiquetas: "nombre;color;descripcin"
LABELS=(
  "ai-generated;6f42c1;PR producido mayormente por IA"
  "ai-assisted;a371f7;PR con asistencia puntual de IA"
  "nivel-N1;c2e0c6;Revisin light"
  "nivel-N2;fef2c0;Revisin standard"
  "nivel-N3;f9a825;Revisin crtica (clnica)"
  "nivel-N4;d93f0b;Revisin restringida (infra/secrets)"
  "riesgo-clinico-critico;b60205;Afecta dosis/interacciones"
  "riesgo-clinico-alto;e99695;Toca contenido mdico"
  "tech-debt;fbca04;Deuda tcnica registrada"
  "switching-matrix;5319e7;Cambios en matriz IMAO/ISRS"
  "playfulness;ff9ec7;Mejora de microinteracciones"
  "seo;0e8a16;Linkbuilding / posicionamiento"
  "deploy;1d76db;Relacionado con CI/CD"
  "blocked;000000;Bloqueado por dependencia externa"
  "needs-medical-review;d4c5f9;Pendiente de Revisor Mdico"
  "enhancement;a2eeef;Funcionalidad o mejora no clnica"
  "bug;d73a4a;Comportamiento incorrecto"
)

echo "Creando etiquetas en $REPO..."

for item in "${LABELS[@]}"; do
  IFS=";" read -r name color description <<< "$item"
  
  echo "=> Procesando: $name"
  
  # Intenta crear la etiqueta
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API_URL" \
    -H "Authorization: token $GITHUB_TOKEN" \
    -H "Accept: application/vnd.github.v3+json" \
    -d "{\"name\":\"$name\", \"color\":\"$color\", \"description\":\"$description\"}")
  
  if [ "$STATUS" -eq 201 ]; then
    echo "   [CREADA] $name"
  elif [ "$STATUS" -eq 422 ]; then
    echo "   [EXISTE] $name - Intentando actualizar..."
    # Si existe, actualizamos
    curl -s -o /dev/null -X PATCH "$API_URL/$name" \
      -H "Authorization: token $GITHUB_TOKEN" \
      -H "Accept: application/vnd.github.v3+json" \
      -d "{\"new_name\":\"$name\", \"color\":\"$color\", \"description\":\"$description\"}"
  else
    echo "   [ERROR] Fall la creacin de $name (Status: $STATUS)"
  fi
done

echo "Finalizado."
