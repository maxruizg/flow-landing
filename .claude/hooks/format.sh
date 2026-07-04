#!/bin/bash
# PostToolUse (matcher Write|Edit): auto-formatea el archivo editado segun su tipo.
f=$(jq -r '.tool_input.file_path // empty')
[ -z "$f" ] && exit 0
case "$f" in
  *.ts|*.tsx|*.js|*.jsx|*.json|*.md|*.css) command -v npx >/dev/null && npx --no-install prettier --write "$f" 2>/dev/null ;;
  *.rs) command -v rustfmt >/dev/null && rustfmt "$f" 2>/dev/null ;;
  *.go) command -v gofmt >/dev/null && gofmt -w "$f" 2>/dev/null ;;
esac
exit 0
