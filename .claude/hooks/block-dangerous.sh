#!/bin/bash
# PreToolUse (matcher Bash): bloquea comandos destructivos. exit 2 = bloquear.
cmd=$(jq -r '.tool_input.command // empty')
if echo "$cmd" | grep -iE '\brm -rf\b|sudo rm|dd if=|mkfs|:\(\)\{|git push --force|DROP TABLE|TRUNCATE '; then
  echo "Bloqueado: comando potencialmente destructivo. Pídelo de forma explícita si es intencional." >&2
  exit 2
fi
exit 0
