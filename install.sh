#!/usr/bin/env bash
# dsh-plugin-splash installer — one command, idempotent.
# Usage:  curl -fsSL https://raw.githubusercontent.com/Canary-Builds/dsh-splash/main/install.sh | bash
#         install.sh [profile]        (default profile: web)
set -euo pipefail

PROFILE="${1:-web}"
PKG="dsh-plugin-splash"
PATCH_FILE="$HOME/.dsh/profiles/$PROFILE/cordis.patch.yml"

say() { printf '\033[1;34m[splash]\033[0m %s\n' "$*"; }
die() { printf '\033[1;31m[splash]\033[0m %s\n' "$*" >&2; exit 1; }

command -v dsh >/dev/null 2>&1 || die "dsh CLI not found on PATH"
[ -d "$HOME/.dsh/profiles/$PROFILE" ] || die "profile '$PROFILE' not found at ~/.dsh/profiles/$PROFILE (pass a different name: install.sh <profile>)"

say "installing $PKG into profile '$PROFILE' (via dsh plugin / pnpm)…"
dsh plugin --profile "$PROFILE" add "$PKG"

if [ ! -f "$PATCH_FILE" ]; then
  say "creating $PATCH_FILE"
  mkdir -p "$(dirname "$PATCH_FILE")"
  printf '# plugin composition patches\n' > "$PATCH_FILE"
fi

if grep -q "name: $PKG" "$PATCH_FILE"; then
  say "composition row already present — nothing to patch"
else
  say "appending composition row to $PATCH_FILE"
  printf '\n# %s — mobile/PWA-first UI redesign (installed by install.sh)\n- insert:\n    - id: splash\n      name: %s\n' "$PKG" "$PKG" >> "$PATCH_FILE"
fi

say "done. Restart DSH (however you run it, e.g. 'systemctl --user restart dsh-web')"
say "then open the GUI on a phone or install it as an app — the redesign is PWA/mobile-scoped; desktop browser tabs stay stock."
