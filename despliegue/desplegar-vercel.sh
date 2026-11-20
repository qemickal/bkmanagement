#!/usr/bin/env bash
# Despliegue manual a Vercel sin guardar el token en el repositorio.
#
# Uso (el token vive sólo en tu terminal, no en el chat ni en git):
#
#   export VERCEL_TOKEN=...            # vercel.com/account/tokens
#   export SUPABASE_URL=https://TU-PROYECTO.supabase.co
#   export SUPABASE_ANON_KEY=eyJ...
#   ./despliegue/desplegar-vercel.sh
#
# Al terminar puedes revocar el token en vercel.com/account/tokens.
set -euo pipefail

if [ -z "${VERCEL_TOKEN:-}" ]; then
  echo "Falta VERCEL_TOKEN. Crea uno en https://vercel.com/account/tokens y expórtalo." >&2
  exit 1
fi
if [ -z "${SUPABASE_URL:-}" ] || [ -z "${SUPABASE_ANON_KEY:-}" ]; then
  echo "Faltan SUPABASE_URL y SUPABASE_ANON_KEY: sin ellas el sitio sólo muestra la pantalla de configuración." >&2
  exit 1
fi

PROYECTO="${PROYECTO:-bkmanagement}"
CLI="npx --yes vercel@latest"
cd "$(dirname "$0")/.."

echo "→ Enlazando el proyecto $PROYECTO"
$CLI link --yes --project "$PROYECTO" --token "$VERCEL_TOKEN" >/dev/null

echo "→ Cargando variables de entorno del build"
for nombre in SUPABASE_URL SUPABASE_ANON_KEY; do
  valor="${!nombre}"
  for entorno in production preview; do
    printf '%s' "$valor" |
      $CLI env add "$nombre" "$entorno" --token "$VERCEL_TOKEN" --force >/dev/null
  done
done

echo "→ Desplegando a producción"
$CLI deploy --prod --yes --token "$VERCEL_TOKEN"

echo "Listo. Revoca el token cuando quieras en https://vercel.com/account/tokens"
