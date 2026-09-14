#!/usr/bin/env bash
#
# Deploy schaefchens.de — the gated store for the Schäfchens apps and games.
#
# The SFTP account is jailed to the document root, so remote "/" is the web
# root. One build produces four destinations:
#
#   /             the front controller, .htaccess, fonts and favicons (public)
#   /assets       the JS/CSS bundle      — cookie-guarded by the root .htaccess
#   /media        icons and screenshots  — cookie-guarded the same way
#   /shell        the built SPA shell    — denied outright; index.php reads it
#   /inc          gate.php, secrets.php, state/ — denied outright
#
# The gate only holds if that split is right, so --verify-only checks it on
# every deploy rather than trusting it.
#
# Usage: scripts/deploy.sh [options]
#
#   --skip-build    upload the existing dist/ as-is
#   --prune         delete files under /assets this build did not produce
#   --dry-run       print the plan; upload nothing
#   --verify-only   run the post-deploy HTTP checks and exit
#   -h, --help      this text
#
# Default: build, upload everything, then verify.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

SITE_URL="https://schaefchens.de"
DIST="dist"
ENV_FILE="sftp.env"
SECRETS="server/inc/secrets.php"

# Left behind by the design mockup that used to be the whole site. If index.html
# survives, it is reachable without the gate and serves the entire catalogue.
LEGACY_FILES=(/index.html /support.js)

die()  { printf '\033[31merror:\033[0m %s\n' "$*" >&2; exit 1; }
info() { printf '\033[34m==>\033[0m %s\n' "$*"; }
ok()   { printf '  \033[32m✓\033[0m %s\n' "$*"; }
bad()  { printf '  \033[31m✗\033[0m %s\n' "$*"; }

# shellcheck source=scripts/lib/sftp.sh
. "$REPO_ROOT/scripts/lib/sftp.sh"

DO_BUILD=1 DO_PRUNE=0 DRY_RUN=0 VERIFY_ONLY=0

while [ $# -gt 0 ]; do
  case "$1" in
    # `npm run deploy -- --prune` needs the separator to pass the flag through;
    # people then type it when calling the script directly too. Ignore it.
    --)            ;;
    --skip-build)  DO_BUILD=0 ;;
    --prune)       DO_PRUNE=1 ;;
    --dry-run)     DRY_RUN=1 ;;
    --verify-only) VERIFY_ONLY=1 ;;
    -h|--help)     sed -n '2,26p' "$0" | sed 's/^#\{1,2\} \{0,1\}//'; exit 0 ;;
    *)             die "unknown option: $1 (try --help)" ;;
  esac
  shift
done

emit()       { printf '%s\n' "$*" >> "$BATCH"; }
emit_mkdir() { emit "-mkdir $1"; }                 # leading - : ignore "exists"
emit_put()   { emit "put $1 $2"; PLANNED=$((PLANNED + 1)); }

# Read a PHP string constant out of secrets.php without sourcing it.
php_const() {
  php -r '
    require $argv[1];
    $c = $argv[2];
    if (!defined($c)) { fwrite(STDERR, "missing const $c\n"); exit(1); }
    echo constant($c);
  ' "$REPO_ROOT/$SECRETS" "$1"
}

# --- build -------------------------------------------------------------------

build() {
  info "Building"
  npm run build
  [ -f "$DIST/index.html" ] || die "build produced no $DIST/index.html"
}

# --- plan --------------------------------------------------------------------

plan() {
  info "Planning upload"

  [ -d "$DIST" ] || die "$DIST not found — run without --skip-build"
  [ -f "$SECRETS" ] || die "$SECRETS not found — copy secrets.php.example and fill it in"

  local key; key=$(php_const GATE_ASSET_KEY)
  [ -n "$key" ] && [ "$key" != "CHANGE-ME" ] || die "GATE_ASSET_KEY not set in $SECRETS"
  case "$key" in
    *[!0-9a-fA-F]*) die "GATE_ASSET_KEY must be hex — it goes into a RewriteCond regex" ;;
  esac

  # The root .htaccess carries the key, so it is generated rather than uploaded
  # verbatim. Kept out of git: see .gitignore.
  sed "s/__ASSET_KEY__/$key/g" deploy/htaccess-root > .htaccess.built
  grep -q "sch_k=$key" .htaccess.built || die "asset key substitution failed"

  emit_mkdir /assets
  emit_mkdir /media
  emit_mkdir /fonts
  emit_mkdir /shell
  emit_mkdir /inc
  emit_mkdir /inc/state
  emit_mkdir /api

  # Directories under media/ (find is pre-order, so parents come first).
  local d f
  while IFS= read -r d; do
    emit_mkdir "/${d#./}"
  done < <(cd "$DIST" && find media fonts -mindepth 1 -type d 2>/dev/null | sed 's|^|./|' | sort)

  # Everything the build produced, except the shell — that goes last, and to /app.
  while IFS= read -r f; do
    f="${f#./}"
    [ "$f" = "index.html" ] && continue
    emit_put "$REPO_ROOT/$DIST/$f" "/$f"
  done < <(cd "$DIST" && find . -mindepth 1 -type f | sort)

  # PHP.
  emit_put "$REPO_ROOT/server/inc/gate.php"        /inc/gate.php
  emit_put "$REPO_ROOT/server/inc/secrets.php"     /inc/secrets.php
  emit_put "$REPO_ROOT/server/api/contact.php"     /api/contact.php

  # Access rules before the things they protect become reachable.
  emit_put "$REPO_ROOT/deploy/htaccess-deny"   /inc/.htaccess
  emit_put "$REPO_ROOT/deploy/htaccess-deny"   /inc/state/.htaccess
  emit_put "$REPO_ROOT/deploy/htaccess-deny"   /shell/.htaccess
  emit_put "$REPO_ROOT/deploy/htaccess-assets" /assets/.htaccess
  emit_put "$REPO_ROOT/deploy/htaccess-media"  /media/.htaccess
  emit_put "$REPO_ROOT/.htaccess.built"        /.htaccess

  # Entry points last, once everything they reference is in place.
  emit_put "$REPO_ROOT/$DIST/index.html" /shell/index.html
  emit_put "$REPO_ROOT/server/index.php" /index.php
}

