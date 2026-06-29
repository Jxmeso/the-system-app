#!/bin/sh
set -eu

url="${1:-https://jxmeso.github.io/the-system-app/}"
separator='?'
case "$url" in
  *\?*) separator='&' ;;
esac

tmp="$(mktemp)"
trap 'rm -f "$tmp"' EXIT HUP INT TERM

curl -fsSL -H 'Cache-Control: no-cache' "${url}${separator}verify=$(date +%s)" > "$tmp"

if ! grep -qi '<!DOCTYPE html>' "$tmp"; then
  echo "FAIL: deployment is not serving the HTML app shell: $url" >&2
  exit 1
fi

if grep -q 'FULL CLEAN PROFESSIONAL INDEX.HTML (COMPLETE APP CODE)' "$tmp"; then
  echo "FAIL: deployment is still serving the recovery placeholder: $url" >&2
  exit 1
fi

if ! grep -q '<title>The System</title>' "$tmp"; then
  echo "FAIL: deployment HTML does not contain The System title: $url" >&2
  exit 1
fi

bytes="$(wc -c < "$tmp" | tr -d ' ')"
if [ "$bytes" -lt 50000 ]; then
  echo "FAIL: deployment HTML is unexpectedly small (${bytes} bytes): $url" >&2
  exit 1
fi

echo "PASS: deployed app shell verified (${bytes} bytes): $url"
