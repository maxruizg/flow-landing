#!/bin/bash
# Stop hook: verificación del stack real de flow-landing.
# Este repo NO tiene scripts de `test` ni `lint`, así que corremos solo el
# chequeo que sí existe y es rápido: `pnpm typecheck`. (El template original
# corría `pnpm test && pnpm lint`, que aquí no existen y colgaban el Stop.)
#   exit 2 = seguir trabajando hasta que pase · exit 0 = todo verde
# Para desactivar temporalmente: renómbralo a verify.sh.off
# Cuando agregues tests/lint, añade `&& pnpm test && pnpm lint` a la línea de abajo.
set -o pipefail
if [ -f package.json ]; then
  pnpm typecheck 2>&1 \
    || { echo "typecheck fallando (pnpm typecheck). Sigue arreglando hasta que pase." >&2; exit 2; }
fi
exit 0