# --- pruning -----------------------------------------------------------------

prune_assets() {
  info "Pruning stale files in /assets"
  local remote name keep=0 removed=0
  remote=$(remote_file_names /assets)
  [ -n "$remote" ] || { ok "nothing on the server yet"; return; }

  local batch; batch=$(mktemp)
  while IFS= read -r name; do
    [ -z "$name" ] && continue
    if [ -f "$DIST/assets/$name" ]; then
      keep=$((keep + 1))
    else
      printf 'rm /assets/%s\n' "$name" >> "$batch"
      removed=$((removed + 1))
      printf '  - %s\n' "$name"
    fi
  done <<< "$remote"

  if [ "$removed" -eq 0 ]; then ok "$keep current, nothing stale"
  elif [ "$DRY_RUN" -eq 1 ]; then ok "would remove $removed stale file(s), keep $keep"
  else run_sftp "$batch" > /dev/null; ok "removed $removed stale file(s), kept $keep"
  fi
  rm -f "$batch"
}

# The mockup that used to be this site. Reachable without the gate if left.
remove_legacy() {
  local present=() f
  for f in "${LEGACY_FILES[@]}"; do
    if curl -sS -o /dev/null -m 15 -w '%{http_code}' "$SITE_URL$f" 2>/dev/null | grep -q '^200$'; then
      present+=("$f")
    fi
  done
  [ ${#present[@]} -gt 0 ] || return 0

  info "Removing the old mockup from the web root"
  local batch; batch=$(mktemp)
  for f in "${present[@]}"; do
    printf 'rm %s\n' "$f" >> "$batch"
    printf '  - %s\n' "$f"
  done
  if [ "$DRY_RUN" -eq 1 ]; then ok "would remove ${#present[@]} legacy file(s)"
  else run_sftp "$batch" > /dev/null 2>&1 || true; ok "removed ${#present[@]} legacy file(s)"
  fi
  rm -f "$batch"
}

# --- upload ------------------------------------------------------------------

upload() {
  local err status=0
  err=$(mktemp)
  run_sftp "$BATCH" > /dev/null 2>"$err" || status=$?
  # `-mkdir` on an existing directory reports "Failure" and is ignored by sftp —
  # that is the idempotent path. Anything else from stderr is worth seeing.
  grep -v 'remote mkdir .*: Failure' "$err" >&2 || true
  rm -f "$err"
  [ "$status" -eq 0 ] || die "sftp upload failed (exit $status)"
}

# --- verify ------------------------------------------------------------------

# Checks what the deploy is supposed to guarantee: the gate holds, the app is
# reachable once past it, and nothing behind it leaks.
verify() {
  info "Verifying $SITE_URL"
  local failed=0

  [ -f "$SECRETS" ] || die "$SECRETS needed to mint a test cookie"
  local pass_cookie asset_cookie
  pass_cookie=$(php -r '
    require $argv[1];
    $e = time() + 300;
    echo $e . "." . hash_hmac("sha256", (string)$e, GATE_SECRET);
  ' "$REPO_ROOT/$SECRETS")
  asset_cookie=$(php_const GATE_ASSET_KEY)
  local COOKIE="sch_pass=$pass_cookie; sch_k=$asset_cookie"

  check() {  # path want label [curl args...]
    local path="$1" want="$2" label="$3"; shift 3
    local got
    got=$(curl -sS -o /dev/null -m 20 -w '%{http_code}' "$@" "$SITE_URL$path" 2>/dev/null || echo 000)
    if [ "$got" = "$want" ]; then ok "$label ($path → $got)"
    else bad "$label ($path → $got, expected $want)"; failed=$((failed + 1)); fi
  }

  # --- locked: what an unauthenticated visitor sees -------------------------
  check /                    401 "gate shown at the root"
  # /app/:id is a SPA route. If a real /app directory ever exists again, its
  # "Require all denied" wins in the auth phase and mod_rewrite never runs —
  # every detail page 403s on reload. That is why the shell lives in /shell.
  check /app/bible-quiz      401 "app detail deep link reaches the gate"
  check /glaube              401 "route reaches the gate"

  local html
  html=$(curl -sS -m 20 "$SITE_URL/" 2>/dev/null || true)
  if printf '%s' "$html" | grep -q 'Wer ist der Herr?\|Who is the Lord?'; then
    ok "gate page asks the question"
  else bad "gate page does not contain the question"; failed=$((failed + 1)); fi

  if printf '%s' "$html" | grep -q '/assets/'; then
    bad "GATE LEAK: the locked page references /assets"; failed=$((failed + 1))
  else ok "locked page references no bundle"; fi

  for probe in bible-quiz "Walk in the Spirit" PolyForm Impressum; do
    if printf '%s' "$html" | grep -qi -- "$probe"; then
      bad "GATE LEAK: locked page contains '$probe'"; failed=$((failed + 1))
    fi
  done
  ok "locked page carries no catalogue content"

  # --- things that must never be reachable ----------------------------------
  check /inc/secrets.php          403 "secrets denied"
  check /inc/gate.php             403 "gate source denied"
  check /inc/state/messages.jsonl 403 "message log denied"
  check /shell/index.html           403 "app shell denied"
  check /inc/                     403 "inc listing denied"

  # --- the mockup must be gone ----------------------------------------------
  # Not a 404 check: with a catch-all front controller nothing 404s for a locked
  # visitor — every unknown path returns the gate. What matters is that the old
  # design mockup is no longer served.
  for stale in /index.html /support.js; do
    body=$(curl -sS -m 20 "$SITE_URL$stale" 2>/dev/null || true)
    if printf '%s' "$body" | grep -q 'x-dc\|data-dc-atomics'; then
      bad "old mockup still served at $stale"; failed=$((failed + 1))
    else ok "old mockup gone ($stale)"; fi
  done

  # --- public by necessity (the gate page needs them) -----------------------
  check /fonts/outfit-latin.woff2 200 "gate font public"
  check /avatar.webp              200 "gate avatar public"

  # --- the asset guard ------------------------------------------------------
  local js
  js=$(cd "$DIST" && find assets -name '*.js' -type f | head -n1)
  if [ -n "$js" ]; then
    check "/$js" 403 "bundle blocked without the cookie"
    check "/$js" 200 "bundle served with the cookie" -H "Cookie: $COOKIE"

    if curl -sS -m 20 -H "Cookie: $COOKIE" -H 'Accept-Encoding: gzip' -D - -o /dev/null "$SITE_URL/$js" 2>/dev/null \
         | grep -qi 'content-encoding: gzip'; then
      local wire
      wire=$(curl -sS -m 20 -H "Cookie: $COOKIE" -H 'Accept-Encoding: gzip' --output - "$SITE_URL/$js" 2>/dev/null | wc -c | tr -d ' ')
      ok "bundle served gzipped (${wire} bytes on the wire)"
    else
      bad "bundle is NOT compressed — check the deflate types"; failed=$((failed + 1))
    fi
  else
    bad "no built bundle found under $DIST/assets"; failed=$((failed + 1))
  fi
  check /media/icons/bible-quiz.webp 403 "media blocked without the cookie"
  check /media/icons/bible-quiz.webp 200 "media served with the cookie" -H "Cookie: $COOKIE"

  # --- unlocked -------------------------------------------------------------
  local shell
  shell=$(curl -sS -m 20 -H "Cookie: $COOKIE" "$SITE_URL/" 2>/dev/null || true)
  if printf '%s' "$shell" | grep -q 'src="/assets/.*\.js"'; then
    ok "unlocked root serves the app shell"
  else bad "unlocked root did not serve the shell"; failed=$((failed + 1)); fi

  # --- the contact endpoint -------------------------------------------------
  check /api/contact.php 403 "contact endpoint refuses a locked caller" -X POST
  check /api/contact.php 405 "contact endpoint refuses GET" -H "Cookie: $COOKIE"

  [ "$failed" -eq 0 ] || die "$failed check(s) failed"
  info "All checks passed"
}

# --- main --------------------------------------------------------------------

require_tools sshpass sftp curl php
load_credentials "$ENV_FILE"

if [ "$VERIFY_ONLY" -eq 1 ]; then verify; exit 0; fi

[ "$DO_BUILD" -eq 1 ] && build

BATCH=$(mktemp); PLANNED=0
trap 'rm -f "$BATCH"' EXIT

plan

[ "$PLANNED" -eq 0 ] && die "nothing to upload"

if [ "$DRY_RUN" -eq 1 ]; then
  info "Dry run — $PLANNED file(s) would be uploaded to $SFTP_SERVER"
  sed -e "s|$REPO_ROOT/||" "$BATCH" | sed 's/^/  /'
  [ "$DO_PRUNE" -eq 1 ] && prune_assets
  remove_legacy
  info "Dry run complete; nothing was uploaded"
  exit 0
fi

info "Uploading $PLANNED file(s) to $SFTP_SERVER"
upload
ok "upload complete"

[ "$DO_PRUNE" -eq 1 ] && prune_assets
remove_legacy

verify
